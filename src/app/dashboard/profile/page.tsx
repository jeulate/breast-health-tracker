import type { Metadata } from "next";
import { ProfileForm } from "@/components/profile/ProfileForm";

export const metadata: Metadata = {
  title: "Mi perfil | BI-RADS Tracker",
};

export default function ProfilePage() {
  return (
    <div className="flex min-w-0 flex-col gap-6">
      <section>
        <p className="text-sm font-medium text-rose-600 dark:text-rose-400">Configuración personal</p>
        <h2 className="text-foreground mt-1 text-2xl font-bold tracking-tight">Mi perfil</h2>
        <p className="text-muted mt-1 text-sm">
          Administra tu información, apariencia y preferencias de notificación.
        </p>
      </section>
      <ProfileForm />
    </div>
  );
}
