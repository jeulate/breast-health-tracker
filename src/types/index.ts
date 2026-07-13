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
  /** Reserved for Telegram integration – Phase 4 */
  telegramUserId?: string;
  /** Reserved for Telegram integration – Phase 4 */
  telegramChatId?: string;
  createdAt: string;
  updatedAt: string;
}

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

/** Phase 2 – BI-RADS findings, symptoms and cycles */
export interface Finding {
  id: string;
  patientId: string;
  // details TBD in Phase 2
}

/** Phase 3 – Habits and medical controls */
export interface MedicalControl {
  id: string;
  patientId: string;
  // details TBD in Phase 3
}

/** Phase 5 – Reminders */
export interface Reminder {
  id: string;
  patientId: string;
  // details TBD in Phase 5
}
