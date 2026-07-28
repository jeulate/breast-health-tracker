"use client";

import { useState } from "react";
import { AdminUserCreateForm } from "@/components/admin/AdminUserCreateForm";
import { AdminUsersTable } from "@/components/admin/AdminUsersTable";
import { Button } from "@/components/ui/Button";
import type { PublicUser } from "@/types";
import { AdminUserEditForm } from "@/components/admin/AdminUserEditForm";

interface AdminUsersManagerProps {
  initialUsers: PublicUser[];
}

export function AdminUsersManager({ initialUsers }: Readonly<AdminUsersManagerProps>) {
  const [users, setUsers] = useState(initialUsers);
  const [isCreating, setIsCreating] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<PublicUser | null>(null);

  function handleCreated(user: PublicUser) {
    setUsers((currentUsers) =>
      [...currentUsers, user].sort((first, second) => first.name.localeCompare(second.name, "es")),
    );
    setIsCreating(false);
    setSuccessMessage(`El usuario ${user.name} fue creado correctamente.`);
  }

  function handleOpenForm() {
    setSuccessMessage(null);
    setIsCreating(true);
    setEditingUser(null);
  }

  function handleEdit(user: PublicUser) {
    setSuccessMessage(null);
    setIsCreating(false);
    setEditingUser(user);
  }

  function handleUpdated(updatedUser: PublicUser) {
    setUsers((currentUsers) =>
      currentUsers
        .map((user) => (user.id === updatedUser.id ? updatedUser : user))
        .sort((first, second) => first.name.localeCompare(second.name, "es")),
    );

    setEditingUser(null);
    setSuccessMessage(`El usuario ${updatedUser.name} fue actualizado correctamente.`);
  }
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
          {users.length} {users.length === 1 ? "usuario" : "usuarios"}
        </p>

        {!isCreating ? (
          <Button type="button" onClick={handleOpenForm}>
            Nuevo usuario
          </Button>
        ) : null}
      </div>

      {successMessage ? (
        <div
          role="status"
          className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300"
        >
          {successMessage}
        </div>
      ) : null}

      {isCreating ? (
        <AdminUserCreateForm onCreated={handleCreated} onCancel={() => setIsCreating(false)} />
      ) : null}

      {editingUser ? (
        <AdminUserEditForm
          user={editingUser}
          onUpdated={handleUpdated}
          onCancel={() => setEditingUser(null)}
        />
      ) : null}

      <AdminUsersTable users={users} onEdit={handleEdit} />
    </div>
  );
}
