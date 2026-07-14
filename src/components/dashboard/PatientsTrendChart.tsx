"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { MonthlyPatientRegistration } from "@/features/dashboard/dashboard.types";

interface PatientsTrendChartProps {
  data: MonthlyPatientRegistration[];
}

export function PatientsTrendChart({ data }: PatientsTrendChartProps) {
  const hasRegistrations = data.some((item) => item.total > 0);

  if (!hasRegistrations) {
    return (
      <div className="flex h-72 items-center justify-center px-6 text-center">
        <div>
          <p className="text-foreground text-sm font-semibold">
            Todavía no hay tendencia disponible
          </p>
          <p className="text-muted mt-1 text-sm">
            La gráfica se completará cuando se registren pacientes.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-72 w-full" aria-label="Registros de pacientes de los últimos seis meses">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 12, right: 12, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="patientsTrend" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.02} />
            </linearGradient>
          </defs>

          <CartesianGrid
            stroke="#94a3b8"
            strokeDasharray="4 4"
            strokeOpacity={0.25}
            vertical={false}
          />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#64748b", fontSize: 12 }}
            dy={10}
          />
          <YAxis
            allowDecimals={false}
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#64748b", fontSize: 12 }}
          />
          <Tooltip
            cursor={{ stroke: "#f43f5e", strokeDasharray: "4 4", strokeOpacity: 0.5 }}
            contentStyle={{
              backgroundColor: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "12px",
              boxShadow: "0 10px 30px rgba(15, 23, 42, 0.12)",
              color: "var(--color-foreground)",
            }}
            formatter={(value) => [Number(value), "Pacientes"]}
            labelFormatter={(label) => `Periodo: ${String(label)}`}
          />
          <Area
            type="monotone"
            dataKey="total"
            name="Pacientes"
            stroke="#f43f5e"
            strokeWidth={3}
            fill="url(#patientsTrend)"
            activeDot={{ r: 5, fill: "#f43f5e", stroke: "#fff", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
