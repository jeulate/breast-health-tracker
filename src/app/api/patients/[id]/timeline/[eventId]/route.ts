import { ZodError } from "zod";
import { getSession } from "@/lib/auth/session";
import { fail, ok, toJsonResponse } from "@/lib/utils/api-response";
import { updateClinicalEventSchema } from "@/lib/validations/clinical-event";
import { ClinicalTimelineService } from "@/services/clinical-timeline.service";

interface Params {
  params: Promise<{ id: string; eventId: string }>;
}

export async function GET(_request: Request, { params }: Params) {
  try {
    const session = await getSession();

    if (!session) {
      return toJsonResponse(fail("UNAUTHORIZED", "Debes iniciar sesión."), 401);
    }

    const { id, eventId } = await params;
    const event = await ClinicalTimelineService.getEventByIdForPatient(id, eventId);

    if (!event) {
      return toJsonResponse(fail("NOT_FOUND", "No se encontró el evento clínico."), 404);
    }

    return toJsonResponse(ok(event));
  } catch {
    return toJsonResponse(
      fail("INTERNAL_ERROR", "No fue posible consultar el evento clínico."),
      500,
    );
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const session = await getSession();

    if (!session) {
      return toJsonResponse(fail("UNAUTHORIZED", "Debes iniciar sesión."), 401);
    }

    const { id, eventId } = await params;
    const body: unknown = await request.json();
    const result = updateClinicalEventSchema.safeParse(body);

    if (!result.success) {
      return toJsonResponse(
        fail("VALIDATION_ERROR", "Revisa los campos indicados.", result.error.issues),
        400,
      );
    }

    const event = await ClinicalTimelineService.update(id, eventId, result.data);

    if (!event) {
      return toJsonResponse(fail("NOT_FOUND", "No se encontró el evento clínico."), 404);
    }

    return toJsonResponse(ok(event));
  } catch (error) {
    if (error instanceof SyntaxError) {
      return toJsonResponse(fail("VALIDATION_ERROR", "El cuerpo JSON no es válido."), 400);
    }

    if (error instanceof ZodError) {
      return toJsonResponse(
        fail("VALIDATION_ERROR", "La actualización contradice los datos existentes.", error.issues),
        400,
      );
    }

    return toJsonResponse(
      fail("INTERNAL_ERROR", "No fue posible actualizar el evento clínico."),
      500,
    );
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const session = await getSession();

    if (!session) {
      return toJsonResponse(fail("UNAUTHORIZED", "Debes iniciar sesión."), 401);
    }

    const { id, eventId } = await params;
    const deleted = await ClinicalTimelineService.delete(id, eventId);

    if (!deleted) {
      return toJsonResponse(fail("NOT_FOUND", "No se encontró el evento clínico."), 404);
    }

    return toJsonResponse(ok({ deleted: true }));
  } catch {
    return toJsonResponse(
      fail("INTERNAL_ERROR", "No fue posible eliminar el evento clínico."),
      500,
    );
  }
}
