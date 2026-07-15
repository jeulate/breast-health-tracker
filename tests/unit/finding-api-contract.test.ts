import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  findingService: {
    listByPatient: vi.fn(),
    create: vi.fn(),
    getByIdForPatient: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock("@/lib/auth/session", () => ({ getSession: mocks.getSession }));

vi.mock("@/services/finding.service", () => ({
  FindingService: mocks.findingService,
}));

import { GET as listFindings, POST as createFinding } from "@/app/api/patients/[id]/findings/route";
import {
  GET as getFinding,
  PUT as updateFinding,
} from "@/app/api/patients/[id]/findings/[findingId]/route";

const patientId = "45ae0fb2-dfd0-49a6-a426-eb492bcbad46";
const findingId = "finding-1";
const session = { sub: "user-1", email: "admin@example.com", role: "ADMIN" };
const finding = {
  id: findingId,
  patientId,
  category: "3",
  laterality: "LEFT",
  studyType: "MAMMOGRAPHY",
  studyDate: "2026-07-01",
  description: "Hallazgo registrado desde el informe profesional.",
  biopsyPerformed: false,
  status: "RECORDED",
  createdAt: "2026-07-01T12:00:00.000Z",
  updatedAt: "2026-07-01T12:00:00.000Z",
};

function collectionParams() {
  return { params: Promise.resolve({ id: patientId }) };
}

function detailParams() {
  return { params: Promise.resolve({ id: patientId, findingId }) };
}

describe("finding API contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSession.mockResolvedValue(session);
    mocks.findingService.listByPatient.mockResolvedValue([finding]);
    mocks.findingService.create.mockResolvedValue(finding);
    mocks.findingService.getByIdForPatient.mockResolvedValue(finding);
    mocks.findingService.update.mockResolvedValue(finding);
  });

  it("rejects unauthenticated requests", async () => {
    mocks.getSession.mockResolvedValue(null);

    const response = await listFindings(
      new Request(`http://localhost/api/patients/${patientId}/findings`),
      collectionParams(),
    );

    expect(response.status).toBe(401);
    expect(mocks.findingService.listByPatient).not.toHaveBeenCalled();
  });

  it("lists findings in the requested direction", async () => {
    const response = await listFindings(
      new Request(`http://localhost/api/patients/${patientId}/findings?direction=asc`),
      collectionParams(),
    );

    expect(response.status).toBe(200);
    expect(mocks.findingService.listByPatient).toHaveBeenCalledWith(patientId, "asc");
  });

  it("returns 400 for an invalid list direction", async () => {
    const response = await listFindings(
      new Request(`http://localhost/api/patients/${patientId}/findings?direction=invalid`),
      collectionParams(),
    );

    expect(response.status).toBe(400);
  });

  it("creates a finding using the patient id from the URL", async () => {
    const response = await createFinding(
      new Request(`http://localhost/api/patients/${patientId}/findings`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          patientId: "ignored-patient",
          category: "3",
          laterality: "LEFT",
          studyType: "MAMMOGRAPHY",
          studyDate: "2026-07-01",
          description: "Hallazgo registrado desde el informe profesional.",
        }),
      }),
      collectionParams(),
    );

    expect(response.status).toBe(201);
    expect(mocks.findingService.create).toHaveBeenCalledWith(
      expect.objectContaining({ patientId, status: "RECORDED" }),
    );
  });

  it("returns 404 when the patient does not exist", async () => {
    mocks.findingService.create.mockResolvedValue(null);

    const response = await createFinding(
      new Request(`http://localhost/api/patients/${patientId}/findings`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          category: "3",
          laterality: "LEFT",
          studyType: "MAMMOGRAPHY",
          studyDate: "2026-07-01",
          description: "Hallazgo registrado desde el informe profesional.",
        }),
      }),
      collectionParams(),
    );

    expect(response.status).toBe(404);
  });

  it("prevents cross-patient detail access", async () => {
    mocks.findingService.getByIdForPatient.mockResolvedValue(null);

    const response = await getFinding(
      new Request(`http://localhost/api/patients/${patientId}/findings/${findingId}`),
      detailParams(),
    );

    expect(response.status).toBe(404);
  });

  it("updates a finding with a partial payload", async () => {
    const response = await updateFinding(
      new Request(`http://localhost/api/patients/${patientId}/findings/${findingId}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: "CLOSED" }),
      }),
      detailParams(),
    );

    expect(response.status).toBe(200);
    expect(mocks.findingService.update).toHaveBeenCalledWith(patientId, findingId, {
      status: "CLOSED",
    });
  });
});
