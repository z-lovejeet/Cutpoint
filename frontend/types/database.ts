export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface YouTubeChannel {
  id: string;
  user_id: string;
  channel_id: string;
  channel_name: string;
  channel_thumbnail: string | null;
  access_token: string;
  refresh_token: string;
  token_expires_at: string;
  connected_at: string;
}

export type AnalysisStatus =
  | "PENDING"
  | "FETCHING_DATA"
  | "DETECTING_CLIFFS"
  | "ANALYZING_VIDEO"
  | "GENERATING_REPORT"
  | "COMPLETE"
  | "ERROR";

export interface AnalysisRecord {
  id: string;
  user_id: string;
  channel_id: string | null;
  video_id: string;
  video_title: string;
  status: AnalysisStatus;
  report_data: Record<string, unknown> | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChatMessageRecord {
  id: string;
  analysis_id: string;
  user_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}
