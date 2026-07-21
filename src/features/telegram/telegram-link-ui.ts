export function buildTelegramStartCommand(token: string): string {
  return `/start ${token}`;
}

export function formatTelegramLinkExpiry(value: string): string {
  return new Intl.DateTimeFormat("es-BO", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/La_Paz",
  }).format(new Date(value));
}
