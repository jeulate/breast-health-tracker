/**
 * Seed script.
 *
 * Creates:
 * - One administrator
 * - Two fictitious patients
 *
 * Run with:
 * npm run seed
 */

import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { config } from "dotenv";

config({ path: ".env.local" });

async function seed(): Promise<void> {
  const [{ getServerEnv }, { getRedisClient }, { redisKeys }] = await Promise.all([
    import("../src/config/env"),
    import("../src/lib/redis/client"),
    import("../src/lib/redis/keys"),
  ]);

  const { ADMIN_INITIAL_EMAIL, ADMIN_INITIAL_PASSWORD } = getServerEnv();

  if (!ADMIN_INITIAL_EMAIL || !ADMIN_INITIAL_PASSWORD) {
    throw new Error("ADMIN_INITIAL_EMAIL and ADMIN_INITIAL_PASSWORD are required to run the seed.");
  }

  const redis = getRedisClient();
  const normalizedAdminEmail = ADMIN_INITIAL_EMAIL.trim().toLowerCase();
  const existingAdminId = await redis.get<string>(redisKeys.userByEmail(normalizedAdminEmail));

  const now = new Date().toISOString();

  console.log("Starting seed...");

  if (existingAdminId) {
    console.log(`Administrator already exists with ID ${existingAdminId}. Skipping creation.`);
  } else {
    const adminId = randomUUID();
    const passwordHash = await bcrypt.hash(ADMIN_INITIAL_PASSWORD, 12);

    const pipeline = redis.pipeline();

    pipeline.hset(redisKeys.user(adminId), {
      id: adminId,
      name: "Administrador",
      email: normalizedAdminEmail,
      passwordHash,
      role: "ADMIN",
      status: "ACTIVE",
      createdAt: now,
      updatedAt: now,
    });

    pipeline.set(redisKeys.userByEmail(normalizedAdminEmail), adminId);
    pipeline.sadd(redisKeys.usersIndex(), adminId);

    await pipeline.exec();

    console.log(`Administrator created: ${normalizedAdminEmail}`);
  }

  const fictitiousPatients = [
    {
      fullName: "Ana Ficticia López",
      birthDate: "1985-03-15",
      timezone: "America/La_Paz",
    },
    {
      fullName: "Beatriz Ficticia Martínez",
      birthDate: "1990-07-22",
      timezone: "America/La_Paz",
    },
  ];

  const existingPatientIds = await redis.smembers<string[]>(redisKeys.patientsIndex());
  const existingPatientNames = new Set<string>();

  for (const patientId of existingPatientIds) {
    const patient = await redis.hgetall<{ fullName?: string }>(redisKeys.patient(patientId));

    if (patient?.fullName) {
      existingPatientNames.add(patient.fullName);
    }
  }

  for (const patientData of fictitiousPatients) {
    if (existingPatientNames.has(patientData.fullName)) {
      console.log(`Patient already exists: ${patientData.fullName}. Skipping creation.`);
      continue;
    }

    const patientId = randomUUID();
    const pipeline = redis.pipeline();

    pipeline.hset(redisKeys.patient(patientId), {
      id: patientId,
      fullName: patientData.fullName,
      birthDate: patientData.birthDate,
      timezone: patientData.timezone,
      status: "ACTIVE",
      createdAt: now,
      updatedAt: now,
    });

    pipeline.sadd(redisKeys.patientsIndex(), patientId);
    pipeline.zadd(redisKeys.patientsCreatedAtIndex(), {
      score: Date.parse(now),
      member: patientId,
    });

    await pipeline.exec();

    console.log(`Patient created: ${patientData.fullName}`);
  }

  console.log("Seed completed.");
}

seed().catch((error: unknown) => {
  console.error("Seed failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
