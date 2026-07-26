export default function ProfileLoading() {
  return (
    <div className="flex min-w-0 animate-pulse flex-col gap-6" aria-label="Cargando perfil">
      <div className="bg-surface-secondary h-20 max-w-xl rounded-xl" />
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="border-border bg-surface h-96 rounded-2xl border xl:col-span-2" />
        <div className="border-border bg-surface h-64 rounded-2xl border" />
      </div>
    </div>
  );
}
