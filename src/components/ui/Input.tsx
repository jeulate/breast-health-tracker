import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, id, className = "", ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <input
        id={id}
        {...props}
        className={`rounded-md border px-3 py-2 text-sm shadow-sm transition-colors focus:border-rose-400 focus:ring-2 focus:ring-rose-300 focus:outline-none ${
          error ? "border-red-400 bg-red-50" : "border-gray-300 bg-white"
        } ${className}`}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
