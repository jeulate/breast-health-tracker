import { randomUUID } from "crypto";
import { canUseChronologicalPatientIndex } from "@/features/patients/patient-list-strategy";
import { queryPatients } from "@/features/patients/query-patients";
import type { PaginatedPatients, PatientListQuery } from "@/features/patients/patient-list.types";
import { PatientRepository } from "@/repositories/patient.repository";
import type { Patient, PatientStatus } from "@/types";
import type { CreatePatientInput, UpdatePatientInput } from "@/lib/validations/patient";

const patientRepo = new PatientRepository();

export const PatientService = {
  async list(): Promise<Patient[]> {
    return patientRepo.listAll();
  },

  async listPaginated(query: PatientListQuery): Promise<PaginatedPatients> {
    if (canUseChronologicalPatientIndex(query)) {
      const [patientCount, indexCount] = await Promise.all([
        patientRepo.count(),
        patientRepo.countCreatedAtIndex(),
      ]);

      if (patientCount === indexCount) {
        return patientRepo.listPageByCreatedAt(query.page, query.pageSize, query.sortDirection);
      }
    }

    const patients = await patientRepo.listAll();
    return queryPatients(patients, query);
  },

  async getById(id: string): Promise<Patient | null> {
    return patientRepo.findById(id);
  },

  async create(input: CreatePatientInput): Promise<Patient> {
    const now = new Date().toISOString();
    const patient: Patient = {
      id: randomUUID(),
      fullName: input.fullName,
      birthDate: input.birthDate,
      timezone: input.timezone ?? "America/La_Paz",
      status: "ACTIVE",
      createdAt: now,
      updatedAt: now,
    };
    await patientRepo.save(patient);
    return patient;
  },

  async update(id: string, input: UpdatePatientInput): Promise<Patient | null> {
    const existing = await patientRepo.findById(id);
    if (!existing) return null;
    await patientRepo.update(id, input);
    return patientRepo.findById(id);
  },

  async setStatus(id: string, status: PatientStatus): Promise<Patient | null> {
    const existing = await patientRepo.findById(id);
    if (!existing) return null;
    await patientRepo.updateStatus(id, status);
    return patientRepo.findById(id);
  },

  async countActive(): Promise<number> {
    return patientRepo.countByStatus("ACTIVE");
  },
};
