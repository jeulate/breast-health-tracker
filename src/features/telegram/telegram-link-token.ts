import { createHash, randomBytes } from "node:crypto";
import type { TelegramLinkToken } from "./telegram.types";

export type TelegramRandomBytes = (size: number) => Buffer;

export function hashTelegramLinkToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function buildTelegramLinkChallengeId(tokenHash: string): string {
  return `tgl_${tokenHash.slice(0, 32)}`;
}

export function createTelegramLinkToken(
  generateRandomBytes: TelegramRandomBytes = randomBytes,
): TelegramLinkToken {
  const token = generateRandomBytes(32).toString("base64url");
  const tokenHash = hashTelegramLinkToken(token);

  return {
    challengeId: buildTelegramLinkChallengeId(tokenHash),
    token,
    tokenHash,
  };
}

export function isTelegramLinkChallengeExpired(expiresAt: string, now = new Date()): boolean {
  return Date.parse(expiresAt) <= now.getTime();
}
