import { describe, it, expect, vi } from "vitest";

// Mock env before importing jwt module
vi.mock("@/config/env", () => ({
  env: { AUTH_SECRET: "test-secret-that-is-long-enough-for-testing" },
}));

const { signJwt, verifyJwt } = await import("@/lib/auth/jwt");

describe("JWT utilities", () => {
  const payload = { sub: "user-123", email: "test@test.com", role: "ADMIN" as const };

  it("signs and verifies a token", async () => {
    const token = await signJwt(payload);
    expect(typeof token).toBe("string");

    const decoded = await verifyJwt(token);
    expect(decoded.sub).toBe(payload.sub);
    expect(decoded.email).toBe(payload.email);
    expect(decoded.role).toBe(payload.role);
  });

  it("throws on tampered token", async () => {
    const token = await signJwt(payload);
    const tampered = token.slice(0, -5) + "XXXXX";
    await expect(verifyJwt(tampered)).rejects.toThrow();
  });

  it("includes iat and exp claims", async () => {
    const token = await signJwt(payload);
    const decoded = await verifyJwt(token);
    expect(decoded.iat).toBeDefined();
    expect(decoded.exp).toBeDefined();
    expect(decoded.exp!).toBeGreaterThan(decoded.iat!);
  });
});
