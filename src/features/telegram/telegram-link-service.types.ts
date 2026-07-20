import type { TelegramLinkChallenge, TelegramPatientLink } from "./telegram.types";

export interface CreatedTelegramLinkChallenge {
  challenge: TelegramLinkChallenge;
  token: string;
}
export type TelegramLinkFailureReason =
  | "INVALID_TOKEN"
  | "EXPIRED_TOKEN"
  | "TOKEN_ALREADY_USED"
  | "TOKEN_REVOKED"
  | "PATIENT_NOT_FOUND"
  | "PATIENT_ALREADY_LINKED"
  | "CHAT_ALREADY_LINKED";
export type ConsumeTelegramLinkResult =
  | { success: true; link: TelegramPatientLink }
  | { success: false; reason: TelegramLinkFailureReason };
