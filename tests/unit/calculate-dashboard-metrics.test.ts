import { describe, expect, it } from "vitest";
import { calculateDashboardMetrics } from "@/features/dashboard/calculate-dashboard-metrics";
import type { Patient } from "@/types";

const NOW = new Date("2026-07-14T12:00:00.000Z");

function createPatient(overrides: Partial<Patient> = {}): Patient {
  return {
    id: "patient-1",
    fullName: "Paciente de prueba",
    timezone: "America/La_Paz",
    status: "ACTIVE",
    createdAt: "2026-07-10T10:00:00.000Z",
    updatedAt: "2026-07-10T10:00:00.000Z",
    ...overrides,
  };
}

describe("calculateDashboardMetrics", () => {
  it("returns zeroed metrics when there are no patients", () => {
    const result = calculateDashboardMetrics([], NOW);

    expect(result.kpis).toEqual({
      totalPatients: 0,
      activePatients: 0,
      inactivePatients: 0,
      newPatientsLast30Days: 0,
    });
    expect(result.monthlyRegistrations).toHaveLength(6);
    expect(result.recentActivity).toEqual([]);
    expect(result.generatedAt).toBe(NOW.toISOString());
  });

  it("calculates patient totals by status", () => {
    const patients = [
      createPatient({ id: "active-1" }),
      createPatient({ id: "active-2" }),
      createPatient({ id: "inactive-1", status: "INACTIVE" }),
    ];

    const result = calculateDashboardMetrics(patients, NOW);

    expect(result.kpis.totalPatients).toBe(3);
    expect(result.kpis.activePatients).toBe(2);
    expect(result.kpis.inactivePatients).toBe(1);
  });

  it("counts registrations from the last 30 days and excludes future dates", () => {
    const patients = [
      createPatient({ id: "recent", createdAt: "2026-06-20T12:00:00.000Z" }),
      createPatient({ id: "old", createdAt: "2026-05-01T12:00:00.000Z" }),
      createPatient({ id: "future", createdAt: "2026-07-20T12:00:00.000Z" }),
      createPatient({ id: "invalid", createdAt: "invalid-date" }),
    ];

    const result = calculateDashboardMetrics(patients, NOW);

    expect(result.kpis.newPatientsLast30Days).toBe(1);
  });

  it("groups registrations into the last six calendar months", () => {
    const patients = [
      createPatient({ id: "february", createdAt: "2026-02-12T10:00:00.000Z" }),
      createPatient({ id: "july-1", createdAt: "2026-07-01T10:00:00.000Z" }),
      createPatient({ id: "july-2", createdAt: "2026-07-10T10:00:00.000Z" }),
      createPatient({ id: "outside-range", createdAt: "2026-01-10T10:00:00.000Z" }),
    ];

    const result = calculateDashboardMetrics(patients, NOW);

    expect(result.monthlyRegistrations.map(({ monthKey, total }) => ({ monthKey, total }))).toEqual(
      [
        { monthKey: "2026-02", total: 1 },
        { monthKey: "2026-03", total: 0 },
        { monthKey: "2026-04", total: 0 },
        { monthKey: "2026-05", total: 0 },
        { monthKey: "2026-06", total: 0 },
        { monthKey: "2026-07", total: 2 },
      ],
    );
  });

  it("returns the five most recent patient activities", () => {
    const patients = Array.from({ length: 7 }, (_, index) =>
      createPatient({
        id: `patient-${index + 1}`,
        fullName: `Paciente ${index + 1}`,
        createdAt: `2026-07-${String(index + 1).padStart(2, "0")}T10:00:00.000Z`,
        updatedAt:
          index === 6
            ? "2026-07-14T11:00:00.000Z"
            : `2026-07-${String(index + 1).padStart(2, "0")}T10:00:00.000Z`,
      }),
    );

    const result = calculateDashboardMetrics(patients, NOW);

    expect(result.recentActivity).toHaveLength(5);
    expect(result.recentActivity[0]).toMatchObject({
      patientId: "patient-7",
      type: "UPDATED",
      occurredAt: "2026-07-14T11:00:00.000Z",
    });
    expect(result.recentActivity.at(-1)?.patientId).toBe("patient-3");
  });
});
