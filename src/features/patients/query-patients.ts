import type { Patient } from "@/types";
import type {
  PaginatedPatients,
  PatientListQuery,
  PatientSortField,
  SortDirection,
} from "./patient-list.types";

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLocaleLowerCase("es-BO");
}

function compareText(left: string, right: string): number {
  return left.localeCompare(right, "es-BO", { sensitivity: "base" });
}

function toTimestamp(value: string): number {
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function comparePatients(
  left: Patient,
  right: Patient,
  sortBy: PatientSortField,
  direction: SortDirection,
): number {
  const result =
    sortBy === "fullName"
      ? compareText(left.fullName, right.fullName)
      : toTimestamp(left[sortBy]) - toTimestamp(right[sortBy]);

  if (result === 0) return compareText(left.fullName, right.fullName);
  return direction === "asc" ? result : -result;
}

export function queryPatients(patients: Patient[], query: PatientListQuery): PaginatedPatients {
  const normalizedSearch = normalizeText(query.search);

  const filtered = patients.filter((patient) => {
    const matchesSearch =
      normalizedSearch.length === 0 || normalizeText(patient.fullName).includes(normalizedSearch);
    const matchesStatus = query.status === "ALL" || patient.status === query.status;
    return matchesSearch && matchesStatus;
  });

  const sorted = [...filtered].sort((left, right) =>
    comparePatients(left, right, query.sortBy, query.sortDirection),
  );

  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / query.pageSize));
  const page = Math.min(query.page, totalPages);
  const start = (page - 1) * query.pageSize;
  const items = sorted.slice(start, start + query.pageSize);

  return {
    items,
    page,
    pageSize: query.pageSize,
    total,
    totalPages,
    hasPreviousPage: page > 1,
    hasNextPage: page < totalPages,
  };
}
