import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET must be at least 32 characters"),
  ADMIN_INITIAL_EMAIL: z.email().optional(),
  ADMIN_INITIAL_PASSWORD: z.string().min(8).optional(),
  KV_REST_API_URL: z.string().url(),
  KV_REST_API_TOKEN: z.string().min(1),
  KV_REST_API_READ_ONLY_TOKEN: z.string().optional(),
});

function validateEnv() {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  • ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Missing or invalid environment variables:\n${issues}`);
  }
  return result.data;
}

// Validate eagerly on first import so errors surface at startup, not runtime.
export const env = validateEnv();
