import { cookies } from "next/headers";
import { signJwt, verifyJwt } from "@/lib/auth/jwt";
import type { JwtPayload } from "@/types";

const COOKIE_NAME = "session";
const COOKIE_MAX_AGE = 60 * 60 * 8; // 8 hours

export async function createSession(payload: Omit<JwtPayload, "iat" | "exp">): Promise<void> {
  const token = await signJwt(payload);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
}

export async function getSession(): Promise<JwtPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    return await verifyJwt(token);
  } catch {
    return null;
  }
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export { COOKIE_NAME };
