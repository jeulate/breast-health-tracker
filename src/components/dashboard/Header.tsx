"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface HeaderProps {
  userEmail?: string;
}

export function Header({ userEmail }: HeaderProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
      <h1 className="text-base font-semibold text-gray-800">Panel de administración</h1>
      <div className="flex items-center gap-4">
        {userEmail && <span className="text-sm text-gray-500">{userEmail}</span>}
        <button
          onClick={handleLogout}
          disabled={loading}
          className="rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50"
        >
          {loading ? "Saliendo…" : "Cerrar sesión"}
        </button>
      </div>
    </header>
  );
}
