import { timingSafeEqual } from "node:crypto";
import { webhookCallback } from "grammy";
import { getServerEnv } from "@/config/env";
import { fail, toJsonResponse } from "@/lib/utils/api-response";
import { createTelegramBot } from "@/services/telegram-bot.service";

function secretsMatch(received: string | null, expected: string): boolean {
  if (!received) return false;
  const left = Buffer.from(received);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function POST(request: Request): Promise<Response> {
  try {
    const { TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET } = getServerEnv();
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_WEBHOOK_SECRET) {
      return toJsonResponse(fail("SERVICE_UNAVAILABLE", "Telegram no está configurado."), 503);
    }
    if (
      !secretsMatch(request.headers.get("x-telegram-bot-api-secret-token"), TELEGRAM_WEBHOOK_SECRET)
    ) {
      return toJsonResponse(fail("UNAUTHORIZED", "Credenciales de webhook inválidas."), 401);
    }
    return webhookCallback(createTelegramBot(TELEGRAM_BOT_TOKEN), "std/http")(request);
  } catch {
    return toJsonResponse(fail("INTERNAL_ERROR", "No fue posible procesar la actualización."), 500);
  }
}
