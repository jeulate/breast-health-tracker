import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { getSession } from "@/lib/auth/session";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default async function DashboardLayout({ children }: Readonly<DashboardLayoutProps>) {
  const session = await getSession();

  return <DashboardShell userEmail={session?.email}>{children}</DashboardShell>;
}
