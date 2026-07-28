import type { PublicUser, UserRole, UserStatus } from "@/types";

interface AdminUsersTableProps {
  users: PublicUser[];
  onEdit: (user: PublicUser) => void;
}

const roleLabels: Record<UserRole, string> = {
  ADMIN: "Administrador",
  PROFESSIONAL: "Profesional",
};

const statusLabels: Record<UserStatus, string> = {
  ACTIVE: "Activo",
  INACTIVE: "Inactivo",
};

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("es-BO", {
    dateStyle: "medium",
    timeZone: "America/La_Paz",
  }).format(new Date(value));
}

export function AdminUsersTable({ users, onEdit }: Readonly<AdminUsersTableProps>) {
  if (users.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-lg font-semibold text-slate-950 dark:text-white">
          No hay usuarios registrados
        </h2>

        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Cuando se registren cuentas, aparecerán en esta sección.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
          <caption className="sr-only">Usuarios registrados en la aplicación</caption>

          <thead className="bg-slate-50 dark:bg-slate-950/50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400"
              >
                Usuario
              </th>

              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400"
              >
                Rol
              </th>

              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400"
              >
                Estado
              </th>

              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400"
              >
                Registro
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-right text-xs font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400"
              >
                Acciones
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {users.map((user) => (
              <tr key={user.id} className="transition hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td className="px-6 py-4">
                  <p className="font-medium text-slate-950 dark:text-white">{user.name}</p>

                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
                </td>

                <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300">
                  {roleLabels[user.role]}
                </td>

                <td className="px-6 py-4">
                  <span
                    className={
                      user.status === "ACTIVE"
                        ? "inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                        : "inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                    }
                  >
                    {statusLabels[user.status]}
                  </span>
                </td>

                <td className="px-6 py-4 text-sm whitespace-nowrap text-slate-600 dark:text-slate-300">
                  {formatDate(user.createdAt)}
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    type="button"
                    onClick={() => onEdit(user)}
                    className="text-sm font-medium text-blue-600 transition hover:text-blue-700 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none dark:text-blue-400 dark:hover:text-blue-300"
                    aria-label={`Editar usuario ${user.name}`}
                  >
                    Editar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
