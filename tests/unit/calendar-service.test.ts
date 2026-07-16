import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ClinicalEvent } from "@/features/clinical-timeline";
import type { Finding, Patient } from "@/types";

const mocks = vi.hoisted(() => ({
  clinicalEventRepository: {
    listByPatient: vi.fn(),
  },
  findingRepository: {
    listByPatient: vi.fn(),
  },
  patientRepository: {
    listAll: vi.fn(),
  },
}));

vi.mock("@/repositories/clinical-event.repository", () => ({
  ClinicalEventRepository: vi.fn(() => mocks.clinicalEventRepository),
}));

vi.mock("@/repositories/finding.repository", () => ({
  FindingRepository: vi.fn(() => mocks.findingRepository),
}));

vi.mock("@/repositories/patient.repository", () => ({
  PatientRepository: vi.fn(() => mocks.patientRepository),
}));

import { CalendarService } from "@/services/calendar.service";

const patient: Patient = {
  id: "45ae0fb2-dfd0-49a6-a426-eb492bcbad46",
  fullName: "Paciente ficticia",
  timezone: "America/La_Paz",
  status: "ACTIVE",
  createdAt: "2026-07-01T12:00:00.000Z",
  updatedAt: "2026-07-01T12:00:00.000Z",
};

const control: ClinicalEvent = {
  id: "event-1",
  patientId: patient.id,
  type: "CONTROL",
  eventDate: "2026-08-10",
  title: "Control programado",
  description: "Control ficticio registrado para seguimiento.",
  status: "SCHEDULED",
  createdAt: "2026-07-16T12:00:00.000Z",
  updatedAt: "2026-07-16T12:00:00.000Z",
};

const finding: Finding = {
  id: "finding-1",
  patientId: patient.id,
  category: "3",
  laterality: "LEFT",
  studyType: "ULTRASOUND",
  studyDate: "2026-07-10",
  description: "Hallazgo ficticio consignado por un profesional.",
  biopsyPerformed: false,
  nextControlDate: "2026-08-20",
  status: "FOLLOW_UP",
  createdAt: "2026-07-10T12:00:00.000Z",
  updatedAt: "2026-07-10T12:00:00.000Z",
};

const range = { from: "2026-08-01", to: "2026-08-31" } as const;

describe("CalendarService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.patientRepository.listAll.mockResolvedValue([patient]);
    mocks.clinicalEventRepository.listByPatient.mockResolvedValue([control]);
    mocks.findingRepository.listByPatient.mockResolvedValue([finding]);
  });

  it("enriches projected items with patient information", async () => {
    const result = await CalendarService.list(range);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual(
      expect.objectContaining({
        patientId: patient.id,
        patientName: "Paciente ficticia",
        patientActive: true,
      }),
    );
  });

  it("keeps inactive patients visible and marked", async () => {
    mocks.patientRepository.listAll.mockResolvedValue([{ ...patient, status: "INACTIVE" }]);

    const result = await CalendarService.list(range);

    expect(result[0].patientActive).toBe(false);
  });

  it("queries both sources in ascending order for every patient", async () => {
    await CalendarService.list(range);

    expect(mocks.clinicalEventRepository.listByPatient).toHaveBeenCalledWith(patient.id, "asc");
    expect(mocks.findingRepository.listByPatient).toHaveBeenCalledWith(patient.id, "asc");
  });

  it("returns an empty calendar without querying sources when there are no patients", async () => {
    mocks.patientRepository.listAll.mockResolvedValue([]);

    await expect(CalendarService.list(range)).resolves.toEqual([]);
    expect(mocks.clinicalEventRepository.listByPatient).not.toHaveBeenCalled();
    expect(mocks.findingRepository.listByPatient).not.toHaveBeenCalled();
  });

  it("sorts the combined result globally by date and patient name", async () => {
    const secondPatient = {
      ...patient,
      id: "6f7b715e-623e-46bf-bcf4-d5fdcc20fbf2",
      fullName: "Ana Ficticia",
    };
    mocks.patientRepository.listAll.mockResolvedValue([patient, secondPatient]);
    mocks.clinicalEventRepository.listByPatient.mockImplementation(async (patientId: string) => [
      { ...control, patientId, id: `event-${patientId}`, eventDate: "2026-08-10" },
    ]);
    mocks.findingRepository.listByPatient.mockResolvedValue([]);

    const result = await CalendarService.list(range);

    expect(result.map((item) => item.patientName)).toEqual(["Ana Ficticia", "Paciente ficticia"]);
  });

  it("validates the range before reading repositories", async () => {
    await expect(CalendarService.list({ from: "2026-09-01", to: "2026-08-01" })).rejects.toThrow();

    expect(mocks.patientRepository.listAll).not.toHaveBeenCalled();
  });
});
