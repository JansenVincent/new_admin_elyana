"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { productStockService } from "@/application/services/ProductStockService";
import type { ProductJenis } from "@/domain/entities/ProductStock";
import ErrorPopup from "@/presentation/components/ui/ErrorPopup";
import { useAuthSession } from "@/shared/hooks/useAuthSession";
import {
  CURRENCY_OPTIONS,
  MAX_DETAIL_BARANG_LENGTH,
  PRODUCT_JENIS_OPTIONS,
  SUPPORTED_BARCODE_IMAGE_EXTENSIONS,
} from "@/shared/constants/product";
import {
  hasNoErrors,
  validateBarcodeImage,
  validateStep1,
  validateStep2,
} from "@/shared/utils/inputStockValidation";

const FORM_STEPS = [
  { number: 1, label: "Informasi Barang" },
  { number: 2, label: "Detail Barang" },
  { number: 3, label: "Barcode" },
] as const;

const inputClassName =
  "w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-500 focus:bg-white focus:ring-2 focus:ring-slate-200";

/**
 * Ikon upload untuk area unggah gambar barcode.
 */
function UploadIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="mx-auto h-10 w-10 text-slate-400"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
      />
    </svg>
  );
}

/**
 * Form multi-step Input Stock untuk pengisian detail product di toko.
 */
