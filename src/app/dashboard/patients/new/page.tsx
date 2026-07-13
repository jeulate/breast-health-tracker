import type { Metadata } from "next";
import Link from "next/link";
import { PatientForm } from "@/components/forms/PatientForm";

export const metadata: Metadata = {
  title: "Nueva paciente | BI-RADS Tracker",
};

export default function NewPatientPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Link
          href="/dashboard/patients"
          className="text-muted hover:text-foreground inline-flex w-fit items-center gap-2 text-sm font-medium transition"
        >
          <span aria-hidden="true">←</span>
          Volver a pacientes
        </Link>

        <div>
          <p className="text-sm font-medium text-rose-600 dark:text-rose-400">Registro</p>

          <h2 className="text-foreground mt-1 text-2xl font-bold tracking-tight">Nueva paciente</h2>

          <p className="text-muted mt-1 text-sm leading-6">
            Completa los datos principales para crear el perfil inicial de seguimiento.
          </p>
        </div>
      </div>

      <section
        aria-labelledby="new-patient-form-title"
        className="border-border bg-surface overflow-hidden rounded-2xl border shadow-sm"
      >
        <div className="border-border bg-surface-secondary border-b px-5 py-4 sm:px-6">
          <h3 id="new-patient-form-title" className="text-foreground text-base font-semibold">
            Información de la paciente
          </h3>

          <p className="text-muted mt-1 text-sm">
            Los campos obligatorios están indicados en el formulario.
          </p>
        </div>

        <div className="p-5 sm:p-6">
          <PatientForm mode="create" />
        </div>
      </section>
    </div>
  );
}
