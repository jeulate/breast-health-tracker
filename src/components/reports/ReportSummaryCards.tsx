import { StatCard } from "@/components/dashboard/StatCard";
import type { ReportSummary } from "@/features/reports";

export function ReportSummaryCards({ summary }: { summary: ReportSummary }) {
  return (
    <section
      aria-label="Indicadores del reporte"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
    >
      <StatCard
        title="Pacientes"
        value={summary.patients.total}
        description={`${summary.patients.active} activos · ${summary.patients.inactive} inactivos`}
        color="blue"
      />
      <StatCard
        title="Hallazgos"
        value={summary.findings.total}
        description={`${summary.findings.followUp} en seguimiento · ${summary.findings.closed} cerrados`}
        color="yellow"
      />
      <StatCard
        title="Seguimientos"
        value={summary.clinicalEvents.total}
        description={`${summary.clinicalEvents.completed} completados · ${summary.clinicalEvents.scheduled} programados`}
        color="green"
      />
      <StatCard
        title="Recordatorios"
        value={summary.reminders.total}
        description={`${summary.reminders.sent} enviados · ${summary.reminders.failed} fallidos`}
        color="red"
      />
    </section>
  );
}
