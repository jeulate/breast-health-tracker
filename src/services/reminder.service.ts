import { buildCalendarItems } from "@/features/calendar";
import {
  buildReminderId,
  canTransitionReminder,
  type Reminder,
  type ReminderCandidate,
} from "@/features/reminders";
import {
  createReminderSchema,
  rescheduleReminderSchema,
  type CreateReminderInput,
  type RescheduleReminderInput,
} from "@/lib/validations/reminder";
import { ClinicalEventRepository } from "@/repositories/clinical-event.repository";
import { FindingRepository } from "@/repositories/finding.repository";
import { PatientRepository } from "@/repositories/patient.repository";
import { ReminderRepository } from "@/repositories/reminder.repository";

const clinicalEventRepository = new ClinicalEventRepository();
const findingRepository = new FindingRepository();
const patientRepository = new PatientRepository();
const reminderRepository = new ReminderRepository();

function localDateForTimezone(isoDateTime: string, timezone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(isoDateTime));
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function isScheduledOnOrBeforeTarget(
  scheduledFor: string,
  targetDate: string,
  timezone: string,
): boolean {
  return localDateForTimezone(scheduledFor, timezone) <= targetDate;
}

async function sourceIsValid(input: {
  patientId: string;
  source: Reminder["source"];
  sourceId: string;
  targetDate: string;
}): Promise<boolean> {
  if (input.source === "CLINICAL_EVENT") {
    const event = await clinicalEventRepository.findById(input.sourceId);
    return (
      event?.patientId === input.patientId &&
      event.type === "CONTROL" &&
      event.status === "SCHEDULED" &&
      event.eventDate === input.targetDate
    );
  }

  const finding = await findingRepository.findById(input.sourceId);
  return (
    finding?.patientId === input.patientId &&
    finding.status !== "CLOSED" &&
    finding.nextControlDate === input.targetDate
  );
}

async function updateAndRead(
  patientId: string,
  reminder: Reminder,
  fields: Parameters<ReminderRepository["update"]>[1],
): Promise<Reminder | null> {
  await reminderRepository.update(reminder.id, fields);
  const updated = await reminderRepository.findById(reminder.id);
  return updated?.patientId === patientId ? updated : null;
}

export const ReminderService = {
  async listCandidates(patientId: string): Promise<ReminderCandidate[] | null> {
    const patient = await patientRepository.findById(patientId);
    if (!patient) return null;

    const [events, findings] = await Promise.all([
      clinicalEventRepository.listByPatient(patientId, "asc"),
      findingRepository.listByPatient(patientId, "asc"),
    ]);
    const today = localDateForTimezone(new Date().toISOString(), patient.timezone);

    return buildCalendarItems(events, findings, {
      from: today,
      to: "9999-12-31",
      status: "SCHEDULED",
    }).map((item) => ({
      id: item.id,
      source: item.source,
      sourceId: item.sourceId,
      targetDate: item.date,
      title: item.title,
    }));
  },

  async listByPatient(patientId: string): Promise<Reminder[] | null> {
    const patient = await patientRepository.findById(patientId);
    if (!patient) return null;
    return reminderRepository.listByPatient(patientId, "asc");
  },

  async getByIdForPatient(patientId: string, id: string): Promise<Reminder | null> {
    const reminder = await reminderRepository.findById(id);
    return reminder?.patientId === patientId ? reminder : null;
  },

  async create(input: CreateReminderInput): Promise<Reminder | null> {
    const parsed = createReminderSchema.parse(input);
    const patient = await patientRepository.findById(parsed.patientId);
    if (!patient || patient.status !== "ACTIVE") return null;
    if (!(await sourceIsValid(parsed))) return null;

    const scheduledFor = new Date(parsed.scheduledFor).toISOString();
    if (Date.parse(scheduledFor) <= Date.now()) return null;
    if (!isScheduledOnOrBeforeTarget(scheduledFor, parsed.targetDate, parsed.timezone)) return null;

    const activeForSource = (await reminderRepository.listByPatient(parsed.patientId, "asc")).find(
      (reminder) =>
        reminder.source === parsed.source &&
        reminder.sourceId === parsed.sourceId &&
        reminder.channel === parsed.channel &&
        reminder.status !== "COMPLETED" &&
        reminder.status !== "CANCELLED",
    );
    if (activeForSource) return activeForSource;

    const id = buildReminderId({
      source: parsed.source,
      sourceId: parsed.sourceId,
      scheduledFor,
      channel: parsed.channel,
    });
    const existing = await reminderRepository.findById(id);
    if (existing) {
      if (existing.patientId !== parsed.patientId) return null;
      return existing.status === "COMPLETED" || existing.status === "CANCELLED" ? null : existing;
    }

    const now = new Date().toISOString();
    const reminder: Reminder = {
      id,
      patientId: parsed.patientId,
      source: parsed.source,
      sourceId: parsed.sourceId,
      targetDate: parsed.targetDate,
      scheduledFor,
      timezone: parsed.timezone,
      channel: parsed.channel,
      status: "PENDING",
      attempts: 0,
      maxAttempts: parsed.maxAttempts,
      createdAt: now,
      updatedAt: now,
    };

    await reminderRepository.save(reminder);
    return reminder;
  },

  async reschedule(
    patientId: string,
    id: string,
    input: RescheduleReminderInput,
  ): Promise<Reminder | null> {
    const reminder = await this.getByIdForPatient(patientId, id);
    if (!reminder || !["PENDING", "FAILED"].includes(reminder.status)) return null;

    const parsed = rescheduleReminderSchema.parse(input);
    const timezone = parsed.timezone ?? reminder.timezone;
    const scheduledFor = new Date(parsed.scheduledFor).toISOString();
    if (Date.parse(scheduledFor) <= Date.now()) return null;
    if (!isScheduledOnOrBeforeTarget(scheduledFor, reminder.targetDate, timezone)) return null;

    return updateAndRead(patientId, reminder, {
      scheduledFor,
      timezone,
      status: "PENDING",
      lastError: undefined,
    });
  },

  async cancel(patientId: string, id: string): Promise<Reminder | null> {
    const reminder = await this.getByIdForPatient(patientId, id);
    if (!reminder || !canTransitionReminder(reminder.status, "CANCELLED")) return null;

    return updateAndRead(patientId, reminder, {
      status: "CANCELLED",
      cancelledAt: new Date().toISOString(),
    });
  },

  async complete(patientId: string, id: string): Promise<Reminder | null> {
    const reminder = await this.getByIdForPatient(patientId, id);
    if (!reminder || !canTransitionReminder(reminder.status, "COMPLETED")) return null;

    return updateAndRead(patientId, reminder, {
      status: "COMPLETED",
      completedAt: new Date().toISOString(),
    });
  },
};
