import { buildCalendarItems, type PatientCalendarItem } from "@/features/calendar";
import { calendarRangeSchema, type CalendarRangeInput } from "@/lib/validations/calendar";
import { ClinicalEventRepository } from "@/repositories/clinical-event.repository";
import { FindingRepository } from "@/repositories/finding.repository";
import { PatientRepository } from "@/repositories/patient.repository";

const clinicalEventRepository = new ClinicalEventRepository();
const findingRepository = new FindingRepository();
const patientRepository = new PatientRepository();

function compareItems(left: PatientCalendarItem, right: PatientCalendarItem): number {
  const dateComparison = left.date.localeCompare(right.date);
  if (dateComparison !== 0) return dateComparison;

  const patientComparison = left.patientName.localeCompare(right.patientName, "es-BO", {
    sensitivity: "base",
  });
  if (patientComparison !== 0) return patientComparison;

  return left.id.localeCompare(right.id);
}

export const CalendarService = {
  async list(input: CalendarRangeInput): Promise<PatientCalendarItem[]> {
    const range = calendarRangeSchema.parse(input);
    const patients = await patientRepository.listAll();

    const itemsByPatient = await Promise.all(
      patients.map(async (patient) => {
        const [events, findings] = await Promise.all([
          clinicalEventRepository.listByPatient(patient.id, "asc"),
          findingRepository.listByPatient(patient.id, "asc"),
        ]);

        return buildCalendarItems(events, findings, range).map((item) => ({
          ...item,
          patientName: patient.fullName,
          patientActive: patient.status === "ACTIVE",
        }));
      }),
    );

    return itemsByPatient.flat().sort(compareItems);
  },
};
