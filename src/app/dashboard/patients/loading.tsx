export default function PatientsLoading() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Cargando pacientes">
      <div className="space-y-2">
        <div className="bg-surface-secondary h-4 w-20 animate-pulse rounded" />
        <div className="bg-surface-secondary h-8 w-48 animate-pulse rounded-lg" />
        <div className="bg-surface-secondary h-4 w-full max-w-md animate-pulse rounded" />
      </div>

      <div className="bg-surface-secondary h-36 animate-pulse rounded-2xl" />
      <div className="bg-surface-secondary h-96 animate-pulse rounded-2xl" />
    </div>
  );
}
