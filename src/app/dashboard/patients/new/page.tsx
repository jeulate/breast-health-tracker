import type { Metadata } from "next";
import { PatientForm } from "@/components/forms/PatientForm";

export const metadata: Metadata = {
  title: "Nueva paciente | BI-RADS Tracker",
};

export default function NewPatientPage() {
  return (
    <div className="mx-auto max-w-lg">
      <h2 className="mb-6 text-lg font-semibold text-gray-800">Nueva paciente</h2>
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <PatientForm mode="create" />
      </div>
    </div>
  );
}
