"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { PublicUser, UserRole, UserStatus } from "@/types";
import { ProfilePhotoEditor } from "@/components/profile-photo/ProfilePhotoEditor";

interface AdminUserEditFormProps {
  user: PublicUser;
  onUpdated: (user: PublicUser) => void;
  onCancel: () => void;
}

interface ApiSuccessResponse {
  success: true;
  data: PublicUser;
}

interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

type UpdateUserResponse = ApiSuccessResponse | ApiErrorResponse;

export function AdminUserEditForm({ user, onUpdated, onCancel }: Readonly<AdminUserEditFormProps>) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const userInitials = user.name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);

    const payload = {
      name: String(formData.get("name") ?? ""),
      role: String(formData.get("role") ?? user.role) as UserRole,
      status: String(formData.get("status") ?? user.status) as UserStatus,
    };

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const body = (await response.json()) as UpdateUserResponse;

      if (!response.ok || !body.success) {
        setErrorMessage(
          body.success ? "No fue posible actualizar el usuario." : body.error.message,
        );
        return;
      }

      onUpdated(body.data);
    } catch {
      setErrorMessage("No fue posible conectar con el servidor. Inténtalo nuevamente.");
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
        <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Editar usuario</h2>

        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Actualiza los datos y permisos de {user.name}.
        </p>
      </div>

      {errorMessage ? (
        <div
          role="alert"
          className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300"
        >
          {errorMessage}
        </div>
      ) : null}

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <div className="md:col-span-2">
          <ProfilePhotoEditor
            endpoint={`/api/admin/users/${encodeURIComponent(user.id)}/profile-photo`}
            initials={userInitials || "US"}
            alt={`Fotografía de perfil de ${user.name}`}
            initialHasPhoto={Boolean(user.profilePhotoPath)}
          />
        </div>
        <Input
          id="edit-admin-user-name"
          name="name"
          label="Nombre completo"
          defaultValue={user.name}
          autoComplete="name"
          required
          disabled={isSubmitting}
        />

        <Input
          id="edit-admin-user-email"
          label="Correo electrónico"
          value={user.email}
          disabled
          readOnly
        />

        <div>
          <label
            htmlFor="edit-admin-user-role"
            className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200"
          >
            Rol
          </label>

          <select
            id="edit-admin-user-role"
            name="role"
            defaultValue={user.role}
            disabled={isSubmitting}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 transition outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          >
            <option value="PROFESSIONAL">Profesional</option>
            <option value="ADMIN">Administrador</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="edit-admin-user-status"
            className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200"
          >
            Estado
          </label>

          <select
            id="edit-admin-user-status"
            name="status"
            defaultValue={user.status}
            disabled={isSubmitting}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 transition outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          >
            <option value="ACTIVE">Activo</option>
            <option value="INACTIVE">Inactivo</option>
          </select>
        </div>
      </div>

      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Guardando cambios..." : "Guardar cambios"}
        </Button>
      </div>
    </form>
  );
}
