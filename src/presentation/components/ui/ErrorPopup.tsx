"use client";

interface ErrorPopupProps {
  /** Apakah popup ditampilkan. */
  visible: boolean;
  /** Callback saat popup ditutup. */
  onClose: () => void;
  /** Teks pesan error yang ditampilkan. */
  message?: string;
}

/**
 * Popup error dengan ikon silang merah dan pesan yang dapat disesuaikan.
 */
export default function ErrorPopup({
  visible,
  onClose,
  message = "Gagal Login",
}: ErrorPopupProps) {
  if (!visible) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="login-error-title"
    >
      <div className="relative w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 transition hover:text-slate-600"
          aria-label="Tutup"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-5 w-5"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              className="h-7 w-7 text-red-500"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <p
            id="login-error-title"
            className="whitespace-pre-line text-lg font-semibold text-black"
          >
            {message}
          </p>
        </div>
      </div>
    </div>
  );
}
