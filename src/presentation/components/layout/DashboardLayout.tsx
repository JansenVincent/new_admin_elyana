"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { authService } from "@/application/services/AuthService";
import { useAuthSession } from "@/shared/hooks/useAuthSession";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    label: "Product",
    href: "/product",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="h-5 w-5 shrink-0"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
        />
      </svg>
    ),
  },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
}

/**
 * Ikon hamburger untuk membuka side menu di mobile.
 */
function MenuIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 6h16M4 12h16M4 18h16"
      />
    </svg>
  );
}

/**
 * Ikon silang untuk menutup side menu di mobile.
 */
function CloseIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );
}

/**
 * Layout dashboard dengan header, sidebar menu responsif, dan area konten utama.
 * Di mobile, sidebar menjadi drawer yang dapat dibuka/ditutup.
 */
export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const { user, isLoading } = useAuthSession();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const sidebarId = useId();

  /**
   * Menutup side menu (drawer) di mobile.
   */
  function closeSidebar() {
    setIsSidebarOpen(false);
  }

  /**
   * Membuka atau menutup side menu di mobile.
   */
  function toggleSidebar() {
    setIsSidebarOpen((open) => !open);
  }

  /**
   * Menangani logout dan kembali ke halaman login.
   */
  function handleLogout() {
    authService.logout();
    window.location.href = "/login";
  }

  useEffect(() => {
    closeSidebar();
  }, [pathname]);

  useEffect(() => {
    /**
     * Menutup drawer saat tombol Escape ditekan.
     */
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeSidebar();
      }
    }

    if (!isSidebarOpen) {
      return;
    }

    document.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isSidebarOpen]);

  if (isLoading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-slate-500">Memuat...</p>
      </main>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <div
        className={`fixed inset-0 z-40 bg-slate-900/40 transition-opacity duration-300 md:hidden ${
          isSidebarOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
        aria-hidden="true"
        onClick={closeSidebar}
      />

      <aside
        id={sidebarId}
        className={`fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r border-slate-200 bg-white shadow-xl transition-transform duration-300 ease-out md:static md:z-auto md:w-64 md:max-w-none md:translate-x-0 md:shadow-none ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Menu navigasi"
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-5 md:px-6">
          <Link
            href="/home"
            onClick={closeSidebar}
            className="text-lg font-bold text-slate-900 transition hover:text-slate-600"
          >
            Dashboard Admin Elyana
          </Link>

          <button
            type="button"
            onClick={closeSidebar}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 md:hidden"
            aria-label="Tutup menu"
          >
            <CloseIcon />
          </button>
        </div>

        <nav className="flex-1 space-y-1 p-4" aria-label="Menu utama">
          {navItems.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeSidebar}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                  isActive
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
          <div className="flex items-center justify-between gap-3 px-4 py-4 md:justify-end md:px-6">
            <button
              type="button"
              onClick={toggleSidebar}
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 p-2 text-slate-700 transition hover:bg-slate-100 md:hidden"
              aria-controls={sidebarId}
              aria-expanded={isSidebarOpen}
              aria-label={isSidebarOpen ? "Tutup menu" : "Buka menu"}
            >
              <MenuIcon />
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Logout
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
