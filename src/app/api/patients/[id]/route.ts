import { getSession } from "@/lib/auth/session";
import { updatePatientSchema } from "@/lib/validations/patient";
import { PatientService } from "@/services/patient.service";
import { ok, fail, toJsonResponse } from "@/lib/utils/api-response";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: Params) {
  try {
    const session = await getSession();

    if (!session) {
      return toJsonResponse(fail("UNAUTHORIZED", "Debes iniciar sesión."), 401);
    }

    const { id } = await params;
    const patient = await PatientService.getById(id);

    if (!patient) {
      return toJsonResponse(fail("NOT_FOUND", "No se encontró la paciente."), 404);
    }

    return toJsonResponse(ok(patient));
  } catch {
    return toJsonResponse(fail("INTERNAL_ERROR", "No fue posible consultar la paciente."), 500);
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const session = await getSession();

    if (!session) {
      return toJsonResponse(fail("UNAUTHORIZED", "Debes iniciar sesión."), 401);
    }

    const { id } = await params;
    const body = await request.json();
    const result = updatePatientSchema.safeParse(body);

    if (!result.success) {
      return toJsonResponse(
        fail("VALIDATION_ERROR", "Revisa los campos indicados.", result.error.issues),
        400,
      );
    }

    const patient = await PatientService.update(id, result.data);

    if (!patient) {
      return toJsonResponse(fail("NOT_FOUND", "No se encontró la paciente."), 404);
    }

    return toJsonResponse(ok(patient));
  } catch {
    return toJsonResponse(fail("INTERNAL_ERROR", "No fue posible actualizar la paciente."), 500);
  }
}
