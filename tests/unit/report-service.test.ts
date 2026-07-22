import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  patientRepository: { listAll: vi.fn() },
  findingRepository: { listByPatient: vi.fn() },
  clinicalEventRepository: { listByPatient: vi.fn() },
  reminderRepository: { listByPatient: vi.fn() },
}));

vi.mock("@/repositories/patient.repository", () => ({
  PatientRepository: vi.fn(() => mocks.patientRepository),
}));
vi.mock("@/repositories/finding.repository", () => ({
  FindingRepository: vi.fn(() => mocks.findingRepository),
}));
vi.mock("@/repositories/clinical-event.repository", () => ({
  ClinicalEventRepository: vi.fn(() => mocks.clinicalEventRepository),
}));
vi.mock("@/repositories/reminder.repository", () => ({
  ReminderRepository: vi.fn(() => mocks.reminderRepository),
}));

import { ReportService } from "@/services/report.service";

const filters = { from: "2026-07-01", to: "2026-07-31" } as const;
const patients = [
  {
    id: "patient-1",
    fullName: "Paciente uno",
    timezone: "America/La_Paz",
    status: "ACTIVE",
    createdAt: "2026-07-01T12:00:00.000Z",
    updatedAt: "2026-07-01T12:00:00.000Z",
  },
  {
    id: "patient-2",
    fullName: "Paciente dos",
    timezone: "America/La_Paz",
    status: "INACTIVE",
    createdAt: "2026-07-01T12:00:00.000Z",
    updatedAt: "2026-07-01T12:00:00.000Z",
  },
] as const;

describe("ReportService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.patientRepository.listAll.mockResolvedValue(patients);
    mocks.findingRepository.listByPatient.mockResolvedValue([]);
    mocks.clinicalEventRepository.listByPatient.mockResolvedValue([]);
    mocks.reminderRepository.listByPatient.mockResolvedValue([]);
  });

  it("aggregates every patient when no patient filter is present", async () => {
    const result = await ReportService.summary(filters);

    expect(result.patients).toEqual({ total: 2, active: 1, inactive: 1 });
    expect(mocks.findingRepository.listByPatient).toHaveBeenCalledTimes(2);
    expect(mocks.clinicalEventRepository.listByPatient).toHaveBeenCalledTimes(2);
    expect(mocks.reminderRepository.listByPatient).toHaveBeenCalledTimes(2);
  });

  it("queries only the selected patient", async () => {
    const result = await ReportService.summary({ ...filters, patientId: "patient-2" });

    expect(result.patients).toEqual({ total: 1, active: 0, inactive: 1 });
    expect(mocks.findingRepository.listByPatient).toHaveBeenCalledOnce();
    expect(mocks.findingRepository.listByPatient).toHaveBeenCalledWith("patient-2");
    expect(mocks.clinicalEventRepository.listByPatient).toHaveBeenCalledWith("patient-2");
    expect(mocks.reminderRepository.listByPatient).toHaveBeenCalledWith("patient-2");
  });

  it("does not query clinical repositories for an unknown patient", async () => {
    const result = await ReportService.summary({ ...filters, patientId: "missing" });

    expect(result.patients.total).toBe(0);
    expect(mocks.findingRepository.listByPatient).not.toHaveBeenCalled();
    expect(mocks.clinicalEventRepository.listByPatient).not.toHaveBeenCalled();
    expect(mocks.reminderRepository.listByPatient).not.toHaveBeenCalled();
  });
});
