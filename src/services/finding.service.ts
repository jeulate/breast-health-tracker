import { randomUUID } from "crypto";
import type { Finding } from "@/features/findings";
import {
  createFindingSchema,
  updateFindingSchema,
  type CreateFindingInput,
  type UpdateFindingInput,
} from "@/lib/validations/finding";
import { FindingRepository, type FindingSortDirection } from "@/repositories/finding.repository";
import { PatientRepository } from "@/repositories/patient.repository";

const findingRepository = new FindingRepository();
const patientRepository = new PatientRepository();

function hasOwnField(object: object, field: PropertyKey): boolean {
  return Object.prototype.hasOwnProperty.call(object, field);
}

function optionalValue<K extends "observations" | "biopsyResult" | "nextControlDate">(
  existing: Finding,
  input: UpdateFindingInput,
  field: K,
): Finding[K] {
  return hasOwnField(input, field) ? input[field] : existing[field];
}

function prepareUpdate(existing: Finding, input: UpdateFindingInput): UpdateFindingInput {
  const parsedInput = updateFindingSchema.parse(input);
  const normalizedInput: UpdateFindingInput = { ...parsedInput };

  if (normalizedInput.biopsyPerformed === false) {
    normalizedInput.biopsyResult = undefined;
  }

  createFindingSchema.parse({
    patientId: existing.patientId,
    category: normalizedInput.category ?? existing.category,
    laterality: normalizedInput.laterality ?? existing.laterality,
    studyType: normalizedInput.studyType ?? existing.studyType,
    studyDate: normalizedInput.studyDate ?? existing.studyDate,
    description: normalizedInput.description ?? existing.description,
    observations: optionalValue(existing, normalizedInput, "observations"),
    biopsyPerformed: normalizedInput.biopsyPerformed ?? existing.biopsyPerformed,
    biopsyResult: optionalValue(existing, normalizedInput, "biopsyResult"),
    nextControlDate: optionalValue(existing, normalizedInput, "nextControlDate"),
    status: normalizedInput.status ?? existing.status,
  });

  return normalizedInput;
}

export const FindingService = {
  async listByPatient(
    patientId: string,
    direction: FindingSortDirection = "desc",
  ): Promise<Finding[] | null> {
    const patient = await patientRepository.findById(patientId);

    if (!patient) return null;

    return findingRepository.listByPatient(patientId, direction);
  },

  async getByIdForPatient(patientId: string, id: string): Promise<Finding | null> {
    const finding = await findingRepository.findById(id);

    if (!finding || finding.patientId !== patientId) return null;

    return finding;
  },

  async create(input: CreateFindingInput): Promise<Finding | null> {
    const parsedInput = createFindingSchema.parse(input);
    const patient = await patientRepository.findById(parsedInput.patientId);

    if (!patient) return null;

    const now = new Date().toISOString();
    const finding: Finding = {
      id: randomUUID(),
      patientId: parsedInput.patientId,
      category: parsedInput.category,
      laterality: parsedInput.laterality,
      studyType: parsedInput.studyType,
      studyDate: parsedInput.studyDate,
      description: parsedInput.description,
      observations: parsedInput.observations,
      biopsyPerformed: parsedInput.biopsyPerformed,
      biopsyResult: parsedInput.biopsyResult,
      nextControlDate: parsedInput.nextControlDate,
      status: parsedInput.status,
      createdAt: now,
      updatedAt: now,
    };

    await findingRepository.save(finding);

    return finding;
  },

  async update(patientId: string, id: string, input: UpdateFindingInput): Promise<Finding | null> {
    const existing = await findingRepository.findById(id);

    if (!existing || existing.patientId !== patientId) return null;

    const normalizedInput = prepareUpdate(existing, input);

    await findingRepository.update(id, normalizedInput);

    return findingRepository.findById(id);
  },
};
