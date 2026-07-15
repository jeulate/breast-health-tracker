import { randomUUID } from "crypto";
import type { ClinicalEvent, TimelineEntry } from "@/features/clinical-timeline";
import {
  createClinicalEventSchema,
  updateClinicalEventSchema,
  type CreateClinicalEventInput,
  type UpdateClinicalEventInput,
} from "@/lib/validations/clinical-event";
import { ClinicalEventRepository } from "@/repositories/clinical-event.repository";
import { FindingRepository } from "@/repositories/finding.repository";
import { PatientRepository } from "@/repositories/patient.repository";

const clinicalEventRepository = new ClinicalEventRepository();
const findingRepository = new FindingRepository();
const patientRepository = new PatientRepository();

export type TimelineSortDirection = "asc" | "desc";

function hasOwnField(object: object, field: PropertyKey): boolean {
  return Object.prototype.hasOwnProperty.call(object, field);
}

function prepareUpdate(
  existing: ClinicalEvent,
  input: UpdateClinicalEventInput,
): UpdateClinicalEventInput {
  const parsedInput = updateClinicalEventSchema.parse(input);

  createClinicalEventSchema.parse({
    patientId: existing.patientId,
    type: parsedInput.type ?? existing.type,
    eventDate: parsedInput.eventDate ?? existing.eventDate,
    title: parsedInput.title ?? existing.title,
    description: parsedInput.description ?? existing.description,
    status: parsedInput.status ?? existing.status,
    findingId: hasOwnField(parsedInput, "findingId") ? parsedInput.findingId : existing.findingId,
  });

  return parsedInput;
}

async function findingBelongsToPatient(
  findingId: string | undefined,
  patientId: string,
): Promise<boolean> {
  if (!findingId) return true;

  const finding = await findingRepository.findById(findingId);
  return finding?.patientId === patientId;
}

function compareTimelineEntries(
  left: TimelineEntry,
  right: TimelineEntry,
  direction: TimelineSortDirection,
): number {
  const dateComparison = left.eventDate.localeCompare(right.eventDate);

  if (dateComparison !== 0) return direction === "asc" ? dateComparison : -dateComparison;

  const sourceComparison = left.source.localeCompare(right.source);
  if (sourceComparison !== 0) return sourceComparison;

  return left.sourceId.localeCompare(right.sourceId);
}

export const ClinicalTimelineService = {
  async listByPatient(
    patientId: string,
    direction: TimelineSortDirection = "desc",
  ): Promise<TimelineEntry[] | null> {
    const patient = await patientRepository.findById(patientId);

    if (!patient) return null;

    const [events, findings] = await Promise.all([
      clinicalEventRepository.listByPatient(patientId, direction),
      findingRepository.listByPatient(patientId, direction),
    ]);

    const eventEntries: TimelineEntry[] = events.map((event) => ({
      id: `clinical-event:${event.id}`,
      patientId: event.patientId,
      source: "CLINICAL_EVENT",
      sourceId: event.id,
      eventDate: event.eventDate,
      type: event.type,
      title: event.title,
      description: event.description,
      status: event.status,
    }));

    const findingEntries: TimelineEntry[] = findings.map((finding) => ({
      id: `finding:${finding.id}`,
      patientId: finding.patientId,
      source: "FINDING",
      sourceId: finding.id,
      eventDate: finding.studyDate,
      type: "FINDING",
      title: `BI-RADS ${finding.category}`,
      description: finding.description,
      status: finding.status,
    }));

    return [...eventEntries, ...findingEntries].sort((left, right) =>
      compareTimelineEntries(left, right, direction),
    );
  },

  async getEventByIdForPatient(patientId: string, id: string): Promise<ClinicalEvent | null> {
    const event = await clinicalEventRepository.findById(id);

    if (!event || event.patientId !== patientId) return null;

    return event;
  },

  async create(input: CreateClinicalEventInput): Promise<ClinicalEvent | null> {
    const parsedInput = createClinicalEventSchema.parse(input);
    const patient = await patientRepository.findById(parsedInput.patientId);

    if (!patient) return null;

    if (!(await findingBelongsToPatient(parsedInput.findingId, parsedInput.patientId))) {
      return null;
    }

    const now = new Date().toISOString();
    const event: ClinicalEvent = {
      id: randomUUID(),
      patientId: parsedInput.patientId,
      type: parsedInput.type,
      eventDate: parsedInput.eventDate,
      title: parsedInput.title,
      description: parsedInput.description,
      status: parsedInput.status,
      findingId: parsedInput.findingId,
      createdAt: now,
      updatedAt: now,
    };

    await clinicalEventRepository.save(event);

    return event;
  },

  async update(
    patientId: string,
    id: string,
    input: UpdateClinicalEventInput,
  ): Promise<ClinicalEvent | null> {
    const existing = await clinicalEventRepository.findById(id);

    if (!existing || existing.patientId !== patientId) return null;

    const normalizedInput = prepareUpdate(existing, input);

    if (
      hasOwnField(normalizedInput, "findingId") &&
      !(await findingBelongsToPatient(normalizedInput.findingId, patientId))
    ) {
      return null;
    }

    await clinicalEventRepository.update(id, normalizedInput);

    return clinicalEventRepository.findById(id);
  },

  async delete(patientId: string, id: string): Promise<boolean> {
    const existing = await clinicalEventRepository.findById(id);

    if (!existing || existing.patientId !== patientId) return false;

    await clinicalEventRepository.delete(id);
    return true;
  },
};
