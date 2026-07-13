import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helpText?: string;
}

export function Input({
  label,
  error,
  helpText,
  id,
  className = "",
  "aria-describedby": ariaDescribedBy,
  ...props
}: InputProps) {
  const errorId = error && id ? `${id}-error` : undefined;
  const helpTextId = helpText && id ? `${id}-help` : undefined;

  const describedBy = [ariaDescribedBy, errorId, helpTextId].filter(Boolean).join(" ");

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-foreground text-sm font-medium">
          {label}
        </label>
      )}

      <input
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy || undefined}
        {...props}
        className={[
          "min-h-10 w-full rounded-lg border px-3 py-2 text-sm shadow-sm transition",
          "bg-surface text-foreground placeholder:text-muted",
          "focus:ring-2 focus:outline-none",
          "disabled:bg-surface-secondary disabled:cursor-not-allowed disabled:opacity-60",
          error
            ? "border-red-400 bg-red-50/50 focus:border-red-500 focus:ring-red-500/20 dark:border-red-500/50 dark:bg-red-500/10"
            : "border-border focus:border-rose-500 focus:ring-rose-500/20",
          className,
        ].join(" ")}
      />

      {helpText && !error && (
        <p id={helpTextId} className="text-muted text-xs">
          {helpText}
        </p>
      )}

      {error && (
        <p id={errorId} role="alert" className="text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
