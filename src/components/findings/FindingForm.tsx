"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type {
  BiradsCategory,
  BreastLaterality,
  BreastStudyType,
  Finding,
  FindingStatus,
} from "@/features/findings";
import type { ApiResponse } from "@/types";

interface ValidationIssue {
  path?: Array<string | number>;
  message?: string;
}

type FindingField =
  | "category"
  | "laterality"
  | "studyType"
  | "studyDate"
  | "description"
  | "observations"
  | "biopsyPerformed"
  | "biopsyResult"
  | "nextControlDate"
  | "status";

type FieldErrors = Partial<Record<FindingField, string>>;

const findingFields: FindingField[] = [
  "category",
  "laterality",
  "studyType",
  "studyDate",
  "description",
  "observations",
  "biopsyPerformed",
  "biopsyResult",
  "nextControlDate",
  "status",
];

interface FindingFormProps {
  patientId: string;
  mode?: "create" | "edit";
  finding?: Finding;
  onCancel?: () => void;
  onSaved?: (finding: Finding) => void;
}

function getBoliviaToday(): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "America/La_Paz",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return `${values.year}-${values.month}-${values.day}`;
}

function getFieldErrors(details: unknown): FieldErrors {
  if (!Array.isArray(details)) return {};

  const errors: FieldErrors = {};

  for (const detail of details as ValidationIssue[]) {
    const field = detail.path?.[0];

    if (
      typeof field === "string" &&
      findingFields.includes(field as FindingField) &&
      typeof detail.message === "string"
    ) {
      errors[field as FindingField] ??= detail.message;
    }
  }

  return errors;
}

