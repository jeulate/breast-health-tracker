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

// ─── Placeholders for future phases ──────────────────────────────────────────

/** Phase 5 – Timeline and medical controls */
export interface MedicalControl {
  id: string;
  patientId: string;
  // details TBD in Phase 5
}

/** Phase 6 – Reminders */
export interface Reminder {
  id: string;
  patientId: string;
  // details TBD in Phase 6
}