export default function InputStockForm() {
  const { user } = useAuthSession();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentStep, setCurrentStep] = useState(1);
  const [maxStepReached, setMaxStepReached] = useState(1);
  const [namaBarang, setNamaBarang] = useState("");
  const [harga, setHarga] = useState("");
  const [currency, setCurrency] = useState("IDR");
  const [jenis, setJenis] = useState<ProductJenis | "">("");
  const [detailBarang, setDetailBarang] = useState("");
  const [barcodeImage, setBarcodeImage] = useState<File | null>(null);
  const [barcodePreviewUrl, setBarcodePreviewUrl] = useState<string | null>(
    null
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isDragging, setIsDragging] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [errorMessage, setErrorMessage] = useState("Gagal menyimpan data");
  const [showSuccess, setShowSuccess] = useState(false);

  const step1Errors = useMemo(
    () => validateStep1({ namaBarang, harga, currency, jenis }),
    [namaBarang, harga, currency, jenis]
  );
  const step2Errors = useMemo(
    () => validateStep2(detailBarang),
    [detailBarang]
  );
  const step3Errors = useMemo(
    () => validateBarcodeImage(barcodeImage),
    [barcodeImage]
  );

  const isStep1Valid = hasNoErrors(step1Errors);
  const isStep2Valid = hasNoErrors(step2Errors);
  const isStep3Valid = hasNoErrors(step3Errors);
  const canSave = isStep1Valid && isStep2Valid && isStep3Valid;

  /**
   * Mengatur preview URL saat file barcode berubah.
   */
  useEffect(() => {
    if (!barcodeImage) {
      setBarcodePreviewUrl(null);
      return;
    }

    const previewUrl = URL.createObjectURL(barcodeImage);
    setBarcodePreviewUrl(previewUrl);

    return () => {
      URL.revokeObjectURL(previewUrl);
    };
  }, [barcodeImage]);

  /**
   * Memproses file gambar barcode yang dipilih pengguna.
   */
  const handleBarcodeFile = useCallback((file: File | null) => {
    if (!file) {
      return;
    }

    const errors = validateBarcodeImage(file);
    setFieldErrors(errors);

    if (hasNoErrors(errors)) {
      setBarcodeImage(file);
    } else {
      setBarcodeImage(null);
    }
  }, []);

  /**
   * Menangani pemilihan file dari input file.
   */
  function handleFileInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    handleBarcodeFile(file);
    event.target.value = "";
  }

  /**
   * Menangani drop file pada area upload.
   */
  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);

    const file = event.dataTransfer.files[0] ?? null;
    handleBarcodeFile(file);
  }

  /**
   * Berpindah ke step yang dipilih pengguna tanpa menghapus data sebelumnya.
   */
  function goToStep(step: number) {
    if (step <= maxStepReached) {
      setCurrentStep(step);
      setFieldErrors({});
    }
  }

  /**
   * Melanjutkan ke step berikutnya setelah validasi step saat ini berhasil.
   */
  function handleNextStep() {
    if (currentStep === 1) {
      setFieldErrors(step1Errors);
      if (!isStep1Valid) {
        return;
      }
      setMaxStepReached((prev) => Math.max(prev, 2));
      setCurrentStep(2);
      setFieldErrors({});
      return;
    }

    if (currentStep === 2) {
      setFieldErrors(step2Errors);
      if (!isStep2Valid) {
        return;
      }
      setMaxStepReached((prev) => Math.max(prev, 3));
      setCurrentStep(3);
      setFieldErrors({});
    }
  }

  /**
   * Mereset form ke kondisi awal setelah penyimpanan berhasil.
   */
  function resetForm() {
    setCurrentStep(1);
    setMaxStepReached(1);
    setNamaBarang("");
    setHarga("");
    setCurrency("IDR");
    setJenis("");
    setDetailBarang("");
    setBarcodeImage(null);
    setFieldErrors({});
    setShowSuccess(false);
  }

  /**
   * Menyimpan data product stock ke Supabase.
   */
  async function handleSave() {
    const errors = {
      ...validateStep1({ namaBarang, harga, currency, jenis }),
      ...validateStep2(detailBarang),
      ...validateBarcodeImage(barcodeImage),
    };

    setFieldErrors(errors);

    if (!hasNoErrors(errors) || !barcodeImage || !jenis) {
      return;
    }

    setIsSaving(true);

    const result = await productStockService.saveProductStock({
      namaBarang,
      harga: Number(harga),
      currency,
      jenis,
      detailBarang,
      barcodeImage,
      createdBy: user?.id,
    });

    setIsSaving(false);

    if (result.success) {
      setShowSuccess(true);
      return;
    }

    setErrorMessage(result.error ?? "Gagal menyimpan data");
    setShowErrorPopup(true);
  }

  return (
    <>
      <section className="mx-auto max-w-2xl">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <h2 className="text-xl font-semibold text-slate-900">Input Stock</h2>

          <nav
            className="mt-6"
            aria-label="Langkah pengisian form"
          >
            <ol className="flex items-center justify-between gap-2">
              {FORM_STEPS.map((step, index) => {
                const isActive = currentStep === step.number;
                const isCompleted = step.number < currentStep;
                const isClickable = step.number <= maxStepReached;

                return (
                  <li key={step.number} className="flex flex-1 items-center">
                    <button
                      type="button"
                      onClick={() => goToStep(step.number)}
                      disabled={!isClickable}
                      className={`flex w-full flex-col items-center gap-1.5 text-center transition ${
                        isClickable
                          ? "cursor-pointer"
                          : "cursor-not-allowed opacity-50"
                      }`}
                      aria-current={isActive ? "step" : undefined}
                    >
                      <span
                        className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition ${
                          isActive
                            ? "bg-slate-900 text-white"
                            : isCompleted
                              ? "bg-slate-200 text-slate-700"
                              : "border border-slate-300 bg-white text-slate-500"
                        }`}
                      >
                        {step.number}
                      </span>
                      <span
                        className={`hidden text-xs font-medium sm:block ${
                          isActive ? "text-slate-900" : "text-slate-500"
                        }`}
                      >
                        {step.label}
                      </span>
                    </button>

                    {index < FORM_STEPS.length - 1 && (
                      <div
                        className={`mx-1 hidden h-0.5 flex-1 sm:block ${
                          step.number < maxStepReached
                            ? "bg-slate-300"
                            : "bg-slate-200"
                        }`}
                        aria-hidden="true"
                      />
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>

          <div className="mt-8 space-y-5">
            {currentStep === 1 && (
              <>
                <div>
                  <label
                    htmlFor="namaBarang"
                    className="mb-1.5 block text-sm font-medium text-slate-700"
                  >
                    Nama Barang
                  </label>
                  <input
                    id="namaBarang"
                    type="text"
                    value={namaBarang}
                    onChange={(event) => setNamaBarang(event.target.value)}
                    placeholder="Masukkan nama barang"
                    className={inputClassName}
                  />
                  {fieldErrors.namaBarang && (
                    <p className="mt-1.5 text-sm text-red-600">
                      {fieldErrors.namaBarang}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="harga"
                    className="mb-1.5 block text-sm font-medium text-slate-700"
                  >
                    Harga
                  </label>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <select
                      id="currency"
                      value={currency}
                      onChange={(event) => setCurrency(event.target.value)}
                      className={`${inputClassName} sm:w-48`}
                      aria-label="Mata uang"
                    >
                      {CURRENCY_OPTIONS.map((option) => (
                        <option key={option.code} value={option.code}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <input
                      id="harga"
                      type="number"
                      min="0"
                      step="0.01"
                      value={harga}
                      onChange={(event) => setHarga(event.target.value)}
                      placeholder="Masukkan harga barang"
                      className={inputClassName}
                    />
                  </div>
                  {(fieldErrors.harga || fieldErrors.currency) && (
                    <p className="mt-1.5 text-sm text-red-600">
                      {fieldErrors.harga ?? fieldErrors.currency}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="jenis"
                    className="mb-1.5 block text-sm font-medium text-slate-700"
                  >
                    Jenis
                  </label>
                  <select
                    id="jenis"
                    value={jenis}
                    onChange={(event) =>
                      setJenis(event.target.value as ProductJenis | "")
                    }
                    className={inputClassName}
                  >
                    <option value="" disabled>
                      Pilih jenis barang
                    </option>
                    {PRODUCT_JENIS_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.jenis && (
                    <p className="mt-1.5 text-sm text-red-600">
                      {fieldErrors.jenis}
                    </p>
                  )}
                </div>
              </>
            )}

            {currentStep === 2 && (
              <div>
                <label
                  htmlFor="detailBarang"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Detail Barang
                </label>
                <textarea
                  id="detailBarang"
                  value={detailBarang}
                  onChange={(event) => setDetailBarang(event.target.value)}
                  placeholder="Masukkan detail barang (maks. 500 karakter)"
                  rows={6}
                  maxLength={MAX_DETAIL_BARANG_LENGTH}
                  className={`${inputClassName} resize-y`}
                />
                <div className="mt-1.5 flex items-center justify-between gap-2">
                  {fieldErrors.detailBarang ? (
                    <p className="text-sm text-red-600">
                      {fieldErrors.detailBarang}
                    </p>
                  ) : (
                    <span />
                  )}
                  <p className="text-xs text-slate-500">
                    {detailBarang.length}/{MAX_DETAIL_BARANG_LENGTH}
                  </p>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div>
                <p className="mb-3 text-sm font-medium text-slate-700">
                  Upload Image Barcode
                </p>

                <div
                  onDragOver={(event) => {
                    event.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  className={`rounded-2xl border-2 border-dashed p-6 text-center transition ${
                    isDragging
                      ? "border-slate-500 bg-slate-50"
                      : "border-slate-300 bg-slate-50/50"
                  }`}
                >
                  <UploadIcon />
                  <p className="mt-3 text-sm font-medium text-slate-700">
                    drop a file here
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    File Supported {SUPPORTED_BARCODE_IMAGE_EXTENSIONS}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Maximum Size 5MB
                  </p>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-4 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                  >
                    Choose Image
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileInputChange}
                  />
                </div>

                {fieldErrors.barcodeImage && (
                  <p className="mt-2 text-sm text-red-600">
                    {fieldErrors.barcodeImage}
                  </p>
                )}

                {barcodePreviewUrl && (
                  <div className="mt-4">
                    <p className="mb-2 text-sm font-medium text-slate-700">
                      Preview Barcode
                    </p>
                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white p-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={barcodePreviewUrl}
                        alt="Preview barcode"
                        className="mx-auto max-h-64 w-full object-contain"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mt-8 flex justify-end">
            {currentStep < 3 ? (
              <button
                type="button"
                onClick={handleNextStep}
                disabled={
                  (currentStep === 1 && !isStep1Valid) ||
                  (currentStep === 2 && !isStep2Valid)
                }
                className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Lanjut
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSave}
                disabled={!canSave || isSaving}
                className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSaving ? "Menyimpan..." : "Simpan"}
              </button>
            )}
          </div>
        </div>
      </section>

      <ErrorPopup
        visible={showErrorPopup}
        message={errorMessage}
        onClose={() => setShowErrorPopup(false)}
      />

      {showSuccess && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="save-success-title"
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-50">
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
              </div>
              <p
                id="save-success-title"
                className="text-lg font-semibold text-slate-900"
              >
                Data berhasil disimpan
              </p>
              <button
                type="button"
                onClick={resetForm}
                className="mt-6 w-full rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Input Stock Baru
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
