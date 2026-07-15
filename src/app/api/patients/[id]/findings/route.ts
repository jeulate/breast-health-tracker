import { getSession } from "@/lib/auth/session";
import { fail, ok, toJsonResponse } from "@/lib/utils/api-response";
import { createFindingSchema } from "@/lib/validations/finding";
import { FindingService } from "@/services/finding.service";

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

    const findings = await FindingService.listByPatient(id, direction);

    if (!findings) {
      return toJsonResponse(fail("NOT_FOUND", "No se encontró la paciente."), 404);
    }

    return toJsonResponse(ok(findings));
  } catch {
    return toJsonResponse(fail("INTERNAL_ERROR", "No fue posible consultar los hallazgos."), 500);
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
    const result = createFindingSchema.safeParse({ ...bodyRecord, patientId: id });

    if (!result.success) {
      return toJsonResponse(
        fail("VALIDATION_ERROR", "Revisa los campos indicados.", result.error.issues),
        400,
      );
    }

    const finding = await FindingService.create(result.data);

    if (!finding) {
      return toJsonResponse(fail("NOT_FOUND", "No se encontró la paciente."), 404);
    }

    return toJsonResponse(ok(finding), 201);
  } catch {
    return toJsonResponse(fail("INTERNAL_ERROR", "No fue posible crear el hallazgo."), 500);
  }
}
