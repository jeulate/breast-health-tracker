export function MedicalDisclaimer() {
  return (
    <div
      role="note"
      aria-label="Aviso médico"
      className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 shadow-sm dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100"
    >
      <span
        aria-hidden="true"
        className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700 dark:bg-amber-500/20 dark:text-amber-200"
      >
        !
      </span>

      <p className="leading-6">
        <strong className="font-semibold">Aviso importante: </strong>
        Esta plataforma es una herramienta de seguimiento y acompañamiento. No realiza diagnósticos
        ni sustituye la consulta médica. Ante cualquier duda, consulte siempre a un profesional de
        la salud.
      </p>
    </div>
  );
}
