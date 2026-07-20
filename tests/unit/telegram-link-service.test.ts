import { describe, expect, it, vi } from "vitest";
import { hashTelegramLinkToken, type TelegramLinkChallenge } from "@/features/telegram";
import { TelegramLinkService } from "@/services/telegram-link.service";
import type { Patient } from "@/types";

const patientId = "45ae0fb2-dfd0-49a6-a426-eb492bcbad46";
const token = "a".repeat(43);
const tokenHash = hashTelegramLinkToken(token);
const now = new Date("2026-07-20T15:00:00.000Z");
const patient: Patient = {
  id: patientId,
  fullName: "Paciente de prueba",
  timezone: "America/La_Paz",
  status: "ACTIVE",
  createdAt: "2026-07-01T12:00:00.000Z",
  updatedAt: "2026-07-01T12:00:00.000Z",
};
const challenge: TelegramLinkChallenge = {
  id: `tgl_${tokenHash.slice(0, 32)}`,
  patientId,
  tokenHash,
  status: "PENDING",
  expiresAt: "2026-07-20T15:15:00.000Z",
  createdAt: now.toISOString(),
  updatedAt: now.toISOString(),
};

function dependencies() {
  return {
    patients: {
      findById: vi.fn(),
      updateTelegramLink: vi.fn(),
      clearTelegramLink: vi.fn(),
    },
    links: {
      saveChallenge: vi.fn(),
      findChallengeById: vi.fn(),
      findChallengeByTokenHash: vi.fn(),
      updateChallenge: vi.fn(),
      claimChat: vi.fn(),
      releaseChat: vi.fn(),
    },
  };
}

describe("TelegramLinkService", () => {
  it("creates a challenge and returns the raw token once", async () => {
    const deps = dependencies();
    deps.patients.findById.mockResolvedValue(patient);
    const service = new TelegramLinkService({
      ...deps,
      now: () => now,
      createToken: () => ({ challengeId: challenge.id, token, tokenHash }),
    });
    await expect(service.createChallenge({ patientId, ttlMinutes: 15 })).resolves.toEqual({
      challenge,
      token,
    });
    expect(deps.links.saveChallenge).toHaveBeenCalledWith(challenge, 900);
  });

  it("refuses to create a challenge for an already linked patient", async () => {
    const deps = dependencies();
    deps.patients.findById.mockResolvedValue({ ...patient, telegramChatId: "123" });
    await expect(
      new TelegramLinkService(deps).createChallenge({ patientId, ttlMinutes: 15 }),
    ).resolves.toBeNull();
  });

  it("consumes a valid challenge", async () => {
    const deps = dependencies();
    deps.links.findChallengeByTokenHash.mockResolvedValue(challenge);
    deps.patients.findById.mockResolvedValue(patient);
    deps.links.claimChat.mockResolvedValue(true);
    const service = new TelegramLinkService({ ...deps, now: () => now });
    await expect(
      service.consume(token, { telegramUserId: "123", telegramChatId: "123" }),
    ).resolves.toEqual({
      success: true,
      link: {
        patientId,
        telegramUserId: "123",
        telegramChatId: "123",
        linkedAt: now.toISOString(),
      },
    });
    expect(deps.links.updateChallenge).toHaveBeenCalledWith(challenge.id, {
      status: "CONSUMED",
      consumedAt: now.toISOString(),
    });
  });

  it("marks an expired challenge", async () => {
    const deps = dependencies();
    deps.links.findChallengeByTokenHash.mockResolvedValue({
      ...challenge,
      expiresAt: "2026-07-20T14:59:59.000Z",
    });
    const service = new TelegramLinkService({ ...deps, now: () => now });
    await expect(
      service.consume(token, { telegramUserId: "123", telegramChatId: "123" }),
    ).resolves.toEqual({ success: false, reason: "EXPIRED_TOKEN" });
    expect(deps.links.updateChallenge).toHaveBeenCalledWith(challenge.id, {
      status: "EXPIRED",
    });
  });

  it("refuses a chat linked to another patient", async () => {
    const deps = dependencies();
    deps.links.findChallengeByTokenHash.mockResolvedValue(challenge);
    deps.patients.findById.mockResolvedValue(patient);
    deps.links.claimChat.mockResolvedValue(false);
    await expect(
      new TelegramLinkService({ ...deps, now: () => now }).consume(token, {
        telegramUserId: "123",
        telegramChatId: "123",
      }),
    ).resolves.toEqual({ success: false, reason: "CHAT_ALREADY_LINKED" });
  });

  it("releases the chat if updating the patient fails", async () => {
    const deps = dependencies();
    deps.links.findChallengeByTokenHash.mockResolvedValue(challenge);
    deps.patients.findById.mockResolvedValue(patient);
    deps.links.claimChat.mockResolvedValue(true);
    deps.patients.updateTelegramLink.mockRejectedValue(new Error("Redis unavailable"));
    const service = new TelegramLinkService({ ...deps, now: () => now });
    await expect(
      service.consume(token, { telegramUserId: "123", telegramChatId: "123" }),
    ).rejects.toThrow("Redis unavailable");
    expect(deps.links.releaseChat).toHaveBeenCalledWith("123", patientId);
  });

  it("revokes a pending challenge", async () => {
    const deps = dependencies();
    deps.links.findChallengeById.mockResolvedValue(challenge);
    const service = new TelegramLinkService({ ...deps, now: () => now });
    await expect(service.revoke(challenge.id)).resolves.toBe(true);
    expect(deps.links.updateChallenge).toHaveBeenCalledWith(challenge.id, {
      status: "REVOKED",
      revokedAt: now.toISOString(),
    });
  });

  it("unlinks a patient and releases the chat", async () => {
    const deps = dependencies();
    deps.patients.findById.mockResolvedValue({ ...patient, telegramChatId: "123" });
    await expect(new TelegramLinkService(deps).unlinkPatient(patientId)).resolves.toBe(true);
    expect(deps.links.releaseChat).toHaveBeenCalledWith("123", patientId);
    expect(deps.patients.clearTelegramLink).toHaveBeenCalledWith(patientId);
  });
});
