import Link from "next/link";
import { redirect } from "next/navigation";
import { authorize } from "@/features/auth";

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
        <p className="text-sm font-medium text-red-700 dark:text-red-300">
          Acceso restringido
        </p>

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
          className="mt-6 inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
        >
          Volver al dashboard
        </Link>
      </section>
    );
  }

  return (
    <section aria-labelledby="admin-page-title" className="space-y-6">
      <div>
        <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
          Administración
        </p>

        <h1
          id="admin-page-title"
          className="mt-1 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white"
        >
          Configuración administrativa
        </h1>

        <p className="mt-2 max-w-3xl text-sm text-slate-600 dark:text-slate-300">
          Gestiona los usuarios, la configuración general y las funciones
          administrativas de BI-RADS Tracker.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-semibold text-slate-950 dark:text-white">
            Gestión de usuarios
          </h2>

          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Administra roles, estados y acceso de las cuentas registradas.
          </p>

          <p className="mt-4 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Disponible en la Fase 9.4.2
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-semibold text-slate-950 dark:text-white">
            Configuración general
          </h2>

          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Configura el nombre de la aplicación, zona horaria y opciones para
            fotografías.
          </p>

          <p className="mt-4 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Disponible en la Fase 9.4.3
          </p>
        </article>
      </div>
    </section>
  );
}