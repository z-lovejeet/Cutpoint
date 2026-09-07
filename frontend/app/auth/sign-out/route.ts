import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();

  const { origin } = new URL(request.url);
  const response = NextResponse.redirect(`${origin}/sign-in`, {
    status: 302,
  });

  // Clear guest session cookie
  response.cookies.delete("cutpoint_guest_session");

  return response;
}
