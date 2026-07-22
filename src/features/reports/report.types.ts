import type { PatientStatus } from "@/types";

export interface ReportFilters {
  from: string;
  to: string;
  patientId?: string;
  patientStatus?: PatientStatus;
}

export interface ReportSummary {
  period: { from: string; to: string };
  patients: { total: number; active: number; inactive: number };
  findings: { total: number; followUp: number; closed: number };
  clinicalEvents: { total: number; scheduled: number; completed: number; cancelled: number };
  reminders: {
    total: number;
    pending: number;
    processing: number;
    sent: number;
    completed: number;
    cancelled: number;
    failed: number;
  };
}

export interface ReportPatientSource {
  id: string;
  status: PatientStatus;
}
