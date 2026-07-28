import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ThemePreferenceSync } from "@/components/profile/ThemePreferenceSync";
import { getSession } from "@/lib/auth/session";
import { UserProfileService } from "@/services/user-profile.service";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default async function DashboardLayout({ children }: Readonly<DashboardLayoutProps>) {
  const session = await getSession();
  const profile = session ? await UserProfileService.get(session.sub) : null;

  return (
    <>
      {profile && <ThemePreferenceSync theme={profile.preferences.theme} />}

      <DashboardShell
        userName={profile?.user.name}
        userEmail={profile?.user.email ?? session?.email}
        userRole={profile?.user.role ?? session?.role}
        hasProfilePhoto={Boolean(profile?.user.profilePhotoPath)}
      >
        {children}
      </DashboardShell>
    </>
  );
}
