import type { Patient } from "@/types";
import type {
  DashboardMetrics,
  MonthlyPatientRegistration,
  RecentPatientActivity,
} from "./dashboard.types";

const MONTHS_TO_DISPLAY = 6;
const RECENT_ACTIVITY_LIMIT = 5;
const THIRTY_DAYS_IN_MS = 30 * 24 * 60 * 60 * 1000;

function toValidTimestamp(value: string): number | null {
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? null : timestamp;
}

function getMonthKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function getMonthLabel(date: Date): string {
  return new Intl.DateTimeFormat("es-BO", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function buildMonthlyRegistrations(patients: Patient[], now: Date): MonthlyPatientRegistration[] {
  const months = Array.from({ length: MONTHS_TO_DISPLAY }, (_, index) => {
    const monthsAgo = MONTHS_TO_DISPLAY - 1 - index;
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - monthsAgo, 1));

    return {
      monthKey: getMonthKey(date),
      label: getMonthLabel(date),
      total: 0,
    };
  });

  const totalsByMonth = new Map(months.map((month) => [month.monthKey, month]));

  for (const patient of patients) {
    const createdAt = toValidTimestamp(patient.createdAt);
    if (createdAt === null) continue;

    const month = totalsByMonth.get(getMonthKey(new Date(createdAt)));
    if (month) month.total += 1;
  }

  return months;
}

function buildRecentActivity(patients: Patient[]): RecentPatientActivity[] {
  return patients
    .flatMap((patient): RecentPatientActivity[] => {
      const createdAt = toValidTimestamp(patient.createdAt);
      const updatedAt = toValidTimestamp(patient.updatedAt);

      if (createdAt === null && updatedAt === null) return [];

      const wasUpdated = updatedAt !== null && (createdAt === null || updatedAt > createdAt);
      const occurredAt = wasUpdated ? patient.updatedAt : patient.createdAt;

      return [
        {
          id: `${patient.id}:${wasUpdated ? "updated" : "registered"}`,
          patientId: patient.id,
          patientName: patient.fullName,
          type: wasUpdated ? "UPDATED" : "REGISTERED",
          occurredAt,
        },
      ];
    })
    .sort((left, right) => Date.parse(right.occurredAt) - Date.parse(left.occurredAt))
    .slice(0, RECENT_ACTIVITY_LIMIT);
}

export function calculateDashboardMetrics(
  patients: Patient[],
  now: Date = new Date(),
): DashboardMetrics {
  const nowTimestamp = now.getTime();
  const thirtyDaysAgo = nowTimestamp - THIRTY_DAYS_IN_MS;
  const activePatients = patients.filter((patient) => patient.status === "ACTIVE").length;

  const newPatientsLast30Days = patients.filter((patient) => {
    const createdAt = toValidTimestamp(patient.createdAt);
    return createdAt !== null && createdAt >= thirtyDaysAgo && createdAt <= nowTimestamp;
  }).length;

  return {
    kpis: {
      totalPatients: patients.length,
      activePatients,
      inactivePatients: patients.length - activePatients,
      newPatientsLast30Days,
    },
    monthlyRegistrations: buildMonthlyRegistrations(patients, now),
    recentActivity: buildRecentActivity(patients),
    generatedAt: now.toISOString(),
  };
}
