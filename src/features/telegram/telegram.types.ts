export const TELEGRAM_LINK_STATUSES = ["PENDING", "CONSUMED", "EXPIRED", "REVOKED"] as const;

export type TelegramLinkStatus = (typeof TELEGRAM_LINK_STATUSES)[number];

/** Telegram numeric identifiers are stored as strings to avoid precision loss. */
export interface TelegramIdentity {
  telegramUserId: string;
  telegramChatId: string;
}

/** Persisted challenge. The raw deep-link token is never stored. */
export interface TelegramLinkChallenge {
  id: string;
  patientId: string;
  tokenHash: string;
  status: TelegramLinkStatus;
  expiresAt: string;
  consumedAt?: string;
  revokedAt?: string;
  createdAt: string;
  updatedAt: string;
}

/** Returned only when a challenge is created and shown once to the administrator. */
export interface TelegramLinkToken {
  challengeId: string;
  token: string;
  tokenHash: string;
}

export interface TelegramPatientLink extends TelegramIdentity {
  patientId: string;
  linkedAt: string;
}
