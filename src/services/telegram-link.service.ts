import {
  createTelegramLinkToken,
  hashTelegramLinkToken,
  isTelegramLinkChallengeExpired,
  type ConsumeTelegramLinkResult,
  type CreatedTelegramLinkChallenge,
  type TelegramIdentity,
  type TelegramLinkChallenge,
  type TelegramLinkToken,
} from "@/features/telegram";
import {
  createTelegramLinkChallengeSchema,
  telegramIdentitySchema,
  telegramLinkTokenSchema,
  type CreateTelegramLinkChallengeInput,
} from "@/lib/validations/telegram";
import { PatientRepository } from "@/repositories/patient.repository";
import {
  TelegramLinkRepository,
  type TelegramChallengeUpdateFields,
} from "@/repositories/telegram-link.repository";
import type { Patient } from "@/types";

interface PatientLinks {
  findById(id: string): Promise<Patient | null>;
  updateTelegramLink(id: string, identity: TelegramIdentity): Promise<void>;
  clearTelegramLink(id: string): Promise<void>;
}
interface Challenges {
  saveChallenge(challenge: TelegramLinkChallenge, ttlSeconds: number): Promise<void>;
  findChallengeById(id: string): Promise<TelegramLinkChallenge | null>;
  findChallengeByTokenHash(hash: string): Promise<TelegramLinkChallenge | null>;
  updateChallenge(id: string, fields: TelegramChallengeUpdateFields): Promise<void>;
  claimChat(chatId: string, patientId: string): Promise<boolean>;
  releaseChat(chatId: string, patientId: string): Promise<boolean>;
}
export interface TelegramLinkServiceDependencies {
  patients?: PatientLinks;
  links?: Challenges;
  now?: () => Date;
  createToken?: () => TelegramLinkToken;
}

export class TelegramLinkService {
  private readonly patients: PatientLinks;
  private readonly links: Challenges;
  private readonly now: () => Date;
  private readonly createToken: () => TelegramLinkToken;

  constructor(deps: TelegramLinkServiceDependencies = {}) {
    this.patients = deps.patients ?? new PatientRepository();
    this.links = deps.links ?? new TelegramLinkRepository();
    this.now = deps.now ?? (() => new Date());
    this.createToken = deps.createToken ?? (() => createTelegramLinkToken());
  }

  async createChallenge(
    input: CreateTelegramLinkChallengeInput,
  ): Promise<CreatedTelegramLinkChallenge | null> {
    const parsed = createTelegramLinkChallengeSchema.parse(input);
    const patient = await this.patients.findById(parsed.patientId);
    if (!patient || patient.telegramChatId || patient.telegramUserId) return null;
    const generated = this.createToken();
    const createdAt = this.now();
    const challenge: TelegramLinkChallenge = {
      id: generated.challengeId,
      patientId: parsed.patientId,
      tokenHash: generated.tokenHash,
      status: "PENDING",
      expiresAt: new Date(createdAt.getTime() + parsed.ttlMinutes * 60_000).toISOString(),
      createdAt: createdAt.toISOString(),
      updatedAt: createdAt.toISOString(),
    };
    await this.links.saveChallenge(challenge, parsed.ttlMinutes * 60);
    return { challenge, token: generated.token };
  }

  async consume(token: string, identity: TelegramIdentity): Promise<ConsumeTelegramLinkResult> {
    const parsedToken = telegramLinkTokenSchema.parse(token);
    const parsedIdentity = telegramIdentitySchema.parse(identity);
    const challenge = await this.links.findChallengeByTokenHash(hashTelegramLinkToken(parsedToken));
    if (!challenge) return { success: false, reason: "INVALID_TOKEN" };
    if (challenge.status === "CONSUMED") return { success: false, reason: "TOKEN_ALREADY_USED" };
    if (challenge.status === "REVOKED") return { success: false, reason: "TOKEN_REVOKED" };
    if (
      challenge.status === "EXPIRED" ||
      isTelegramLinkChallengeExpired(challenge.expiresAt, this.now())
    ) {
      if (challenge.status === "PENDING")
        await this.links.updateChallenge(challenge.id, { status: "EXPIRED" });
      return { success: false, reason: "EXPIRED_TOKEN" };
    }
    const patient = await this.patients.findById(challenge.patientId);
    if (!patient) return { success: false, reason: "PATIENT_NOT_FOUND" };
    if (patient.telegramChatId || patient.telegramUserId)
      return { success: false, reason: "PATIENT_ALREADY_LINKED" };
    if (!(await this.links.claimChat(parsedIdentity.telegramChatId, challenge.patientId)))
      return { success: false, reason: "CHAT_ALREADY_LINKED" };
    try {
      await this.patients.updateTelegramLink(challenge.patientId, parsedIdentity);
    } catch (error) {
      await this.links.releaseChat(parsedIdentity.telegramChatId, challenge.patientId);
      throw error;
    }
    const linkedAt = this.now().toISOString();
    await this.links.updateChallenge(challenge.id, {
      status: "CONSUMED",
      consumedAt: linkedAt,
    });
    return {
      success: true,
      link: { patientId: challenge.patientId, ...parsedIdentity, linkedAt },
    };
  }

  async revoke(challengeId: string): Promise<boolean> {
    const challenge = await this.links.findChallengeById(challengeId);
    if (!challenge || challenge.status !== "PENDING") return false;
    await this.links.updateChallenge(challenge.id, {
      status: "REVOKED",
      revokedAt: this.now().toISOString(),
    });
    return true;
  }

  async unlinkPatient(patientId: string): Promise<boolean> {
    const patient = await this.patients.findById(patientId);
    if (!patient) return false;
    if (patient.telegramChatId) await this.links.releaseChat(patient.telegramChatId, patientId);
    await this.patients.clearTelegramLink(patientId);
    return true;
  }
}
