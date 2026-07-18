import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  patient: { findById: vi.fn() },
  clinicalEvent: { listByPatient: vi.fn(), findById: vi.fn() },
  finding: { listByPatient: vi.fn(), findById: vi.fn() },
}));

vi.mock("@/repositories/patient.repository", () => ({
  PatientRepository: class {
    findById = mocks.patient.findById;
  },
}));
vi.mock("@/repositories/clinical-event.repository", () => ({
  ClinicalEventRepository: class {
    listByPatient = mocks.clinicalEvent.listByPatient;
    findById = mocks.clinicalEvent.findById;
  },
}));
vi.mock("@/repositories/finding.repository", () => ({
  FindingRepository: class {
    listByPatient = mocks.finding.listByPatient;
    findById = mocks.finding.findById;
  },
}));
vi.mock("@/repositories/reminder.repository", () => ({
  ReminderRepository: class {},
}));

import { ReminderService } from "@/services/reminder.service";

const patientId = "45ae0fb2-dfd0-49a6-a426-eb492bcbad46";
const findingId = "6cc1432f-67d4-445d-ad18-0ca3816d369f";
const event = {
  id: "9d1138d8-89b7-47ba-a570-a0a92cc0a850",
  patientId,
  type: "CONTROL",
  eventDate: "2026-07-25",
  title: "Control programado",
  description: "Información conservada únicamente en el evento.",
  status: "SCHEDULED",
  findingId,
  createdAt: "2026-07-17T15:00:00.000Z",
  updatedAt: "2026-07-17T15:00:00.000Z",
};
const finding = {
  id: findingId,
  patientId,
  category: "3",
  laterality: "LEFT",
  studyType: "MAMMOGRAPHY",
  studyDate: "2026-07-15",
  description: "Información conservada únicamente en el hallazgo.",
  biopsyPerformed: false,
  nextControlDate: "2026-07-25",
  status: "FOLLOW_UP",
  createdAt: "2026-07-15T15:00:00.000Z",
  updatedAt: "2026-07-15T15:00:00.000Z",
};

describe("ReminderService.listCandidates", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-18T15:00:00.000Z"));
    mocks.patient.findById.mockResolvedValue({
      id: patientId,
      timezone: "America/La_Paz",
      status: "ACTIVE",
    });
    mocks.clinicalEvent.listByPatient.mockResolvedValue([event]);
    mocks.finding.listByPatient.mockResolvedValue([finding]);
  });

  it("returns null for an unknown patient", async () => {
    mocks.patient.findById.mockResolvedValue(null);
    await expect(ReminderService.listCandidates(patientId)).resolves.toBeNull();
  });

  it("uses the calendar projection to avoid a linked finding duplicate", async () => {
    await expect(ReminderService.listCandidates(patientId)).resolves.toEqual([
      {
        id: `clinical-event:${event.id}`,
        source: "CLINICAL_EVENT",
        sourceId: event.id,
        targetDate: event.eventDate,
        title: event.title,
      },
    ]);
    expect(mocks.clinicalEvent.listByPatient).toHaveBeenCalledWith(patientId, "asc");
    expect(mocks.finding.listByPatient).toHaveBeenCalledWith(patientId, "asc");
  });

  it("includes an unlinked open finding with a future control", async () => {
    mocks.clinicalEvent.listByPatient.mockResolvedValue([]);

    const result = await ReminderService.listCandidates(patientId);

    expect(result).toEqual([
      expect.objectContaining({
        id: `finding-next-control:${finding.id}`,
        source: "FINDING_NEXT_CONTROL",
        sourceId: finding.id,
        targetDate: finding.nextControlDate,
        title: "Próximo control BI-RADS 3",
      }),
    ]);
  });

  it("rejects creation when the scheduled instant is already in the past", async () => {
    mocks.clinicalEvent.findById.mockResolvedValue(event);

    await expect(
      ReminderService.create({
        patientId,
        source: "CLINICAL_EVENT",
        sourceId: event.id,
        targetDate: event.eventDate,
        scheduledFor: "2026-07-18T10:00:00-04:00",
      }),
    ).resolves.toBeNull();
  });
});
