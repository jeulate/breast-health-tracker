"use client";

import Image from "next/image";
import { type ChangeEvent, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  PROFILE_PHOTO_ALLOWED_TYPES,
  PROFILE_PHOTO_MAX_SIZE_BYTES,
} from "@/features/profile-photo/profile-photo.types";
import type { ApiResponse } from "@/types";

interface ProfilePhotoMutationData {
  hasPhoto: boolean;
  previousPhotoCleanupFailed: boolean;
}

interface ProfilePhotoEditorProps {
  endpoint: string;
  initials: string;
  alt: string;
  initialHasPhoto: boolean;
  compact?: boolean;
}

export function ProfilePhotoEditor({
  endpoint,
  initials,
  alt,
  initialHasPhoto,
  compact = false,
}: ProfilePhotoEditorProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [hasPhoto, setHasPhoto] = useState(initialHasPhoto);
  const [imageVersion, setImageVersion] = useState(0);
  const [pendingAction, setPendingAction] = useState<"upload" | "delete" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function openFilePicker(): void {
    inputRef.current?.click();
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file) {
      return;
    }

    if (
      !PROFILE_PHOTO_ALLOWED_TYPES.includes(
        file.type as (typeof PROFILE_PHOTO_ALLOWED_TYPES)[number],
      )
    ) {
      setMessage(null);
      setError("Selecciona una imagen JPEG, PNG o WebP.");
      return;
    }

    if (file.size > PROFILE_PHOTO_MAX_SIZE_BYTES) {
      setMessage(null);
      setError("La fotografía no puede superar los 5 MB.");
      return;
    }

    setPendingAction("upload");
    setMessage(null);
    setError(null);

    try {
      const formData = new FormData();
      formData.set("photo", file);

      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
      });

      const body = (await response.json()) as ApiResponse<ProfilePhotoMutationData>;

      if (!response.ok || !body.data) {
        throw new Error(body.error?.message ?? "No fue posible guardar la fotografía.");
      }

      setHasPhoto(body.data.hasPhoto);
      setImageVersion(Date.now());

      setMessage(
        body.data.previousPhotoCleanupFailed
          ? "La fotografía fue actualizada, pero el archivo anterior no pudo limpiarse automáticamente."
          : "La fotografía fue actualizada correctamente.",
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No fue posible guardar la fotografía.");
    } finally {
      setPendingAction(null);
    }
  }

  async function removePhoto(): Promise<void> {
    if (!window.confirm("¿Deseas eliminar esta fotografía de perfil?")) {
      return;
    }

    setPendingAction("delete");
    setMessage(null);
    setError(null);

    try {
      const response = await fetch(endpoint, {
        method: "DELETE",
      });

      const body = (await response.json()) as ApiResponse<ProfilePhotoMutationData>;

      if (!response.ok || !body.data) {
        throw new Error(body.error?.message ?? "No fue posible eliminar la fotografía.");
      }

      setHasPhoto(false);

      setMessage(
        body.data.previousPhotoCleanupFailed
          ? "La referencia fue eliminada, pero el archivo no pudo limpiarse automáticamente."
          : "La fotografía fue eliminada correctamente.",
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No fue posible eliminar la fotografía.");
    } finally {
      setPendingAction(null);
    }
  }

  const imageSize = compact ? 80 : 96;
  const imageUrl = imageVersion > 0 ? `${endpoint}?v=${imageVersion}` : endpoint;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div
          className={[
            "border-surface relative flex shrink-0 items-center justify-center overflow-hidden rounded-2xl border-4 bg-rose-600 font-bold text-white shadow-md",
            compact ? "h-20 w-20 text-2xl" : "h-24 w-24 text-3xl",
          ].join(" ")}
        >
          {hasPhoto ? (
            <Image
              key={imageUrl}
              src={imageUrl}
              alt={alt}
              width={imageSize}
              height={imageSize}
              unoptimized
              className="h-full w-full object-cover"
              onError={() => setHasPhoto(false)}
            />
          ) : (
            <span aria-hidden="true">{initials}</span>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={openFilePicker} disabled={pendingAction !== null}>
            {pendingAction === "upload"
              ? "Guardando..."
              : hasPhoto
                ? "Cambiar fotografía"
                : "Subir fotografía"}
          </Button>

          {hasPhoto ? (
            <Button
              type="button"
              variant="danger"
              onClick={removePhoto}
              disabled={pendingAction !== null}
            >
              {pendingAction === "delete" ? "Eliminando..." : "Eliminar"}
            </Button>
          ) : null}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        aria-label="Seleccionar fotografía de perfil"
        onChange={handleFileChange}
        disabled={pendingAction !== null}
      />

      <p className="text-muted text-xs">
        Formatos permitidos: JPEG, PNG y WebP. Tamaño máximo: 5 MB.
      </p>

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
    </div>
  );
}
