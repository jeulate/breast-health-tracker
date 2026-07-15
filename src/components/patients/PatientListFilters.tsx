"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type {
  PatientListQuery,
  PatientPageSize,
  PatientSortField,
  PatientStatusFilter,
  SortDirection,
} from "@/features/patients/patient-list.types";

interface PatientListFiltersProps {
  query: PatientListQuery;
}

export function PatientListFilters({ query }: PatientListFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [search, setSearch] = useState(query.search);

  const updateQuery = useCallback(
    (overrides: Partial<PatientListQuery>) => {
      const nextQuery = { ...query, ...overrides };
      const params = new URLSearchParams();

      if (nextQuery.search) params.set("search", nextQuery.search);
      if (nextQuery.status !== "ALL") params.set("status", nextQuery.status);
      if (nextQuery.page > 1) params.set("page", String(nextQuery.page));
      if (nextQuery.pageSize !== 10) params.set("pageSize", String(nextQuery.pageSize));
      if (nextQuery.sortBy !== "createdAt") params.set("sortBy", nextQuery.sortBy);
      if (nextQuery.sortDirection !== "desc") {
        params.set("sortDirection", nextQuery.sortDirection);
      }

      const searchParams = params.toString();
      router.replace(searchParams ? `${pathname}?${searchParams}` : pathname, { scroll: false });
    },
    [pathname, query, router],
  );

  useEffect(() => {
    if (search === query.search) return;

    const timer = window.setTimeout(() => {
      updateQuery({ search: search.trim(), page: 1 });
    }, 350);

    return () => window.clearTimeout(timer);
  }, [query.search, search, updateQuery]);

  function handleStatusChange(status: PatientStatusFilter): void {
    updateQuery({ search: search.trim(), status, page: 1 });
  }

  function handlePageSizeChange(pageSize: PatientPageSize): void {
    updateQuery({ search: search.trim(), pageSize, page: 1 });
  }

  function handleSortChange(value: string): void {
    const [sortBy, sortDirection] = value.split(":") as [PatientSortField, SortDirection];
    updateQuery({ search: search.trim(), sortBy, sortDirection, page: 1 });
  }

  function clearFilters(): void {
    setSearch("");
    router.replace(pathname, { scroll: false });
  }

  const hasFilters =
    search.length > 0 ||
    query.status !== "ALL" ||
    query.pageSize !== 10 ||
    query.sortBy !== "createdAt" ||
    query.sortDirection !== "desc";

  return (
    <div className="border-border bg-surface rounded-2xl border p-4 shadow-sm sm:p-5">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <label htmlFor="patient-search" className="text-foreground text-sm font-medium">
            Buscar paciente
          </label>
          <div className="relative mt-1.5">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="text-muted pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2"
            >
              <circle cx="11" cy="11" r="7" />
              <path strokeLinecap="round" d="m20 20-4-4" />
            </svg>
            <input
              id="patient-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nombre…"
              autoComplete="off"
              className="border-border bg-surface text-foreground placeholder:text-muted min-h-10 w-full rounded-lg border py-2 pr-3 pl-10 text-sm shadow-sm transition focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 focus:outline-none"
            />
          </div>
        </div>

        <div className="lg:col-span-2">
          <label htmlFor="patient-status" className="text-foreground text-sm font-medium">
            Estado
          </label>
          <select
            id="patient-status"
            value={query.status}
            onChange={(event) => handleStatusChange(event.target.value as PatientStatusFilter)}
            className="border-border bg-surface text-foreground mt-1.5 min-h-10 w-full rounded-lg border px-3 py-2 text-sm shadow-sm transition focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 focus:outline-none"
          >
            <option value="ALL">Todos</option>
            <option value="ACTIVE">Activas</option>
            <option value="INACTIVE">Inactivas</option>
          </select>
        </div>

        <div className="lg:col-span-3">
          <label htmlFor="patient-sort" className="text-foreground text-sm font-medium">
            Ordenar
          </label>
          <select
            id="patient-sort"
            value={`${query.sortBy}:${query.sortDirection}`}
            onChange={(event) => handleSortChange(event.target.value)}
            className="border-border bg-surface text-foreground mt-1.5 min-h-10 w-full rounded-lg border px-3 py-2 text-sm shadow-sm transition focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 focus:outline-none"
          >
            <option value="createdAt:desc">Más recientes</option>
            <option value="createdAt:asc">Más antiguas</option>
            <option value="fullName:asc">Nombre A–Z</option>
            <option value="fullName:desc">Nombre Z–A</option>
            <option value="updatedAt:desc">Actualizadas recientemente</option>
          </select>
        </div>

        <div className="lg:col-span-2">
          <label htmlFor="patient-page-size" className="text-foreground text-sm font-medium">
            Mostrar
          </label>
          <select
            id="patient-page-size"
            value={query.pageSize}
            onChange={(event) =>
              handlePageSizeChange(Number(event.target.value) as PatientPageSize)
            }
            className="border-border bg-surface text-foreground mt-1.5 min-h-10 w-full rounded-lg border px-3 py-2 text-sm shadow-sm transition focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 focus:outline-none"
          >
            <option value={10}>10 por página</option>
            <option value={20}>20 por página</option>
            <option value={50}>50 por página</option>
          </select>
        </div>
      </div>

      {hasFilters && (
        <div className="border-border mt-4 flex justify-end border-t pt-4">
          <button
            type="button"
            onClick={clearFilters}
            className="text-muted hover:text-foreground rounded-lg px-3 py-2 text-sm font-medium transition focus:ring-2 focus:ring-rose-500/30 focus:outline-none"
          >
            Limpiar filtros
          </button>
        </div>
      )}
    </div>
  );
}
