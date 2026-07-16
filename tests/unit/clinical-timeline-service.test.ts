import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ClinicalEvent } from "@/features/clinical-timeline";
import type { Finding, Patient } from "@/types";

const mocks = vi.hoisted(() => ({
  clinicalEventRepository: {
    findById: vi.fn(),
    save: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    listByPatient: vi.fn(),
  },
  findingRepository: {
    findById: vi.fn(),
    listByPatient: vi.fn(),
  },
  patientRepository: {
    findById: vi.fn(),
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

import { ClinicalTimelineService } from "@/services/clinical-timeline.service";

const patient: Patient = {
  id: "45ae0fb2-dfd0-49a6-a426-eb492bcbad46",
  fullName: "Paciente ficticia",
  timezone: "America/La_Paz",
  status: "ACTIVE",
  createdAt: "2026-07-01T12:00:00.000Z",
  updatedAt: "2026-07-01T12:00:00.000Z",
};

const finding: Finding = {
  id: "b19b019a-5a0f-41f3-9ba1-a6f191462bc0",
  patientId: patient.id,
  category: "3",
  laterality: "LEFT",
  studyType: "MAMMOGRAPHY",
  studyDate: "2026-07-12",
  description: "Hallazgo ficticio registrado desde el informe profesional.",
  biopsyPerformed: false,
  status: "FOLLOW_UP",
  createdAt: "2026-07-12T12:00:00.000Z",
  updatedAt: "2026-07-12T12:00:00.000Z",
};

const event: ClinicalEvent = {
  id: "event-1",
  patientId: patient.id,
  type: "CONTROL",
  eventDate: "2026-07-10",
  title: "Control completado",
  description: "Control ficticio registrado según la información profesional.",
  status: "COMPLETED",
  findingId: finding.id,
  createdAt: "2026-07-10T12:00:00.000Z",
  updatedAt: "2026-07-10T12:00:00.000Z",
};

const createInput = {
  patientId: patient.id,
  type: "CONTROL",
  eventDate: "2026-07-10",
  title: "Control completado",
  description: "Control ficticio registrado según la información profesional.",
  status: "COMPLETED",
  findingId: finding.id,
} as const;

describe("ClinicalTimelineService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.patientRepository.findById.mockResolvedValue(patient);
    mocks.findingRepository.findById.mockResolvedValue(finding);
    mocks.findingRepository.listByPatient.mockResolvedValue([finding]);
    mocks.clinicalEventRepository.findById.mockResolvedValue(event);
    mocks.clinicalEventRepository.listByPatient.mockResolvedValue([event]);
    mocks.clinicalEventRepository.save.mockResolvedValue(undefined);
    mocks.clinicalEventRepository.update.mockResolvedValue(undefined);
    mocks.clinicalEventRepository.delete.mockResolvedValue(undefined);
  });

  it("creates an event for an existing patient and related finding", async () => {
    const result = await ClinicalTimelineService.create(createInput);

    expect(result).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        patientId: patient.id,
        findingId: finding.id,
      }),
    );
    expect(mocks.clinicalEventRepository.save).toHaveBeenCalledWith(result);
  });

  it("does not create an event for a missing patient", async () => {
    mocks.patientRepository.findById.mockResolvedValue(null);

    await expect(ClinicalTimelineService.create(createInput)).resolves.toBeNull();
    expect(mocks.clinicalEventRepository.save).not.toHaveBeenCalled();
  });

  it("rejects a finding owned by another patient", async () => {
    mocks.findingRepository.findById.mockResolvedValue({
      ...finding,
      patientId: "another-patient",
    });

    await expect(ClinicalTimelineService.create(createInput)).resolves.toBeNull();
    expect(mocks.clinicalEventRepository.save).not.toHaveBeenCalled();
  });

  it("merges findings and clinical events in descending order", async () => {
    const result = await ClinicalTimelineService.listByPatient(patient.id);

    expect(result).toEqual([
      expect.objectContaining({
        id: `finding:${finding.id}`,
        source: "FINDING",
        eventDate: "2026-07-12",
        title: "BI-RADS 3",
      }),
      expect.objectContaining({
        id: `clinical-event:${event.id}`,
        source: "CLINICAL_EVENT",
        eventDate: "2026-07-10",
      }),
    ]);
  });

  it("uses a deterministic order when entries have the same date", async () => {
    mocks.clinicalEventRepository.listByPatient.mockResolvedValue([
      { ...event, id: "event-b", eventDate: finding.studyDate },
      { ...event, id: "event-a", eventDate: finding.studyDate },
    ]);

    const result = await ClinicalTimelineService.listByPatient(patient.id);

    expect(result?.map((entry) => entry.id)).toEqual([
      "clinical-event:event-a",
      "clinical-event:event-b",
      `finding:${finding.id}`,
    ]);
  });

  it("returns null when listing a missing patient", async () => {
    mocks.patientRepository.findById.mockResolvedValue(null);

    await expect(ClinicalTimelineService.listByPatient(patient.id)).resolves.toBeNull();
    expect(mocks.clinicalEventRepository.listByPatient).not.toHaveBeenCalled();
    expect(mocks.findingRepository.listByPatient).not.toHaveBeenCalled();
  });

  it("validates a partial update against the existing event", async () => {
    await expect(
      ClinicalTimelineService.update(patient.id, event.id, { type: "NOTE" }),
    ).rejects.toThrow();

    expect(mocks.clinicalEventRepository.update).not.toHaveBeenCalled();
  });

  it("allows clearing the optional finding relation", async () => {
    mocks.clinicalEventRepository.findById
      .mockResolvedValueOnce(event)
      .mockResolvedValueOnce({ ...event, findingId: undefined });

    await ClinicalTimelineService.update(patient.id, event.id, { findingId: undefined });

    expect(mocks.clinicalEventRepository.update).toHaveBeenCalledWith(event.id, {
      findingId: undefined,
    });
    expect(mocks.findingRepository.findById).not.toHaveBeenCalled();
  });

  it("prevents reading, updating, or deleting an event from another patient", async () => {
    await expect(
      ClinicalTimelineService.getEventByIdForPatient("another-patient", event.id),
    ).resolves.toBeNull();
    await expect(
      ClinicalTimelineService.update("another-patient", event.id, { title: "Nuevo título" }),
    ).resolves.toBeNull();
    await expect(ClinicalTimelineService.delete("another-patient", event.id)).resolves.toBe(false);

    expect(mocks.clinicalEventRepository.update).not.toHaveBeenCalled();
    expect(mocks.clinicalEventRepository.delete).not.toHaveBeenCalled();
  });

  it("deletes only an owned clinical event", async () => {
    await expect(ClinicalTimelineService.delete(patient.id, event.id)).resolves.toBe(true);
    expect(mocks.clinicalEventRepository.delete).toHaveBeenCalledWith(event.id);
    expect(mocks.findingRepository.findById).not.toHaveBeenCalled();
  });
});
