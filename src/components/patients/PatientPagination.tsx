import Link from "next/link";
import { buildPatientListHref } from "@/features/patients/patient-list-url";
import type { PaginatedPatients, PatientListQuery } from "@/features/patients/patient-list.types";

interface PatientPaginationProps {
  pagination: PaginatedPatients;
  query: PatientListQuery;
}

export function PatientPagination({ pagination, query }: PatientPaginationProps) {
  const firstItem = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.pageSize + 1;
  const lastItem = Math.min(pagination.page * pagination.pageSize, pagination.total);

  return (
    <div className="border-border flex flex-col gap-3 border-t px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-muted text-sm">
        Mostrando <span className="text-foreground font-medium">{firstItem}</span>–
        <span className="text-foreground font-medium">{lastItem}</span> de{" "}
        <span className="text-foreground font-medium">{pagination.total}</span>
      </p>

      <nav aria-label="Paginación de pacientes" className="flex items-center gap-2">
        {pagination.hasPreviousPage ? (
          <Link
            href={buildPatientListHref(query, { page: pagination.page - 1 })}
            className="border-border bg-surface text-foreground inline-flex min-h-9 items-center rounded-lg border px-3 text-sm font-medium transition hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-500/10 dark:hover:text-rose-300"
          >
            Anterior
          </Link>
        ) : (
          <span className="border-border text-muted inline-flex min-h-9 cursor-not-allowed items-center rounded-lg border px-3 text-sm opacity-50">
            Anterior
          </span>
        )}

        <span className="text-muted px-2 text-sm">
          Página <span className="text-foreground font-medium">{pagination.page}</span> de{" "}
          <span className="text-foreground font-medium">{pagination.totalPages}</span>
        </span>

        {pagination.hasNextPage ? (
          <Link
            href={buildPatientListHref(query, { page: pagination.page + 1 })}
            className="border-border bg-surface text-foreground inline-flex min-h-9 items-center rounded-lg border px-3 text-sm font-medium transition hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-500/10 dark:hover:text-rose-300"
          >
            Siguiente
          </Link>
        ) : (
          <span className="border-border text-muted inline-flex min-h-9 cursor-not-allowed items-center rounded-lg border px-3 text-sm opacity-50">
            Siguiente
          </span>
        )}
      </nav>
    </div>
  );
}
