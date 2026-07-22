"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ReportFilters as ReportFiltersValue } from "@/features/reports";
import { buildReportHref } from "@/features/reports/report-filter-url";
import type { ReportFilters } from "@/features/reports";

interface ReportFiltersProps {
  filters: ReportFiltersValue;
}

export function ReportFilters({ filters }: ReportFiltersProps) {
  const router = useRouter();
  const [from, setFrom] = useState(filters.from);
  const [to, setTo] = useState(filters.to);
  const [patientId, setPatientId] = useState(filters.patientId ?? "");
  const [patientStatus, setPatientStatus] = useState(filters.patientStatus ?? "");
  const [error, setError] = useState<string | null>(null);

  function applyFilters(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    setError(null);

    if (!from || !to) {
      setError("Selecciona una fecha inicial y una fecha final.");
      return;
    }

    if (from > to) {
      setError("La fecha inicial no puede ser posterior a la fecha final.");
      return;
    }

    router.replace(
      buildReportHref({
        from,
        to,
        patientId: patientId.trim() || undefined,
        patientStatus:
          patientStatus === "" ? undefined : (patientStatus as ReportFilters["patientStatus"]),
      }),
      { scroll: false },
    );
  }

  return (
    <form
      onSubmit={applyFilters}
      className="border-border bg-surface rounded-2xl border p-4 shadow-sm sm:p-5"
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <FilterField label="Desde" htmlFor="report-from">
          <input
            id="report-from"
            type="date"
            required
            value={from}
            onChange={(event) => setFrom(event.target.value)}
            className={controlClassName}
          />
        </FilterField>

        <FilterField label="Hasta" htmlFor="report-to">
          <input
            id="report-to"
            type="date"
            required
            value={to}
            onChange={(event) => setTo(event.target.value)}
            className={controlClassName}
          />
        </FilterField>

        <FilterField label="Estado de paciente" htmlFor="report-patient-status">
          <select
            id="report-patient-status"
            value={patientStatus}
            onChange={(event) => setPatientStatus(event.target.value as "" | "ACTIVE" | "INACTIVE")}
            className={controlClassName}
          >
            <option value="">Todos</option>
            <option value="ACTIVE">Activos</option>
            <option value="INACTIVE">Inactivos</option>
          </select>
        </FilterField>

        <FilterField label="Paciente (ID)" htmlFor="report-patient-id">
          <input
            id="report-patient-id"
            value={patientId}
            onChange={(event) => setPatientId(event.target.value)}
            placeholder="Todos los pacientes"
            autoComplete="off"
            className={controlClassName}
          />
        </FilterField>

        <div className="flex items-end">
          <button
            type="submit"
            className="min-h-10 w-full rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700 focus:ring-2 focus:ring-rose-500/30 focus:outline-none"
          >
            Aplicar filtros
          </button>
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-4 text-sm font-medium text-rose-600 dark:text-rose-300">
          {error}
        </p>
      )}
    </form>
  );
}

const controlClassName =
  "border-border bg-surface text-foreground mt-1.5 min-h-10 w-full rounded-lg border px-3 py-2 text-sm shadow-sm transition focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 focus:outline-none";

function FilterField({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="text-foreground text-sm font-medium">
        {label}
      </label>
      {children}
    </div>
  );
}
