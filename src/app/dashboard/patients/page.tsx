import type { Metadata } from "next";
import Link from "next/link";
import { PatientService } from "@/services/patient.service";
import type { Patient } from "@/types";

export const metadata: Metadata = {
  title: "Pacientes | BI-RADS Tracker",
};

export const dynamic = "force-dynamic";

export default async function PatientsPage() {
  let patients: Patient[];
  let loadError = false;

  try {
    patients = await PatientService.list();
  } catch {
    patients = [];
    loadError = true;
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-medium text-rose-600 dark:text-rose-400">Gestión</p>

          <h2 className="text-foreground mt-1 text-2xl font-bold tracking-tight">Pacientes</h2>

          <p className="text-muted mt-1 text-sm">
            Administra las pacientes registradas y consulta sus datos principales.
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

      {loadError && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
        >
          No fue posible cargar las pacientes. Intente actualizar la página.
        </div>
      )}

      {!loadError && patients.length === 0 ? (
        <section className="border-border bg-surface rounded-2xl border border-dashed px-6 py-14 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-2xl text-rose-600 dark:bg-rose-500/10 dark:text-rose-300">
            ♡
          </div>

          <h3 className="text-foreground mt-4 text-base font-semibold">
            No hay pacientes registradas
          </h3>

          <p className="text-muted mx-auto mt-2 max-w-md text-sm leading-6">
            Registra la primera paciente para comenzar a organizar su seguimiento.
          </p>

          <Link
            href="/dashboard/patients/new"
            className="focus-visible:ring-offset-background mt-5 inline-flex min-h-10 items-center justify-center rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-rose-700 focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            Crear la primera paciente
          </Link>
        </section>
      ) : !loadError ? (
        <section className="border-border bg-surface overflow-hidden rounded-2xl border shadow-sm">
          <div className="border-border border-b px-5 py-4">
            <h3 className="text-foreground font-semibold">Pacientes registradas</h3>

            <p className="text-muted mt-1 text-sm">Total: {patients.length}</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead>
                <tr className="border-border bg-surface-secondary border-b">
                  <th className="text-muted px-5 py-3.5 text-left text-xs font-semibold tracking-wide uppercase">
                    Nombre
                  </th>

                  <th className="text-muted px-5 py-3.5 text-left text-xs font-semibold tracking-wide uppercase">
                    Zona horaria
                  </th>

                  <th className="text-muted px-5 py-3.5 text-left text-xs font-semibold tracking-wide uppercase">
                    Estado
                  </th>

                  <th className="text-muted px-5 py-3.5 text-left text-xs font-semibold tracking-wide uppercase">
                    Registrada
                  </th>

                  <th className="text-muted px-5 py-3.5 text-right text-xs font-semibold tracking-wide uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>

              <tbody>
                {patients.map((patient) => (
                  <tr
                    key={patient.id}
                    className="border-border hover:bg-surface-secondary border-b transition-colors last:border-0"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-50 text-sm font-semibold text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
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
        </section>
      ) : null}
    </div>
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
        className={["h-1.5 w-1.5 rounded-full", isActive ? "bg-emerald-500" : "bg-slate-400"].join(
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
