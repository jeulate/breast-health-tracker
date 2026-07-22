import type { ClinicalEvent } from "@/features/clinical-timeline";
import type { Finding } from "@/features/findings";
import type { Reminder } from "@/features/reminders";
import type { ReportFilters, ReportPatientSource, ReportSummary } from "./report.types";

const inPeriod = (value: string, from: string, to: string) =>
  value.slice(0, 10) >= from && value.slice(0, 10) <= to;

export function calculateReportSummary(
  filters: ReportFilters,
  patients: ReportPatientSource[],
  findings: Finding[],
  events: ClinicalEvent[],
  reminders: Reminder[],
): ReportSummary {
  const filteredPatients = patients.filter(
    (p) => !filters.patientStatus || p.status === filters.patientStatus,
  );
  const ids = new Set(filteredPatients.map((p) => p.id));
  const selected = (patientId: string) =>
    ids.has(patientId) && (!filters.patientId || patientId === filters.patientId);
  const periodFindings = findings.filter(
    (item) => selected(item.patientId) && inPeriod(item.studyDate, filters.from, filters.to),
  );
  const periodEvents = events.filter(
    (item) => selected(item.patientId) && inPeriod(item.eventDate, filters.from, filters.to),
  );
  const periodReminders = reminders.filter(
    (item) => selected(item.patientId) && inPeriod(item.scheduledFor, filters.from, filters.to),
  );
  const visiblePatients = filteredPatients.filter(
    (p) => !filters.patientId || p.id === filters.patientId,
  );

  return {
    period: { from: filters.from, to: filters.to },
    patients: {
      total: visiblePatients.length,
      active: visiblePatients.filter((p) => p.status === "ACTIVE").length,
      inactive: visiblePatients.filter((p) => p.status === "INACTIVE").length,
    },
    findings: {
      total: periodFindings.length,
      followUp: periodFindings.filter((x) => x.status === "FOLLOW_UP").length,
      closed: periodFindings.filter((x) => x.status === "CLOSED").length,
    },
    clinicalEvents: {
      total: periodEvents.length,
      scheduled: periodEvents.filter((x) => x.status === "SCHEDULED").length,
      completed: periodEvents.filter((x) => x.status === "COMPLETED").length,
      cancelled: periodEvents.filter((x) => x.status === "CANCELLED").length,
    },
    reminders: {
      total: periodReminders.length,
      pending: periodReminders.filter((x) => x.status === "PENDING").length,
      processing: periodReminders.filter((x) => x.status === "PROCESSING").length,
      sent: periodReminders.filter((x) => x.status === "SENT").length,
      completed: periodReminders.filter((x) => x.status === "COMPLETED").length,
      cancelled: periodReminders.filter((x) => x.status === "CANCELLED").length,
      failed: periodReminders.filter((x) => x.status === "FAILED").length,
    },
  };
}
