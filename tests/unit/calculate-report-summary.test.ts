import { describe, expect, it } from "vitest";
import type { ClinicalEvent } from "@/features/clinical-timeline";
import type { Finding } from "@/features/findings";
import { calculateReportSummary } from "@/features/reports";
import type { Reminder } from "@/features/reminders";

const patients = [
  { id: "patient-1", status: "ACTIVE" as const },
  { id: "patient-2", status: "INACTIVE" as const },
];

function finding(overrides: Partial<Finding> = {}): Finding {
  return {
    id: "finding-1",
    patientId: "patient-1",
    category: "3",
    laterality: "LEFT",
    studyType: "ULTRASOUND",
    studyDate: "2026-07-10",
    description: "Hallazgo de prueba",
    biopsyPerformed: false,
    status: "FOLLOW_UP",
    createdAt: "2026-07-10T12:00:00.000Z",
    updatedAt: "2026-07-10T12:00:00.000Z",
    ...overrides,
  };
}

function clinicalEvent(overrides: Partial<ClinicalEvent> = {}): ClinicalEvent {
  return {
    id: "event-1",
    patientId: "patient-1",
    type: "CONTROL",
    eventDate: "2026-07-15",
    title: "Control",
    description: "Evento de prueba",
    status: "SCHEDULED",
    createdAt: "2026-07-15T12:00:00.000Z",
    updatedAt: "2026-07-15T12:00:00.000Z",
    ...overrides,
  };
}

function reminder(overrides: Partial<Reminder> = {}): Reminder {
  return {
    id: "reminder-1",
    patientId: "patient-1",
    source: "CLINICAL_EVENT",
    sourceId: "event-1",
    targetDate: "2026-07-20",
    scheduledFor: "2026-07-20T14:00:00.000Z",
    timezone: "America/La_Paz",
    channel: "IN_APP",
    status: "PENDING",
    attempts: 0,
    maxAttempts: 3,
    createdAt: "2026-07-15T12:00:00.000Z",
    updatedAt: "2026-07-15T12:00:00.000Z",
    ...overrides,
  };
}

describe("calculateReportSummary", () => {
  it("returns zero activity when there are no records", () => {
    const result = calculateReportSummary({ from: "2026-07-01", to: "2026-07-31" }, [], [], [], []);

    expect(result.period).toEqual({ from: "2026-07-01", to: "2026-07-31" });
    expect(result.patients.total).toBe(0);
    expect(result.findings.total).toBe(0);
    expect(result.clinicalEvents.total).toBe(0);
    expect(result.reminders.total).toBe(0);
  });

  it("counts records inside the inclusive period by status", () => {
    const result = calculateReportSummary(
      { from: "2026-07-10", to: "2026-07-31" },
      patients,
      [finding(), finding({ id: "finding-2", status: "CLOSED", studyDate: "2026-07-31" })],
      [clinicalEvent(), clinicalEvent({ id: "event-2", status: "COMPLETED" })],
      [reminder(), reminder({ id: "reminder-2", status: "SENT" })],
    );

    expect(result.patients).toEqual({ total: 2, active: 1, inactive: 1 });
    expect(result.findings).toEqual({ total: 2, followUp: 1, closed: 1 });
    expect(result.clinicalEvents).toEqual({
      total: 2,
      scheduled: 1,
      completed: 1,
      cancelled: 0,
    });
    expect(result.reminders).toMatchObject({ total: 2, pending: 1, sent: 1 });
  });

  it("excludes activity outside the requested period", () => {
    const result = calculateReportSummary(
      { from: "2026-07-01", to: "2026-07-31" },
      patients,
      [finding({ studyDate: "2026-06-30" })],
      [clinicalEvent({ eventDate: "2026-08-01" })],
      [reminder({ scheduledFor: "2026-08-01T00:00:00.000Z" })],
    );

    expect(result.findings.total).toBe(0);
    expect(result.clinicalEvents.total).toBe(0);
    expect(result.reminders.total).toBe(0);
  });

  it("applies patient and patient-status scope to every metric", () => {
    const result = calculateReportSummary(
      {
        from: "2026-07-01",
        to: "2026-07-31",
        patientId: "patient-2",
        patientStatus: "INACTIVE",
      },
      patients,
      [finding(), finding({ id: "finding-2", patientId: "patient-2", status: "CLOSED" })],
      [clinicalEvent(), clinicalEvent({ id: "event-2", patientId: "patient-2" })],
      [reminder(), reminder({ id: "reminder-2", patientId: "patient-2", status: "FAILED" })],
    );

    expect(result.patients).toEqual({ total: 1, active: 0, inactive: 1 });
    expect(result.findings).toEqual({ total: 1, followUp: 0, closed: 1 });
    expect(result.clinicalEvents.total).toBe(1);
    expect(result.reminders).toMatchObject({ total: 1, pending: 0, failed: 1 });
  });
});
