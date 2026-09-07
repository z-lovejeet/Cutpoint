import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { DashboardNavbar } from "@/components/layout/DashboardNavbar";
import type { User } from "@supabase/supabase-js";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user: supabaseUser },
  } = await supabase.auth.getUser();

  const cookieStore = await cookies();
  const isGuest = cookieStore.get("cutpoint_guest_session")?.value === "true";

  if (!supabaseUser && !isGuest) {
    redirect("/sign-in");
  }

  const activeUser: User = supabaseUser || {
    id: "guest-evaluator-id",
    app_metadata: { provider: "guest" },
    user_metadata: {
      full_name: "Hackathon Evaluator",
      name: "Guest Judge",
      avatar_url: null,
      is_guest: true,
    },
    aud: "authenticated",
    created_at: new Date().toISOString(),
    email: "judge@cutpoint.engine",
    phone: "",
    role: "guest",
    updated_at: new Date().toISOString(),
  };

  return (
    <div className="min-h-screen flex flex-col bg-background-base text-text-primary">
      <DashboardNavbar user={activeUser} isGuest={isGuest && !supabaseUser} />
      <div className="flex-1 flex flex-col">{children}</div>
    </div>
  );
}
