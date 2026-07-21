export function buildTelegramReminderMessage(targetDate: string): string {
  const [year, month, day] = targetDate.split("-").map(Number);
  const formatted = new Intl.DateTimeFormat("es-BO", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));

  return [
    "Recordatorio administrativo",
    `Tienes un control programado para el ${formatted}.`,
    "Consulta el panel o comunícate con el centro correspondiente si necesitas más información.",
    "Este aviso es informativo y no reemplaza la consulta profesional.",
  ].join("\n\n");
}
