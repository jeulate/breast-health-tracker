import { ReportFilters } from "@/components/reports/ReportFilters";
import { ReportResultsTable } from "@/components/reports/ReportResultsTable";
import { ReportSummaryCards } from "@/components/reports/ReportSummaryCards";
import type { ReportFilters as ReportFiltersValue } from "@/features/reports";
import { reportFiltersSchema } from "@/lib/validations/report";
import { ReportService } from "@/services/report.service";

interface ReportsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const params = await searchParams;
  const defaults = getDefaultPeriod();
  const parsed = reportFiltersSchema.safeParse({
    from: single(params.from) ?? defaults.from,
    to: single(params.to) ?? defaults.to,
    patientId: single(params.patientId),
    patientStatus: single(params.patientStatus),
  });
  const filters: ReportFiltersValue = parsed.success ? parsed.data : defaults;
  const summary = await ReportService.summary(filters);

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6">
      <header>
        <p className="text-sm font-semibold text-rose-600 dark:text-rose-300">Fase 8</p>
        <h1 className="text-foreground mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
          Reportes
        </h1>
        <p className="text-muted mt-2 max-w-3xl text-sm leading-6">
          Consulta indicadores administrativos y el resumen de seguimientos dentro de un periodo.
        </p>
      </header>
      {!parsed.success && (
        <div
          role="alert"
          className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200"
        >
          Los filtros de la URL no eran válidos. Se muestra el periodo mensual predeterminado.
        </div>
      )}
      <ReportFilters filters={filters} />
      <ReportSummaryCards summary={summary} />
      <ReportResultsTable summary={summary} />
    </div>
  );
}

function single(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function getDefaultPeriod(): ReportFiltersValue {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/La_Paz",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    from: `${values.year}-${values.month}-01`,
    to: `${values.year}-${values.month}-${values.day}`,
  };
}
