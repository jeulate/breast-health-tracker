// ─── Enums ────────────────────────────────────────────────────────────────────

export type UserRole = "ADMIN" | "PROFESSIONAL";
export type UserStatus = "ACTIVE" | "INACTIVE";
export type PatientStatus = "ACTIVE" | "INACTIVE";

// ─── Entities ─────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Patient {
  id: string;
  fullName: string;
  birthDate?: string;
  timezone: string;
  status: PatientStatus;
  /** Reserved for Telegram integration – Phase 7 */
  telegramUserId?: string;
  /** Reserved for Telegram integration – Phase 7 */
  telegramChatId?: string;
  createdAt: string;
  updatedAt: string;
}

export type {
  BiradsCategory,
  BreastLaterality,
  BreastStudyType,
  Finding,
  FindingStatus,
} from "@/features/findings";

export type {
  ClinicalEvent,
  ClinicalEventStatus,
  ClinicalEventType,
  TimelineEntry,
  TimelineEntrySource,
} from "@/features/clinical-timeline";

export type {
  Reminder,
  ReminderChannel,
  ReminderIdentityInput,
  ReminderSource,
  ReminderStatus,
} from "@/features/reminders";

export type {
  TelegramIdentity,
  TelegramLinkChallenge,
  TelegramLinkStatus,
  TelegramLinkToken,
  TelegramPatientLink,
} from "@/features/telegram";

// ─── API Response ─────────────────────────────────────────────────────────────

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export interface ApiResponse<T = undefined> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

// ─── Session ──────────────────────────────────────────────────────────────────

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

// ─── Public User (safe to return to client) ───────────────────────────────────

export type PublicUser = Omit<User, "passwordHash">;
