import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  patientService: {
    listPaginated: vi.fn(),
    create: vi.fn(),
    getById: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock("@/lib/auth/session", () => ({ getSession: mocks.getSession }));

vi.mock("@/services/patient.service", () => ({
  PatientService: mocks.patientService,
}));

import { GET as listPatients, POST as createPatient } from "@/app/api/patients/route";
import { GET as getPatient, PUT as updatePatient } from "@/app/api/patients/[id]/route";

const patientId = "45ae0fb2-dfd0-49a6-a426-eb492bcbad46";

function detailParams() {
  return { params: Promise.resolve({ id: patientId }) };
}

describe("patient API authentication", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSession.mockResolvedValue(null);
  });

  it("rejects every patient operation without a session", async () => {
    const responses = await Promise.all([
      listPatients(new Request("http://localhost/api/patients")),
      createPatient(
        new Request("http://localhost/api/patients", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ fullName: "Paciente ficticia" }),
        }),
      ),
      getPatient(new Request(`http://localhost/api/patients/${patientId}`), detailParams()),
      updatePatient(
        new Request(`http://localhost/api/patients/${patientId}`, {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ status: "INACTIVE" }),
        }),
        detailParams(),
      ),
    ]);

    expect(responses.map((response) => response.status)).toEqual([401, 401, 401, 401]);
    expect(mocks.patientService.listPaginated).not.toHaveBeenCalled();
    expect(mocks.patientService.create).not.toHaveBeenCalled();
    expect(mocks.patientService.getById).not.toHaveBeenCalled();
    expect(mocks.patientService.update).not.toHaveBeenCalled();
  });

  it("allows an authenticated patient list request", async () => {
    mocks.getSession.mockResolvedValue({
      sub: "user-1",
      email: "admin@example.com",
      role: "ADMIN",
    });
    mocks.patientService.listPaginated.mockResolvedValue({
      items: [],
      page: 1,
      pageSize: 10,
      total: 0,
      totalPages: 1,
      hasPreviousPage: false,
      hasNextPage: false,
    });

    const response = await listPatients(new Request("http://localhost/api/patients"));

    expect(response.status).toBe(200);
    expect(mocks.patientService.listPaginated).toHaveBeenCalledOnce();
  });
});
