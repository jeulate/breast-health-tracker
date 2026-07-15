import { getSession } from "@/lib/auth/session";
import { parsePatientListQuery } from "@/lib/validations/patient-list";
import { createPatientSchema } from "@/lib/validations/patient";
import { PatientService } from "@/services/patient.service";
import { ok, fail, toJsonResponse } from "@/lib/utils/api-response";

export async function GET(request: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return toJsonResponse(fail("UNAUTHORIZED", "Debes iniciar sesión."), 401);
    }

    const searchParams = Object.fromEntries(new URL(request.url).searchParams.entries());
    const query = parsePatientListQuery(searchParams);
    const patients = await PatientService.listPaginated(query);
    return toJsonResponse(ok(patients));
  } catch {
    return toJsonResponse(fail("INTERNAL_ERROR", "No fue posible consultar las pacientes."), 500);
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return toJsonResponse(fail("UNAUTHORIZED", "Debes iniciar sesión."), 401);
    }

    const body = await request.json();
    const result = createPatientSchema.safeParse(body);

    if (!result.success) {
      return toJsonResponse(
        fail("VALIDATION_ERROR", "Revisa los campos indicados.", result.error.issues),
        400,
      );
    }

    const patient = await PatientService.create(result.data);
    return toJsonResponse(ok(patient), 201);
  } catch {
    return toJsonResponse(fail("INTERNAL_ERROR", "No fue posible crear la paciente."), 500);
  }
}
