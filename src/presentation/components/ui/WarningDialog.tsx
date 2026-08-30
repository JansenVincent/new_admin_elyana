"use client";

interface WarningDialogProps {
  /** Apakah dialog ditampilkan. */
  visible: boolean;
  /** Konten pesan peringatan. */
  message: React.ReactNode;
  /** Callback saat tombol tutup ditekan. */
  onClose: () => void;
  /** Label tombol aksi utama. */
  primaryLabel?: string;
  /** Callback saat tombol aksi utama ditekan. */
  onPrimaryAction?: () => void;
}

/**
 * Dialog peringatan dengan ikon warning dan dua aksi opsional.
 */
export default function WarningDialog({
  visible,
  message,
  onClose,
  primaryLabel,
  onPrimaryAction,
}: WarningDialogProps) {
  if (!visible) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="warning-dialog-title"
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-7 w-7 text-amber-500"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div
            id="warning-dialog-title"
            className="text-sm leading-relaxed text-slate-700"
          >
            {message}
          </div>
          <div className="mt-6 flex w-full flex-col gap-3 sm:flex-row">
            {primaryLabel && onPrimaryAction && (
              <button
                type="button"
                onClick={onPrimaryAction}
                className="flex-1 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                {primaryLabel}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
