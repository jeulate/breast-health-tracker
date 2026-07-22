import type { ReportFilters } from "@/features/reports";
import { buildReportExportUrl } from "@/features/reports";

export function ReportExportButtons({ filters }: { filters: ReportFilters }) {
  return (
    <div className="flex flex-wrap items-center gap-3" aria-label="Exportar reporte">
      <a
        href={buildReportExportUrl(filters, "csv")}
        download
        className="border-border bg-surface text-foreground hover:bg-surface-secondary inline-flex min-h-10 items-center justify-center rounded-lg border px-4 py-2 text-sm font-semibold shadow-sm transition focus:ring-2 focus:ring-rose-500/30 focus:outline-none"
      >
        Descargar CSV
      </a>
      <a
        href={buildReportExportUrl(filters, "pdf")}
        download
        className="inline-flex min-h-10 items-center justify-center rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700 focus:ring-2 focus:ring-rose-500/30 focus:outline-none"
      >
        Descargar PDF
      </a>
    </div>
  );
}
