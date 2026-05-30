import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { USER_SESSION_COOKIE } from "@/lib/user-session";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim() : "";

  if (!name || !email) {
    return NextResponse.json({ error: "Name dan email wajib diisi." }, { status: 400 });
  }

  const sessionId = randomUUID();

  const res = NextResponse.json({
    session_id: sessionId,
    user: {
      name,
      email,
      avatar_seed: `${name}:${email}`,
    },
  });

  res.cookies.set(USER_SESSION_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return res;
}

