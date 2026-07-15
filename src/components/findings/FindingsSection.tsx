import type { Finding } from "@/features/findings";
import { FindingCard } from "./FindingCard";
import { FindingForm } from "./FindingForm";

export function FindingsSection({
  patientId,
  findings,
}: {
  patientId: string;
  findings: Finding[];
}) {
  return (
    <section id="findings" aria-labelledby="findings-title" className="flex flex-col gap-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-rose-600 dark:text-rose-400">Fase 4</p>
          <h2 id="findings-title" className="text-foreground mt-1 text-xl font-semibold">
            Hallazgos BI-RADS
          </h2>
          <p className="text-muted mt-1 text-sm">
            Estudios y clasificaciones registradas para esta paciente.
          </p>
        </div>
        <span className="border-border bg-surface text-foreground inline-flex w-fit rounded-full border px-3 py-1.5 text-sm font-semibold">
          {findings.length} {findings.length === 1 ? "registro" : "registros"}
        </span>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
        Registra únicamente la categoría y las indicaciones consignadas por un profesional de salud.
        La plataforma no calcula ni interpreta BI-RADS.
      </div>

      <div className="border-border bg-surface overflow-hidden rounded-2xl border shadow-sm">
        <div className="border-border bg-surface-secondary border-b px-5 py-4 sm:px-6">
          <h3 className="text-foreground text-base font-semibold">Registrar hallazgo</h3>
          <p className="text-muted mt-1 text-sm">
            Completa los datos a partir del informe profesional.
          </p>
        </div>
        <div className="p-5 sm:p-6">
          <FindingForm patientId={patientId} />
        </div>
      </div>

      <div>
        <h3 className="text-foreground text-base font-semibold">Historial de hallazgos</h3>
        <p className="text-muted mt-1 text-sm">Ordenado desde el estudio más reciente.</p>
      </div>

      {findings.length === 0 ? (
        <div className="border-border bg-surface-secondary rounded-2xl border border-dashed px-6 py-10 text-center">
          <p className="text-foreground text-sm font-semibold">No hay hallazgos registrados</p>
          <p className="text-muted mx-auto mt-2 max-w-md text-sm leading-6">
            Los estudios registrados desde el formulario aparecerán en esta sección.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {findings.map((finding) => (
            <FindingCard key={finding.id} patientId={patientId} finding={finding} />
          ))}
        </div>
      )}
    </section>
  );
}
