import type { Metadata } from "next";
import Link from "next/link";
import { PatientListFilters } from "@/components/patients/PatientListFilters";
import { PatientTable } from "@/components/patients/PatientTable";
import type { PaginatedPatients } from "@/features/patients/patient-list.types";
import { parsePatientListQuery } from "@/lib/validations/patient-list";
import { PatientService } from "@/services/patient.service";

export const metadata: Metadata = {
  title: "Pacientes | BI-RADS Tracker",
};

export const dynamic = "force-dynamic";

interface PatientsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function PatientsPage({ searchParams }: PatientsPageProps) {
  const query = parsePatientListQuery(await searchParams);
  let result: PaginatedPatients;
  let loadError = false;

  try {
    result = await PatientService.listPaginated(query);
  } catch {
    result = {
      items: [],
      page: 1,
      pageSize: query.pageSize,
      total: 0,
      totalPages: 1,
      hasPreviousPage: false,
      hasNextPage: false,
    };
    loadError = true;
  }

  const hasActiveQuery =
    query.search.length > 0 ||
    query.status !== "ALL" ||
    query.pageSize !== 10 ||
    query.sortBy !== "createdAt" ||
    query.sortDirection !== "desc";

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-medium text-rose-600 dark:text-rose-400">Gestión</p>
          <h2 className="text-foreground mt-1 text-2xl font-bold tracking-tight">Pacientes</h2>
          <p className="text-muted mt-1 text-sm">
            Busca, filtra y administra las pacientes registradas.
          </p>
        </div>

        <Link
          href="/dashboard/patients/new"
          className="focus-visible:ring-offset-background inline-flex min-h-10 items-center justify-center rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-rose-700 focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          <span aria-hidden="true" className="mr-2 text-lg leading-none">
            +
          </span>
          Nueva paciente
        </Link>
      </section>

      <PatientListFilters key={JSON.stringify(query)} query={query} />

      {loadError ? (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
        >
          No fue posible cargar las pacientes. Intenta actualizar la página.
        </div>
      ) : result.total === 0 ? (
        <EmptyState hasActiveQuery={hasActiveQuery} />
      ) : (
        <PatientTable result={result} query={{ ...query, page: result.page }} />
      )}
    </div>
  );
}

function EmptyState({ hasActiveQuery }: { hasActiveQuery: boolean }) {
  return (
    <section className="border-border bg-surface rounded-2xl border border-dashed px-6 py-14 text-center shadow-sm">
      <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-rose-50 text-2xl text-rose-600 dark:bg-rose-500/10 dark:text-rose-300">
        ♡
      </div>
      <h3 className="text-foreground mt-4 text-base font-semibold">
        {hasActiveQuery ? "No se encontraron pacientes" : "No hay pacientes registradas"}
      </h3>
      <p className="text-muted mx-auto mt-2 max-w-md text-sm leading-6">
        {hasActiveQuery
          ? "Prueba con otro nombre o elimina los filtros seleccionados."
          : "Registra la primera paciente para comenzar a organizar su seguimiento."}
      </p>
      {hasActiveQuery ? (
        <Link
          href="/dashboard/patients"
          className="border-border bg-surface text-foreground hover:bg-surface-secondary mt-5 inline-flex min-h-10 items-center justify-center rounded-lg border px-4 py-2 text-sm font-medium transition"
        >
          Limpiar filtros
        </Link>
      ) : (
        <Link
          href="/dashboard/patients/new"
          className="mt-5 inline-flex min-h-10 items-center justify-center rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-rose-700"
        >
          Crear la primera paciente
        </Link>
      )}
    </section>
  );
}
