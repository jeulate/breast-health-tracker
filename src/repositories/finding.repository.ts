import type { Redis } from "@upstash/redis";
import type { Finding } from "@/features/findings";
import type { UpdateFindingInput } from "@/lib/validations/finding";
import { getRedisClient } from "@/lib/redis/client";
import { redisKeys } from "@/lib/redis/keys";

export type FindingSortDirection = "asc" | "desc";

export class FindingRepository {
  private get redis(): Redis {
    return getRedisClient();
  }

  private key(id: string): string {
    return redisKeys.finding(id);
  }

  async findById(id: string): Promise<Finding | null> {
    const data = await this.redis.hgetall<Record<string, unknown>>(this.key(id));

    if (!data || Object.keys(data).length === 0) return null;

    return this.deserialize(data);
  }

  async save(finding: Finding): Promise<void> {
    const studyDateScore = this.studyDateScore(finding.studyDate);
    const pipeline = this.redis.pipeline();

    pipeline.hset(this.key(finding.id), this.serialize(finding));
    pipeline.sadd(redisKeys.findingsIndex(), finding.id);
    pipeline.zadd(redisKeys.patientFindingsByStudyDate(finding.patientId), {
      score: studyDateScore,
      member: finding.id,
    });

    await pipeline.exec();
  }

  async update(id: string, fields: UpdateFindingInput): Promise<void> {
    const existing = await this.findById(id);

    if (!existing) return;

    const pipeline = this.redis.pipeline();
    const values: Record<string, string> = { updatedAt: new Date().toISOString() };
    const fieldsToDelete: string[] = [];

    if (fields.category !== undefined) values.category = this.serializeCategory(fields.category);
    if (fields.laterality !== undefined) values.laterality = fields.laterality;
    if (fields.studyType !== undefined) values.studyType = fields.studyType;
    if (fields.studyDate !== undefined) values.studyDate = fields.studyDate;
    if (fields.description !== undefined) values.description = fields.description;
    if (fields.biopsyPerformed !== undefined) {
      values.biopsyPerformed = String(fields.biopsyPerformed);
    }
    if (fields.status !== undefined) values.status = fields.status;

    this.assignOptionalField(fields, "observations", values, fieldsToDelete);
    this.assignOptionalField(fields, "biopsyResult", values, fieldsToDelete);
    this.assignOptionalField(fields, "nextControlDate", values, fieldsToDelete);

    pipeline.hset(this.key(id), values);

    if (fieldsToDelete.length > 0) {
      pipeline.hdel(this.key(id), ...fieldsToDelete);
    }

    if (fields.studyDate !== undefined) {
      pipeline.zadd(redisKeys.patientFindingsByStudyDate(existing.patientId), {
        score: this.studyDateScore(fields.studyDate),
        member: id,
      });
    }

    await pipeline.exec();
  }

  async listByPatient(
    patientId: string,
    direction: FindingSortDirection = "desc",
  ): Promise<Finding[]> {
    const ids = (await this.redis.zrange(redisKeys.patientFindingsByStudyDate(patientId), 0, -1, {
      rev: direction === "desc",
    })) as string[];

    if (ids.length === 0) return [];

    const findings = await Promise.all(ids.map((id) => this.findById(id)));

    return findings.filter(
      (finding): finding is Finding => finding !== null && finding.patientId === patientId,
    );
  }

  async countByPatient(patientId: string): Promise<number> {
    return this.redis.zcard(redisKeys.patientFindingsByStudyDate(patientId));
  }

  async belongsToPatient(id: string, patientId: string): Promise<boolean> {
    const finding = await this.findById(id);
    return finding?.patientId === patientId;
  }

  private assignOptionalField(
    fields: UpdateFindingInput,
    field: "observations" | "biopsyResult" | "nextControlDate",
    values: Record<string, string>,
    fieldsToDelete: string[],
  ): void {
    if (!Object.prototype.hasOwnProperty.call(fields, field)) return;

    const value = fields[field];

    if (value === undefined) {
      fieldsToDelete.push(field);
      return;
    }

    values[field] = value;
  }

  private studyDateScore(studyDate: string): number {
    const score = Date.parse(`${studyDate}T00:00:00.000Z`);

    if (Number.isNaN(score)) {
      throw new Error("Finding studyDate must be a valid date");
    }

    return score;
  }

  private serialize(finding: Finding): Record<string, string> {
    const record: Record<string, string> = {
      id: finding.id,
      patientId: finding.patientId,
      category: this.serializeCategory(finding.category),
      laterality: finding.laterality,
      studyType: finding.studyType,
      studyDate: finding.studyDate,
      description: finding.description,
      biopsyPerformed: String(finding.biopsyPerformed),
      status: finding.status,
      createdAt: finding.createdAt,
      updatedAt: finding.updatedAt,
    };

    if (finding.observations) record.observations = finding.observations;
    if (finding.biopsyResult) record.biopsyResult = finding.biopsyResult;
    if (finding.nextControlDate) record.nextControlDate = finding.nextControlDate;

    return record;
  }

  private serializeCategory(category: Finding["category"]): string {
    return `BI-RADS:${category}`;
  }

  private requiredString(value: unknown): string {
    return typeof value === "string" ? value : String(value ?? "");
  }

  private optionalString(value: unknown): string | undefined {
    const normalized = this.requiredString(value);
    return normalized || undefined;
  }

  private deserialize(data: Record<string, unknown>): Finding {
    const storedCategory = this.requiredString(data.category);
    const category = storedCategory.replace(/^BI-RADS:/, "") as Finding["category"];

    return {
      id: this.requiredString(data.id),
      patientId: this.requiredString(data.patientId),
      category,
      laterality: this.requiredString(data.laterality) as Finding["laterality"],
      studyType: this.requiredString(data.studyType) as Finding["studyType"],
      studyDate: this.requiredString(data.studyDate),
      description: this.requiredString(data.description),
      observations: this.optionalString(data.observations),
      biopsyPerformed: data.biopsyPerformed === true || data.biopsyPerformed === "true",
      biopsyResult: this.optionalString(data.biopsyResult),
      nextControlDate: this.optionalString(data.nextControlDate),
      status: this.requiredString(data.status) as Finding["status"],
      createdAt: this.requiredString(data.createdAt),
      updatedAt: this.requiredString(data.updatedAt),
    };
  }
}
