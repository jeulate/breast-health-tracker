import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/forms/LoginForm";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export const metadata: Metadata = {
  title: "Iniciar sesión | BI-RADS Tracker",
};

export default function LoginPage() {
  return (
    <main className="bg-background text-foreground relative flex min-h-dvh items-center justify-center overflow-hidden px-4 py-10 sm:px-6">
      {/* Elementos decorativos */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-rose-200/40 blur-3xl dark:bg-rose-500/10" />

        <div className="absolute -right-24 -bottom-32 h-80 w-80 rounded-full bg-violet-200/30 blur-3xl dark:bg-violet-500/10" />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,var(--background)_75%)]" />
      </div>

      {/* Selector de tema */}
      <div className="absolute top-4 right-4 z-20 sm:top-6 sm:right-6">
        <ThemeToggle />
      </div>

      <div className="border-border bg-surface relative z-10 grid w-full max-w-5xl overflow-hidden rounded-3xl border shadow-2xl shadow-slate-900/10 lg:grid-cols-[1.05fr_0.95fr] dark:shadow-black/30">
        {/* Panel informativo */}
        <section className="relative hidden overflow-hidden bg-slate-950 px-10 py-12 text-white lg:flex lg:flex-col lg:justify-between">
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(244,63,94,0.35),transparent_55%)]"
          />

          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-600 text-sm font-bold text-white shadow-lg shadow-rose-500/20">
                BT
              </span>

              <div>
                <p className="text-lg font-bold">BI-RADS Tracker</p>

                <p className="text-sm text-slate-400">Health Dashboard</p>
              </div>
            </div>

            <div className="mt-16 max-w-md">
              <p className="text-sm font-semibold tracking-[0.2em] text-rose-300 uppercase">
                Seguimiento organizado
              </p>

              <h1 className="mt-4 text-4xl leading-tight font-bold tracking-tight">
                Gestiona el seguimiento de pacientes desde un solo lugar
              </h1>

              <p className="mt-5 text-base leading-7 text-slate-300">
                Consulta pacientes, controles, alertas y recordatorios mediante un panel seguro y
                centralizado.
              </p>
            </div>
          </div>

          <div className="relative z-10 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
            <p className="text-sm leading-6 text-slate-300">
              Esta plataforma es una herramienta de apoyo y organización. No realiza diagnósticos ni
              sustituye la consulta con profesionales de salud.
            </p>
          </div>
        </section>

        {/* Formulario */}
        <section className="flex min-h-[560px] items-center px-6 py-10 sm:px-10 lg:px-12">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-8">
              <div className="mb-5 flex items-center gap-3 lg:hidden">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-rose-600 text-sm font-bold text-white shadow-sm shadow-rose-500/20">
                  BT
                </span>

                <div>
                  <p className="text-foreground font-bold">BI-RADS Tracker</p>

                  <p className="text-muted text-xs">Health Dashboard</p>
                </div>
              </div>

              <p className="text-sm font-medium text-rose-600 dark:text-rose-400">
                Acceso administrativo
              </p>

              <h2 className="text-foreground mt-2 text-3xl font-bold tracking-tight">
                Iniciar sesión
              </h2>

              <p className="text-muted mt-2 text-sm leading-6">
                Ingresa tus credenciales para acceder al panel de administración.
              </p>
            </div>

            <Suspense fallback={<LoginFormSkeleton />}>
              <LoginForm />
            </Suspense>

            <div className="border-border mt-8 border-t pt-6">
              <p className="text-muted text-center text-xs leading-5">
                El acceso está restringido a usuarios autorizados. Las actividades pueden quedar
                registradas por motivos de seguridad.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function LoginFormSkeleton() {
  return (
    <div aria-hidden="true" className="flex animate-pulse flex-col gap-5">
      <div className="space-y-2">
        <div className="bg-surface-secondary h-4 w-28 rounded" />
        <div className="bg-surface-secondary h-11 rounded-lg" />
      </div>

      <div className="space-y-2">
        <div className="bg-surface-secondary h-4 w-24 rounded" />
        <div className="bg-surface-secondary h-11 rounded-lg" />
      </div>

      <div className="h-11 rounded-lg bg-rose-200 dark:bg-rose-500/20" />
    </div>
  );
}
