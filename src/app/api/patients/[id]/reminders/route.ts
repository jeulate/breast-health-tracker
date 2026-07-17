import { getSession } from "@/lib/auth/session";
import { fail, ok, toJsonResponse } from "@/lib/utils/api-response";
import { createPatientReminderSchema } from "@/lib/validations/reminder";
import { ReminderService } from "@/services/reminder.service";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: Params) {
  try {
    const session = await getSession();
    if (!session) return toJsonResponse(fail("UNAUTHORIZED", "Debes iniciar sesión."), 401);

    const { id } = await params;
    const reminders = await ReminderService.listByPatient(id);
    if (!reminders) return toJsonResponse(fail("NOT_FOUND", "No se encontró la paciente."), 404);

    return toJsonResponse(ok(reminders));
  } catch {
    return toJsonResponse(
      fail("INTERNAL_ERROR", "No fue posible consultar los recordatorios."),
      500,
    );
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const session = await getSession();
    if (!session) return toJsonResponse(fail("UNAUTHORIZED", "Debes iniciar sesión."), 401);

    const { id } = await params;
    const body: unknown = await request.json();
    const result = createPatientReminderSchema.safeParse(body);

    if (!result.success) {
      return toJsonResponse(
        fail("VALIDATION_ERROR", "Revisa los campos indicados.", result.error.issues),
        400,
      );
    }

    const reminder = await ReminderService.create({ ...result.data, patientId: id });
    if (!reminder) {
      return toJsonResponse(
        fail("NOT_FOUND_OR_INVALID_SOURCE", "No fue posible crear el recordatorio."),
        404,
      );
    }

    return toJsonResponse(ok(reminder), 201);
  } catch (error) {
    if (error instanceof SyntaxError) {
      return toJsonResponse(fail("VALIDATION_ERROR", "El cuerpo JSON no es válido."), 400);
    }
    return toJsonResponse(fail("INTERNAL_ERROR", "No fue posible crear el recordatorio."), 500);
  }
}
