import { getSession } from "@/lib/auth/session";
import { fail, ok, toJsonResponse } from "@/lib/utils/api-response";
import { TelegramLinkService } from "@/services/telegram-link.service";

const telegramLinkService = new TelegramLinkService();

interface Params {
  params: Promise<{ id: string; challengeId: string }>;
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    if (!(await getSession()))
      return toJsonResponse(fail("UNAUTHORIZED", "Debes iniciar sesión."), 401);
    const { challengeId } = await params;
    if (!/^tgl_[a-f0-9]{32}$/.test(challengeId))
      return toJsonResponse(fail("VALIDATION_ERROR", "El enlace no es válido."), 400);
    if (!(await telegramLinkService.revoke(challengeId))) {
      return toJsonResponse(
        fail("LINK_UNAVAILABLE", "El enlace no existe o ya no está pendiente."),
        409,
      );
    }
    return toJsonResponse(ok({ revoked: true }));
  } catch {
    return toJsonResponse(fail("INTERNAL_ERROR", "No fue posible revocar el enlace."), 500);
  }
}
