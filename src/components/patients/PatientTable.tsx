import Link from "next/link";
import type { ReactNode } from "react";
import { PatientPagination } from "@/components/patients/PatientPagination";
import type { PaginatedPatients, PatientListQuery } from "@/features/patients/patient-list.types";
import type { Patient } from "@/types";

interface PatientTableProps {
  result: PaginatedPatients;
  query: PatientListQuery;
}

export function PatientTable({ result, query }: PatientTableProps) {
  return (
    <section className="border-border bg-surface overflow-hidden rounded-2xl border shadow-sm">
      <div className="border-border flex flex-col gap-1 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-foreground font-semibold">Pacientes registradas</h3>
          <p className="text-muted mt-1 text-sm">
            {result.total} {result.total === 1 ? "resultado" : "resultados"}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="border-border bg-surface-secondary border-b">
              <TableHeader>Nombre</TableHeader>
              <TableHeader>Zona horaria</TableHeader>
              <TableHeader>Estado</TableHeader>
              <TableHeader>Registrada</TableHeader>
              <th className="text-muted px-5 py-3.5 text-right text-xs font-semibold tracking-wide uppercase">
                Acciones
              </th>
            </tr>
          </thead>

          <tbody>
            {result.items.map((patient) => (
              <tr
                key={patient.id}
                className="border-border hover:bg-surface-secondary border-b transition-colors last:border-0"
              >
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-rose-50 text-sm font-semibold text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
                      {getInitials(patient.fullName)}
                    </div>
                    <span className="text-foreground font-medium">{patient.fullName}</span>
                  </div>
                </td>
                <td className="text-muted px-5 py-4">{patient.timezone}</td>
                <td className="px-5 py-4">
                  <PatientStatusBadge status={patient.status} />
                </td>
                <td className="text-muted px-5 py-4">{formatDate(patient.createdAt)}</td>
                <td className="px-5 py-4 text-right">
                  <Link
                    href={`/dashboard/patients/${patient.id}`}
                    className="inline-flex min-h-9 items-center justify-center rounded-lg px-3 text-sm font-medium text-rose-600 transition hover:bg-rose-50 hover:text-rose-700 focus-visible:ring-2 focus-visible:ring-rose-500/30 focus-visible:outline-none dark:text-rose-400 dark:hover:bg-rose-500/10 dark:hover:text-rose-300"
                  >
                    Ver detalle
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <PatientPagination pagination={result} query={query} />
    </section>
  );
}

function TableHeader({ children }: { children: ReactNode }) {
  return (
    <th className="text-muted px-5 py-3.5 text-left text-xs font-semibold tracking-wide uppercase">
      {children}
    </th>
  );
}

function PatientStatusBadge({ status }: { status: Patient["status"] }) {
  const isActive = status === "ACTIVE";

  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        isActive
          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
          : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
      ].join(" ")}
    >
      <span
        aria-hidden="true"
        className={["size-1.5 rounded-full", isActive ? "bg-emerald-500" : "bg-slate-400"].join(
          " ",
        )}
      />
      {isActive ? "Activa" : "Inactiva"}
    </span>
  );
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("es-BO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "America/La_Paz",
  }).format(new Date(value));
}

function getInitials(fullName: string): string {
  return fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}
