import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PatientForm } from "@/components/forms/PatientForm";
import { PatientService } from "@/services/patient.service";
import type { Patient } from "@/types";

export const metadata: Metadata = {
  title: "Detalle paciente | BI-RADS Tracker",
};

export const dynamic = "force-dynamic";

interface PatientDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function PatientDetailPage({ params }: PatientDetailPageProps) {
  const { id } = await params;

  let patient: Patient | null;

  try {
    patient = await PatientService.getById(id);
  } catch {
    patient = null;
  }

  if (!patient) {
    notFound();
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Link
          href="/dashboard/patients"
          className="text-muted hover:text-foreground inline-flex w-fit items-center gap-2 text-sm font-medium transition"
        >
          <span aria-hidden="true">←</span>
          Volver a pacientes
        </Link>

        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <p className="text-sm font-medium text-rose-600 dark:text-rose-400">
              Perfil de paciente
            </p>

            <h2 className="text-foreground mt-1 text-2xl font-bold tracking-tight">
              {patient.fullName}
            </h2>

            <p className="text-muted mt-1 text-sm">
              Consulta la información general y actualiza los datos principales.
            </p>
          </div>

          <PatientStatusBadge status={patient.status} />
        </div>
      </div>

      <section
        aria-labelledby="patient-summary-title"
        className="border-border bg-surface overflow-hidden rounded-2xl border shadow-sm"
      >
        <div className="border-border bg-surface-secondary border-b px-5 py-4 sm:px-6">
          <h3 id="patient-summary-title" className="text-foreground text-base font-semibold">
            Información general
          </h3>

          <p className="text-muted mt-1 text-sm">Datos de identificación y seguimiento inicial.</p>
        </div>

        <dl className="grid grid-cols-1 gap-x-8 gap-y-6 p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-3">
          <PatientDataItem label="Identificador" value={patient.id} mono />

          <PatientDataItem
            label="Estado"
            value={patient.status === "ACTIVE" ? "Activa" : "Inactiva"}
          />

          <PatientDataItem label="Zona horaria" value={patient.timezone} />

          <PatientDataItem label="Fecha de registro" value={formatDate(patient.createdAt)} />

          <PatientDataItem
            label="Fecha de nacimiento"
            value={patient.birthDate ? formatDate(patient.birthDate) : "No registrada"}
          />

          <PatientDataItem
            label="Telegram"
            value={patient.telegramUserId ? "Vinculado" : "No vinculado"}
          />
        </dl>
      </section>

      <section
        aria-labelledby="edit-patient-title"
        className="border-border bg-surface overflow-hidden rounded-2xl border shadow-sm"
      >
        <div className="border-border bg-surface-secondary border-b px-5 py-4 sm:px-6">
          <h3 id="edit-patient-title" className="text-foreground text-base font-semibold">
            Editar datos
          </h3>

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

      <section className="border-border bg-surface-secondary rounded-2xl border border-dashed px-5 py-4">
        <p className="text-foreground text-sm font-medium">Próximos módulos</p>

        <p className="text-muted mt-1 text-sm leading-6">
          Fase 2: hallazgos BI-RADS, síntomas y ciclos. Fase 3: hábitos y controles médicos. Fase 4:
          integración con Telegram.
        </p>
      </section>
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

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("es-BO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}
