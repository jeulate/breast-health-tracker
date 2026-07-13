"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Inicio", icon: "⊞" },
  { href: "/dashboard/patients", label: "Pacientes", icon: "♡" },
  // Phase 2 – Findings, symptoms, cycles
  // Phase 3 – Habits, medical controls
  // Phase 4 – Telegram bot
  // Phase 5 – Reminders
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-64 flex-col border-r border-gray-200 bg-white">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-gray-200 px-6">
        <span className="text-lg font-bold text-rose-600">BI-RADS Tracker</span>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-1 p-4">
        {navItems.map(({ href, label, icon }) => {
          const isActive =
            pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-rose-50 text-rose-700"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <span aria-hidden="true">{icon}</span>
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-200 p-4">
        <p className="text-xs text-gray-400">v0.1.0 – Fase 1</p>
      </div>
    </aside>
  );
}
