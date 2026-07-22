import { calculateReportSummary, type ReportFilters, type ReportSummary } from "@/features/reports";
import { ClinicalEventRepository } from "@/repositories/clinical-event.repository";
import { FindingRepository } from "@/repositories/finding.repository";
import { PatientRepository } from "@/repositories/patient.repository";
import { ReminderRepository } from "@/repositories/reminder.repository";

export class ReportService {
  static async summary(filters: ReportFilters): Promise<ReportSummary> {
    const patientRepository = new PatientRepository();
    const patients = await patientRepository.listAll();
    const scoped = filters.patientId
      ? patients.filter((p) => p.id === filters.patientId)
      : patients;
    const findingRepository = new FindingRepository();
    const eventRepository = new ClinicalEventRepository();
    const reminderRepository = new ReminderRepository();
    const rows = await Promise.all(
      scoped.map(async (patient) => ({
        findings: await findingRepository.listByPatient(patient.id),
        events: await eventRepository.listByPatient(patient.id),
        reminders: await reminderRepository.listByPatient(patient.id),
      })),
    );
    return calculateReportSummary(
      filters,
      patients,
      rows.flatMap((x) => x.findings),
      rows.flatMap((x) => x.events),
      rows.flatMap((x) => x.reminders),
    );
  }
}
