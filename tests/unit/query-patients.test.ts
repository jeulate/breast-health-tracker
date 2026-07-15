import { describe, expect, it } from "vitest";
import { queryPatients } from "@/features/patients/query-patients";
import {
  DEFAULT_PATIENT_LIST_QUERY,
  type PatientListQuery,
} from "@/features/patients/patient-list.types";
import type { Patient } from "@/types";

function createPatient(overrides: Partial<Patient> = {}): Patient {
  return {
    id: "patient-1",
    fullName: "Paciente de prueba",
    timezone: "America/La_Paz",
    status: "ACTIVE",
    createdAt: "2026-07-01T12:00:00.000Z",
    updatedAt: "2026-07-01T12:00:00.000Z",
    ...overrides,
  };
}

function createQuery(overrides: Partial<PatientListQuery> = {}): PatientListQuery {
  return { ...DEFAULT_PATIENT_LIST_QUERY, ...overrides };
}

describe("queryPatients", () => {
  it("returns the first page ordered by newest registration by default", () => {
    const patients = [
      createPatient({ id: "old", fullName: "Ana", createdAt: "2026-05-01T12:00:00.000Z" }),
      createPatient({ id: "new", fullName: "Beatriz", createdAt: "2026-07-01T12:00:00.000Z" }),
    ];

    const result = queryPatients(patients, createQuery());

    expect(result.items.map((patient) => patient.id)).toEqual(["new", "old"]);
    expect(result.total).toBe(2);
    expect(result.page).toBe(1);
  });

  it("searches names without distinguishing accents or letter case", () => {
    const patients = [
      createPatient({ id: "maria", fullName: "María García" }),
      createPatient({ id: "ana", fullName: "Ana Pérez" }),
    ];

    const result = queryPatients(patients, createQuery({ search: "MARIA" }));

    expect(result.items.map((patient) => patient.id)).toEqual(["maria"]);
  });

  it("filters patients by status", () => {
    const patients = [
      createPatient({ id: "active", status: "ACTIVE" }),
      createPatient({ id: "inactive", status: "INACTIVE" }),
    ];

    const result = queryPatients(patients, createQuery({ status: "INACTIVE" }));

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.id).toBe("inactive");
  });

  it("sorts patients alphabetically", () => {
    const patients = [
      createPatient({ id: "zoe", fullName: "Zoé" }),
      createPatient({ id: "ana", fullName: "Ána" }),
      createPatient({ id: "beatriz", fullName: "Beatriz" }),
    ];

    const result = queryPatients(
      patients,
      createQuery({ sortBy: "fullName", sortDirection: "asc" }),
    );

    expect(result.items.map((patient) => patient.id)).toEqual(["ana", "beatriz", "zoe"]);
  });

  it("returns the requested page with pagination metadata", () => {
    const patients = Array.from({ length: 25 }, (_, index) =>
      createPatient({
        id: `patient-${index + 1}`,
        fullName: `Paciente ${String(index + 1).padStart(2, "0")}`,
        createdAt: new Date(Date.UTC(2026, 0, index + 1)).toISOString(),
      }),
    );

    const result = queryPatients(patients, createQuery({ page: 2, pageSize: 10 }));

    expect(result.items).toHaveLength(10);
    expect(result.total).toBe(25);
    expect(result.totalPages).toBe(3);
    expect(result.page).toBe(2);
    expect(result.hasPreviousPage).toBe(true);
    expect(result.hasNextPage).toBe(true);
  });

  it("clamps an out-of-range page to the final available page", () => {
    const patients = [createPatient({ id: "only" })];

    const result = queryPatients(patients, createQuery({ page: 99 }));

    expect(result.page).toBe(1);
    expect(result.items[0]?.id).toBe("only");
  });
});
