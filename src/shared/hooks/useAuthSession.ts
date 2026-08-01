"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AUTH_SESSION_KEY } from "@/shared/constants/auth";
import type { AdminUser } from "@/domain/entities/AdminUser";

/**
 * Hook untuk membaca session admin dari sessionStorage dan mengarahkan ke login jika belum auth.
 */
export function useAuthSession() {
  const router = useRouter();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
      return;
    }

    setIsLoading(false);
  }, [router]);

  return { user, isLoading };
}
