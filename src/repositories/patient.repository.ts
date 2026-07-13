import { getRedisClient } from "@/lib/redis/client";
import type { Patient, PatientStatus } from "@/types";
import { redisKeys } from "@/lib/redis/keys";


export class PatientRepository {
  private get redis() {
    return getRedisClient();
  }

  private key(id: string): string {
    return redisKeys.patient(id);
}

  async findById(id: string): Promise<Patient | null> {
    const data = await this.redis.hgetall<Record<string, string>>(this.key(id));
    if (!data || Object.keys(data).length === 0) return null;
    return this.deserialize(data);
  }

  async save(patient: Patient): Promise<void> {
    const pipeline = this.redis.pipeline();
    pipeline.hset(this.key(patient.id), this.serialize(patient));
    pipeline.sadd(redisKeys.patientsIndex(), patient.id);
    await pipeline.exec();
  }

  async update(id: string, fields: Partial<Patient>): Promise<void> {
    const now = new Date().toISOString();
    const sanitized: Record<string, string> = { updatedAt: now };
    if (fields.fullName !== undefined) sanitized.fullName = fields.fullName;
    if (fields.birthDate !== undefined) sanitized.birthDate = fields.birthDate;
    if (fields.timezone !== undefined) sanitized.timezone = fields.timezone;
    if (fields.status !== undefined) sanitized.status = fields.status;
    await this.redis.hset(this.key(id), sanitized);
  }

  async updateStatus(id: string, status: PatientStatus): Promise<void> {
    const now = new Date().toISOString();
    await this.redis.hset(this.key(id), { status, updatedAt: now });
  }

  async listAll(): Promise<Patient[]> {
    const ids = await this.redis.smembers(redisKeys.patientsIndex());
    if (ids.length === 0) return [];
    const patients = await Promise.all(ids.map((id) => this.findById(id)));
    return patients.filter((p): p is Patient => p !== null);
  }

  async count(): Promise<number> {
    return this.redis.scard(redisKeys.patientsIndex());
  }

  async countByStatus(status: PatientStatus): Promise<number> {
    const all = await this.listAll();
    return all.filter((p) => p.status === status).length;
  }

  private serialize(patient: Patient): Record<string, string> {
    const record: Record<string, string> = {
      id: patient.id,
      fullName: patient.fullName,
      timezone: patient.timezone,
      status: patient.status,
      createdAt: patient.createdAt,
      updatedAt: patient.updatedAt,
    };
    if (patient.birthDate) record.birthDate = patient.birthDate;
    if (patient.telegramUserId) record.telegramUserId = patient.telegramUserId;
    if (patient.telegramChatId) record.telegramChatId = patient.telegramChatId;
    return record;
  }

  private deserialize(data: Record<string, string>): Patient {
    return {
      id: data.id,
      fullName: data.fullName,
      birthDate: data.birthDate || undefined,
      timezone: data.timezone,
      status: data.status as PatientStatus,
      telegramUserId: data.telegramUserId || undefined,
      telegramChatId: data.telegramChatId || undefined,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }
}
