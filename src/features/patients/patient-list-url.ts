import { DEFAULT_PATIENT_LIST_QUERY, type PatientListQuery } from "./patient-list.types";

export function buildPatientListHref(
  query: PatientListQuery,
  overrides: Partial<PatientListQuery> = {},
): string {
  const nextQuery: PatientListQuery = { ...query, ...overrides };
  const params = new URLSearchParams();

  if (nextQuery.search) params.set("search", nextQuery.search);
  if (nextQuery.status !== DEFAULT_PATIENT_LIST_QUERY.status) {
    params.set("status", nextQuery.status);
  }
  if (nextQuery.page !== DEFAULT_PATIENT_LIST_QUERY.page) {
    params.set("page", String(nextQuery.page));
  }
  if (nextQuery.pageSize !== DEFAULT_PATIENT_LIST_QUERY.pageSize) {
    params.set("pageSize", String(nextQuery.pageSize));
  }
  if (nextQuery.sortBy !== DEFAULT_PATIENT_LIST_QUERY.sortBy) {
    params.set("sortBy", nextQuery.sortBy);
  }
  if (nextQuery.sortDirection !== DEFAULT_PATIENT_LIST_QUERY.sortDirection) {
    params.set("sortDirection", nextQuery.sortDirection);
  }

  const searchParams = params.toString();
  return searchParams ? `/dashboard/patients?${searchParams}` : "/dashboard/patients";
}
