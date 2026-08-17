"use client";

import { useAuthSession } from "@/shared/hooks/useAuthSession";
import { toLowerCaseText, toTitleCase } from "@/shared/utils/stringFormat";

/**
 * Halaman beranda dashboard setelah login berhasil.
 */
export default function HomePage() {
  const { user, isLoading } = useAuthSession();

  if (isLoading || !user) {
    return null;
  }

  const displayName = toTitleCase(user.name);
  const displayRole = toLowerCaseText(user.role);

  return (
    <section className="mx-auto max-w-4xl">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">
          Selamat datang, {displayName}
        </h2>
        <p className="mt-2 text-slate-600">
          Anda login sebagai{" "}
          <span className="font-medium">{displayRole}</span>
        </p>
      </div>
    </section>
  );
}
