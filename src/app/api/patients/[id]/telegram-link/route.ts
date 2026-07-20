import { getSession } from "@/lib/auth/session";
import { fail, ok, toJsonResponse } from "@/lib/utils/api-response";
import { createTelegramLinkChallengeSchema } from "@/lib/validations/telegram";
import { TelegramLinkService } from "@/services/telegram-link.service";

const telegramLinkService = new TelegramLinkService();

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: Params) {
  try {
    if (!(await getSession()))
      return toJsonResponse(fail("UNAUTHORIZED", "Debes iniciar sesión."), 401);

    const { id } = await params;
    const body: unknown = await request.json();
    const record =
      typeof body === "object" && body !== null && !Array.isArray(body)
        ? (body as Record<string, unknown>)
        : {};
    const parsed = createTelegramLinkChallengeSchema.safeParse({
      patientId: id,
      ttlMinutes: record.ttlMinutes,
    });
    if (!parsed.success) {
      return toJsonResponse(
        fail("VALIDATION_ERROR", "Revisa la duración del enlace.", parsed.error.issues),
        400,
      );
    }

    const result = await telegramLinkService.createChallenge(parsed.data);
    if (!result) {
      return toJsonResponse(
        fail("LINK_UNAVAILABLE", "La paciente no existe o ya tiene Telegram vinculado."),
        409,
      );
    }

    return toJsonResponse(
      ok({
        challengeId: result.challenge.id,
        token: result.token,
        expiresAt: result.challenge.expiresAt,
      }),
      201,
    );
  } catch {
    return toJsonResponse(
      fail("INTERNAL_ERROR", "No fue posible generar el enlace de Telegram."),
      500,
    );
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    if (!(await getSession()))
      return toJsonResponse(fail("UNAUTHORIZED", "Debes iniciar sesión."), 401);
    const { id } = await params;
    if (!(await telegramLinkService.unlinkPatient(id)))
      return toJsonResponse(fail("NOT_FOUND", "No se encontró la paciente."), 404);
    return toJsonResponse(ok({ unlinked: true }));
  } catch {
    return toJsonResponse(fail("INTERNAL_ERROR", "No fue posible desvincular Telegram."), 500);
  }
}
