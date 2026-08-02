"use client";

import { useEffect } from "react";

interface LoadingOverlayProps {
  /** Apakah overlay loading ditampilkan. */
  visible: boolean;
  /** Teks yang ditampilkan di bawah spinner. */
  message?: string;
}

/**
 * Overlay loading full layar untuk memblokir interaksi saat query database berjalan.
 */
export default function LoadingOverlay({
  visible,
  message = "Memproses...",
}: LoadingOverlayProps) {
  useEffect(() => {
    if (!visible) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [visible]);

  if (!visible) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={message}
    >
      <div className="flex flex-col items-center gap-4 rounded-2xl bg-white px-8 py-6 shadow-xl">
        <div
          className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900"
          aria-hidden="true"
        />
        <p className="text-sm font-medium text-slate-700">{message}</p>
      </div>
    </div>
  );
}
