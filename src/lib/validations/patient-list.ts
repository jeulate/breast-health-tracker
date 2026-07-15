import { z } from "zod";
import type { PatientListQuery } from "@/features/patients/patient-list.types";

const patientPageSizeSchema = z.union([z.literal(10), z.literal(20), z.literal(50)]);

export const patientListQuerySchema = z.object({
  search: z.string().trim().max(100).catch(""),
  status: z.enum(["ALL", "ACTIVE", "INACTIVE"]).catch("ALL"),
  page: z.coerce.number().int().min(1).catch(1),
  pageSize: z.coerce.number().pipe(patientPageSizeSchema).catch(10),
  sortBy: z.enum(["fullName", "createdAt", "updatedAt"]).catch("createdAt"),
  sortDirection: z.enum(["asc", "desc"]).catch("desc"),
});

export function parsePatientListQuery(
  input: Record<string, string | string[] | undefined>,
): PatientListQuery {
  const firstValue = (value: string | string[] | undefined): string | undefined =>
    Array.isArray(value) ? value[0] : value;

  return patientListQuerySchema.parse({
    search: firstValue(input.search),
    status: firstValue(input.status),
    page: firstValue(input.page),
    pageSize: firstValue(input.pageSize),
    sortBy: firstValue(input.sortBy),
    sortDirection: firstValue(input.sortDirection),
  });
}
