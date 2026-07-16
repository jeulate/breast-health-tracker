import type { Metadata } from "next";
import Link from "next/link";
import { CalendarAgenda } from "@/components/calendar/CalendarAgenda";
import { CalendarMonthGrid } from "@/components/calendar/CalendarMonthGrid";
import { CALENDAR_ITEM_STATUSES, type CalendarItemStatus } from "@/features/calendar";
import {
  getCalendarMonthRange,
  getCurrentCalendarMonth,
  normalizeCalendarMonth,
  shiftCalendarMonth,
} from "@/features/calendar/calendar-month";
import { CalendarService } from "@/services/calendar.service";

export const metadata: Metadata = { title: "Calendario | BI-RADS Tracker" };
export const dynamic = "force-dynamic";

interface CalendarPageProps {
  searchParams: Promise<{ month?: string | string[]; status?: string | string[] }>;
}

export default async function CalendarPage({ searchParams }: CalendarPageProps) {
  const query = await searchParams;
  const rawMonth = Array.isArray(query.month) ? query.month[0] : query.month;
  const rawStatus = Array.isArray(query.status) ? query.status[0] : query.status;
  const month = normalizeCalendarMonth(rawMonth, getCurrentCalendarMonth());
  const status = normalizeStatus(rawStatus);
  const range = getCalendarMonthRange(month);
  const items = await CalendarService.list({ ...range, status });
  const previousMonth = shiftCalendarMonth(month, -1);
  const nextMonth = shiftCalendarMonth(month, 1);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium text-rose-600 dark:text-rose-400">Fase 6</p>
          <h1 className="text-foreground mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
            Calendario de seguimiento
          </h1>
          <p className="text-muted mt-1 text-sm">
            Controles programados y próximos seguimientos registrados.
          </p>
        </div>
        <span className="border-border bg-surface text-foreground inline-flex w-fit rounded-full border px-3 py-1.5 text-sm font-semibold">
          {items.length} {items.length === 1 ? "actividad" : "actividades"}
        </span>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
        El calendario organiza fechas ya registradas. No establece controles ni modifica
        indicaciones profesionales.
      </div>

      <section
        aria-label="Controles del calendario"
        className="border-border bg-surface rounded-2xl border p-4 shadow-sm sm:p-5"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center justify-between gap-3 sm:justify-start">
            <Link
              href={`/dashboard/calendar?month=${previousMonth}&status=${status}`}
              aria-label="Mes anterior"
              className="border-border bg-surface-secondary text-foreground hover:bg-border/60 inline-flex min-h-10 items-center justify-center rounded-lg border px-3 text-sm font-medium transition"
            >
              ←
            </Link>
            <h2 className="text-foreground min-w-44 text-center text-lg font-semibold capitalize">
              {formatMonth(month)}
            </h2>
            <Link
              href={`/dashboard/calendar?month=${nextMonth}&status=${status}`}
              aria-label="Mes siguiente"
              className="border-border bg-surface-secondary text-foreground hover:bg-border/60 inline-flex min-h-10 items-center justify-center rounded-lg border px-3 text-sm font-medium transition"
            >
              →
            </Link>
          </div>

          <form method="get" className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <input type="hidden" name="month" value={month} />
            <div className="flex flex-col gap-1.5">
              <label htmlFor="calendar-status" className="text-foreground text-sm font-medium">
                Estado
              </label>
              <select
                id="calendar-status"
                name="status"
                defaultValue={status}
                className="border-border bg-surface text-foreground min-h-10 rounded-lg border px-3 py-2 text-sm shadow-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 focus:outline-none"
              >
                <option value="ALL">Todos</option>
                <option value="SCHEDULED">Programados</option>
                <option value="COMPLETED">Completados</option>
                <option value="CANCELLED">Cancelados</option>
              </select>
            </div>
            <button
              type="submit"
              className="min-h-10 rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-rose-700"
            >
              Aplicar filtro
            </button>
          </form>
        </div>
      </section>

      <CalendarMonthGrid month={month} items={items} />
      <CalendarAgenda items={items} />

      <div className="border-border bg-surface-secondary text-muted rounded-xl border px-4 py-3 text-xs">
        <span className="text-foreground font-semibold">Estados:</span> azul programado · verde
        completado · gris cancelado.
      </div>
    </div>
  );
}

function normalizeStatus(value: string | undefined): CalendarItemStatus | "ALL" {
  return value && (value === "ALL" || CALENDAR_ITEM_STATUSES.includes(value as CalendarItemStatus))
    ? (value as CalendarItemStatus | "ALL")
    : "ALL";
}

function formatMonth(month: string): string {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Intl.DateTimeFormat("es-BO", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, monthNumber - 1, 1)));
}
