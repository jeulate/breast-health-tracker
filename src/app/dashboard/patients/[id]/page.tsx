import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PatientForm } from "@/components/forms/PatientForm";
import { FindingsSection } from "@/components/findings/FindingsSection";
import { ClinicalTimelineSection } from "@/components/timeline/ClinicalTimelineSection";
import { RemindersSection } from "@/components/reminders/RemindersSection";
import { TelegramLinkSection } from "@/components/telegram/TelegramLinkSection";
import { FindingService } from "@/services/finding.service";
import { PatientService } from "@/services/patient.service";
import { ClinicalTimelineService } from "@/services/clinical-timeline.service";
import { ReminderService } from "@/services/reminder.service";
import type { Reminder, ReminderCandidate } from "@/features/reminders";
import type { Finding, Patient, TimelineEntry } from "@/types";

export const metadata: Metadata = {
  title: "Detalle paciente | BI-RADS Tracker",
};

export const dynamic = "force-dynamic";

interface PatientDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string | string[] }>;
}

export default async function PatientDetailPage({ params, searchParams }: PatientDetailPageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);

  let patient: Patient | null;
  let findings: Finding[] = [];
  let timelineEntries: TimelineEntry[] = [];
  let reminders: Reminder[] = [];
  let reminderCandidates: ReminderCandidate[] = [];

  try {
    patient = await PatientService.getById(id);
  } catch {
    patient = null;
  }

  if (!patient) {
    notFound();
  }

  try {
    findings = (await FindingService.listByPatient(patient.id)) ?? [];
  } catch {
    findings = [];
  }

  try {
    timelineEntries = (await ClinicalTimelineService.listByPatient(patient.id)) ?? [];
  } catch {
    timelineEntries = [];
  }

  try {
    reminders = (await ReminderService.listByPatient(patient.id)) ?? [];
  } catch {
    reminders = [];
  }

  try {
    reminderCandidates = (await ReminderService.listCandidates(patient.id)) ?? [];
  } catch {
    reminderCandidates = [];
  }

  const saved = Array.isArray(query.saved) ? query.saved[0] : query.saved;
  const initials = getInitials(patient.fullName);
  const age = patient.birthDate ? calculateAge(patient.birthDate) : null;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <Link
        href="/dashboard/patients"
        className="text-muted hover:text-foreground inline-flex w-fit items-center gap-2 text-sm font-medium transition"
      >
        <span aria-hidden="true">←</span>
        Volver a pacientes
      </Link>

      <section className="border-border bg-surface overflow-hidden rounded-2xl border shadow-sm">
        <div className="h-24 bg-gradient-to-r from-rose-500/20 via-pink-500/10 to-transparent sm:h-28" />

        <div className="px-5 pb-5 sm:px-6 sm:pb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end">
              <div
                aria-hidden="true"
                className="border-surface -mt-10 flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border-4 bg-rose-600 text-2xl font-bold text-white shadow-md sm:h-24 sm:w-24 sm:text-3xl"
              >
                {initials}
              </div>

              <div className="min-w-0 pb-1">
                <p className="text-sm font-medium text-rose-600 dark:text-rose-400">
                  Perfil de paciente
                </p>
                <h1 className="text-foreground mt-1 truncate text-2xl font-bold tracking-tight sm:text-3xl">
                  {patient.fullName}
                </h1>
                <p className="text-muted mt-1 text-sm">Expediente administrativo y seguimiento.</p>
              </div>
            </div>

            <PatientStatusBadge status={patient.status} />
          </div>
        </div>
      </section>

      {saved === "created" || saved === "updated" ? (
        <div
          role="status"
          className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200"
        >
          <span aria-hidden="true" className="font-bold">
            ✓
          </span>
          <p>
            {saved === "created"
              ? "La paciente fue registrada correctamente."
              : "Los datos de la paciente fueron actualizados correctamente."}
          </p>
        </div>
      ) : null}

      <section aria-labelledby="patient-summary-title">
        <div className="mb-4">
          <h2 id="patient-summary-title" className="text-foreground text-lg font-semibold">
            Información general
          </h2>
          <p className="text-muted mt-1 text-sm">Datos principales del expediente.</p>
        </div>

        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <PatientDataCard
            label="Fecha de nacimiento"
            value={patient.birthDate ? formatDateOnly(patient.birthDate) : "No registrada"}
            detail={age === null ? "Edad no disponible" : `${age} años`}
          />
          <PatientDataCard label="Zona horaria" value="Bolivia" detail={patient.timezone} />
          <PatientDataCard
            label="Fecha de registro"
            value={formatDateTime(patient.createdAt)}
            detail="Alta en el sistema"
          />
          <PatientDataCard
            label="Última actualización"
            value={formatDateTime(patient.updatedAt)}
            detail="Datos administrativos"
          />
        </dl>
      </section>

      <section
        aria-labelledby="record-details-title"
        className="border-border bg-surface overflow-hidden rounded-2xl border shadow-sm"
      >
        <div className="border-border bg-surface-secondary border-b px-5 py-4 sm:px-6">
          <h2 id="record-details-title" className="text-foreground text-base font-semibold">
            Detalles del expediente
          </h2>
        </div>

        <dl className="grid grid-cols-1 gap-x-8 gap-y-5 p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-3">
          <PatientDataItem label="Identificador" value={patient.id} mono />
          <PatientDataItem
            label="Estado"
            value={patient.status === "ACTIVE" ? "Activa" : "Inactiva"}
          />
          <PatientDataItem
            label="Telegram"
            value={patient.telegramUserId ? "Vinculado" : "No vinculado"}
          />
        </dl>
      </section>

      <TelegramLinkSection
        patientId={patient.id}
        telegramUserId={patient.telegramUserId}
        telegramChatId={patient.telegramChatId}
      />

      <section
        aria-labelledby="edit-patient-title"
        className="border-border bg-surface overflow-hidden rounded-2xl border shadow-sm"
      >
        <div className="border-border bg-surface-secondary border-b px-5 py-4 sm:px-6">
          <h2 id="edit-patient-title" className="text-foreground text-base font-semibold">
            Editar datos
          </h2>
          <p className="text-muted mt-1 text-sm">
            Actualiza la información administrativa de la paciente.
          </p>
        </div>

        <div className="p-5 sm:p-6">
          <PatientForm
            mode="edit"
            patientId={patient.id}
            initialValues={{
              fullName: patient.fullName,
              birthDate: patient.birthDate,
              timezone: patient.timezone,
              status: patient.status,
            }}
          />
        </div>
      </section>

      <FindingsSection patientId={patient.id} findings={findings} />

      <ClinicalTimelineSection patientId={patient.id} entries={timelineEntries} />

      <RemindersSection
        patientId={patient.id}
        timezone={patient.timezone}
        patientActive={patient.status === "ACTIVE"}
        reminders={reminders}
        candidates={reminderCandidates}
      />
    </div>
  );
}

function PatientDataCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="border-border bg-surface rounded-2xl border p-5 shadow-sm">
      <dt className="text-muted text-sm font-medium">{label}</dt>
      <dd className="text-foreground mt-2 text-base font-semibold">{value}</dd>
      <p className="text-muted mt-1 text-xs">{detail}</p>
    </div>
  );
}

function PatientDataItem({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="text-muted text-sm font-medium">{label}</dt>
      <dd
        className={[
          "text-foreground mt-1 text-sm break-words",
          mono ? "font-mono text-xs" : "",
        ].join(" ")}
      >
        {value}
      </dd>
    </div>
  );
}

function PatientStatusBadge({ status }: { status: Patient["status"] }) {
  const isActive = status === "ACTIVE";

  return (
    <span
      className={[
        "inline-flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium",
        isActive
          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
          : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
      ].join(" ")}
    >
      <span
        aria-hidden="true"
        className={["h-2 w-2 rounded-full", isActive ? "bg-emerald-500" : "bg-slate-400"].join(" ")}
      />
      {isActive ? "Activa" : "Inactiva"}
    </span>
  );
}

function getInitials(fullName: string): string {
  return fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toLocaleUpperCase("es-BO"))
    .join("");
}

function calculateAge(birthDate: string): number {
  const [birthYear, birthMonth, birthDay] = birthDate.split("-").map(Number);
  const todayParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/La_Paz",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(todayParts.map((part) => [part.type, part.value]));
  const year = Number(values.year);
  const month = Number(values.month);
  const day = Number(values.day);
  const birthdayPending = month < birthMonth || (month === birthMonth && day < birthDay);

  return year - birthYear - (birthdayPending ? 1 : 0);
}

function formatDateOnly(value: string): string {
  const [year, month, day] = value.split("-").map(Number);

  return new Intl.DateTimeFormat("es-BO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("es-BO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/La_Paz",
  }).format(new Date(value));
}