export function FindingForm({
  patientId,
  mode = "create",
  finding,
  onCancel,
  onSaved,
}: FindingFormProps) {
  const router = useRouter();
  const [category, setCategory] = useState<BiradsCategory | "">(finding?.category ?? "");
  const [laterality, setLaterality] = useState<BreastLaterality | "">(finding?.laterality ?? "");
  const [studyType, setStudyType] = useState<BreastStudyType | "">(finding?.studyType ?? "");
  const [studyDate, setStudyDate] = useState(finding?.studyDate ?? "");
  const [description, setDescription] = useState(finding?.description ?? "");
  const [observations, setObservations] = useState(finding?.observations ?? "");
  const [biopsyPerformed, setBiopsyPerformed] = useState(finding?.biopsyPerformed ?? false);
  const [biopsyResult, setBiopsyResult] = useState(finding?.biopsyResult ?? "");
  const [nextControlDate, setNextControlDate] = useState(finding?.nextControlDate ?? "");
  const [status, setStatus] = useState<FindingStatus>(finding?.status ?? "RECORDED");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const idPrefix = mode === "edit" ? `finding-${finding?.id ?? "edit"}` : "finding-new";

  function clearFieldError(field: FindingField): void {
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
  }

  function resetForm(): void {
    setCategory("");
    setLaterality("");
    setStudyType("");
    setStudyDate("");
    setDescription("");
    setObservations("");
    setBiopsyPerformed(false);
    setBiopsyResult("");
    setNextControlDate("");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setFieldErrors({});
    setLoading(true);

    try {
      if (mode === "edit" && !finding) {
        setError("No se encontró el hallazgo que deseas editar.");
        return;
      }

      const url =
        mode === "create"
          ? `/api/patients/${patientId}/findings`
          : `/api/patients/${patientId}/findings/${finding?.id}`;
      const response = await fetch(url, {
        method: mode === "create" ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          laterality,
          studyType,
          studyDate,
          description,
          observations,
          biopsyPerformed,
          biopsyResult: biopsyPerformed ? biopsyResult : "",
          nextControlDate,
          ...(mode === "edit" ? { status } : {}),
        }),
      });
      const data = (await response.json()) as ApiResponse<Finding>;

      if (!response.ok || !data.success || !data.data) {
        setFieldErrors(getFieldErrors(data.error?.details));
        setError(
          data.error?.message ??
            (mode === "create"
              ? "No fue posible registrar el hallazgo."
              : "No fue posible actualizar el hallazgo."),
        );
        return;
      }

      if (mode === "create") {
        resetForm();
        setSuccess("El hallazgo fue registrado correctamente.");
      }
      onSaved?.(data.data);
      router.refresh();
    } catch {
      setError("No fue posible conectar con el servidor. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
      {error ? (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
        >
          {error}
        </div>
      ) : null}

      {success ? (
        <div
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200"
        >
          {success}
        </div>
      ) : null}

      <div className="grid gap-5 md:grid-cols-3">
        <SelectField
          id={`${idPrefix}-category`}
          label="Categoría BI-RADS"
          value={category}
          onChange={(value) => {
            setCategory(value as BiradsCategory);
            clearFieldError("category");
          }}
          error={fieldErrors.category}
          disabled={loading}
          placeholder="Selecciona una categoría"
          options={["0", "1", "2", "3", "4A", "4B", "4C", "5", "6"].map((value) => ({
            value,
            label: `BI-RADS ${value}`,
          }))}
        />
        <SelectField
          id={`${idPrefix}-laterality`}
          label="Lateralidad"
          value={laterality}
          onChange={(value) => {
            setLaterality(value as BreastLaterality);
            clearFieldError("laterality");
          }}
          error={fieldErrors.laterality}
          disabled={loading}
          placeholder="Selecciona una lateralidad"
          options={[
            { value: "LEFT", label: "Mama izquierda" },
            { value: "RIGHT", label: "Mama derecha" },
            { value: "BILATERAL", label: "Bilateral" },
          ]}
        />
        <SelectField
          id={`${idPrefix}-study-type`}
          label="Tipo de estudio"
          value={studyType}
          onChange={(value) => {
            setStudyType(value as BreastStudyType);
            clearFieldError("studyType");
          }}
          error={fieldErrors.studyType}
          disabled={loading}
          placeholder="Selecciona un estudio"
          options={[
            { value: "MAMMOGRAPHY", label: "Mamografía" },
            { value: "ULTRASOUND", label: "Ecografía" },
            { value: "MRI", label: "Resonancia" },
          ]}
        />
      </div>

      {mode === "edit" ? (
        <SelectField
          id={`${idPrefix}-status`}
          label="Estado del registro"
          value={status}
          onChange={(value) => {
            setStatus(value as FindingStatus);
            clearFieldError("status");
          }}
          error={fieldErrors.status}
          disabled={loading}
          placeholder="Selecciona un estado"
          options={[
            { value: "RECORDED", label: "Registrado" },
            { value: "FOLLOW_UP", label: "En seguimiento" },
            { value: "CLOSED", label: "Cerrado" },
          ]}
        />
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <Input
          id={`${idPrefix}-study-date`}
          label="Fecha del estudio"
          type="date"
          value={studyDate}
          max={getBoliviaToday()}
          onChange={(event) => {
            setStudyDate(event.target.value);
            clearFieldError("studyDate");
          }}
          error={fieldErrors.studyDate}
          required
          disabled={loading}
        />
        <Input
          id={`${idPrefix}-next-control`}
          label="Próximo control"
          type="date"
          value={nextControlDate}
          min={studyDate || undefined}
          onChange={(event) => {
            setNextControlDate(event.target.value);
            clearFieldError("nextControlDate");
          }}
          error={fieldErrors.nextControlDate}
          helpText="Opcional; registra únicamente la fecha indicada por el profesional."
          disabled={loading}
        />
      </div>

      <TextAreaField
        id={`${idPrefix}-description`}
        label="Descripción del hallazgo"
        value={description}
        onChange={(value) => {
          setDescription(value);
          clearFieldError("description");
        }}
        error={fieldErrors.description}
        maxLength={2000}
        required
        disabled={loading}
      />

      <TextAreaField
        id={`${idPrefix}-observations`}
        label="Observaciones"
        value={observations}
        onChange={(value) => {
          setObservations(value);
          clearFieldError("observations");
        }}
        error={fieldErrors.observations}
        maxLength={4000}
        disabled={loading}
      />

      <div className="border-border bg-surface-secondary rounded-xl border p-4">
        <label className="text-foreground flex cursor-pointer items-start gap-3 text-sm font-medium">
          <input
            type="checkbox"
            checked={biopsyPerformed}
            onChange={(event) => {
              setBiopsyPerformed(event.target.checked);
              if (!event.target.checked) setBiopsyResult("");
              clearFieldError("biopsyPerformed");
              clearFieldError("biopsyResult");
            }}
            disabled={loading}
            className="mt-0.5 size-4 accent-rose-600"
          />
          Registrar que existe una biopsia asociada
        </label>

        {biopsyPerformed ? (
          <div className="mt-4">
            <TextAreaField
              id={`${idPrefix}-biopsy-result`}
              label="Resultado de biopsia"
              value={biopsyResult}
              onChange={(value) => {
                setBiopsyResult(value);
                clearFieldError("biopsyResult");
              }}
              error={fieldErrors.biopsyResult}
              maxLength={2000}
              disabled={loading}
            />
          </div>
        ) : null}
      </div>

      <div className="border-border flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:justify-end">
        {mode === "edit" ? (
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>
        ) : null}
        <Button type="submit" disabled={loading} className="w-full sm:w-auto">
          {loading
            ? mode === "create"
              ? "Registrando…"
              : "Guardando…"
            : mode === "create"
              ? "Registrar hallazgo"
              : "Guardar cambios"}
        </Button>
      </div>
    </form>
  );
}

interface SelectFieldProps {
  id: string;
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  placeholder: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}

function SelectField({
  id,
  label,
  value,
  options,
  placeholder,
  onChange,
  error,
  disabled,
}: SelectFieldProps) {
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-foreground text-sm font-medium">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        aria-describedby={errorId}
        className="border-border bg-surface text-foreground disabled:bg-surface-secondary min-h-10 rounded-lg border px-3 py-2 text-sm shadow-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? (
        <p id={errorId} role="alert" className="text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}

interface TextAreaFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  maxLength: number;
  required?: boolean;
  disabled?: boolean;
}

function TextAreaField({
  id,
  label,
  value,
  onChange,
  error,
  maxLength,
  required,
  disabled,
}: TextAreaFieldProps) {
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={id} className="text-foreground text-sm font-medium">
          {label}
        </label>
        <span className="text-muted text-xs">
          {value.length}/{maxLength}
        </span>
      </div>
      <textarea
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        maxLength={maxLength}
        required={required}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        aria-describedby={errorId}
        rows={4}
        className="border-border bg-surface text-foreground placeholder:text-muted disabled:bg-surface-secondary min-h-28 w-full resize-y rounded-lg border px-3 py-2 text-sm shadow-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
      />
      {error ? (
        <p id={errorId} role="alert" className="text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}
