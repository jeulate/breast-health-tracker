import { describe, it, expect } from "vitest";
import type { User, Patient } from "@/types";

// Mirrors the serialization logic in the repositories
function serializeUser(user: User): Record<string, string> {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    passwordHash: user.passwordHash,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function deserializeUser(data: Record<string, string>): User {
  return {
    id: data.id,
    name: data.name,
    email: data.email,
    passwordHash: data.passwordHash,
    role: data.role as User["role"],
    status: data.status as User["status"],
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

function serializePatient(patient: Patient): Record<string, string> {
  const record: Record<string, string> = {
    id: patient.id,
    fullName: patient.fullName,
    timezone: patient.timezone,
    status: patient.status,
    createdAt: patient.createdAt,
    updatedAt: patient.updatedAt,
  };
  if (patient.birthDate) record.birthDate = patient.birthDate;
  return record;
}

function deserializePatient(data: Record<string, string>): Patient {
  return {
    id: data.id,
    fullName: data.fullName,
    birthDate: data.birthDate || undefined,
    timezone: data.timezone,
    status: data.status as Patient["status"],
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

const BASE_USER: User = {
  id: "u-001",
  name: "Admin",
  email: "admin@test.com",
  passwordHash: "$2b$12$xxx",
  role: "ADMIN",
  status: "ACTIVE",
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
};

const BASE_PATIENT: Patient = {
  id: "p-001",
  fullName: "Ana Test",
  timezone: "America/Mexico_City",
  status: "ACTIVE",
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
};

describe("Redis mapper – User", () => {
  it("round-trips a user without data loss", () => {
    const serialized = serializeUser(BASE_USER);
    const deserialized = deserializeUser(serialized);
    expect(deserialized).toEqual(BASE_USER);
  });

  it("preserves role type", () => {
    const serialized = serializeUser(BASE_USER);
    const deserialized = deserializeUser(serialized);
    expect(deserialized.role).toBe("ADMIN");
  });
});

describe("Redis mapper – Patient", () => {
  it("round-trips a patient without optional fields", () => {
    const serialized = serializePatient(BASE_PATIENT);
    const deserialized = deserializePatient(serialized);
    expect(deserialized).toEqual(BASE_PATIENT);
  });

  it("preserves optional birthDate", () => {
    const patient: Patient = { ...BASE_PATIENT, birthDate: "1990-01-01" };
    const serialized = serializePatient(patient);
    const deserialized = deserializePatient(serialized);
    expect(deserialized.birthDate).toBe("1990-01-01");
  });

  it("returns undefined for missing birthDate", () => {
    const serialized = serializePatient(BASE_PATIENT);
    const deserialized = deserializePatient(serialized);
    expect(deserialized.birthDate).toBeUndefined();
  });
});
