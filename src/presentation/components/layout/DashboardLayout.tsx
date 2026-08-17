"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { authService } from "@/application/services/AuthService";
import { useAuthSession } from "@/shared/hooks/useAuthSession";

interface NavSubItem {
  label: string;
  href: string;
}

interface NavItem {
  label: string;
  icon: React.ReactNode;
  href?: string;
  children?: NavSubItem[];
}

const navItems: NavItem[] = [
  {
    label: "Customer",
    href: "/customer",
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
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
    ),
  },
  {
    label: "Product",
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
    children: [{ label: "Input Barang", href: "/product/input-stock" }],
  },
  {
    label: "Account",
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
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        />
      </svg>
    ),
    children: [
      { label: "Add User", href: "/account/add-user" },
      { label: "Delete User", href: "/account/delete-user" },
    ],
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
 * Logo placeholder brand WIRA MAKMUR AKSESORIS (ganti URL saat asset Google Drive tersedia).
 */
function BrandLogo() {
  return (
    <div
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-white sm:h-10 sm:w-10"
      aria-hidden="true"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="h-5 w-5 sm:h-6 sm:w-6"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 9l9-6 9 6v11a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1V9z"
        />
      </svg>
    </div>
  );
}

/**
 * Label brand di header dashboard.
 */
function BrandLabel() {
  return (
    <span
      className="truncate text-[11px] font-bold uppercase leading-tight tracking-wide text-slate-900 sm:text-xs md:text-sm md:whitespace-normal"
      title="WIRA MAKMUR AKSESORIS"
    >
      WIRA MAKMUR AKSESORIS
    </span>
  );
}

/**
 * Ikon chevron untuk indikator expand/collapse menu.
 */
function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={`h-4 w-4 shrink-0 transition-transform duration-200 ${
        expanded ? "rotate-180" : ""
      }`}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
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
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    Product: pathname.startsWith("/product"),
    Account: pathname.startsWith("/account"),
  });
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
   * Membuka atau menutup sub-menu pada item navigasi.
   */
  function toggleSubmenu(label: string) {
    setExpandedMenus((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
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
    if (pathname.startsWith("/product")) {
      setExpandedMenus((prev) => ({ ...prev, Product: true }));
    }

    if (pathname.startsWith("/account")) {
      setExpandedMenus((prev) => ({ ...prev, Account: true }));
    }
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
            Dashboard Admin
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
            if (item.href) {
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={closeSidebar}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                    isActive
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              );
            }

            const isExpanded = expandedMenus[item.label] ?? false;
            const isChildActive =
              item.children?.some((child) => pathname === child.href) ?? false;

            return (
              <div key={item.label}>
                <button
                  type="button"
                  onClick={() => toggleSubmenu(item.label)}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                    isChildActive
                      ? "bg-slate-100 text-slate-900"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                  aria-expanded={isExpanded}
                >
                  {item.icon}
                  <span className="flex-1 text-left">{item.label}</span>
                  <ChevronIcon expanded={isExpanded} />
                </button>

                <div
                  className={`overflow-hidden transition-all duration-200 ${
                    isExpanded ? "max-h-48 opacity-100" : "max-h-0 opacity-0"
                  }`}
                >
                  <div className="mt-1 space-y-1 pl-4">
                    {item.children?.map((child) => {
                      const isActive = pathname === child.href;

                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={closeSidebar}
                          className={`flex items-center rounded-xl py-2.5 pl-8 pr-4 text-sm font-medium transition ${
                            isActive
                              ? "bg-slate-900 text-white"
                              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                          }`}
                        >
                          {child.label}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </nav>
      </aside>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
          <div className="flex items-center justify-between gap-2 px-4 py-3 md:gap-4 md:px-6">
            <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={toggleSidebar}
                className="inline-flex shrink-0 items-center justify-center rounded-lg border border-slate-300 p-2 text-slate-700 transition hover:bg-slate-100 md:hidden"
                aria-controls={sidebarId}
                aria-expanded={isSidebarOpen}
                aria-label={isSidebarOpen ? "Tutup menu" : "Buka menu"}
              >
                <MenuIcon />
              </button>

              <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                <BrandLogo />
                <BrandLabel />
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="shrink-0 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 sm:px-4"
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
