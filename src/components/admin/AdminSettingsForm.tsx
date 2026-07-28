"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import type { AppSettings, UpdateAppSettingsInput } from "@/features/admin-settings";
import type { ApiResponse } from "@/types";

interface AdminSettingsFormProps {
  initialSettings: AppSettings;
}

interface ToggleFieldProps {
  id: string;
  name: string;
  label: string;
  description: string;
  checked: boolean;
  disabled: boolean;
  onChange: (checked: boolean) => void;
}

export function AdminSettingsForm({ initialSettings }: Readonly<AdminSettingsFormProps>) {
  const [settings, setSettings] = useState<AppSettings>(initialSettings);
  const [userPhotosEnabled, setUserPhotosEnabled] = useState(
    initialSettings.userProfilePhotosEnabled,
  );
  const [patientPhotosEnabled, setPatientPhotosEnabled] = useState(
    initialSettings.patientProfilePhotosEnabled,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);

    const payload: UpdateAppSettingsInput = {
      appName: String(formData.get("appName") ?? "").trim(),
      defaultTimezone: String(formData.get("defaultTimezone") ?? ""),
      userProfilePhotosEnabled: userPhotosEnabled,
      patientProfilePhotosEnabled: patientPhotosEnabled,
      profilePhotoMaxSizeMb: Number(formData.get("profilePhotoMaxSizeMb")),
    };

    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const body = (await response.json()) as ApiResponse<AppSettings>;

      if (!response.ok || !body.success || !body.data) {
        setErrorMessage(body.error?.message ?? "No fue posible actualizar la configuración.");
        return;
      }

      setSettings(body.data);
      setUserPhotosEnabled(body.data.userProfilePhotosEnabled);
      setPatientPhotosEnabled(body.data.patientProfilePhotosEnabled);
      setSuccessMessage("La configuración fue actualizada correctamente.");
      router.refresh();
    } catch {
      setErrorMessage("No fue posible conectar con el servidor. Inténtalo nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900"
    >
      <div>
        <h2 className="text-xl font-semibold text-slate-950 dark:text-white">
          Parámetros generales
        </h2>

        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Estos valores se aplican de forma global en la plataforma.
        </p>
      </div>

      {successMessage ? (
        <div
          role="status"
          className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300"
        >
          {successMessage}
        </div>
      ) : null}

      {errorMessage ? (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300"
        >
          {errorMessage}
        </div>
      ) : null}

      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label
            htmlFor="admin-settings-app-name"
            className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200"
          >
            Nombre de la aplicación
          </label>

          <input
            id="admin-settings-app-name"
            name="appName"
            type="text"
            defaultValue={settings.appName}
            required
            minLength={2}
            maxLength={80}
            disabled={isSubmitting}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 transition outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          />
        </div>

        <div>
          <label
            htmlFor="admin-settings-timezone"
            className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200"
          >
            Zona horaria predeterminada
          </label>

          <select
            id="admin-settings-timezone"
            name="defaultTimezone"
            defaultValue={settings.defaultTimezone}
            disabled={isSubmitting}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 transition outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          >
            <option value="America/La_Paz">America/La_Paz (Bolivia)</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="admin-settings-photo-size"
            className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200"
          >
            Tamaño máximo de fotografías
          </label>

          <div className="flex items-center gap-3">
            <input
              id="admin-settings-photo-size"
              name="profilePhotoMaxSizeMb"
              type="number"
              defaultValue={settings.profilePhotoMaxSizeMb}
              min={1}
              max={10}
              step={1}
              required
              disabled={isSubmitting}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 transition outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />

            <span className="shrink-0 text-sm font-medium text-slate-600 dark:text-slate-300">
              MB
            </span>
          </div>

          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Selecciona un valor entre 1 y 10 MB.
          </p>
        </div>
      </div>

      <fieldset className="space-y-4">
        <legend className="text-base font-semibold text-slate-950 dark:text-white">
          Fotografías de perfil
        </legend>

        <ToggleField
          id="admin-settings-user-photos"
          name="userProfilePhotosEnabled"
          label="Fotografías para usuarios"
          description="Permite que las cuentas profesionales y administrativas utilicen una fotografía de perfil."
          checked={userPhotosEnabled}
          disabled={isSubmitting}
          onChange={setUserPhotosEnabled}
        />

        <ToggleField
          id="admin-settings-patient-photos"
          name="patientProfilePhotosEnabled"
          label="Fotografías para pacientes"
          description="Permite asociar una fotografía de perfil a los registros de pacientes."
          checked={patientPhotosEnabled}
          disabled={isSubmitting}
          onChange={setPatientPhotosEnabled}
        />
      </fieldset>

      <div className="flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Última actualización:{" "}
          <time dateTime={settings.updatedAt} suppressHydrationWarning>
            {new Intl.DateTimeFormat("es-BO", {
              dateStyle: "medium",
              timeStyle: "short",
              timeZone: settings.defaultTimezone,
            }).format(new Date(settings.updatedAt))}
          </time>
        </p>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Guardando configuración..." : "Guardar configuración"}
        </Button>
      </div>
    </form>
  );
}

function ToggleField({
  id,
  name,
  label,
  description,
  checked,
  disabled,
  onChange,
}: Readonly<ToggleFieldProps>) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
      <div className="max-w-2xl">
        <label htmlFor={id} className="text-sm font-medium text-slate-900 dark:text-white">
          {label}
        </label>

        <p
          id={`${id}-description`}
          className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400"
        >
          {description}
        </p>
      </div>

      <label className="inline-flex shrink-0 items-center gap-3">
        <span className="text-sm text-slate-600 dark:text-slate-300">
          {checked ? "Habilitado" : "Deshabilitado"}
        </span>

        <input
          id={id}
          name={name}
          type="checkbox"
          role="switch"
          checked={checked}
          disabled={disabled}
          aria-describedby={`${id}-description`}
          onChange={(event) => onChange(event.target.checked)}
          className="peer sr-only"
        />

        <span
          aria-hidden="true"
          className="relative h-6 w-11 rounded-full bg-slate-300 transition peer-checked:bg-blue-600 peer-focus-visible:ring-2 peer-focus-visible:ring-blue-500/40 peer-focus-visible:ring-offset-2 peer-disabled:cursor-not-allowed peer-disabled:opacity-60 dark:bg-slate-700 dark:peer-focus-visible:ring-offset-slate-900"
        >
          <span className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
        </span>
      </label>
    </div>
  );
}
