// Patients feature public API
export { PatientService } from "@/services/patient.service";
export { createPatientSchema, updatePatientSchema } from "@/lib/validations/patient";
export type { CreatePatientInput, UpdatePatientInput } from "@/lib/validations/patient";
