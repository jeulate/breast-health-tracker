import { describe, expect, it } from "vitest";
import { buildPatientListHref } from "@/features/patients/patient-list-url";
import {
  DEFAULT_PATIENT_LIST_QUERY,
  type PatientListQuery,
} from "@/features/patients/patient-list.types";

function createQuery(overrides: Partial<PatientListQuery> = {}): PatientListQuery {
  return { ...DEFAULT_PATIENT_LIST_QUERY, ...overrides };
}

describe("buildPatientListHref", () => {
  it("omits default values from the URL", () => {
    expect(buildPatientListHref(createQuery())).toBe("/dashboard/patients");
  });

  it("preserves active filters when changing pages", () => {
    const href = buildPatientListHref(
      createQuery({ search: "Ana", status: "ACTIVE", pageSize: 20 }),
      { page: 2 },
    );

    expect(href).toBe("/dashboard/patients?search=Ana&status=ACTIVE&page=2&pageSize=20");
  });

  it("encodes special characters safely", () => {
    const href = buildPatientListHref(createQuery({ search: "María López" }));
    expect(href).toBe("/dashboard/patients?search=Mar%C3%ADa+L%C3%B3pez");
  });
});
