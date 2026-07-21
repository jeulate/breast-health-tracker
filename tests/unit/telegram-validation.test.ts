import { describe, expect, it } from "vitest";
import {
  createTelegramLinkChallengeSchema,
  telegramIdentitySchema,
  telegramLinkChallengeSchema,
  telegramLinkTokenSchema,
} from "@/lib/validations/telegram";

const challenge = {
  id: "tgl_0123456789abcdef0123456789abcdef",
  patientId: "45ae0fb2-dfd0-49a6-a426-eb492bcbad46",
  tokenHash: "a".repeat(64),
  status: "PENDING" as const,
  expiresAt: "2026-07-20T15:15:00.000Z",
  createdAt: "2026-07-20T15:00:00.000Z",
  updatedAt: "2026-07-20T15:00:00.000Z",
};

describe("Telegram validation", () => {
  it("accepts numeric identifiers as strings", () => {
    expect(
      telegramIdentitySchema.parse({ telegramUserId: "123456789", telegramChatId: "123456789" }),
    ).toEqual({ telegramUserId: "123456789", telegramChatId: "123456789" });
  });

  it("rejects malformed identifiers and unknown fields", () => {
    expect(
      telegramIdentitySchema.safeParse({ telegramUserId: "user", telegramChatId: "chat" }).success,
    ).toBe(false);
    expect(
      telegramIdentitySchema.safeParse({
        telegramUserId: "1",
        telegramChatId: "1",
        patientName: "Do not copy clinical identity",
      }).success,
    ).toBe(false);
  });

  it("applies a 15-minute default and limits challenge lifetime", () => {
    const patientId = challenge.patientId;
    expect(createTelegramLinkChallengeSchema.parse({ patientId })).toEqual({
      patientId,
      ttlMinutes: 15,
    });
    expect(createTelegramLinkChallengeSchema.safeParse({ patientId, ttlMinutes: 31 }).success).toBe(
      false,
    );
  });

  it("accepts only URL-safe 32-byte tokens", () => {
    expect(telegramLinkTokenSchema.safeParse("A".repeat(43)).success).toBe(true);
    expect(telegramLinkTokenSchema.safeParse("not valid token").success).toBe(false);
  });

  it("accepts a valid pending challenge", () => {
    expect(telegramLinkChallengeSchema.safeParse(challenge).success).toBe(true);
  });

  it("requires lifecycle timestamps for consumed and revoked challenges", () => {
    expect(
      telegramLinkChallengeSchema.safeParse({ ...challenge, status: "CONSUMED" }).success,
    ).toBe(false);
    expect(telegramLinkChallengeSchema.safeParse({ ...challenge, status: "REVOKED" }).success).toBe(
      false,
    );
  });

  it("rejects lifecycle metadata on pending challenges", () => {
    expect(
      telegramLinkChallengeSchema.safeParse({
        ...challenge,
        consumedAt: "2026-07-20T15:05:00.000Z",
      }).success,
    ).toBe(false);
  });
});
