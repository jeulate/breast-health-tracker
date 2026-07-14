import type { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  color?: "blue" | "green" | "yellow" | "red";
  icon?: ReactNode;
}

const colorMap = {
  blue: {
    card: "border-blue-200 bg-blue-50/80 dark:border-blue-500/20 dark:bg-blue-500/10",
    title: "text-blue-700 dark:text-blue-300",
    value: "text-blue-800 dark:text-blue-200",
    description: "text-blue-600 dark:text-blue-300/80",
    indicator: "bg-blue-500",
    icon: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
  },
  green: {
    card: "border-emerald-200 bg-emerald-50/80 dark:border-emerald-500/20 dark:bg-emerald-500/10",
    title: "text-emerald-700 dark:text-emerald-300",
    value: "text-emerald-800 dark:text-emerald-200",
    description: "text-emerald-600 dark:text-emerald-300/80",
    indicator: "bg-emerald-500",
    icon: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
  },
  yellow: {
    card: "border-amber-200 bg-amber-50/80 dark:border-amber-500/20 dark:bg-amber-500/10",
    title: "text-amber-700 dark:text-amber-300",
    value: "text-amber-800 dark:text-amber-200",
    description: "text-amber-600 dark:text-amber-300/80",
    indicator: "bg-amber-500",
    icon: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
  },
  red: {
    card: "border-rose-200 bg-rose-50/80 dark:border-rose-500/20 dark:bg-rose-500/10",
    title: "text-rose-700 dark:text-rose-300",
    value: "text-rose-800 dark:text-rose-200",
    description: "text-rose-600 dark:text-rose-300/80",
    indicator: "bg-rose-500",
    icon: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300",
  },
} satisfies Record<
  NonNullable<StatCardProps["color"]>,
  {
    card: string;
    title: string;
    value: string;
    description: string;
    indicator: string;
    icon: string;
  }
>;

export function StatCard({ title, value, description, color = "blue", icon }: StatCardProps) {
  const styles = colorMap[color];

  return (
    <article
      className={[
        "relative overflow-hidden rounded-2xl border p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md",
        styles.card,
      ].join(" ")}
    >
      <span
        aria-hidden="true"
        className={["absolute top-0 left-0 h-full w-1", styles.indicator].join(" ")}
      />

      <div className="flex items-start justify-between gap-4 pl-1">
        <div className="min-w-0">
          <p className={["text-sm font-medium", styles.title].join(" ")}>{title}</p>
          <p className={["mt-2 text-3xl font-bold tracking-tight", styles.value].join(" ")}>
            {value}
          </p>
          {description && (
            <p className={["mt-1 text-xs leading-5", styles.description].join(" ")}>
              {description}
            </p>
          )}
        </div>

        {icon && (
          <span
            aria-hidden="true"
            className={[
              "flex size-11 shrink-0 items-center justify-center rounded-xl",
              styles.icon,
            ].join(" ")}
          >
            {icon}
          </span>
        )}
      </div>
    </article>
  );
}
