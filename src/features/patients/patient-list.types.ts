import type { Patient, PatientStatus } from "@/types";

export type PatientStatusFilter = PatientStatus | "ALL";
export type PatientSortField = "fullName" | "createdAt" | "updatedAt";
export type SortDirection = "asc" | "desc";
export type PatientPageSize = 10 | 20 | 50;

export interface PatientListQuery {
  search: string;
  status: PatientStatusFilter;
  page: number;
  pageSize: PatientPageSize;
  sortBy: PatientSortField;
  sortDirection: SortDirection;
}

export interface PaginatedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export type PaginatedPatients = PaginatedResult<Patient>;

export const DEFAULT_PATIENT_LIST_QUERY: PatientListQuery = {
  search: "",
  status: "ALL",
  page: 1,
  pageSize: 10,
  sortBy: "createdAt",
  sortDirection: "desc",
};
