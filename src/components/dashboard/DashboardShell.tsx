"use client";

import { useCallback, useState } from "react";
import { Header } from "@/components/dashboard/Header";
import { Sidebar } from "@/components/dashboard/Sidebar";

interface DashboardShellProps {
  children: React.ReactNode;
  userEmail?: string;
}

const DESKTOP_MEDIA_QUERY = "(min-width: 1024px)";

export function DashboardShell({ children, userEmail }: Readonly<DashboardShellProps>) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(false);

  const toggleSidebar = useCallback(() => {
    const isDesktop = window.matchMedia(DESKTOP_MEDIA_QUERY).matches;

    if (isDesktop) {
      setIsDesktopSidebarCollapsed((current) => !current);
      return;
    }

    setIsMobileSidebarOpen((current) => !current);
  }, []);

  const closeMobileSidebar = useCallback(() => {
    setIsMobileSidebarOpen(false);
  }, []);

  return (
    <div className="bg-background text-foreground fixed inset-0 flex overflow-hidden">
      <Sidebar
        isMobileOpen={isMobileSidebarOpen}
        isDesktopCollapsed={isDesktopSidebarCollapsed}
        onMobileClose={closeMobileSidebar}
      />

      {isMobileSidebarOpen && (
        <button
          type="button"
          aria-label="Cerrar menú lateral"
          onClick={closeMobileSidebar}
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-[1px] lg:hidden"
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header
          userEmail={userEmail}
          isMobileSidebarOpen={isMobileSidebarOpen}
          isDesktopSidebarCollapsed={isDesktopSidebarCollapsed}
          onMenuClick={toggleSidebar}
        />

        <main className="bg-background min-h-0 min-w-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
          <div className="mx-auto w-full max-w-7xl min-w-0">{children}</div>
        </main>
      </div>
    </div>
  );
}
