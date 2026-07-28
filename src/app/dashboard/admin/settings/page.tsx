import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminSettingsForm } from "@/components/admin/AdminSettingsForm";
import { authorize } from "@/features/auth";
import { adminSettingsService } from "@/services/admin-settings.service";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Configuración",
};

export default async function AdminSettingsPage() {
  const authorization = await authorize("settings:manage");

  if (!authorization.authorized) {
    if (authorization.reason === "UNAUTHORIZED") {
      redirect("/login");
    }

    return (
      <section
        aria-labelledby="settings-access-denied-title"
        className="rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-900/50 dark:bg-red-950/30"
      >
        <p className="text-sm font-medium text-red-700 dark:text-red-300">Acceso restringido</p>

        <h1
          id="settings-access-denied-title"
          className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white"
        >
          No tienes permisos para modificar la configuración
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

  const settings = await adminSettingsService.getSettings();

  return (
    <section aria-labelledby="admin-settings-title" className="space-y-6">
      <div>
        <Link
          href="/dashboard/admin"
          className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          ← Volver a Administración
        </Link>

        <div className="mt-4">
          <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Administración</p>

          <h1
            id="admin-settings-title"
            className="mt-1 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white"
          >
            Configuración de la aplicación
          </h1>

          <p className="mt-2 max-w-3xl text-sm text-slate-600 dark:text-slate-300">
            Administra los parámetros generales, las fotografías de perfil y la zona horaria
            predeterminada de la plataforma.
          </p>
        </div>
      </div>

      <AdminSettingsForm initialSettings={settings} />
    </section>
  );
}
