import Link from "next/link";
import { redirect } from "next/navigation";
import { authorize } from "@/features/auth";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Administración",
};

export default async function AdminPage() {
  const authorization = await authorize("settings:manage");

  if (!authorization.authorized) {
    if (authorization.reason === "UNAUTHORIZED") {
      redirect("/login");
    }

    return (
      <section
        aria-labelledby="admin-access-denied-title"
        className="rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-900/50 dark:bg-red-950/30"
      >
        <p className="text-sm font-medium text-red-700 dark:text-red-300">Acceso restringido</p>

        <h1
          id="admin-access-denied-title"
          className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white"
        >
          No tienes permisos para acceder
        </h1>

        <p className="mt-3 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
          Esta sección está disponible únicamente para cuentas administradoras.
        </p>

        <Link
          href="/dashboard"
          className="mt-6 inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:outline-none dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
        >
          Volver al dashboard
        </Link>
      </section>
    );
  }

  return (
    <section aria-labelledby="admin-page-title" className="space-y-6">
      <div>
        <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Administración</p>

        <h1
          id="admin-page-title"
          className="mt-1 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white"
        >
          Configuración administrativa
        </h1>

        <p className="mt-2 max-w-3xl text-sm text-slate-600 dark:text-slate-300">
          Gestiona los usuarios, la configuración general y las funciones administrativas de BI-RADS
          Tracker.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Link
          href="/dashboard/admin/users"
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-blue-300 hover:shadow-md focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-700"
        >
          <h2 className="text-lg font-semibold text-slate-950 dark:text-white">
            Gestión de usuarios
          </h2>

          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Administra roles, estados y acceso de las cuentas registradas.
          </p>

          <p className="mt-4 text-xs font-semibold tracking-wide text-blue-600 uppercase dark:text-blue-400">
            Gestionar usuarios →
          </p>
        </Link>

        <Link
          href="/dashboard/admin/settings"
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-blue-300 hover:shadow-md focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-700"
        >
          <h2 className="text-lg font-semibold text-slate-950 dark:text-white">
            Configuración de la aplicación
          </h2>

          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Configura el nombre de la aplicación, la zona horaria y las opciones para fotografías de
            perfil.
          </p>

          <p className="mt-4 text-xs font-semibold tracking-wide text-blue-600 uppercase dark:text-blue-400">
            Administrar configuración →
          </p>
        </Link>
      </div>
    </section>
  );
}
