import { NextResponse } from "next/server";
import { createSessionToken, getSessionTtlMs, SESSION_COOKIE } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const password = body?.password;
  const expected = process.env.DASHBOARD_PASSWORD;

  if (!expected) {
    return NextResponse.json({ error: "Missing dashboard password" }, { status: 500 });
  }

  if (!password || password !== expected) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = createSessionToken();
  if (!token) {
    return NextResponse.json({ error: "Unable to create session" }, { status: 500 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: Math.floor(getSessionTtlMs() / 1000),
    path: "/",
  });
  return response;
}
