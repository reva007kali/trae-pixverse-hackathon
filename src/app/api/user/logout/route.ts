import { NextResponse } from "next/server";
import { USER_SESSION_COOKIE } from "@/lib/user-session";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(USER_SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}

