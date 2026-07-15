import { ZodError } from "zod";
import { getSession } from "@/lib/auth/session";
import { fail, ok, toJsonResponse } from "@/lib/utils/api-response";
import { updateFindingSchema } from "@/lib/validations/finding";
import { FindingService } from "@/services/finding.service";

interface Params {
  params: Promise<{ id: string; findingId: string }>;
}

export async function GET(_request: Request, { params }: Params) {
  try {
    const session = await getSession();

    if (!session) {
      return toJsonResponse(fail("UNAUTHORIZED", "Debes iniciar sesión."), 401);
    }

    const { id, findingId } = await params;
    const finding = await FindingService.getByIdForPatient(id, findingId);

    if (!finding) {
      return toJsonResponse(fail("NOT_FOUND", "No se encontró el hallazgo."), 404);
    }

    return toJsonResponse(ok(finding));
  } catch {
    return toJsonResponse(fail("INTERNAL_ERROR", "No fue posible consultar el hallazgo."), 500);
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const session = await getSession();

    if (!session) {
      return toJsonResponse(fail("UNAUTHORIZED", "Debes iniciar sesión."), 401);
    }

    const { id, findingId } = await params;
    const body: unknown = await request.json();
    const result = updateFindingSchema.safeParse(body);

    if (!result.success) {
      return toJsonResponse(
        fail("VALIDATION_ERROR", "Revisa los campos indicados.", result.error.issues),
        400,
      );
    }

    const finding = await FindingService.update(id, findingId, result.data);

    if (!finding) {
      return toJsonResponse(fail("NOT_FOUND", "No se encontró el hallazgo."), 404);
    }

    return toJsonResponse(ok(finding));
  } catch (error) {
    if (error instanceof ZodError) {
      return toJsonResponse(
        fail("VALIDATION_ERROR", "La actualización contradice los datos existentes.", error.issues),
        400,
      );
    }

    return toJsonResponse(fail("INTERNAL_ERROR", "No fue posible actualizar el hallazgo."), 500);
  }
}
