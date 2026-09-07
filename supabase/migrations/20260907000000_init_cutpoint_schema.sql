-- ==============================================================================
-- Cutpoint Core Relational Schema & Row-Level Security (RLS)
-- ==============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. PROFILES TABLE (Linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
    CREATE POLICY "Users can view their own profile"
        ON public.profiles FOR SELECT
        USING (auth.uid() = id);

    DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
    CREATE POLICY "Users can update their own profile"
        ON public.profiles FOR UPDATE
        USING (auth.uid() = id);

    DROP POLICY IF EXISTS "Service role has full access to profiles" ON public.profiles;
    CREATE POLICY "Service role has full access to profiles"
        ON public.profiles FOR ALL
        USING (auth.jwt() ->> 'role' = 'service_role');
END$$;

-- 3. YOUTUBE CHANNELS TABLE
CREATE TABLE IF NOT EXISTS public.youtube_channels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    channel_id TEXT NOT NULL,
    channel_name TEXT NOT NULL,
    channel_thumbnail TEXT,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    token_expires_at TIMESTAMPTZ NOT NULL,
    connected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, channel_id)
);

ALTER TABLE public.youtube_channels ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can view and manage their own YouTube channels" ON public.youtube_channels;
    CREATE POLICY "Users can view and manage their own YouTube channels"
        ON public.youtube_channels FOR ALL
        USING (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Service role has full access to channels" ON public.youtube_channels;
    CREATE POLICY "Service role has full access to channels"
        ON public.youtube_channels FOR ALL
        USING (auth.jwt() ->> 'role' = 'service_role');
END$$;

-- 4. ANALYSES TABLE (Core Retention Runs)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'analysis_status') THEN
        CREATE TYPE public.analysis_status AS ENUM (
            'PENDING',
            'FETCHING_DATA',
            'DETECTING_CLIFFS',
            'ANALYZING_VIDEO',
            'GENERATING_REPORT',
            'COMPLETE',
            'ERROR'
        );
    END IF;
END$$;

CREATE TABLE IF NOT EXISTS public.analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    channel_id UUID REFERENCES public.youtube_channels(id) ON DELETE SET NULL,
    video_id TEXT NOT NULL,
    video_title TEXT NOT NULL,
    status public.analysis_status NOT NULL DEFAULT 'PENDING',
    report_data JSONB,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can view and manage their own analyses" ON public.analyses;
    CREATE POLICY "Users can view and manage their own analyses"
        ON public.analyses FOR ALL
        USING (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Service role has full access to analyses" ON public.analyses;
    CREATE POLICY "Service role has full access to analyses"
        ON public.analyses FOR ALL
        USING (auth.jwt() ->> 'role' = 'service_role');
END$$;

CREATE INDEX IF NOT EXISTS idx_analyses_user_id ON public.analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_analyses_video_id ON public.analyses(video_id);
CREATE INDEX IF NOT EXISTS idx_analyses_status ON public.analyses(status);

-- 5. CHAT MESSAGES TABLE (Interactive Agent 5 Follow-ups)
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    analysis_id UUID NOT NULL REFERENCES public.analyses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can manage their own chat messages" ON public.chat_messages;
    CREATE POLICY "Users can manage their own chat messages"
        ON public.chat_messages FOR ALL
        USING (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Service role has full access to chat messages" ON public.chat_messages;
    CREATE POLICY "Service role has full access to chat messages"
        ON public.chat_messages FOR ALL
        USING (auth.jwt() ->> 'role' = 'service_role');
END$$;

CREATE INDEX IF NOT EXISTS idx_chat_messages_analysis_id ON public.chat_messages(analysis_id);

-- 6. AUTO-UPDATE TIMESTAMP FUNCTION & TRIGGERS
CREATE OR REPLACE FUNCTION public.update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_modtime ON public.profiles;
CREATE TRIGGER update_profiles_modtime
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE PROCEDURE public.update_modified_column();

DROP TRIGGER IF EXISTS update_analyses_modtime ON public.analyses;
CREATE TRIGGER update_analyses_modtime
    BEFORE UPDATE ON public.analyses
    FOR EACH ROW EXECUTE PROCEDURE public.update_modified_column();

-- 7. AUTOMATIC PROFILE CREATION ON AUTH SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, display_name, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', '')
    )
    ON CONFLICT (id) DO UPDATE
    SET
        display_name = EXCLUDED.display_name,
        avatar_url = EXCLUDED.avatar_url,
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
