export interface DashboardKpis {
  totalPatients: number;
  activePatients: number;
  inactivePatients: number;
  newPatientsLast30Days: number;
}

export interface MonthlyPatientRegistration {
  monthKey: string;
  label: string;
  total: number;
}

export type PatientActivityType = "REGISTERED" | "UPDATED";

export interface RecentPatientActivity {
  id: string;
  patientId: string;
  patientName: string;
  type: PatientActivityType;
  occurredAt: string;
}

export interface DashboardMetrics {
  kpis: DashboardKpis;
  monthlyRegistrations: MonthlyPatientRegistration[];
  recentActivity: RecentPatientActivity[];
  generatedAt: string;
}
