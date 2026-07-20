import { z } from "zod";

const serverEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),

  AUTH_SECRET: z.string().min(32, "AUTH_SECRET must be at least 32 characters"),

  ADMIN_INITIAL_EMAIL: z.string().email().optional(),

  ADMIN_INITIAL_PASSWORD: z.string().min(8).optional(),

  KV_REST_API_URL: z.string().url("KV_REST_API_URL must be a valid URL"),

  KV_REST_API_TOKEN: z.string().min(1, "KV_REST_API_TOKEN is required"),

  KV_REST_API_READ_ONLY_TOKEN: z.string().optional(),

  HEALTH_APP_REDIS_PREFIX: z.string().min(1).default("bht:v1:"),

  CRON_SECRET: z.string().min(32).optional(),

  TELEGRAM_BOT_TOKEN: z.string().min(20).optional(),

  TELEGRAM_WEBHOOK_SECRET: z.string().min(32).optional(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cachedEnv: ServerEnv | null = null;

function formatEnvErrors(error: z.ZodError): string {
  return error.issues
    .map((issue) => {
      const path = issue.path.join(".") || "environment";
      return `  • ${path}: ${issue.message}`;
    })
    .join("\n");
}

/**
 * Valida y devuelve las variables privadas del servidor.
 *
 * Se ejecuta únicamente cuando una función del servidor realmente
 * necesita acceder a la configuración. Esto evita fallos prematuros
 * durante la evaluación estática de módulos.
 */
export function getServerEnv(): ServerEnv {
  if (cachedEnv) {
    return cachedEnv;
  }

  const result = serverEnvSchema.safeParse(process.env);

  if (!result.success) {
    throw new Error(`Missing or invalid environment variables:\n${formatEnvErrors(result.error)}`);
  }

  cachedEnv = result.data;
  return cachedEnv;
}

/**
 * Permite limpiar el caché únicamente para pruebas.
 */
export function resetServerEnvForTests(): void {
  cachedEnv = null;
}
