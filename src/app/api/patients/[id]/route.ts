import { updatePatientSchema } from "@/lib/validations/patient";
import { PatientService } from "@/services/patient.service";
import { ok, fail, toJsonResponse } from "@/lib/utils/api-response";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const patient = await PatientService.getById(id);
    if (!patient) {
      return toJsonResponse(fail("NOT_FOUND", "Patient not found"), 404);
    }
    return toJsonResponse(ok(patient));
  } catch {
    return toJsonResponse(fail("INTERNAL_ERROR", "Failed to fetch patient"), 500);
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();
    const result = updatePatientSchema.safeParse(body);
    if (!result.success) {
      return toJsonResponse(fail("VALIDATION_ERROR", "Invalid input", result.error.issues), 400);
    }
    const patient = await PatientService.update(id, result.data);
    if (!patient) {
      return toJsonResponse(fail("NOT_FOUND", "Patient not found"), 404);
    }
    return toJsonResponse(ok(patient));
  } catch {
    return toJsonResponse(fail("INTERNAL_ERROR", "Failed to update patient"), 500);
  }
}
