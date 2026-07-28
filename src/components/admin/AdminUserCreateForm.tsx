"use client";

import Image from "next/image";
import { type ChangeEvent, type FormEvent, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  PROFILE_PHOTO_ALLOWED_TYPES,
  PROFILE_PHOTO_MAX_SIZE_BYTES,
} from "@/features/profile-photo/profile-photo.types";
import type { ApiResponse, PublicUser, UserRole, UserStatus } from "@/types";

interface AdminUserCreateFormProps {
  onCreated: (user: PublicUser) => void;
  onCancel: () => void;
}

interface ProfilePhotoMutationData {
  hasPhoto: boolean;
  previousPhotoCleanupFailed: boolean;
}

export function AdminUserCreateForm({ onCreated, onCancel }: Readonly<AdminUserCreateFormProps>) {
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [createdUserWithoutPhoto, setCreatedUserWithoutPhoto] = useState<PublicUser | null>(null);
  const isFormLocked = isSubmitting || createdUserWithoutPhoto !== null;

  useEffect(() => {
    return () => {
      if (photoPreviewUrl) {
        URL.revokeObjectURL(photoPreviewUrl);
      }
    };
  }, [photoPreviewUrl]);

  function selectPhoto(event: ChangeEvent<HTMLInputElement>): void {
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
      setErrorMessage("Selecciona una imagen JPEG, PNG o WebP.");
      return;
    }

    if (file.size > PROFILE_PHOTO_MAX_SIZE_BYTES) {
      setErrorMessage("La fotografía no puede superar los 5 MB.");
      return;
    }

    const nextPreviewUrl = URL.createObjectURL(file);

    setPhotoPreviewUrl((currentUrl) => {
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
      }

      return nextPreviewUrl;
    });

    setSelectedPhoto(file);
    setErrorMessage(null);
  }

  function removeSelectedPhoto(): void {
    setPhotoPreviewUrl((currentUrl) => {
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
      }

      return null;
    });

    setSelectedPhoto(null);
  }

  async function uploadProfilePhoto(userId: string, photo: File): Promise<void> {
    const photoFormData = new FormData();
    photoFormData.set("photo", photo);

    const response = await fetch(`/api/admin/users/${encodeURIComponent(userId)}/profile-photo`, {
      method: "POST",
      body: photoFormData,
    });

    const body = (await response.json()) as ApiResponse<ProfilePhotoMutationData>;

    if (!response.ok || !body.success || !body.data) {
      throw new Error(body.error?.message ?? "No fue posible guardar la fotografía.");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    const form = event.currentTarget;
    const formData = new FormData(form);

    const payload = {
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      role: String(formData.get("role") ?? "PROFESSIONAL") as UserRole,
      status: String(formData.get("status") ?? "ACTIVE") as UserStatus,
    };

    let createdUser: PublicUser | null = null;

    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const body = (await response.json()) as ApiResponse<PublicUser>;

      if (!response.ok || !body.success || !body.data) {
        setErrorMessage(body.error?.message ?? "No fue posible crear el usuario.");
        return;
      }

      createdUser = body.data;

      if (selectedPhoto) {
        await uploadProfilePhoto(createdUser.id, selectedPhoto);
      }

      form.reset();
      removeSelectedPhoto();
      onCreated(createdUser);
    } catch (error) {
      if (createdUser) {
        setCreatedUserWithoutPhoto(createdUser);
        setErrorMessage(
          `El usuario ${createdUser.name} fue creado, pero no fue posible guardar su fotografía. Puedes agregarla posteriormente desde la edición de su perfil.`,
        );

        return;
      }

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No fue posible conectar con el servidor. Inténtalo nuevamente.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
    >
      <div>
        <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Nuevo usuario</h2>

        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Registra una cuenta, asigna sus permisos y añade una fotografía opcional.
        </p>
      </div>

      {errorMessage ? (
        <div
          role="alert"
          className={
            createdUserWithoutPhoto
              ? "mt-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300"
              : "mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300"
          }
        >
          {errorMessage}
        </div>
      ) : null}

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <Input
          id="admin-user-name"
          name="name"
          label="Nombre completo"
          autoComplete="name"
          required
          disabled={isFormLocked}
        />

        <Input
          id="admin-user-email"
          name="email"
          type="email"
          label="Correo electrónico"
          autoComplete="email"
          required
          disabled={isFormLocked}
        />

        <Input
          id="admin-user-password"
          name="password"
          type="password"
          label="Contraseña temporal"
          autoComplete="new-password"
          minLength={8}
          required
          disabled={isFormLocked}
        />

        <div>
          <label
            htmlFor="admin-user-role"
            className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200"
          >
            Rol
          </label>

          <select
            id="admin-user-role"
            name="role"
            defaultValue="PROFESSIONAL"
            disabled={isFormLocked}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 transition outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          >
            <option value="PROFESSIONAL">Profesional</option>
            <option value="ADMIN">Administrador</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="admin-user-status"
            className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200"
          >
            Estado
          </label>

          <select
            id="admin-user-status"
            name="status"
            defaultValue="ACTIVE"
            disabled={isFormLocked}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 transition outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          >
            <option value="ACTIVE">Activo</option>
            <option value="INACTIVE">Inactivo</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-200">
            Fotografía de perfil
            <span className="ml-1 font-normal text-slate-500">(opcional)</span>
          </p>

          <div className="flex flex-col gap-4 rounded-xl border border-dashed border-slate-300 p-4 sm:flex-row sm:items-center dark:border-slate-700">
            <div className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-rose-600 text-2xl font-bold text-white shadow-sm">
              {photoPreviewUrl ? (
                <Image
                  src={photoPreviewUrl}
                  alt="Vista previa de la fotografía seleccionada"
                  fill
                  sizes="96px"
                  unoptimized
                  className="object-cover"
                />
              ) : (
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-10 w-10"
                >
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 21a8 8 0 0 1 16 0" />
                </svg>
              )}
            </div>

            <div className="flex-1">
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => photoInputRef.current?.click()}
                  disabled={isFormLocked}
                >
                  {selectedPhoto ? "Cambiar fotografía" : "Seleccionar fotografía"}
                </Button>

                {selectedPhoto ? (
                  <Button
                    type="button"
                    variant="danger"
                    onClick={removeSelectedPhoto}
                    disabled={isFormLocked}
                  >
                    Quitar
                  </Button>
                ) : null}
              </div>

              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Formatos permitidos: JPEG, PNG y WebP. Tamaño máximo: 5 MB.
              </p>

              {selectedPhoto ? (
                <p className="mt-1 truncate text-xs font-medium text-slate-700 dark:text-slate-200">
                  {selectedPhoto.name}
                </p>
              ) : null}
            </div>
          </div>

          <input
            ref={photoInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            aria-label="Seleccionar fotografía de perfil"
            onChange={selectPhoto}
            disabled={isFormLocked}
          />
        </div>
      </div>

      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        {!createdUserWithoutPhoto ? (
          <>
            <Button type="button" variant="secondary" onClick={onCancel} disabled={isFormLocked}>
              Cancelar
            </Button>

            <Button type="submit" disabled={isFormLocked}>
              {isSubmitting
                ? selectedPhoto
                  ? "Creando usuario y guardando fotografía..."
                  : "Creando usuario..."
                : "Crear usuario"}
            </Button>
          </>
        ) : (
          <Button type="button" onClick={() => onCreated(createdUserWithoutPhoto)}>
            Finalizar sin fotografía
          </Button>
        )}
      </div>
    </form>
  );
}
