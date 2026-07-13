import type { Metadata } from "next";
import { MedicalDisclaimer } from "@/components/dashboard/MedicalDisclaimer";
import { StatCard } from "@/components/dashboard/StatCard";

export const metadata: Metadata = {
  title: "Inicio | BI-RADS Tracker",
};

const SIMULATED_STATS = [
  {
    title: "Pacientes activas",
    value: 0,
    color: "blue" as const,
    description: "Registradas en el sistema",
  },
  {
    title: "Controles pendientes",
    value: 0,
    color: "yellow" as const,
    description: "Requieren seguimiento",
  },
  {
    title: "Alertas pendientes",
    value: 0,
    color: "red" as const,
    description: "Requieren atención",
  },
  {
    title: "Recordatorios programados",
    value: 0,
    color: "green" as const,
    description: "Para las próximas 48 horas",
  },
];

const SIMULATED_ACTIVITY = [
  {
    id: "1",
    type: "Sistema iniciado",
    description: "Primera fase implementada",
    date: new Date().toLocaleDateString("es-BO"),
  },
];

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-1">
        <p className="text-sm font-medium text-rose-600 dark:text-rose-400">Panel general</p>

        <h2 className="text-foreground text-2xl font-bold tracking-tight">Resumen del sistema</h2>

        <p className="text-muted text-sm">
          Consulta el estado general de pacientes, controles, alertas y recordatorios.
        </p>
      </section>

      <MedicalDisclaimer />

      <section aria-labelledby="dashboard-summary-title">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h3 id="dashboard-summary-title" className="text-foreground text-lg font-semibold">
              Resumen
            </h3>

            <p className="text-muted mt-1 text-sm">Indicadores principales de seguimiento.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {SIMULATED_STATS.map((stat) => (
            <StatCard key={stat.title} {...stat} />
          ))}
        </div>
      </section>

      <section aria-labelledby="recent-activity-title">
        <div className="mb-4">
          <h3 id="recent-activity-title" className="text-foreground text-lg font-semibold">
            Actividad reciente
          </h3>

          <p className="text-muted mt-1 text-sm">
            Últimos movimientos registrados en la plataforma.
          </p>
        </div>

        <div className="border-border bg-surface overflow-hidden rounded-2xl border shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-border bg-surface-secondary border-b">
                  <th className="text-muted px-5 py-3.5 text-left text-xs font-semibold tracking-wide uppercase">
                    Tipo
                  </th>

                  <th className="text-muted px-5 py-3.5 text-left text-xs font-semibold tracking-wide uppercase">
                    Descripción
                  </th>

                  <th className="text-muted px-5 py-3.5 text-left text-xs font-semibold tracking-wide uppercase">
                    Fecha
                  </th>
                </tr>
              </thead>

              <tbody>
                {SIMULATED_ACTIVITY.map((item) => (
                  <tr
                    key={item.id}
                    className="border-border hover:bg-surface-secondary border-b transition-colors last:border-0"
                  >
                    <td className="text-foreground px-5 py-4 font-medium">{item.type}</td>

                    <td className="text-muted px-5 py-4">{item.description}</td>

                    <td className="text-muted px-5 py-4">{item.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
