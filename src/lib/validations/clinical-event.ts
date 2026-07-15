import { z } from "zod";
import { CLINICAL_EVENT_STATUSES, CLINICAL_EVENT_TYPES } from "@/features/clinical-timeline";

function isValidDateOnly(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}

function getTodayInBolivia(): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/La_Paz",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return `${values.year}-${values.month}-${values.day}`;
}

const eventDateSchema = z
  .string()
  .trim()
  .min(1, "La fecha del evento es obligatoria.")
  .refine(isValidDateOnly, "Ingresa una fecha de evento válida.");

const optionalFindingIdSchema = z
  .string()
  .trim()
  .optional()
  .transform((value) => value || undefined)
  .refine((value) => value === undefined || z.uuid().safeParse(value).success, {
    message: "El identificador del hallazgo no es válido.",
  })
  .optional();

const eventFields = {
  type: z.enum(CLINICAL_EVENT_TYPES, { error: "Selecciona un tipo de evento válido." }),
  eventDate: eventDateSchema,
  title: z
    .string()
    .trim()
    .min(3, "El título debe tener al menos 3 caracteres.")
    .max(200, "El título no puede superar los 200 caracteres."),
  description: z
    .string()
    .trim()
    .min(3, "La descripción debe tener al menos 3 caracteres.")
    .max(4000, "La descripción no puede superar los 4000 caracteres."),
  status: z.enum(CLINICAL_EVENT_STATUSES, { error: "Selecciona un estado válido." }),
  findingId: optionalFindingIdSchema,
};

function validateEventRules(
  data: {
    type?: (typeof CLINICAL_EVENT_TYPES)[number];
    eventDate?: string;
    status?: (typeof CLINICAL_EVENT_STATUSES)[number];
  },
  context: z.RefinementCtx,
): void {
  if (data.type === "CONTROL" && data.status === "RECORDED") {
    context.addIssue({
      code: "custom",
      path: ["status"],
      message: "Un control debe estar programado, completado o cancelado.",
    });
  }

  if (data.type && data.type !== "CONTROL" && data.status && data.status !== "RECORDED") {
    context.addIssue({
      code: "custom",
      path: ["status"],
      message: "Los síntomas y notas utilizan el estado registrado.",
    });
  }

  if (
    data.eventDate &&
    isValidDateOnly(data.eventDate) &&
    data.eventDate > getTodayInBolivia() &&
    !(data.type === "CONTROL" && data.status === "SCHEDULED")
  ) {
    context.addIssue({
      code: "custom",
      path: ["eventDate"],
      message: "Solo los controles programados pueden tener una fecha futura.",
    });
  }
}

export const createClinicalEventSchema = z
  .object({
    patientId: z.uuid("El identificador de la paciente no es válido."),
    ...eventFields,
  })
  .strict()
  .superRefine(validateEventRules);

export const updateClinicalEventSchema = z
  .object({
    type: eventFields.type.optional(),
    eventDate: eventFields.eventDate.optional(),
    title: eventFields.title.optional(),
    description: eventFields.description.optional(),
    status: eventFields.status.optional(),
    findingId: eventFields.findingId,
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Envía al menos un campo para actualizar.",
  })
  .superRefine(validateEventRules);

export type CreateClinicalEventInput = z.input<typeof createClinicalEventSchema>;
export type UpdateClinicalEventInput = z.infer<typeof updateClinicalEventSchema>;
