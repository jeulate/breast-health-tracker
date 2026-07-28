import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminUsersManager } from "@/components/admin/AdminUsersManager";
import { authorize } from "@/features/auth";
import { AdminUserService } from "@/services/admin-user.service";

export default async function AdminUsersPage() {
  const authorization = await authorize("users:manage");

  if (!authorization.authorized) {
    if (authorization.reason === "UNAUTHORIZED") {
      redirect("/login");
    }

    return (
      <section
        aria-labelledby="users-access-denied-title"
        className="rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-900/50 dark:bg-red-950/30"
      >
        <p className="text-sm font-medium text-red-700 dark:text-red-300">Acceso restringido</p>

        <h1
          id="users-access-denied-title"
          className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white"
        >
          No tienes permisos para gestionar usuarios
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

  const users = await AdminUserService.list();

  return (
    <section aria-labelledby="admin-users-title" className="space-y-6">
      <div>
        <Link
          href="/dashboard/admin"
          className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          ← Volver a Administración
        </Link>

        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Administración</p>

            <h1
              id="admin-users-title"
              className="mt-1 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white"
            >
              Gestión de usuarios
            </h1>

            <p className="mt-2 max-w-3xl text-sm text-slate-600 dark:text-slate-300">
              Consulta las cuentas registradas y administra sus permisos y estados.
            </p>
          </div>
        </div>
      </div>

      <AdminUsersManager initialUsers={users} />
    </section>
  );
}
