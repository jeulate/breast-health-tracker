import type { Finding } from "@/features/findings";

const studyLabels: Record<Finding["studyType"], string> = {
  MAMMOGRAPHY: "Mamografía",
  ULTRASOUND: "Ecografía",
  MRI: "Resonancia",
};

const lateralityLabels: Record<Finding["laterality"], string> = {
  LEFT: "Mama izquierda",
  RIGHT: "Mama derecha",
  BILATERAL: "Bilateral",
};

const statusLabels: Record<Finding["status"], string> = {
  RECORDED: "Registrado",
  FOLLOW_UP: "En seguimiento",
  CLOSED: "Cerrado",
};

export function FindingCard({ finding }: { finding: Finding }) {
  return (
    <article className="border-border bg-surface rounded-2xl border p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-rose-100 font-bold text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">
            {finding.category}
          </div>
          <div className="min-w-0">
            <p className="text-foreground font-semibold">BI-RADS {finding.category}</p>
            <p className="text-muted mt-1 text-sm">
              {studyLabels[finding.studyType]} · {lateralityLabels[finding.laterality]}
            </p>
          </div>
        </div>

        <span className="border-border bg-surface-secondary text-foreground inline-flex w-fit rounded-full border px-3 py-1 text-xs font-semibold">
          {statusLabels[finding.status]}
        </span>
      </div>

      <dl className="mt-5 grid gap-4 sm:grid-cols-3">
        <DataItem label="Fecha del estudio" value={formatDateOnly(finding.studyDate)} />
        <DataItem
          label="Próximo control"
          value={
            finding.nextControlDate ? formatDateOnly(finding.nextControlDate) : "No registrado"
          }
        />
        <DataItem
          label="Biopsia"
          value={finding.biopsyPerformed ? "Registrada" : "No registrada"}
        />
      </dl>

      <div className="border-border mt-5 border-t pt-4">
        <p className="text-muted text-xs font-semibold tracking-wide uppercase">Descripción</p>
        <p className="text-foreground mt-2 text-sm leading-6 whitespace-pre-wrap">
          {finding.description}
        </p>
      </div>

      {finding.observations ? (
        <div className="mt-4">
          <p className="text-muted text-xs font-semibold tracking-wide uppercase">Observaciones</p>
          <p className="text-muted mt-2 text-sm leading-6 whitespace-pre-wrap">
            {finding.observations}
          </p>
        </div>
      ) : null}

      {finding.biopsyResult ? (
        <div className="mt-4">
          <p className="text-muted text-xs font-semibold tracking-wide uppercase">
            Resultado de biopsia registrado
          </p>
          <p className="text-muted mt-2 text-sm leading-6 whitespace-pre-wrap">
            {finding.biopsyResult}
          </p>
        </div>
      ) : null}
    </article>
  );
}

function DataItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted text-xs font-medium">{label}</dt>
      <dd className="text-foreground mt-1 text-sm font-medium">{value}</dd>
    </div>
  );
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
