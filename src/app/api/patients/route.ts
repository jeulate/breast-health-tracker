import { createPatientSchema } from "@/lib/validations/patient";
import { PatientService } from "@/services/patient.service";
import { ok, fail, toJsonResponse } from "@/lib/utils/api-response";

export async function GET() {
  try {
    const patients = await PatientService.list();
    return toJsonResponse(ok(patients));
  } catch {
    return toJsonResponse(fail("INTERNAL_ERROR", "Failed to fetch patients"), 500);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = createPatientSchema.safeParse(body);
    if (!result.success) {
      return toJsonResponse(fail("VALIDATION_ERROR", "Invalid input", result.error.issues), 400);
    }
    const patient = await PatientService.create(result.data);
    return toJsonResponse(ok(patient), 201);
  } catch {
    return toJsonResponse(fail("INTERNAL_ERROR", "Failed to create patient"), 500);
  }
}
