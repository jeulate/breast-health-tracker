import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ThemePreferenceSync } from "@/components/profile/ThemePreferenceSync";
import { DEFAULT_APP_SETTINGS } from "@/features/admin-settings";
import { getSession } from "@/lib/auth/session";
import { adminSettingsService } from "@/services/admin-settings.service";
import { UserProfileService } from "@/services/user-profile.service";
import type { Metadata } from "next";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await adminSettingsService.getSettings().catch(() => DEFAULT_APP_SETTINGS);

  const appName = settings.appName.trim() || DEFAULT_APP_SETTINGS.appName;

  return {
    title: {
      default: appName,
      template: `%s | ${appName}`,
    },
  };
}

export default async function DashboardLayout({ children }: Readonly<DashboardLayoutProps>) {
  const session = await getSession();

  const [profile, settings] = await Promise.all([
    session ? UserProfileService.get(session.sub) : Promise.resolve(null),
    adminSettingsService.getSettings().catch(() => DEFAULT_APP_SETTINGS),
  ]);

  return (
    <>
      {profile && <ThemePreferenceSync theme={profile.preferences.theme} />}

      <DashboardShell
        appName={settings.appName}
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
