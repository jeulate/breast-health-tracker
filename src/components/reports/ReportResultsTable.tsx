import type { ReportSummary } from "@/features/reports";

interface Row {
  category: string;
  total: number;
  detail: string;
}

export function ReportResultsTable({ summary }: { summary: ReportSummary }) {
  const rows: Row[] = [
    {
      category: "Pacientes",
      total: summary.patients.total,
      detail: `${summary.patients.active} activos, ${summary.patients.inactive} inactivos`,
    },
    {
      category: "Hallazgos",
      total: summary.findings.total,
      detail: `${summary.findings.followUp} en seguimiento, ${summary.findings.closed} cerrados`,
    },
    {
      category: "Seguimientos",
      total: summary.clinicalEvents.total,
      detail: `${summary.clinicalEvents.scheduled} programados, ${summary.clinicalEvents.completed} completados, ${summary.clinicalEvents.cancelled} cancelados`,
    },
    {
      category: "Recordatorios",
      total: summary.reminders.total,
      detail: `${summary.reminders.pending} pendientes, ${summary.reminders.processing} procesando, ${summary.reminders.sent} enviados, ${summary.reminders.completed} completados, ${summary.reminders.cancelled} cancelados, ${summary.reminders.failed} fallidos`,
    },
  ];

  const hasActivity =
    summary.findings.total + summary.clinicalEvents.total + summary.reminders.total > 0;

  return (
    <section className="border-border bg-surface overflow-hidden rounded-2xl border shadow-sm">
      <div className="border-border border-b px-5 py-4">
        <h2 className="text-foreground text-base font-semibold">Resumen del periodo</h2>
        <p className="text-muted mt-1 text-sm">Desglose consolidado de la actividad registrada.</p>
      </div>
      {!hasActivity ? (
        <div className="px-5 py-10 text-center">
          <p className="text-foreground font-medium">No se encontró actividad en el periodo.</p>
          <p className="text-muted mt-1 text-sm">
            Modifica el rango o los filtros para consultar otros registros.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="bg-surface-secondary text-muted">
              <tr>
                <th className="px-5 py-3 font-semibold">Categoría</th>
                <th className="px-5 py-3 text-right font-semibold">Total</th>
                <th className="px-5 py-3 font-semibold">Detalle por estado</th>
              </tr>
            </thead>
            <tbody className="divide-border divide-y">
              {rows.map((row) => (
                <tr key={row.category} className="hover:bg-surface-secondary/60">
                  <th scope="row" className="text-foreground px-5 py-4 font-medium">
                    {row.category}
                  </th>
                  <td className="text-foreground px-5 py-4 text-right font-semibold tabular-nums">
                    {row.total}
                  </td>
                  <td className="text-muted px-5 py-4">{row.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
