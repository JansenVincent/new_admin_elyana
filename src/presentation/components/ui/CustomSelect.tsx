"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { formInputClassName } from "@/shared/constants/formInput";

/** Opsi item pada dropdown kustom. */
export interface CustomSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface CustomSelectProps {
  /** ID elemen trigger untuk label htmlFor. */
  id?: string;
  /** Nilai opsi yang terpilih. */
  value: string;
  /** Callback saat opsi berubah. */
  onChange: (value: string) => void;
  /** Daftar opsi dropdown. */
  options: CustomSelectOption[];
  /** Placeholder saat belum ada nilai terpilih. */
  placeholder?: string;
  /** Callback saat dropdown kehilangan fokus; menerima nilai terpilih jika dari pemilihan opsi. */
  onBlur?: (selectedValue?: string) => void;
  /** Apakah dropdown dinonaktifkan. */
  disabled?: boolean;
  /** ClassName tambahan pada trigger. */
  className?: string;
  /** Label aksesibilitas untuk trigger. */
  "aria-label"?: string;
}

/**
 * Ikon chevron untuk trigger dropdown kustom.
 */
function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={`h-4 w-4 shrink-0 text-slate-500 transition ${open ? "rotate-180" : ""}`}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

/**
 * Dropdown kustom agar tampilan konsisten di Safari dan browser lain.
 */
export default function CustomSelect({
  id,
  value,
  onChange,
  options,
  placeholder = "Pilih opsi",
  onBlur,
  disabled = false,
  className = "",
  "aria-label": ariaLabel,
}: CustomSelectProps) {
  const listboxId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = options.find((option) => option.value === value);
  const displayLabel = selectedOption?.label ?? placeholder;

  /**
   * Menutup dropdown dan memicu callback blur.
   */
  const closeDropdown = useCallback(() => {
    setIsOpen(false);
    onBlur?.();
  }, [onBlur]);

  /**
   * Memilih opsi, menutup dropdown, dan memvalidasi dengan nilai terbaru.
   */
  function handleSelectOption(nextValue: string) {
    onChange(nextValue);
    setIsOpen(false);
    onBlur?.(nextValue);
  }

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    /**
     * Menutup dropdown saat klik di luar komponen.
     */
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        closeDropdown();
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [isOpen, closeDropdown]);

  return (
    <div ref={containerRef} className="relative">
      <button
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-label={ariaLabel}
        onClick={() => {
          if (disabled) {
            return;
          }
          setIsOpen((open) => !open);
        }}
        className={`${formInputClassName} flex items-center justify-between gap-3 text-left ${!selectedOption ? "text-slate-400" : ""} ${className}`}
      >
        <span className="truncate">{displayLabel}</span>
        <ChevronIcon open={isOpen} />
      </button>

      {isOpen && (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute z-50 mt-2 max-h-60 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
        >
          {options.map((option) => {
            const isSelected = option.value === value;

            return (
              <li key={option.value} role="option" aria-selected={isSelected}>
                <button
                  type="button"
                  disabled={option.disabled}
                  onClick={() => handleSelectOption(option.value)}
                  className={`flex w-full px-4 py-2.5 text-left text-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 ${
                    isSelected
                      ? "bg-slate-100 font-medium text-slate-900"
                      : "text-slate-700"
                  }`}
                >
                  {option.label}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
