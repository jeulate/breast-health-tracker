/**
 * Seed script – creates a fictitious admin and two patients.
 * Run with: npm run seed
 *
 * Requires environment variables to be set (copy .env.example to .env.local).
 */

import { randomUUID } from "crypto";
import { Redis } from "@upstash/redis";
import bcrypt from "bcryptjs";
import type { User, Patient } from "../src/types/index.js";

// Load env vars from .env.local when running outside Next.js
import { config } from "dotenv";
config({ path: ".env.local" });

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

async function seed() {
  console.log("🌱  Starting seed…\n");

  const now = new Date().toISOString();

  // ── Admin user ─────────────────────────────────────────────────────────────
  const adminEmail = process.env.ADMIN_INITIAL_EMAIL ?? "admin@ejemplo.com";
  const adminPassword = process.env.ADMIN_INITIAL_PASSWORD ?? "Admin1234!";
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  const admin: User = {
    id: randomUUID(),
    name: "Administrador",
    email: adminEmail,
    passwordHash,
    role: "ADMIN",
    status: "ACTIVE",
    createdAt: now,
    updatedAt: now,
  };

  const pipeline = redis.pipeline();

  // Persist admin
  pipeline.hset(`users:${admin.id}`, {
    id: admin.id,
    name: admin.name,
    email: admin.email,
    passwordHash: admin.passwordHash,
    role: admin.role,
    status: admin.status,
    createdAt: admin.createdAt,
    updatedAt: admin.updatedAt,
  });
  pipeline.set(`users:email:${admin.email}`, admin.id);
  pipeline.sadd("users:index", admin.id);

  // ── Patients ───────────────────────────────────────────────────────────────
  const patients: Patient[] = [
    {
      id: randomUUID(),
      fullName: "Ana Ficticia López",
      birthDate: "1985-03-15",
      timezone: "America/Mexico_City",
      status: "ACTIVE",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: randomUUID(),
      fullName: "Beatriz Ficticia Martínez",
      birthDate: "1990-07-22",
      timezone: "America/Mexico_City",
      status: "ACTIVE",
      createdAt: now,
      updatedAt: now,
    },
  ];

  for (const patient of patients) {
    pipeline.hset(`patients:${patient.id}`, {
      id: patient.id,
      fullName: patient.fullName,
      birthDate: patient.birthDate ?? "",
      timezone: patient.timezone,
      status: patient.status,
      createdAt: patient.createdAt,
      updatedAt: patient.updatedAt,
    });
    pipeline.sadd("patients:index", patient.id);
  }

  await pipeline.exec();

  console.log("✅  Admin created:");
  console.log(`   Email: ${adminEmail}`);
  console.log(`   Password: ${adminPassword}`);
  console.log(`   Role: ADMIN\n`);

  for (const p of patients) {
    console.log(`✅  Patient created: ${p.fullName}`);
  }

  console.log("\n🌱  Seed complete.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌  Seed failed:", err);
  process.exit(1);
});
