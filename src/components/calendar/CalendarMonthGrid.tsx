import Link from "next/link";
import type { PatientCalendarItem } from "@/features/calendar";
import { buildCalendarDays } from "@/features/calendar/calendar-month";

const weekDays = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

const statusClasses: Record<PatientCalendarItem["status"], string> = {
  SCHEDULED:
    "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-200",
  COMPLETED:
    "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200",
  CANCELLED:
    "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-600 dark:bg-slate-700/50 dark:text-slate-300",
};

export function CalendarMonthGrid({
  month,
  items,
}: {
  month: string;
  items: PatientCalendarItem[];
}) {
  const days = buildCalendarDays(month);
  const itemsByDate = new Map<string, PatientCalendarItem[]>();

  for (const item of items) {
    const current = itemsByDate.get(item.date) ?? [];
    current.push(item);
    itemsByDate.set(item.date, current);
  }

  return (
    <div className="border-border bg-surface hidden overflow-hidden rounded-2xl border shadow-sm lg:block">
      <div className="border-border bg-surface-secondary grid grid-cols-7 border-b">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-muted px-3 py-3 text-center text-xs font-semibold uppercase"
          >
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const dayItems = itemsByDate.get(day.date) ?? [];
          return (
            <div
              key={day.date}
              className={[
                "border-border min-h-32 border-r border-b p-2 last:border-r-0",
                day.inCurrentMonth ? "bg-surface" : "bg-surface-secondary/60",
              ].join(" ")}
            >
              <time
                dateTime={day.date}
                className={[
                  "inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold",
                  day.inCurrentMonth ? "text-foreground" : "text-muted opacity-60",
                ].join(" ")}
              >
                {day.dayNumber}
              </time>
              <div className="mt-1 flex flex-col gap-1.5">
                {dayItems.slice(0, 3).map((item) => (
                  <Link
                    key={item.id}
                    href={`/dashboard/patients/${item.patientId}#clinical-timeline`}
                    className={[
                      "block rounded-lg border px-2 py-1.5 text-xs transition hover:brightness-95 dark:hover:brightness-110",
                      statusClasses[item.status],
                    ].join(" ")}
                  >
                    <span className="block truncate font-semibold">{item.title}</span>
                    <span className="mt-0.5 block truncate opacity-80">{item.patientName}</span>
                  </Link>
                ))}
                {dayItems.length > 3 ? (
                  <p className="text-muted px-1 text-xs">+{dayItems.length - 3} más</p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
