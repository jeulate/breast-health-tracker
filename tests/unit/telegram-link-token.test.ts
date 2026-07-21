import { describe, expect, it } from "vitest";
import {
  buildTelegramLinkChallengeId,
  createTelegramLinkToken,
  hashTelegramLinkToken,
  isTelegramLinkChallengeExpired,
} from "@/features/telegram";

describe("Telegram link token", () => {
  it("creates a URL-safe token without persisting it in the identifier", () => {
    const result = createTelegramLinkToken(() => Buffer.alloc(32, 7));

    expect(result.token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(result.tokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(result.challengeId).toBe(buildTelegramLinkChallengeId(result.tokenHash));
    expect(result.challengeId).not.toContain(result.token);
  });

  it("hashes equivalent tokens deterministically", () => {
    expect(hashTelegramLinkToken("safe-token")).toBe(hashTelegramLinkToken("safe-token"));
    expect(hashTelegramLinkToken("safe-token")).not.toBe(hashTelegramLinkToken("another-token"));
  });

  it("detects an expired challenge at the exact boundary", () => {
    const now = new Date("2026-07-20T15:00:00.000Z");
    expect(isTelegramLinkChallengeExpired("2026-07-20T15:00:00.000Z", now)).toBe(true);
    expect(isTelegramLinkChallengeExpired("2026-07-20T15:00:01.000Z", now)).toBe(false);
  });
});
