import Link from "next/link";
import type { RecentPatientActivity } from "@/features/dashboard/dashboard.types";

interface RecentPatientActivityTableProps {
  activities: RecentPatientActivity[];
}

const activityLabels = {
  REGISTERED: "Paciente registrado",
  UPDATED: "Información actualizada",
} satisfies Record<RecentPatientActivity["type"], string>;

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("es-BO", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/La_Paz",
  }).format(new Date(value));
}

export function RecentPatientActivityTable({ activities }: RecentPatientActivityTableProps) {
  if (activities.length === 0) {
    return (
      <div className="flex min-h-56 items-center justify-center px-6 text-center">
        <div>
          <p className="text-foreground text-sm font-semibold">No hay actividad reciente</p>
          <p className="text-muted mt-1 text-sm">
            Los movimientos aparecerán después de registrar o actualizar pacientes.
          </p>
          <Link
            href="/dashboard/patients/new"
            className="mt-4 inline-flex rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 focus:outline-none"
          >
            Registrar paciente
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-full overflow-x-auto overscroll-x-contain">
      <table className="w-full min-w-[680px] text-sm">
        <thead>
          <tr className="border-border bg-surface-secondary border-b">
            <th className="text-muted px-5 py-3.5 text-left text-xs font-semibold tracking-wide uppercase">
              Actividad
            </th>
            <th className="text-muted px-5 py-3.5 text-left text-xs font-semibold tracking-wide uppercase">
              Paciente
            </th>
            <th className="text-muted px-5 py-3.5 text-left text-xs font-semibold tracking-wide uppercase">
              Fecha
            </th>
            <th className="px-5 py-3.5 text-right">
              <span className="sr-only">Acciones</span>
            </th>
          </tr>
        </thead>

        <tbody>
          {activities.map((activity) => (
            <tr
              key={activity.id}
              className="border-border hover:bg-surface-secondary border-b transition-colors last:border-0"
            >
              <td className="text-foreground px-5 py-4 font-medium">
                {activityLabels[activity.type]}
              </td>
              <td className="text-muted px-5 py-4">{activity.patientName}</td>
              <td className="text-muted px-5 py-4">{formatDate(activity.occurredAt)}</td>
              <td className="px-5 py-4 text-right">
                <Link
                  href={`/dashboard/patients/${activity.patientId}`}
                  className="font-semibold text-rose-600 transition hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300"
                >
                  Ver detalle
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
