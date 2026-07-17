import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  reminderService: {
    listByPatient: vi.fn(),
    create: vi.fn(),
    getByIdForPatient: vi.fn(),
    reschedule: vi.fn(),
    complete: vi.fn(),
    cancel: vi.fn(),
  },
}));

vi.mock("@/lib/auth/session", () => ({ getSession: mocks.getSession }));
vi.mock("@/services/reminder.service", () => ({ ReminderService: mocks.reminderService }));

import {
  GET as listReminders,
  POST as createReminder,
} from "@/app/api/patients/[id]/reminders/route";
import {
  GET as getReminder,
  PUT as updateReminder,
} from "@/app/api/patients/[id]/reminders/[reminderId]/route";

const patientId = "45ae0fb2-dfd0-49a6-a426-eb492bcbad46";
const sourceId = "9d1138d8-89b7-47ba-a570-a0a92cc0a850";
const reminderId = "rem_0123456789abcdef0123456789abcdef";
const session = { sub: "user-1", email: "admin@example.com", role: "ADMIN" };
const reminder = {
  id: reminderId,
  patientId,
  source: "CLINICAL_EVENT",
  sourceId,
  targetDate: "2026-07-25",
  scheduledFor: "2026-07-24T13:00:00.000Z",
  timezone: "America/La_Paz",
  channel: "IN_APP",
  status: "PENDING",
  attempts: 0,
  maxAttempts: 3,
  createdAt: "2026-07-17T15:00:00.000Z",
  updatedAt: "2026-07-17T15:00:00.000Z",
};

function collectionParams() {
  return { params: Promise.resolve({ id: patientId }) };
}

function detailParams() {
  return { params: Promise.resolve({ id: patientId, reminderId }) };
}

function jsonRequest(url: string, method: string, body: unknown): Request {
  return new Request(url, {
    method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("reminder API contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSession.mockResolvedValue(session);
    mocks.reminderService.listByPatient.mockResolvedValue([reminder]);
    mocks.reminderService.create.mockResolvedValue(reminder);
    mocks.reminderService.getByIdForPatient.mockResolvedValue(reminder);
    mocks.reminderService.reschedule.mockResolvedValue(reminder);
    mocks.reminderService.complete.mockResolvedValue({ ...reminder, status: "COMPLETED" });
    mocks.reminderService.cancel.mockResolvedValue({ ...reminder, status: "CANCELLED" });
  });

  it("rejects unauthenticated collection requests", async () => {
    mocks.getSession.mockResolvedValue(null);

    const response = await listReminders(
      new Request(`http://localhost/api/patients/${patientId}/reminders`),
      collectionParams(),
    );

    expect(response.status).toBe(401);
    expect(mocks.reminderService.listByPatient).not.toHaveBeenCalled();
  });

  it("lists reminders for the patient in the URL", async () => {
    const response = await listReminders(
      new Request(`http://localhost/api/patients/${patientId}/reminders`),
      collectionParams(),
    );

    expect(response.status).toBe(200);
    expect(mocks.reminderService.listByPatient).toHaveBeenCalledWith(patientId);
  });

  it("creates a reminder using the patient id from the URL", async () => {
    const response = await createReminder(
      jsonRequest(`http://localhost/api/patients/${patientId}/reminders`, "POST", {
        source: "CLINICAL_EVENT",
        sourceId,
        targetDate: "2026-07-25",
        scheduledFor: "2026-07-24T09:00:00-04:00",
      }),
      collectionParams(),
    );

    expect(response.status).toBe(201);
    expect(mocks.reminderService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        patientId,
        timezone: "America/La_Paz",
        channel: "IN_APP",
        maxAttempts: 3,
      }),
    );
  });

  it("rejects invalid creation fields and patient id injection", async () => {
    const response = await createReminder(
      jsonRequest(`http://localhost/api/patients/${patientId}/reminders`, "POST", {
        patientId: sourceId,
        source: "CLINICAL_EVENT",
        sourceId,
        targetDate: "invalid",
        scheduledFor: "invalid",
      }),
      collectionParams(),
    );

    expect(response.status).toBe(400);
    expect(mocks.reminderService.create).not.toHaveBeenCalled();
  });

  it("returns 404 when the patient or source is invalid", async () => {
    mocks.reminderService.create.mockResolvedValue(null);

    const response = await createReminder(
      jsonRequest(`http://localhost/api/patients/${patientId}/reminders`, "POST", {
        source: "CLINICAL_EVENT",
        sourceId,
        targetDate: "2026-07-25",
        scheduledFor: "2026-07-24T09:00:00-04:00",
      }),
      collectionParams(),
    );

    expect(response.status).toBe(404);
  });

  it("prevents cross-patient detail access", async () => {
    mocks.reminderService.getByIdForPatient.mockResolvedValue(null);

    const response = await getReminder(
      new Request(`http://localhost/api/patients/${patientId}/reminders/${reminderId}`),
      detailParams(),
    );

    expect(response.status).toBe(404);
  });

  it("reschedules through the explicit action contract", async () => {
    const response = await updateReminder(
      jsonRequest(`http://localhost/api/patients/${patientId}/reminders/${reminderId}`, "PUT", {
        action: "RESCHEDULE",
        scheduledFor: "2026-07-23T09:00:00-04:00",
      }),
      detailParams(),
    );

    expect(response.status).toBe(200);
    expect(mocks.reminderService.reschedule).toHaveBeenCalledWith(patientId, reminderId, {
      scheduledFor: "2026-07-23T09:00:00-04:00",
    });
  });

  it.each([
    ["COMPLETE", "complete"],
    ["CANCEL", "cancel"],
  ] as const)("executes the %s action", async (action, method) => {
    const response = await updateReminder(
      jsonRequest(`http://localhost/api/patients/${patientId}/reminders/${reminderId}`, "PUT", {
        action,
      }),
      detailParams(),
    );

    expect(response.status).toBe(200);
    expect(mocks.reminderService[method]).toHaveBeenCalledWith(patientId, reminderId);
  });

  it("rejects direct internal status manipulation", async () => {
    const response = await updateReminder(
      jsonRequest(`http://localhost/api/patients/${patientId}/reminders/${reminderId}`, "PUT", {
        action: "SENT",
        status: "SENT",
      }),
      detailParams(),
    );

    expect(response.status).toBe(400);
  });

  it("returns conflict when the action is invalid for the current state", async () => {
    mocks.reminderService.cancel.mockResolvedValue(null);

    const response = await updateReminder(
      jsonRequest(`http://localhost/api/patients/${patientId}/reminders/${reminderId}`, "PUT", {
        action: "CANCEL",
      }),
      detailParams(),
    );

    expect(response.status).toBe(409);
  });
});
