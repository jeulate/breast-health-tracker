import { z } from "zod";
import { TELEGRAM_LINK_STATUSES } from "@/features/telegram";

const telegramUserIdSchema = z
  .string()
  .trim()
  .regex(/^\d{1,20}$/, "El identificador del usuario de Telegram no es válido.");

const telegramChatIdSchema = z
  .string()
  .trim()
  .regex(/^-?\d{1,20}$/, "El identificador del chat de Telegram no es válido.");

export const telegramLinkTokenSchema = z
  .string()
  .regex(/^[A-Za-z0-9_-]{43}$/, "El token de vinculación no es válido.");

export const telegramIdentitySchema = z
  .object({
    telegramUserId: telegramUserIdSchema,
    telegramChatId: telegramChatIdSchema,
  })
  .strict();

export const createTelegramLinkChallengeSchema = z
  .object({
    patientId: z.string().uuid("La paciente no es válida."),
    ttlMinutes: z.coerce.number().int().min(5).max(30).default(15),
  })
  .strict();

export const telegramLinkChallengeSchema = z
  .object({
    id: z.string().regex(/^tgl_[a-f0-9]{32}$/),
    patientId: z.string().uuid(),
    tokenHash: z.string().regex(/^[a-f0-9]{64}$/),
    status: z.enum(TELEGRAM_LINK_STATUSES),
    expiresAt: z.string().datetime(),
    consumedAt: z.string().datetime().optional(),
    revokedAt: z.string().datetime().optional(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .strict()
  .superRefine((challenge, context) => {
    if (challenge.status === "CONSUMED" && !challenge.consumedAt) {
      context.addIssue({
        code: "custom",
        path: ["consumedAt"],
        message: "Una vinculación consumida debe registrar su fecha.",
      });
    }

    if (challenge.status === "REVOKED" && !challenge.revokedAt) {
      context.addIssue({
        code: "custom",
        path: ["revokedAt"],
        message: "Una vinculación revocada debe registrar su fecha.",
      });
    }

    if (challenge.status === "PENDING" && (challenge.consumedAt || challenge.revokedAt)) {
      context.addIssue({
        code: "custom",
        path: ["status"],
        message: "Una vinculación pendiente no puede estar consumida ni revocada.",
      });
    }
  });

export type CreateTelegramLinkChallengeInput = z.infer<typeof createTelegramLinkChallengeSchema>;
