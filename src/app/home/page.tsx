"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AUTH_SESSION_KEY } from "@/shared/constants/auth";
import type { AdminUser } from "@/domain/entities/AdminUser";
import { authService } from "@/application/services/AuthService";

/**
 * Halaman dashboard utama setelah login berhasil.
 */
export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<AdminUser | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem(AUTH_SESSION_KEY);

    if (!stored) {
      router.replace("/login");
      return;
    }

    try {
      setUser(JSON.parse(stored) as AdminUser);
    } catch {
      router.replace("/login");
    }
  }, [router]);

  /**
   * Menangani logout dan kembali ke halaman login.
   */
  function handleLogout() {
    authService.logout();
    router.push("/login");
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-slate-500">Memuat...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <h1 className="text-xl font-bold text-slate-900">Dashboard Admin Ely</h1>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            Logout
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Selamat datang!
          </h2>
          <p className="mt-2 text-slate-600">
            Anda login sebagai <span className="font-medium">{user.email}</span>
          </p>
        </div>
      </section>
    </main>
  );
}
