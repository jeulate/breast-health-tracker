import { calculateDashboardMetrics } from "@/features/dashboard/calculate-dashboard-metrics";
import type { DashboardMetrics } from "@/features/dashboard/dashboard.types";
import { PatientService } from "@/services/patient.service";

export const DashboardService = {
  async getMetrics(): Promise<DashboardMetrics> {
    const patients = await PatientService.list();
    return calculateDashboardMetrics(patients);
  },
};
