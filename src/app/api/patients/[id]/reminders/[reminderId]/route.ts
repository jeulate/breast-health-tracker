import { getSession } from "@/lib/auth/session";
import { fail, ok, toJsonResponse } from "@/lib/utils/api-response";
import { reminderActionSchema } from "@/lib/validations/reminder";
import { ReminderService } from "@/services/reminder.service";

interface Params {
  params: Promise<{ id: string; reminderId: string }>;
}

export async function GET(_request: Request, { params }: Params) {
  try {
    const session = await getSession();
    if (!session) return toJsonResponse(fail("UNAUTHORIZED", "Debes iniciar sesión."), 401);

    const { id, reminderId } = await params;
    const reminder = await ReminderService.getByIdForPatient(id, reminderId);
    if (!reminder) {
      return toJsonResponse(fail("NOT_FOUND", "No se encontró el recordatorio."), 404);
    }

    return toJsonResponse(ok(reminder));
  } catch {
    return toJsonResponse(fail("INTERNAL_ERROR", "No fue posible consultar el recordatorio."), 500);
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const session = await getSession();
    if (!session) return toJsonResponse(fail("UNAUTHORIZED", "Debes iniciar sesión."), 401);

    const { id, reminderId } = await params;
    const body: unknown = await request.json();
    const result = reminderActionSchema.safeParse(body);

    if (!result.success) {
      return toJsonResponse(
        fail("VALIDATION_ERROR", "Revisa la acción solicitada.", result.error.issues),
        400,
      );
    }

    const existing = await ReminderService.getByIdForPatient(id, reminderId);
    if (!existing) {
      return toJsonResponse(fail("NOT_FOUND", "No se encontró el recordatorio."), 404);
    }

    const { action } = result.data;
    const reminder =
      action === "RESCHEDULE"
        ? await ReminderService.reschedule(id, reminderId, {
            scheduledFor: result.data.scheduledFor,
            ...(result.data.timezone ? { timezone: result.data.timezone } : {}),
          })
        : action === "COMPLETE"
          ? await ReminderService.complete(id, reminderId)
          : await ReminderService.cancel(id, reminderId);

    if (!reminder) {
      return toJsonResponse(
        fail("INVALID_STATE", "La acción no está permitida para el estado actual."),
        409,
      );
    }

    return toJsonResponse(ok(reminder));
  } catch (error) {
    if (error instanceof SyntaxError) {
      return toJsonResponse(fail("VALIDATION_ERROR", "El cuerpo JSON no es válido."), 400);
    }
    return toJsonResponse(
      fail("INTERNAL_ERROR", "No fue posible actualizar el recordatorio."),
      500,
    );
  }
}
