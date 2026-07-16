import Link from "next/link";
import type { PatientCalendarItem } from "@/features/calendar";

const statusLabels: Record<PatientCalendarItem["status"], string> = {
  SCHEDULED: "Programado",
  COMPLETED: "Completado",
  CANCELLED: "Cancelado",
};

export function CalendarAgenda({ items }: { items: PatientCalendarItem[] }) {
  if (items.length === 0) {
    return (
      <div className="border-border bg-surface-secondary rounded-2xl border border-dashed px-6 py-10 text-center">
        <p className="text-foreground text-sm font-semibold">No hay actividades en este periodo</p>
        <p className="text-muted mt-2 text-sm">Prueba otro mes o cambia el filtro de estado.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 lg:hidden">
      {items.map((item) => (
        <article
          key={item.id}
          className="border-border bg-surface rounded-2xl border p-4 shadow-sm"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <time
                dateTime={item.date}
                className="text-sm font-semibold text-rose-600 dark:text-rose-400"
              >
                {formatDateOnly(item.date)}
              </time>
              <h3 className="text-foreground mt-1 font-semibold break-words">{item.title}</h3>
              <p className="text-muted mt-1 text-sm">{item.patientName}</p>
            </div>
            <span className="border-border bg-surface-secondary text-foreground shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold">
              {statusLabels[item.status]}
            </span>
          </div>
          <p className="text-muted mt-3 line-clamp-3 text-sm leading-6">{item.description}</p>
          {!item.patientActive ? (
            <p className="mt-3 text-xs font-medium text-amber-700 dark:text-amber-300">
              Paciente inactiva
            </p>
          ) : null}
          <Link
            href={`/dashboard/patients/${item.patientId}#clinical-timeline`}
            className="mt-4 inline-flex text-sm font-medium text-rose-600 hover:text-rose-700 dark:text-rose-400"
          >
            Abrir expediente
          </Link>
        </article>
      ))}
    </div>
  );
}

function formatDateOnly(value: string): string {
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("es-BO", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}
