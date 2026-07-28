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

const PROFILE_PHOTO_UPDATED_EVENT = "profile-photo-updated";

interface ProfilePhotoUpdatedEventDetail {
  endpoint: string;
  hasPhoto: boolean;
  version: number;
}

function dispatchProfilePhotoUpdated(detail: ProfilePhotoUpdatedEventDetail): void {
  window.dispatchEvent(
    new CustomEvent<ProfilePhotoUpdatedEventDetail>(PROFILE_PHOTO_UPDATED_EVENT, { detail }),
  );
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
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

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
    setUploadProgress(0);
    setMessage(null);
    setError(null);

    try {
      const formData = new FormData();
      formData.set("photo", file);

      const result = await uploadProfilePhoto(endpoint, formData, setUploadProgress);

      const nextImageVersion = Date.now();

      setHasPhoto(result.hasPhoto);
      setImageVersion(nextImageVersion);

      dispatchProfilePhotoUpdated({
        endpoint,
        hasPhoto: result.hasPhoto,
        version: nextImageVersion,
      });

      setMessage(
        result.previousPhotoCleanupFailed
          ? "La fotografía fue actualizada, pero el archivo anterior no pudo limpiarse automáticamente."
          : "La fotografía fue actualizada correctamente.",
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No fue posible guardar la fotografía.");
    } finally {
      setPendingAction(null);
      setUploadProgress(0);
    }
  }

  async function removePhoto(): Promise<void> {
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
      setImageVersion(0);
      setShowDeleteConfirmation(false);

      dispatchProfilePhotoUpdated({
        endpoint,
        hasPhoto: false,
        version: Date.now(),
      });

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
              onClick={() => setShowDeleteConfirmation(true)}
              disabled={pendingAction !== null}
            >
              Eliminar
            </Button>
          ) : null}
        </div>
      </div>

      {pendingAction === "upload" ? (
        <div
          className="w-full sm:max-w-xs"
          role="progressbar"
          aria-label="Progreso de carga de la fotografía"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={uploadProgress}
        >
          <div className="flex justify-between text-xs text-slate-600 dark:text-slate-300">
            <span>Cargando fotografía</span>
            <span>{uploadProgress}%</span>
          </div>

          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
            <div
              className="h-full rounded-full bg-rose-600 transition-[width]"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      ) : null}
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
      {showDeleteConfirmation ? (
        <div
          role="presentation"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowDeleteConfirmation(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-profile-photo-title"
            aria-describedby="delete-profile-photo-description"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900"
          >
            <h2
              id="delete-profile-photo-title"
              className="text-lg font-semibold text-slate-950 dark:text-white"
            >
              Eliminar fotografía
            </h2>

            <p
              id="delete-profile-photo-description"
              className="mt-2 text-sm text-slate-600 dark:text-slate-300"
            >
              ¿Confirmas que deseas eliminar esta fotografía de perfil? Se volverán a mostrar las
              iniciales del usuario.
            </p>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowDeleteConfirmation(false)}
                disabled={pendingAction === "delete"}
              >
                Cancelar
              </Button>

              <Button
                type="button"
                variant="danger"
                onClick={() => void removePhoto()}
                disabled={pendingAction === "delete"}
              >
                {pendingAction === "delete" ? "Eliminando..." : "Eliminar fotografía"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function uploadProfilePhoto(
  endpoint: string,
  formData: FormData,
  onProgress: (progress: number) => void,
): Promise<ProfilePhotoMutationData> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();

    request.open("POST", endpoint);

    request.upload.addEventListener("progress", (event) => {
      if (!event.lengthComputable) {
        return;
      }

      onProgress(Math.round((event.loaded / event.total) * 100));
    });

    request.addEventListener("load", () => {
      try {
        const body = JSON.parse(request.responseText) as ApiResponse<ProfilePhotoMutationData>;

        if (request.status < 200 || request.status >= 300 || !body.success || !body.data) {
          reject(new Error(body.error?.message ?? "No fue posible guardar la fotografía."));
          return;
        }

        onProgress(100);
        resolve(body.data);
      } catch {
        reject(new Error("El servidor devolvió una respuesta inválida."));
      }
    });

    request.addEventListener("error", () => {
      reject(new Error("No fue posible conectar con el servidor."));
    });

    request.addEventListener("abort", () => {
      reject(new Error("La carga de la fotografía fue cancelada."));
    });

    request.send(formData);
  });
}
