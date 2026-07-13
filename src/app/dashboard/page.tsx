import type { Metadata } from "next";
import { StatCard } from "@/components/dashboard/StatCard";
import { MedicalDisclaimer } from "@/components/dashboard/MedicalDisclaimer";

export const metadata: Metadata = {
  title: "Inicio | BI-RADS Tracker",
};

// Simulated data – will be replaced with real data in Phase 2
const SIMULATED_STATS = [
  {
    title: "Pacientes activas",
    value: 0,
    color: "blue" as const,
    description: "Registradas en el sistema",
  },
  {
    title: "Controles pendientes",
    value: 0,
    color: "yellow" as const,
    description: "Requieren seguimiento",
  },
  {
    title: "Alertas pendientes",
    value: 0,
    color: "red" as const,
    description: "Requieren atención",
  },
  {
    title: "Recordatorios programados",
    value: 0,
    color: "green" as const,
    description: "Para las próximas 48h",
  },
];

const SIMULATED_ACTIVITY = [
  {
    id: "1",
    type: "Sistema iniciado",
    description: "Primera fase implementada",
    date: new Date().toLocaleDateString("es-MX"),
  },
];

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <MedicalDisclaimer />

      <section>
        <h2 className="mb-4 text-lg font-semibold text-gray-800">Resumen</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SIMULATED_STATS.map((stat) => (
            <StatCard key={stat.title} {...stat} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-gray-800">Actividad reciente</h2>
        <div className="rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3 text-left font-medium text-gray-600">Tipo</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Descripción</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {SIMULATED_ACTIVITY.map((item) => (
                <tr key={item.id} className="border-b border-gray-50 last:border-0">
                  <td className="px-4 py-3 text-gray-700">{item.type}</td>
                  <td className="px-4 py-3 text-gray-600">{item.description}</td>
                  <td className="px-4 py-3 text-gray-500">{item.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
