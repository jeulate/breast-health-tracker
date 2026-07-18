import { timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { getServerEnv } from "@/config/env";
import { fail, ok, toJsonResponse } from "@/lib/utils/api-response";
import { ReminderProcessorService } from "@/services/reminder-processor.service";

export const runtime = "nodejs";

const requestSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(100),
});

function hasValidBearerToken(request: Request, secret: string): boolean {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return false;

  const provided = authorization.slice("Bearer ".length);
  const providedBuffer = Buffer.from(provided);
  const secretBuffer = Buffer.from(secret);
  return (
    providedBuffer.length === secretBuffer.length && timingSafeEqual(providedBuffer, secretBuffer)
  );
}

export async function POST(request: Request) {
  try {
    const secret = getServerEnv().CRON_SECRET;

    if (!secret) {
      return toJsonResponse(
        fail("SERVICE_UNAVAILABLE", "El procesador de recordatorios no está configurado."),
        503,
      );
    }

    if (!hasValidBearerToken(request, secret)) {
      return toJsonResponse(fail("UNAUTHORIZED", "Credenciales internas inválidas."), 401);
    }

    const searchParams = new URL(request.url).searchParams;
    const parsed = requestSchema.safeParse({ limit: searchParams.get("limit") ?? undefined });
    if (!parsed.success) {
      return toJsonResponse(
        fail("VALIDATION_ERROR", "El límite debe estar entre 1 y 100.", parsed.error.issues),
        400,
      );
    }

    const summary = await new ReminderProcessorService().processDue(parsed.data.limit);
    return toJsonResponse(ok(summary));
  } catch {
    return toJsonResponse(
      fail("INTERNAL_ERROR", "No fue posible procesar los recordatorios."),
      500,
    );
  }
}

export const GET = POST;
