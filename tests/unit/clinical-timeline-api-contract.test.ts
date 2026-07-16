import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  timelineService: {
    listByPatient: vi.fn(),
    create: vi.fn(),
    getEventByIdForPatient: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("@/lib/auth/session", () => ({ getSession: mocks.getSession }));

vi.mock("@/services/clinical-timeline.service", () => ({
  ClinicalTimelineService: mocks.timelineService,
}));

import { GET as listTimeline, POST as createEvent } from "@/app/api/patients/[id]/timeline/route";
import {
  DELETE as deleteEvent,
  GET as getEvent,
  PUT as updateEvent,
} from "@/app/api/patients/[id]/timeline/[eventId]/route";

const patientId = "45ae0fb2-dfd0-49a6-a426-eb492bcbad46";
const eventId = "event-1";
const session = { sub: "user-1", email: "admin@example.com", role: "ADMIN" };
const event = {
  id: eventId,
  patientId,
  type: "CONTROL",
  eventDate: "2026-07-10",
  title: "Control completado",
  description: "Control ficticio registrado según la información profesional.",
  status: "COMPLETED",
  createdAt: "2026-07-10T12:00:00.000Z",
  updatedAt: "2026-07-10T12:00:00.000Z",
};

function collectionParams() {
  return { params: Promise.resolve({ id: patientId }) };
}

function detailParams() {
  return { params: Promise.resolve({ id: patientId, eventId }) };
}

function eventRequest(method: string, body: unknown) {
  return new Request(`http://localhost/api/patients/${patientId}/timeline`, {
    method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("clinical timeline API contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSession.mockResolvedValue(session);
    mocks.timelineService.listByPatient.mockResolvedValue([]);
    mocks.timelineService.create.mockResolvedValue(event);
    mocks.timelineService.getEventByIdForPatient.mockResolvedValue(event);
    mocks.timelineService.update.mockResolvedValue(event);
    mocks.timelineService.delete.mockResolvedValue(true);
  });

  it("rejects every operation without a session", async () => {
    mocks.getSession.mockResolvedValue(null);

    const responses = await Promise.all([
      listTimeline(
        new Request(`http://localhost/api/patients/${patientId}/timeline`),
        collectionParams(),
      ),
      createEvent(
        eventRequest("POST", {
          type: "CONTROL",
          eventDate: "2026-07-10",
          title: "Control completado",
          description: "Control ficticio registrado según la información profesional.",
          status: "COMPLETED",
        }),
        collectionParams(),
      ),
      getEvent(
        new Request(`http://localhost/api/patients/${patientId}/timeline/${eventId}`),
        detailParams(),
      ),
      updateEvent(eventRequest("PUT", { title: "Control actualizado" }), detailParams()),
      deleteEvent(
        new Request(`http://localhost/api/patients/${patientId}/timeline/${eventId}`, {
          method: "DELETE",
        }),
        detailParams(),
      ),
    ]);

    expect(responses.map((response) => response.status)).toEqual([401, 401, 401, 401, 401]);
    expect(mocks.timelineService.listByPatient).not.toHaveBeenCalled();
    expect(mocks.timelineService.create).not.toHaveBeenCalled();
    expect(mocks.timelineService.getEventByIdForPatient).not.toHaveBeenCalled();
    expect(mocks.timelineService.update).not.toHaveBeenCalled();
    expect(mocks.timelineService.delete).not.toHaveBeenCalled();
  });

  it("lists the unified timeline in the requested direction", async () => {
    const response = await listTimeline(
      new Request(`http://localhost/api/patients/${patientId}/timeline?direction=asc`),
      collectionParams(),
    );

    expect(response.status).toBe(200);
    expect(mocks.timelineService.listByPatient).toHaveBeenCalledWith(patientId, "asc");
  });

  it("returns 400 for an invalid direction", async () => {
    const response = await listTimeline(
      new Request(`http://localhost/api/patients/${patientId}/timeline?direction=invalid`),
      collectionParams(),
    );

    expect(response.status).toBe(400);
    expect(mocks.timelineService.listByPatient).not.toHaveBeenCalled();
  });

  it("creates an event using the patient id from the URL", async () => {
    const response = await createEvent(
      eventRequest("POST", {
        patientId: "ignored-patient",
        type: "CONTROL",
        eventDate: "2026-07-10",
        title: "Control completado",
        description: "Control ficticio registrado según la información profesional.",
        status: "COMPLETED",
      }),
      collectionParams(),
    );

    expect(response.status).toBe(201);
    expect(mocks.timelineService.create).toHaveBeenCalledWith(
      expect.objectContaining({ patientId, type: "CONTROL", status: "COMPLETED" }),
    );
  });

  it("rejects an invalid event payload", async () => {
    const response = await createEvent(
      eventRequest("POST", { type: "CONTROL" }),
      collectionParams(),
    );

    expect(response.status).toBe(400);
    expect(mocks.timelineService.create).not.toHaveBeenCalled();
  });

  it("returns 404 when the patient or finding relation does not exist", async () => {
    mocks.timelineService.create.mockResolvedValue(null);

    const response = await createEvent(
      eventRequest("POST", {
        type: "CONTROL",
        eventDate: "2026-07-10",
        title: "Control completado",
        description: "Control ficticio registrado según la información profesional.",
        status: "COMPLETED",
      }),
      collectionParams(),
    );

    expect(response.status).toBe(404);
  });

  it("prevents cross-patient detail access", async () => {
    mocks.timelineService.getEventByIdForPatient.mockResolvedValue(null);

    const response = await getEvent(
      new Request(`http://localhost/api/patients/${patientId}/timeline/${eventId}`),
      detailParams(),
    );

    expect(response.status).toBe(404);
  });

  it("updates an event with a partial payload", async () => {
    const response = await updateEvent(
      eventRequest("PUT", { title: "Control actualizado" }),
      detailParams(),
    );

    expect(response.status).toBe(200);
    expect(mocks.timelineService.update).toHaveBeenCalledWith(patientId, eventId, {
      title: "Control actualizado",
    });
  });

  it("rejects empty updates", async () => {
    const response = await updateEvent(eventRequest("PUT", {}), detailParams());

    expect(response.status).toBe(400);
    expect(mocks.timelineService.update).not.toHaveBeenCalled();
  });

  it("deletes only an owned manual event", async () => {
    const response = await deleteEvent(
      new Request(`http://localhost/api/patients/${patientId}/timeline/${eventId}`, {
        method: "DELETE",
      }),
      detailParams(),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true, data: { deleted: true } });
    expect(mocks.timelineService.delete).toHaveBeenCalledWith(patientId, eventId);
  });

  it("returns 404 when deleting a missing or foreign event", async () => {
    mocks.timelineService.delete.mockResolvedValue(false);

    const response = await deleteEvent(
      new Request(`http://localhost/api/patients/${patientId}/timeline/${eventId}`, {
        method: "DELETE",
      }),
      detailParams(),
    );

    expect(response.status).toBe(404);
  });
});
