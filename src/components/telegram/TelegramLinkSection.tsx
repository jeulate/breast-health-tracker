"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import {
  buildTelegramStartCommand,
  formatTelegramLinkExpiry,
} from "@/features/telegram/telegram-link-ui";
import type { ApiResponse } from "@/types";

interface CreatedLink {
  challengeId: string;
  token: string;
  expiresAt: string;
}

export function TelegramLinkSection({
  patientId,
  telegramUserId,
  telegramChatId,
}: {
  patientId: string;
  telegramUserId?: string;
  telegramChatId?: string;
}) {
  const router = useRouter();
  const [createdLink, setCreatedLink] = useState<CreatedLink | null>(null);
  const [pendingAction, setPendingAction] = useState<"create" | "revoke" | "unlink" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const linked = Boolean(telegramUserId && telegramChatId);

  async function createLink() {
    setPendingAction("create");
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(`/api/patients/${patientId}/telegram-link`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ttlMinutes: 15 }),
      });
      const body = (await response.json()) as ApiResponse<CreatedLink>;
      if (!response.ok || !body.data)
        throw new Error(body.error?.message ?? "No fue posible generar el enlace.");
      setCreatedLink(body.data);
      setMessage("Enlace temporal generado. Se mostrará únicamente en esta sesión.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No fue posible generar el enlace.");
    } finally {
      setPendingAction(null);
    }
  }

  async function copyCommand() {
    if (!createdLink) return;
    try {
      await navigator.clipboard.writeText(buildTelegramStartCommand(createdLink.token));
      setMessage("Comando copiado al portapapeles.");
      setError(null);
    } catch {
      setError("No fue posible copiar automáticamente. Selecciona el comando manualmente.");
    }
  }

  async function revokeLink() {
    if (!createdLink) return;
    setPendingAction("revoke");
    setError(null);
    try {
      const response = await fetch(
        `/api/patients/${patientId}/telegram-link/${createdLink.challengeId}`,
        { method: "DELETE" },
      );
      const body = (await response.json()) as ApiResponse<{ revoked: boolean }>;
      if (!response.ok) throw new Error(body.error?.message ?? "No fue posible revocar el enlace.");
      setCreatedLink(null);
      setMessage("El enlace temporal fue revocado.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No fue posible revocar el enlace.");
    } finally {
      setPendingAction(null);
    }
  }

  async function unlink() {
    if (!window.confirm("¿Desvincular Telegram de esta paciente?")) return;
    setPendingAction("unlink");
    setError(null);
    try {
      const response = await fetch(`/api/patients/${patientId}/telegram-link`, {
        method: "DELETE",
      });
      const body = (await response.json()) as ApiResponse<{ unlinked: boolean }>;
      if (!response.ok)
        throw new Error(body.error?.message ?? "No fue posible desvincular Telegram.");
      setMessage("Telegram fue desvinculado correctamente.");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No fue posible desvincular Telegram.");
    } finally {
      setPendingAction(null);
    }
  }

  const command = createdLink ? buildTelegramStartCommand(createdLink.token) : null;

  return (
    <section
      id="telegram-link"
      aria-labelledby="telegram-link-title"
      className="border-border bg-surface overflow-hidden rounded-2xl border shadow-sm"
    >
      <div className="border-border bg-surface-secondary flex flex-col gap-3 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p className="text-sm font-medium text-rose-600 dark:text-rose-400">Fase 7</p>
          <h2 id="telegram-link-title" className="text-foreground mt-1 text-base font-semibold">
            Vinculación con Telegram
          </h2>
          <p className="text-muted mt-1 text-sm">
            Administra el canal de recordatorios sin compartir información clínica.
          </p>
        </div>
        <span
          className={[
            "inline-flex w-fit rounded-full px-3 py-1.5 text-sm font-semibold",
            linked
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
              : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
          ].join(" ")}
        >
          {linked ? "Vinculado" : "No vinculado"}
        </span>
      </div>

      <div className="flex flex-col gap-4 p-5 sm:p-6">
        {message ? (
          <p
            role="status"
            className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200"
          >
            {message}
          </p>
        ) : null}
        {error ? (
          <p
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200"
          >
            {error}
          </p>
        ) : null}

        {linked ? (
          <div className="flex flex-col gap-4">
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-muted text-sm font-medium">Usuario de Telegram</dt>
                <dd className="text-foreground mt-1 font-mono text-sm">{telegramUserId}</dd>
              </div>
              <div>
                <dt className="text-muted text-sm font-medium">Chat autorizado</dt>
                <dd className="text-foreground mt-1 font-mono text-sm">{telegramChatId}</dd>
              </div>
            </dl>
            <Button
              variant="danger"
              className="w-fit"
              disabled={pendingAction !== null}
              onClick={unlink}
            >
              {pendingAction === "unlink" ? "Desvinculando..." : "Desvincular Telegram"}
            </Button>
          </div>
        ) : createdLink && command ? (
          <div className="flex flex-col gap-4">
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
              El comando vence el {formatTelegramLinkExpiry(createdLink.expiresAt)} y solo puede
              utilizarse una vez.
            </div>
            <div>
              <label
                htmlFor="telegram-start-command"
                className="text-foreground text-sm font-medium"
              >
                Comando de vinculación
              </label>
              <input
                id="telegram-start-command"
                readOnly
                value={command}
                className="border-border bg-surface-secondary text-foreground mt-2 w-full rounded-lg border px-3 py-2 font-mono text-sm"
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <Button onClick={copyCommand}>Copiar comando</Button>
              <Button variant="secondary" disabled={pendingAction !== null} onClick={revokeLink}>
                {pendingAction === "revoke" ? "Revocando..." : "Revocar enlace"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-muted text-sm leading-6">
              Genera un comando temporal de 15 minutos. La paciente deberá enviarlo al bot para
              completar la vinculación.
            </p>
            <Button className="w-fit" disabled={pendingAction !== null} onClick={createLink}>
              {pendingAction === "create" ? "Generando..." : "Generar enlace temporal"}
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
