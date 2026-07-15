import { z } from "zod";
import {
  BIRADS_CATEGORIES,
  BREAST_LATERALITIES,
  BREAST_STUDY_TYPES,
  FINDING_STATUSES,
} from "@/features/findings";

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

const requiredDateSchema = z
  .string()
  .trim()
  .min(1, "La fecha del estudio es obligatoria.")
  .refine(isValidDateOnly, "Ingresa una fecha de estudio válida.")
  .refine((value) => !isValidDateOnly(value) || value <= getTodayInBolivia(), {
    message: "La fecha del estudio no puede estar en el futuro.",
  });

const optionalDateSchema = z
  .string()
  .trim()
  .optional()
  .transform((value) => value || undefined)
  .refine((value) => value === undefined || isValidDateOnly(value), {
    message: "Ingresa una fecha de próximo control válida.",
  })
  .optional();

const optionalText = (maximum: number, message: string) =>
  z
    .string()
    .trim()
    .max(maximum, message)
    .optional()
    .transform((value) => value || undefined)
    .optional();

const findingFields = {
  category: z.enum(BIRADS_CATEGORIES, { error: "Selecciona una categoría BI-RADS válida." }),
  laterality: z.enum(BREAST_LATERALITIES, { error: "Selecciona una lateralidad válida." }),
  studyType: z.enum(BREAST_STUDY_TYPES, { error: "Selecciona un tipo de estudio válido." }),
  studyDate: requiredDateSchema,
  description: z
    .string()
    .trim()
    .min(3, "La descripción debe tener al menos 3 caracteres.")
    .max(2000, "La descripción no puede superar los 2000 caracteres."),
  observations: optionalText(4000, "Las observaciones no pueden superar los 4000 caracteres."),
  biopsyPerformed: z.boolean().default(false),
  biopsyResult: optionalText(2000, "El resultado de biopsia no puede superar los 2000 caracteres."),
  nextControlDate: optionalDateSchema,
  status: z.enum(FINDING_STATUSES).default("RECORDED"),
};

function validateFindingDatesAndBiopsy(
  data: {
    studyDate?: string;
    nextControlDate?: string;
    biopsyPerformed?: boolean;
    biopsyResult?: string;
  },
  context: z.RefinementCtx,
): void {
  if (data.studyDate && data.nextControlDate && data.nextControlDate < data.studyDate) {
    context.addIssue({
      code: "custom",
      path: ["nextControlDate"],
      message: "El próximo control no puede ser anterior a la fecha del estudio.",
    });
  }

  if (data.biopsyPerformed === false && data.biopsyResult) {
    context.addIssue({
      code: "custom",
      path: ["biopsyResult"],
      message: "No registres un resultado si la biopsia no fue realizada.",
    });
  }
}

export const createFindingSchema = z
  .object({
    patientId: z.uuid("El identificador de la paciente no es válido."),
    ...findingFields,
  })
  .strict()
  .superRefine(validateFindingDatesAndBiopsy);

export const updateFindingSchema = z
  .object({
    category: findingFields.category.optional(),
    laterality: findingFields.laterality.optional(),
    studyType: findingFields.studyType.optional(),
    studyDate: findingFields.studyDate.optional(),
    description: findingFields.description.optional(),
    observations: findingFields.observations,
    biopsyPerformed: z.boolean().optional(),
    biopsyResult: findingFields.biopsyResult,
    nextControlDate: findingFields.nextControlDate,
    status: z.enum(FINDING_STATUSES).optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Envía al menos un campo para actualizar.",
  })
  .superRefine(validateFindingDatesAndBiopsy);

export type CreateFindingInput = z.input<typeof createFindingSchema>;
export type UpdateFindingInput = z.infer<typeof updateFindingSchema>;
