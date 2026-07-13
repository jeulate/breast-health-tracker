import { SignJWT, jwtVerify } from "jose";
import { getServerEnv } from "@/config/env";
import type { JwtPayload } from "@/types";

const ALGORITHM = "HS256";
const EXPIRATION = "8h";

function getSecret(): Uint8Array {
  const { AUTH_SECRET } = getServerEnv();

  return new TextEncoder().encode(AUTH_SECRET);
}

export async function signJwt(payload: Omit<JwtPayload, "iat" | "exp">): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: ALGORITHM })
    .setIssuedAt()
    .setExpirationTime(EXPIRATION)
    .sign(getSecret());
}

export async function verifyJwt(token: string): Promise<JwtPayload> {
  const { payload } = await jwtVerify(token, getSecret(), {
    algorithms: [ALGORITHM],
  });

  return payload as unknown as JwtPayload;
}
