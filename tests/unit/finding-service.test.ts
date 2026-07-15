import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Finding, Patient } from "@/types";

const mocks = vi.hoisted(() => ({
  findingRepository: {
    findById: vi.fn(),
    save: vi.fn(),
    update: vi.fn(),
    listByPatient: vi.fn(),
  },
  patientRepository: {
    findById: vi.fn(),
  },
}));

vi.mock("@/repositories/finding.repository", () => ({
  FindingRepository: vi.fn(() => mocks.findingRepository),
}));

vi.mock("@/repositories/patient.repository", () => ({
  PatientRepository: vi.fn(() => mocks.patientRepository),
}));

import { FindingService } from "@/services/finding.service";

const patient: Patient = {
  id: "45ae0fb2-dfd0-49a6-a426-eb492bcbad46",
  fullName: "Paciente ficticia",
  timezone: "America/La_Paz",
  status: "ACTIVE",
  createdAt: "2026-07-01T12:00:00.000Z",
  updatedAt: "2026-07-01T12:00:00.000Z",
};

const finding: Finding = {
  id: "finding-1",
  patientId: patient.id,
  category: "3",
  laterality: "LEFT",
  studyType: "MAMMOGRAPHY",
  studyDate: "2026-07-01",
  description: "Hallazgo registrado desde el informe profesional.",
  observations: "Seguimiento registrado.",
  biopsyPerformed: true,
  biopsyResult: "Resultado registrado.",
  nextControlDate: "2026-07-10",
  status: "FOLLOW_UP",
  createdAt: "2026-07-01T12:00:00.000Z",
  updatedAt: "2026-07-01T12:00:00.000Z",
};

const createInput = {
  patientId: patient.id,
  category: "3",
  laterality: "LEFT",
  studyType: "MAMMOGRAPHY",
  studyDate: "2026-07-01",
  description: "Hallazgo registrado desde el informe profesional.",
  biopsyPerformed: false,
} as const;

describe("FindingService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.patientRepository.findById.mockResolvedValue(patient);
    mocks.findingRepository.findById.mockResolvedValue(finding);
    mocks.findingRepository.listByPatient.mockResolvedValue([finding]);
    mocks.findingRepository.save.mockResolvedValue(undefined);
    mocks.findingRepository.update.mockResolvedValue(undefined);
  });

  it("creates a finding only for an existing patient", async () => {
    const result = await FindingService.create(createInput);

    expect(result).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        patientId: patient.id,
        status: "RECORDED",
      }),
    );
    expect(mocks.findingRepository.save).toHaveBeenCalledWith(result);
  });

  it("does not create a finding for a missing patient", async () => {
    mocks.patientRepository.findById.mockResolvedValue(null);

    await expect(FindingService.create(createInput)).resolves.toBeNull();
    expect(mocks.findingRepository.save).not.toHaveBeenCalled();
  });

  it("returns null when listing findings for a missing patient", async () => {
    mocks.patientRepository.findById.mockResolvedValue(null);

    await expect(FindingService.listByPatient(patient.id)).resolves.toBeNull();
    expect(mocks.findingRepository.listByPatient).not.toHaveBeenCalled();
  });

  it("returns only a finding owned by the requested patient", async () => {
    await expect(FindingService.getByIdForPatient(patient.id, finding.id)).resolves.toEqual(
      finding,
    );
    await expect(
      FindingService.getByIdForPatient("another-patient", finding.id),
    ).resolves.toBeNull();
  });

  it("clears a biopsy result when biopsyPerformed becomes false", async () => {
    mocks.findingRepository.findById
      .mockResolvedValueOnce(finding)
      .mockResolvedValueOnce({ ...finding, biopsyPerformed: false, biopsyResult: undefined });

    await FindingService.update(patient.id, finding.id, { biopsyPerformed: false });

    expect(mocks.findingRepository.update).toHaveBeenCalledWith(finding.id, {
      biopsyPerformed: false,
      biopsyResult: undefined,
    });
  });

  it("allows an optional field to be cleared", async () => {
    mocks.findingRepository.findById
      .mockResolvedValueOnce(finding)
      .mockResolvedValueOnce({ ...finding, observations: undefined });

    await FindingService.update(patient.id, finding.id, { observations: undefined });

    expect(mocks.findingRepository.update).toHaveBeenCalledWith(finding.id, {
      observations: undefined,
    });
  });

  it("validates a partial update against the existing finding", async () => {
    await expect(
      FindingService.update(patient.id, finding.id, { studyDate: "2026-07-11" }),
    ).rejects.toThrow();

    expect(mocks.findingRepository.update).not.toHaveBeenCalled();
  });

  it("prevents updating a finding owned by another patient", async () => {
    await expect(
      FindingService.update("another-patient", finding.id, { status: "CLOSED" }),
    ).resolves.toBeNull();

    expect(mocks.findingRepository.update).not.toHaveBeenCalled();
  });
});
