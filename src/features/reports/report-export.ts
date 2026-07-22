import type { ReportFilters, ReportSummary } from "./report.types";

export type ReportExportFormat = "csv" | "pdf";

export interface ReportExportRow {
  category: string;
  total: number;
  detail: string;
}

export function buildReportExportUrl(filters: ReportFilters, format: ReportExportFormat): string {
  const params = new URLSearchParams({ from: filters.from, to: filters.to });
  if (filters.patientId) params.set("patientId", filters.patientId);
  if (filters.patientStatus) params.set("patientStatus", filters.patientStatus);
  return `/api/reports/export/${format}?${params.toString()}`;
}

export function buildReportExportRows(summary: ReportSummary): ReportExportRow[] {
  return [
    {
      category: "Pacientes",
      total: summary.patients.total,
      detail: `${summary.patients.active} activos, ${summary.patients.inactive} inactivos`,
    },
    {
      category: "Hallazgos",
      total: summary.findings.total,
      detail: `${summary.findings.followUp} en seguimiento, ${summary.findings.closed} cerrados`,
    },
    {
      category: "Seguimientos",
      total: summary.clinicalEvents.total,
      detail: `${summary.clinicalEvents.scheduled} programados, ${summary.clinicalEvents.completed} completados, ${summary.clinicalEvents.cancelled} cancelados`,
    },
    {
      category: "Recordatorios",
      total: summary.reminders.total,
      detail: `${summary.reminders.pending} pendientes, ${summary.reminders.processing} procesando, ${summary.reminders.sent} enviados, ${summary.reminders.completed} completados, ${summary.reminders.cancelled} cancelados, ${summary.reminders.failed} fallidos`,
    },
  ];
}

export function buildReportFilename(format: ReportExportFormat, summary: ReportSummary): string {
  return `reporte-${summary.period.from}-${summary.period.to}.${format}`;
}
