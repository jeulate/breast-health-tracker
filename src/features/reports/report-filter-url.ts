import type { ReportFilters } from "./report.types";

export function buildReportHref(filters: ReportFilters): string {
  const params = new URLSearchParams({ from: filters.from, to: filters.to });

  if (filters.patientId) params.set("patientId", filters.patientId);
  if (filters.patientStatus) params.set("patientStatus", filters.patientStatus);

  return `/dashboard/reports?${params.toString()}`;
}
