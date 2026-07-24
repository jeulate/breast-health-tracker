"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { ApiResponse } from "@/types";
import type { ProfileLanguage, ProfileTheme, UserProfile } from "@/features/profile";
import {
  profileThemeToNextTheme,
  toProfileFormValues,
  toUpdateProfileInput,
  type ProfileFormValues,
} from "./profile-form.helpers";

const TIMEZONES = ["America/La_Paz", "America/Argentina/Buenos_Aires", "UTC"] as const;

export function ProfileForm() {
  const { setTheme } = useTheme();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [values, setValues] = useState<ProfileFormValues | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadProfile(): Promise<void> {
      try {
        const response = await fetch("/api/profile", { cache: "no-store" });
        const payload = (await response.json()) as ApiResponse<UserProfile>;

        if (!response.ok || !payload.success || !payload.data) {
          throw new Error(payload.error?.message ?? "No se pudo cargar el perfil.");
        }

        if (active) {
          setProfile(payload.data);
          setValues(toProfileFormValues(payload.data));
        }
      } catch (loadError) {
        if (active) {
          setError(
            loadError instanceof Error ? loadError.message : "No se pudo cargar el perfil.",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadProfile();
    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!values) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toUpdateProfileInput(values)),
      });
      const payload = (await response.json()) as ApiResponse<UserProfile>;

      if (!response.ok || !payload.success || !payload.data) {
        throw new Error(payload.error?.message ?? "No se pudo guardar el perfil.");
      }

      setProfile(payload.data);
      setValues(toProfileFormValues(payload.data));
      setTheme(profileThemeToNextTheme(payload.data.preferences.theme));
      setSuccess("Perfil y preferencias guardados correctamente.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "No se pudo guardar el perfil.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <ProfileFormSkeleton />;

  if (!profile || !values) {
    return (
      <StatusMessage tone="error">
        {error ?? "No fue posible obtener la información del perfil."}
      </StatusMessage>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid min-w-0 gap-6 xl:grid-cols-3">
      <div className="space-y-6 xl:col-span-2">
        <Section
          title="Información personal"
          description="Actualiza el nombre que se muestra dentro del sistema."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              id="profile-name"
              label="Nombre visible"
              value={values.name}
              minLength={2}
              maxLength={100}
              required
              onChange={(event) => setValues({ ...values, name: event.target.value })}
            />
            <Input id="profile-email" label="Correo electrónico" value={profile.user.email} disabled />
          </div>
          <p className="text-muted mt-3 text-xs">
            El correo, rol y estado de la cuenta solo pueden modificarse mediante administración.
          </p>
        </Section>

        <Section
          title="Apariencia y ubicación"
          description="Configura cómo se presenta la interfaz y las fechas."
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <SelectField
              id="profile-theme"
              label="Tema"
              value={values.theme}
              onChange={(value) =>
                setValues({ ...values, theme: value as ProfileTheme })
              }
              options={[
                ["SYSTEM", "Usar sistema"],
                ["LIGHT", "Claro"],
                ["DARK", "Oscuro"],
              ]}
            />
            <SelectField
              id="profile-language"
              label="Idioma"
              value={values.language}
              onChange={(value) =>
                setValues({ ...values, language: value as ProfileLanguage })
              }
              options={[
                ["es", "Español"],
                ["en", "Inglés"],
              ]}
            />
            <SelectField
              id="profile-timezone"
              label="Zona horaria"
              value={values.timezone}
              onChange={(value) => setValues({ ...values, timezone: value })}
              options={TIMEZONES.map((timezone) => [timezone, timezone])}
            />
          </div>
        </Section>

        <Section
          title="Notificaciones"
          description="Elige los canales y recordatorios que deseas mantener activos."
        >
          <div className="divide-border divide-y">
            <PreferenceSwitch
              id="in-app-notifications"
              label="Notificaciones en la aplicación"
              description="Muestra avisos y novedades dentro del panel."
              checked={values.inAppNotifications}
              onChange={(checked) => setValues({ ...values, inAppNotifications: checked })}
            />
            <PreferenceSwitch
              id="telegram-notifications"
              label="Notificaciones por Telegram"
              description="Permite recibir los avisos vinculados a Telegram."
              checked={values.telegramNotifications}
              onChange={(checked) => setValues({ ...values, telegramNotifications: checked })}
            />
            <PreferenceSwitch
              id="clinical-reminders"
              label="Recordatorios clínicos"
              description="Mantiene habilitados los recordatorios de seguimiento."
              checked={values.clinicalReminders}
              onChange={(checked) => setValues({ ...values, clinicalReminders: checked })}
            />
          </div>
        </Section>
      </div>

      <aside className="space-y-6">
        <Section title="Cuenta" description="Información de acceso actual.">
          <AccountRow label="Rol" value={profile.user.role === "ADMIN" ? "Administrador" : "Profesional"} />
          <AccountRow label="Estado" value={profile.user.status === "ACTIVE" ? "Activa" : "Inactiva"} />
          <AccountRow label="Creada" value={formatDate(profile.user.createdAt)} />
          <AccountRow label="Actualizada" value={formatDate(profile.user.updatedAt)} />
        </Section>

        <div className="border-border bg-surface sticky top-20 rounded-2xl border p-5 shadow-sm">
          {error && <StatusMessage tone="error">{error}</StatusMessage>}
          {success && <StatusMessage tone="success">{success}</StatusMessage>}
          <Button type="submit" className="mt-4 w-full" disabled={saving}>
            {saving ? "Guardando…" : "Guardar cambios"}
          </Button>
        </div>
      </aside>
    </form>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-border bg-surface rounded-2xl border shadow-sm">
      <div className="border-border border-b px-5 py-4">
        <h3 className="text-foreground text-base font-semibold">{title}</h3>
        <p className="text-muted mt-1 text-sm">{description}</p>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function SelectField({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  options: readonly (readonly [string, string])[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-foreground text-sm font-medium">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="border-border bg-surface text-foreground min-h-10 w-full rounded-lg border px-3 py-2 text-sm shadow-sm transition focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 focus:outline-none"
      >
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </div>
  );
}

function PreferenceSwitch({
  id,
  label,
  description,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-center justify-between gap-5 py-4 first:pt-0 last:pb-0">
      <span>
        <span className="text-foreground block text-sm font-medium">{label}</span>
        <span className="text-muted mt-1 block text-xs">{description}</span>
      </span>
      <span className="relative shrink-0">
        <input
          id={id}
          type="checkbox"
          className="peer sr-only"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
        />
        <span className="bg-border peer-checked:bg-rose-600 peer-focus-visible:ring-2 peer-focus-visible:ring-rose-500/30 block h-6 w-11 rounded-full transition" />
        <span className="absolute top-1 left-1 size-4 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
      </span>
    </label>
  );
}

function AccountRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-border flex items-center justify-between gap-4 border-b py-3 first:pt-0 last:border-0 last:pb-0">
      <span className="text-muted text-sm">{label}</span>
      <span className="text-foreground text-right text-sm font-medium">{value}</span>
    </div>
  );
}

function StatusMessage({ tone, children }: { tone: "success" | "error"; children: React.ReactNode }) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={[
        "rounded-xl border px-4 py-3 text-sm",
        tone === "success"
          ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
          : "border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300",
      ].join(" ")}
    >
      {children}
    </div>
  );
}

function ProfileFormSkeleton() {
  return (
    <div aria-label="Cargando perfil" className="grid animate-pulse gap-6 xl:grid-cols-3">
      <div className="border-border bg-surface h-96 rounded-2xl border xl:col-span-2" />
      <div className="border-border bg-surface h-64 rounded-2xl border" />
    </div>
  );
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("es-BO", {
    dateStyle: "medium",
    timeZone: "America/La_Paz",
  }).format(new Date(value));
}
