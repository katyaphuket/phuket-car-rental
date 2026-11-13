import { NextRequest, NextResponse } from "next/server";
import { checkManagerPassword, MANAGER_COOKIE, managerCookieValue } from "@/lib/offer";

const COOKIE_MAX_AGE = 90 * 24 * 60 * 60;

export async function POST(request: NextRequest) {
  const { password } = (await request.json().catch(() => ({}))) as { password?: string };

  if (!password || !checkManagerPassword(password)) {
    // Небольшая пауза, чтобы пароль нельзя было быстро подбирать.
    await new Promise((resolve) => setTimeout(resolve, 800));
    return NextResponse.json({ error: "wrong password" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(MANAGER_COOKIE, managerCookieValue()!, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
  return response;
}
