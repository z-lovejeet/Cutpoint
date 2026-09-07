import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const next = url.searchParams.get("next") || "/dashboard";

  const response = NextResponse.redirect(new URL(next, request.url));

  response.cookies.set("cutpoint_guest_session", "true", {
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    sameSite: "lax",
    httpOnly: false,
  });

  return response;
}

export async function POST(request: NextRequest) {
  const url = new URL(request.url);
  const next = url.searchParams.get("next") || "/dashboard";

  const response = NextResponse.json({ success: true, redirect: next });

  response.cookies.set("cutpoint_guest_session", "true", {
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    sameSite: "lax",
    httpOnly: false,
  });

  return response;
}
