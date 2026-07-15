import { describe, expect, it } from "vitest";
import { canUseChronologicalPatientIndex } from "@/features/patients/patient-list-strategy";
import {
  DEFAULT_PATIENT_LIST_QUERY,
  type PatientListQuery,
} from "@/features/patients/patient-list.types";

function createQuery(overrides: Partial<PatientListQuery> = {}): PatientListQuery {
  return { ...DEFAULT_PATIENT_LIST_QUERY, ...overrides };
}

describe("canUseChronologicalPatientIndex", () => {
  it("uses the index for the default chronological query", () => {
    expect(canUseChronologicalPatientIndex(createQuery())).toBe(true);
  });

  it("supports ascending chronological order", () => {
    expect(canUseChronologicalPatientIndex(createQuery({ sortDirection: "asc" }))).toBe(true);
  });

  it("does not use the index when searching by name", () => {
    expect(canUseChronologicalPatientIndex(createQuery({ search: "Ana" }))).toBe(false);
  });

  it("does not use the index when filtering by status", () => {
    expect(canUseChronologicalPatientIndex(createQuery({ status: "ACTIVE" }))).toBe(false);
  });

  it("does not use the index when sorting by another field", () => {
    expect(canUseChronologicalPatientIndex(createQuery({ sortBy: "fullName" }))).toBe(false);
  });
});
