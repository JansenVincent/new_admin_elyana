"use client";

interface ConfirmDialogProps {
  /** Apakah dialog ditampilkan. */
  visible: boolean;
  /** Callback saat dialog ditutup tanpa konfirmasi. */
  onClose: () => void;
  /** Callback saat pengguna menekan tombol konfirmasi. */
  onConfirm: () => void;
  /** Teks pesan konfirmasi. */
  message: string;
  /** Catatan tambahan dengan ukuran font lebih kecil (opsional). */
  note?: string;
  /** Label tombol konfirmasi. */
  confirmLabel?: string;
  /** Label tombol batal. */
  cancelLabel?: string;
  /** Apakah sedang memproses aksi konfirmasi. */
  isLoading?: boolean;
}

/**
 * Dialog konfirmasi dengan ikon peringatan dan tombol Ya/Tidak.
 */
export default function ConfirmDialog({
  visible,
  onClose,
  onConfirm,
  message,
  note,
  confirmLabel = "Ya",
  cancelLabel = "Tidak",
  isLoading = false,
}: ConfirmDialogProps) {
  if (!visible) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl">
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
          <p
            id="confirm-dialog-title"
            className="text-base font-medium leading-relaxed text-slate-900"
          >
            {message}
          </p>
          {note && (
            <p className="mt-3 text-xs leading-relaxed text-slate-500">{note}</p>
          )}
          <div className="mt-6 flex w-full gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 rounded-xl border border-slate-300 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className="flex-1 rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
