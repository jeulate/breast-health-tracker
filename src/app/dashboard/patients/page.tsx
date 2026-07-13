import type { Metadata } from "next";
import Link from "next/link";
import { PatientService } from "@/services/patient.service";
import { Button } from "@/components/ui/Button";
import type { Patient } from "@/types";

export const metadata: Metadata = {
  title: "Pacientes | BI-RADS Tracker",
};

export const dynamic = "force-dynamic";

export default async function PatientsPage() {
  let patients: Patient[];
  try {
    patients = await PatientService.list();
  } catch {
    patients = [];
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">Pacientes</h2>
        <Link href="/dashboard/patients/new">
          <Button size="sm">+ Nueva paciente</Button>
        </Link>
      </div>

      {patients.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center text-sm text-gray-500">
          No hay pacientes registradas todavía.{" "}
          <Link href="/dashboard/patients/new" className="text-rose-600 hover:underline">
            Crear la primera
          </Link>
          .
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3 text-left font-medium text-gray-600">Nombre</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Zona horaria</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Estado</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Registrada</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((patient) => (
                <tr key={patient.id} className="border-b border-gray-50 last:border-0">
                  <td className="px-4 py-3 font-medium text-gray-800">{patient.fullName}</td>
                  <td className="px-4 py-3 text-gray-600">{patient.timezone}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        patient.status === "ACTIVE"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {patient.status === "ACTIVE" ? "Activa" : "Inactiva"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(patient.createdAt).toLocaleDateString("es-MX")}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/patients/${patient.id}`}
                      className="text-rose-600 hover:underline"
                    >
                      Ver detalle
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
