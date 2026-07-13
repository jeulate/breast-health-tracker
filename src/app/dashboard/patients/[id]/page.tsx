import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PatientService } from "@/services/patient.service";
import { PatientForm } from "@/components/forms/PatientForm";

export const metadata: Metadata = {
  title: "Detalle paciente | BI-RADS Tracker",
};

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PatientDetailPage({ params }: Props) {
  const { id } = await params;
  let patient;
  try {
    patient = await PatientService.getById(id);
  } catch {
    patient = null;
  }
  if (!patient) notFound();

  return (
    <div className="mx-auto max-w-lg">
      <h2 className="mb-6 text-lg font-semibold text-gray-800">Detalle: {patient.fullName}</h2>

      <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6">
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="font-medium text-gray-500">ID</dt>
            <dd className="mt-1 font-mono text-xs text-gray-700">{patient.id}</dd>
          </div>
          <div>
            <dt className="font-medium text-gray-500">Estado</dt>
            <dd className="mt-1">
              <span
                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                  patient.status === "ACTIVE"
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {patient.status === "ACTIVE" ? "Activa" : "Inactiva"}
              </span>
            </dd>
          </div>
          <div>
            <dt className="font-medium text-gray-500">Zona horaria</dt>
            <dd className="mt-1 text-gray-700">{patient.timezone}</dd>
          </div>
          <div>
            <dt className="font-medium text-gray-500">Registrada</dt>
            <dd className="mt-1 text-gray-700">
              {new Date(patient.createdAt).toLocaleDateString("es-MX")}
            </dd>
          </div>
          {patient.birthDate && (
            <div>
              <dt className="font-medium text-gray-500">Fecha de nacimiento</dt>
              <dd className="mt-1 text-gray-700">{patient.birthDate}</dd>
            </div>
          )}
        </dl>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="mb-4 text-base font-semibold text-gray-700">Editar datos</h3>
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

      {/* Placeholders for future phases */}
      <div className="mt-6 rounded-lg border border-dashed border-gray-200 bg-gray-50 p-4 text-xs text-gray-400">
        Fase 2: Hallazgos BI-RADS, síntomas y ciclos · Fase 3: Hábitos y controles médicos · Fase 4:
        Integración Telegram
      </div>
    </div>
  );
}
