import { decodeJwt } from "jose";
import { describe, expect, it, vi } from "vitest";
import type { ServerEnv } from "@/config/env";
import type { JwtPayload } from "@/types";

const mocks = vi.hoisted(() => ({
  env: {
    NEXT_PUBLIC_APP_URL: "http://localhost:3000",
    AUTH_SECRET: "test-auth-secret-with-at-least-32-characters",
    ADMIN_INITIAL_EMAIL: "admin@example.com",
    ADMIN_INITIAL_PASSWORD: "Admin1234!",
    KV_REST_API_URL: "https://example.upstash.io",
    KV_REST_API_TOKEN: "test-token",
    KV_REST_API_READ_ONLY_TOKEN: "test-read-only-token",
    HEALTH_APP_REDIS_PREFIX: "bht:v1:",
  } satisfies ServerEnv,
}));

vi.mock("@/config/env", () => ({
  getServerEnv: () => mocks.env,
}));

import { signJwt, verifyJwt } from "@/lib/auth/jwt";

describe("JWT utilities", () => {
  const payload: Omit<JwtPayload, "iat" | "exp"> = {
    sub: "user-123",
    email: "admin@example.com",
    role: "ADMIN",
  };

  it("signs and verifies a token", async () => {
    const token = await signJwt(payload);
    const verified = await verifyJwt(token);

    expect(verified.sub).toBe(payload.sub);
    expect(verified.email).toBe(payload.email);
    expect(verified.role).toBe(payload.role);
  });

  it("throws on tampered token", async () => {
    const token = await signJwt(payload);
    const parts = token.split(".");

    if (parts.length !== 3) {
      throw new Error("Generated JWT does not have the expected format");
    }

    const signature = parts[2];

    if (!signature) {
      throw new Error("Generated JWT does not contain a signature");
    }

    const firstCharacter = signature.charAt(0);
    const replacementCharacter = firstCharacter === "a" ? "b" : "a";

    const tamperedSignature = replacementCharacter + signature.slice(1);

    const tamperedToken = [parts[0], parts[1], tamperedSignature].join(".");

    await expect(verifyJwt(tamperedToken)).rejects.toThrow();
  });

  it("includes iat and exp claims", async () => {
    const token = await signJwt(payload);
    const decoded = decodeJwt(token);

    expect(decoded.iat).toBeTypeOf("number");
    expect(decoded.exp).toBeTypeOf("number");
    expect(decoded.exp).toBeGreaterThan(decoded.iat ?? 0);
  });
});
