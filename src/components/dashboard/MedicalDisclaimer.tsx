export function MedicalDisclaimer() {
  return (
    <div
      role="note"
      aria-label="Aviso médico"
      className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800"
    >
      <strong className="font-semibold">Aviso importante: </strong>
      Esta plataforma es una herramienta de seguimiento y acompañamiento. No realiza diagnósticos ni
      sustituye la consulta médica. Ante cualquier duda, consulte siempre a un profesional de la
      salud.
    </div>
  );
}
