"use client";

interface ResultDialogProps {
  /** Apakah dialog ditampilkan. */
  visible: boolean;
  /** Jenis hasil operasi untuk menentukan ikon dan warna. */
  variant: "success" | "error";
  /** Teks pesan hasil operasi. */
  message: string;
  /** Callback saat dialog ditutup. */
  onClose: () => void;
}

/**
 * Dialog hasil operasi dengan ikon success/error dan tombol Oke.
 */
export default function ResultDialog({
  visible,
  variant,
  message,
  onClose,
}: ResultDialogProps) {
  if (!visible) {
    return null;
  }

  const isSuccess = variant === "success";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="result-dialog-title"
    >
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl">
        <div className="flex flex-col items-center text-center">
          <div
            className={`mb-4 flex h-14 w-14 items-center justify-center rounded-full ${
              isSuccess ? "bg-green-50" : "bg-red-50"
            }`}
          >
            {isSuccess ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                className="h-7 w-7 text-green-500"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                className="h-7 w-7 text-red-500"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            )}
          </div>
          <p
            id="result-dialog-title"
            className="text-lg font-semibold text-slate-900"
          >
            {message}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="mt-6 w-full rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Oke
          </button>
        </div>
      </div>
    </div>
  );
}
