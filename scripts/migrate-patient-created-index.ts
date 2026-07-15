/**
 * Backfills the chronological patient index used for pagination.
 *
 * This migration is idempotent: ZADD updates the score for an existing member
 * and does not duplicate it.
 *
 * Run with:
 * npm run migrate:patient-index
 */

import { config } from "dotenv";

config({ path: ".env.local" });

const BATCH_SIZE = 100;

async function migratePatientCreatedIndex(): Promise<void> {
  const [{ getRedisClient }, { redisKeys }] = await Promise.all([
    import("../src/lib/redis/client"),
    import("../src/lib/redis/keys"),
  ]);

  const redis = getRedisClient();
  const patientIds = await redis.smembers<string[]>(redisKeys.patientsIndex());
  const indexKey = redisKeys.patientsCreatedAtIndex();
  const before = await redis.zcard(indexKey);

  let indexed = 0;
  let skipped = 0;

  console.log(`Starting patient index migration for ${patientIds.length} records...`);

  for (let offset = 0; offset < patientIds.length; offset += BATCH_SIZE) {
    const batchIds = patientIds.slice(offset, offset + BATCH_SIZE);

    const records = await Promise.all(
      batchIds.map(async (patientId) => ({
        patientId,
        patient: await redis.hgetall<{ createdAt?: string }>(redisKeys.patient(patientId)),
      })),
    );

    const validRecords = records.flatMap(({ patientId, patient }) => {
      if (!patient?.createdAt) {
        skipped += 1;
        return [];
      }

      const score = Date.parse(patient.createdAt);

      if (Number.isNaN(score)) {
        skipped += 1;
        return [];
      }

      return [{ patientId, score }];
    });

    if (validRecords.length === 0) continue;

    const pipeline = redis.pipeline();

    for (const record of validRecords) {
      pipeline.zadd(indexKey, {
        score: record.score,
        member: record.patientId,
      });
    }

    await pipeline.exec();
    indexed += validRecords.length;
  }

  const after = await redis.zcard(indexKey);

  console.log(`Index entries before migration: ${before}`);
  console.log(`Valid records processed: ${indexed}`);
  console.log(`Records skipped: ${skipped}`);
  console.log(`Index entries after migration: ${after}`);

  if (skipped === 0 && after !== patientIds.length) {
    throw new Error(
      `Index verification failed: expected ${patientIds.length} entries but found ${after}.`,
    );
  }

  console.log("Patient index migration completed.");
}

migratePatientCreatedIndex().catch((error: unknown) => {
  console.error("Patient index migration failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
