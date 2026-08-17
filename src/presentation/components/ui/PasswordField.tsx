"use client";

import { useState } from "react";
import { MAX_ACCOUNT_FIELD_LENGTH } from "@/shared/constants/account";

interface PasswordFieldProps {
  /** ID elemen input. */
  id: string;
  /** Label field password. */
  label: string;
  /** Nilai password saat ini. */
  value: string;
  /** Callback saat nilai password berubah. */
  onChange: (value: string) => void;
  /** Placeholder teks input. */
  placeholder: string;
  /** Pesan error validasi. */
  error?: string;
  /** Autocomplete attribute untuk input password. */
  autoComplete?: string;
  /** Panjang maksimum karakter input (opsional). */
  maxLength?: number;
  /** Callback saat field kehilangan fokus. */
  onBlur?: () => void;
}

/**
 * Ikon mata untuk toggle show/hide password.
 */
function EyeIcon({ open }: { open: boolean }) {
  if (open) {
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
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
        />
      </svg>
    );
  }

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
        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
      />
    </svg>
  );
}

/**
 * Textfield password dengan toggle show/hide dan batas panjang karakter.
 */
export default function PasswordField({
  id,
  label,
  value,
  onChange,
  placeholder,
  error,
  autoComplete = "new-password",
  maxLength = MAX_ACCOUNT_FIELD_LENGTH,
  onBlur,
}: PasswordFieldProps) {
  const [isVisible, setIsVisible] = useState(false);

  /**
   * Menangani perubahan input dengan batas maksimum karakter.
   */
  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const nextValue = maxLength
      ? event.target.value.slice(0, maxLength)
      : event.target.value;
    onChange(nextValue);
  }

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={isVisible ? "text" : "password"}
          value={value}
          onChange={handleChange}
          onBlur={onBlur}
          maxLength={maxLength}
          autoComplete={autoComplete}
          placeholder={placeholder}
          className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 pr-12 text-slate-900 outline-none transition focus:border-slate-500 focus:bg-white focus:ring-2 focus:ring-slate-200"
        />
        <button
          type="button"
          onClick={() => setIsVisible((visible) => !visible)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
          aria-label={isVisible ? "Sembunyikan password" : "Tampilkan password"}
        >
          <EyeIcon open={isVisible} />
        </button>
      </div>
      {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}
    </div>
  );
}
