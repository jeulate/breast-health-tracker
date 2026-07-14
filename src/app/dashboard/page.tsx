import type { Metadata } from "next";
import Link from "next/link";
import { MedicalDisclaimer } from "@/components/dashboard/MedicalDisclaimer";
import { PatientsTrendChart } from "@/components/dashboard/PatientsTrendChart";
import { RecentPatientActivityTable } from "@/components/dashboard/RecentPatientActivityTable";
import { StatCard } from "@/components/dashboard/StatCard";
import { DashboardService } from "@/services/dashboard.service";

export const metadata: Metadata = {
  title: "Inicio | BI-RADS Tracker",
};

export const dynamic = "force-dynamic";

const cardIcons = {
  total: (
    <svg viewBox="0 0 24 24" fill="none" className="size-6" stroke="currentColor" strokeWidth="1.8">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
      />
    </svg>
  ),
  active: (
    <svg viewBox="0 0 24 24" fill="none" className="size-6" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="m5 12 4 4L19 6" />
    </svg>
  ),
  inactive: (
    <svg viewBox="0 0 24 24" fill="none" className="size-6" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" d="M8 12h8" />
    </svg>
  ),
  recent: (
    <svg viewBox="0 0 24 24" fill="none" className="size-6" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 2" />
    </svg>
  ),
};

export default async function DashboardPage() {
  const metrics = await DashboardService.getMetrics();
  const { kpis } = metrics;

  const stats = [
    {
      title: "Total de pacientes",
      value: kpis.totalPatients,
      color: "blue" as const,
      description: "Registrados en el sistema",
      icon: cardIcons.total,
    },
    {
      title: "Pacientes activos",
      value: kpis.activePatients,
      color: "green" as const,
      description: "Con seguimiento activo",
      icon: cardIcons.active,
    },
    {
      title: "Pacientes inactivos",
      value: kpis.inactivePatients,
      color: "yellow" as const,
      description: "Sin seguimiento activo",
      icon: cardIcons.inactive,
    },
    {
      title: "Nuevos registros",
      value: kpis.newPatientsLast30Days,
      color: "red" as const,
      description: "Durante los últimos 30 días",
      icon: cardIcons.recent,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-rose-600 dark:text-rose-400">Panel general</p>
          <h2 className="text-foreground mt-1 text-2xl font-bold tracking-tight">
            Resumen del sistema
          </h2>
          <p className="text-muted mt-1 text-sm">
            Indicadores actualizados a partir de la información registrada.
          </p>
        </div>

        <Link
          href="/dashboard/patients/new"
          className="inline-flex items-center justify-center rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700 focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 focus:outline-none"
        >
          Registrar paciente
        </Link>
      </section>

      <MedicalDisclaimer />

      <section aria-labelledby="dashboard-summary-title">
        <div className="mb-4">
          <h3 id="dashboard-summary-title" className="text-foreground text-lg font-semibold">
            Resumen
          </h3>
          <p className="text-muted mt-1 text-sm">Indicadores principales de pacientes.</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <StatCard key={stat.title} {...stat} />
          ))}
        </div>
      </section>

      <section
        className="grid grid-cols-1 gap-6 xl:grid-cols-5"
        aria-label="Analítica de pacientes"
      >
        <article className="border-border bg-surface overflow-hidden rounded-2xl border shadow-sm xl:col-span-3">
          <div className="border-border border-b px-5 py-4">
            <h3 className="text-foreground text-lg font-semibold">Tendencia de registros</h3>
            <p className="text-muted mt-1 text-sm">
              Pacientes registrados durante los últimos seis meses.
            </p>
          </div>
          <div className="p-4 sm:p-5">
            <PatientsTrendChart data={metrics.monthlyRegistrations} />
          </div>
        </article>

        <article className="border-border bg-surface rounded-2xl border p-5 shadow-sm xl:col-span-2">
          <h3 className="text-foreground text-lg font-semibold">Estado de pacientes</h3>
          <p className="text-muted mt-1 text-sm">Distribución actual por estado.</p>

          <div className="mt-6 space-y-5">
            <ProgressRow
              label="Activos"
              value={kpis.activePatients}
              total={kpis.totalPatients}
              color="bg-emerald-500"
            />
            <ProgressRow
              label="Inactivos"
              value={kpis.inactivePatients}
              total={kpis.totalPatients}
              color="bg-amber-500"
            />
          </div>

          <div className="border-border bg-surface-secondary mt-6 rounded-xl border p-4">
            <p className="text-muted text-xs font-semibold tracking-wide uppercase">
              Última actualización
            </p>
            <p className="text-foreground mt-1 text-sm font-medium">
              {new Intl.DateTimeFormat("es-BO", {
                dateStyle: "medium",
                timeStyle: "short",
                timeZone: "America/La_Paz",
              }).format(new Date(metrics.generatedAt))}
            </p>
          </div>
        </article>
      </section>

      <section aria-labelledby="recent-activity-title">
        <div className="mb-4">
          <h3 id="recent-activity-title" className="text-foreground text-lg font-semibold">
            Actividad reciente
          </h3>
          <p className="text-muted mt-1 text-sm">Últimos movimientos de pacientes registrados.</p>
        </div>

        <div className="border-border bg-surface overflow-hidden rounded-2xl border shadow-sm">
          <RecentPatientActivityTable activities={metrics.recentActivity} />
        </div>
      </section>
    </div>
  );
}

interface ProgressRowProps {
  label: string;
  value: number;
  total: number;
  color: string;
}

function ProgressRow({ label, value, total, color }: ProgressRowProps) {
  const percentage = total === 0 ? 0 : Math.round((value / total) * 100);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-4 text-sm">
        <span className="text-foreground font-medium">{label}</span>
        <span className="text-muted font-semibold">{percentage}%</span>
      </div>
      <div className="bg-surface-secondary h-2.5 overflow-hidden rounded-full">
        <div
          className={["h-full rounded-full transition-all", color].join(" ")}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-muted mt-1.5 text-xs">{value} pacientes</p>
    </div>
  );
}
