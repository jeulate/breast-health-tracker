import type { PatientListQuery } from "./patient-list.types";

export function canUseChronologicalPatientIndex(query: PatientListQuery): boolean {
  return query.search.trim().length === 0 && query.status === "ALL" && query.sortBy === "createdAt";
}
