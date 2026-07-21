import type { TelegramLinkFailureReason } from "./telegram-link-service.types";

export const TELEGRAM_MESSAGES = {
  welcome: "Envía el comando de vinculación generado desde el panel administrativo.",
  linked: "Vinculación completada. Este chat podrá recibir recordatorios administrativos.",
  invalidCommand: "El comando de vinculación no es válido. Genera uno nuevo desde el panel.",
} as const;

export function telegramLinkFailureMessage(reason: TelegramLinkFailureReason): string {
  if (reason === "EXPIRED_TOKEN") return "El enlace venció. Genera uno nuevo desde el panel.";
  if (reason === "TOKEN_ALREADY_USED") return "El enlace ya fue utilizado.";
  if (reason === "TOKEN_REVOKED") return "El enlace fue revocado.";
  if (reason === "CHAT_ALREADY_LINKED") return "Este chat ya está vinculado a otro registro.";
  if (reason === "PATIENT_ALREADY_LINKED") return "El registro ya tiene un chat vinculado.";
  return TELEGRAM_MESSAGES.invalidCommand;
}
