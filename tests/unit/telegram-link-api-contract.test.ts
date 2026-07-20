import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  service: {
    createChallenge: vi.fn(),
    unlinkPatient: vi.fn(),
    revoke: vi.fn(),
  },
}));

vi.mock("@/lib/auth/session", () => ({ getSession: mocks.getSession }));
vi.mock("@/services/telegram-link.service", () => ({
  TelegramLinkService: vi.fn(() => mocks.service),
}));

import {
  DELETE as unlinkTelegram,
  POST as createTelegramLink,
} from "@/app/api/patients/[id]/telegram-link/route";
import { DELETE as revokeTelegramLink } from "@/app/api/patients/[id]/telegram-link/[challengeId]/route";

const patientId = "45ae0fb2-dfd0-49a6-a426-eb492bcbad46";
const challengeId = "tgl_0123456789abcdef0123456789abcdef";
const session = { sub: "user-1", email: "admin@example.com", role: "ADMIN" };
const collectionParams = () => ({ params: Promise.resolve({ id: patientId }) });
const detailParams = () => ({
  params: Promise.resolve({ id: patientId, challengeId }),
});

describe("Telegram link admin API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSession.mockResolvedValue(session);
    mocks.service.createChallenge.mockResolvedValue({
      challenge: {
        id: challengeId,
        expiresAt: "2026-07-20T15:15:00.000Z",
        tokenHash: "secret-hash",
      },
      token: "a".repeat(43),
    });
    mocks.service.unlinkPatient.mockResolvedValue(true);
    mocks.service.revoke.mockResolvedValue(true);
  });

  it("rejects every operation without a session", async () => {
    mocks.getSession.mockResolvedValue(null);
    const responses = await Promise.all([
      createTelegramLink(
        new Request(`http://localhost/api/patients/${patientId}/telegram-link`, {
          method: "POST",
          body: JSON.stringify({ ttlMinutes: 15 }),
        }),
        collectionParams(),
      ),
      unlinkTelegram(
        new Request(`http://localhost/api/patients/${patientId}/telegram-link`, {
          method: "DELETE",
        }),
        collectionParams(),
      ),
      revokeTelegramLink(
        new Request(`http://localhost/api/patients/${patientId}/telegram-link/${challengeId}`, {
          method: "DELETE",
        }),
        detailParams(),
      ),
    ]);
    expect(responses.map((response) => response.status)).toEqual([401, 401, 401]);
  });

  it("creates a temporary link without exposing its stored hash", async () => {
    const response = await createTelegramLink(
      new Request(`http://localhost/api/patients/${patientId}/telegram-link`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ttlMinutes: 15 }),
      }),
      collectionParams(),
    );
    const body = await response.json();
    expect(response.status).toBe(201);
    expect(body.data).toEqual({
      challengeId,
      token: "a".repeat(43),
      expiresAt: "2026-07-20T15:15:00.000Z",
    });
    expect(JSON.stringify(body)).not.toContain("tokenHash");
  });

  it("rejects an invalid TTL", async () => {
    const response = await createTelegramLink(
      new Request(`http://localhost/api/patients/${patientId}/telegram-link`, {
        method: "POST",
        body: JSON.stringify({ ttlMinutes: 60 }),
      }),
      collectionParams(),
    );
    expect(response.status).toBe(400);
    expect(mocks.service.createChallenge).not.toHaveBeenCalled();
  });

  it("returns a conflict when a link cannot be created", async () => {
    mocks.service.createChallenge.mockResolvedValue(null);
    const response = await createTelegramLink(
      new Request(`http://localhost/api/patients/${patientId}/telegram-link`, {
        method: "POST",
        body: JSON.stringify({ ttlMinutes: 15 }),
      }),
      collectionParams(),
    );
    expect(response.status).toBe(409);
  });

  it("unlinks Telegram from the patient", async () => {
    const response = await unlinkTelegram(
      new Request(`http://localhost/api/patients/${patientId}/telegram-link`, {
        method: "DELETE",
      }),
      collectionParams(),
    );
    expect(response.status).toBe(200);
    expect(mocks.service.unlinkPatient).toHaveBeenCalledWith(patientId);
  });

  it("revokes a pending challenge", async () => {
    const response = await revokeTelegramLink(
      new Request(`http://localhost/api/patients/${patientId}/telegram-link/${challengeId}`, {
        method: "DELETE",
      }),
      detailParams(),
    );
    expect(response.status).toBe(200);
    expect(mocks.service.revoke).toHaveBeenCalledWith(challengeId);
  });

  it("rejects an invalid challenge id", async () => {
    const response = await revokeTelegramLink(
      new Request(`http://localhost/api/patients/${patientId}/telegram-link/invalid`, {
        method: "DELETE",
      }),
      { params: Promise.resolve({ id: patientId, challengeId: "invalid" }) },
    );
    expect(response.status).toBe(400);
    expect(mocks.service.revoke).not.toHaveBeenCalled();
  });
});
