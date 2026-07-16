import { getSession } from "@/lib/auth/session";
import { fail, ok, toJsonResponse } from "@/lib/utils/api-response";
import { createClinicalEventSchema } from "@/lib/validations/clinical-event";
import { ClinicalTimelineService } from "@/services/clinical-timeline.service";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: Params) {
  try {
    const session = await getSession();

    if (!session) {
      return toJsonResponse(fail("UNAUTHORIZED", "Debes iniciar sesión."), 401);
    }

    const { id } = await params;
    const direction = new URL(request.url).searchParams.get("direction") ?? "desc";

    if (direction !== "asc" && direction !== "desc") {
      return toJsonResponse(fail("VALIDATION_ERROR", "La dirección debe ser asc o desc."), 400);
    }

    const timeline = await ClinicalTimelineService.listByPatient(id, direction);

    if (!timeline) {
      return toJsonResponse(fail("NOT_FOUND", "No se encontró la paciente."), 404);
    }

    return toJsonResponse(ok(timeline));
  } catch {
    return toJsonResponse(fail("INTERNAL_ERROR", "No fue posible consultar el timeline."), 500);
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const session = await getSession();

    if (!session) {
      return toJsonResponse(fail("UNAUTHORIZED", "Debes iniciar sesión."), 401);
    }

    const { id } = await params;
    const body: unknown = await request.json();
    const bodyRecord =
      typeof body === "object" && body !== null && !Array.isArray(body)
        ? (body as Record<string, unknown>)
        : {};
    const result = createClinicalEventSchema.safeParse({ ...bodyRecord, patientId: id });

    if (!result.success) {
      return toJsonResponse(
        fail("VALIDATION_ERROR", "Revisa los campos indicados.", result.error.issues),
        400,
      );
    }

    const event = await ClinicalTimelineService.create(result.data);

    if (!event) {
      return toJsonResponse(
        fail("NOT_FOUND", "No se encontró la paciente o el hallazgo relacionado."),
        404,
      );
    }

    return toJsonResponse(ok(event), 201);
  } catch (error) {
    if (error instanceof SyntaxError) {
      return toJsonResponse(fail("VALIDATION_ERROR", "El cuerpo JSON no es válido."), 400);
    }

    return toJsonResponse(fail("INTERNAL_ERROR", "No fue posible crear el evento clínico."), 500);
  }
}
