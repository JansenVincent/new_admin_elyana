"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { productService } from "@/application/services/ProductService";
import type {
  ActiveCustomerOption,
  PriceRowInput,
  ProductJenis,
} from "@/domain/entities/InputBarang";
import ErrorPopup from "@/presentation/components/ui/ErrorPopup";
import LoadingOverlay from "@/presentation/components/ui/LoadingOverlay";
import { useAuthSession } from "@/shared/hooks/useAuthSession";
import {
  CURRENCY_OPTIONS,
  MAX_KETERANGAN_LENGTH,
  MAX_SATUAN_BARANG_LENGTH,
  PRODUCT_JENIS_OPTIONS,
  SUPPORTED_BARCODE_IMAGE_EXTENSIONS,
} from "@/shared/constants/product";
import {
  hasNoErrors,
  validateBarcodeImage,
  validateStep1,
  validateStep2,
  validateStep3,
} from "@/shared/utils/inputBarangValidation";
import { getTodayWibDateInputValue } from "@/shared/utils/timestamp";

const FORM_STEPS = [
  { number: 1, label: "Informasi Barang" },
  { number: 2, label: "Keterangan Barang" },
  { number: 3, label: "Input Harga" },
  { number: 4, label: "Barcode" },
] as const;

const inputClassName =
  "w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-500 focus:bg-white focus:ring-2 focus:ring-slate-200";

/**
 * Membuat baris harga kosong dengan key unik untuk React list.
 */
function createEmptyPriceRow(): PriceRowInput {
  return {
    rowKey: crypto.randomUUID(),
    cust_id: "",
    currency: "IDR",
    harga: "",
  };
}

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
 * Ikon tong sampah untuk menghapus baris harga customer.
 */
function TrashIcon() {
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
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
      />
    </svg>
  );
}

/**
 * Form multi-step Input Barang untuk pengisian product, harga per customer, dan barcode.
 */
export default function InputStockForm() {
  const { user } = useAuthSession();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const customersFetchedRef = useRef(false);

  const [currentStep, setCurrentStep] = useState(1);
  const [maxStepReached, setMaxStepReached] = useState(1);
  const [namaBarang, setNamaBarang] = useState("");
  const [jenis, setJenis] = useState<ProductJenis | "">("");
  const [jumlahBarang, setJumlahBarang] = useState("1");
  const [satuanBarang, setSatuanBarang] = useState("");
  const [tanggalMasuk, setTanggalMasuk] = useState(getTodayWibDateInputValue());
  const [keteranganBarang, setKeteranganBarang] = useState("");
  const [priceRows, setPriceRows] = useState<PriceRowInput[]>([]);
  const [activeCustomers, setActiveCustomers] = useState<ActiveCustomerOption[]>(
    []
  );
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  const [barcodeImage, setBarcodeImage] = useState<File | null>(null);
  const [barcodePreviewUrl, setBarcodePreviewUrl] = useState<string | null>(
    null
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [priceRowErrors, setPriceRowErrors] = useState<
    Record<string, Record<string, string>>
  >({});
  const [isDragging, setIsDragging] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [errorMessage, setErrorMessage] = useState("Gagal menyimpan data");
  const [showSuccess, setShowSuccess] = useState(false);

  const step1Errors = useMemo(
    () =>
      validateStep1({
        namaBarang,
        jenis,
        jumlahBarang,
        satuanBarang,
        tanggalMasuk,
      }),
    [namaBarang, jenis, jumlahBarang, satuanBarang, tanggalMasuk]
  );
  const step2Errors = useMemo(
    () => validateStep2(keteranganBarang),
    [keteranganBarang]
  );
  const step3Validation = useMemo(
    () => validateStep3(priceRows),
    [priceRows]
  );
  const step4Errors = useMemo(
    () => validateBarcodeImage(barcodeImage),
    [barcodeImage]
  );

  const isStep1Valid = hasNoErrors(step1Errors);
  const isStep2Valid = hasNoErrors(step2Errors);
  const isStep3Valid = step3Validation.isValid;
  const isStep4Valid = hasNoErrors(step4Errors);
  const canSave = isStep1Valid && isStep2Valid && isStep3Valid && isStep4Valid;

  /**
   * Memuat customer aktif sekali saat pertama kali masuk step Input Harga.
   */
  const loadActiveCustomers = useCallback(async () => {
    if (customersFetchedRef.current) {
      return;
    }

    setIsLoadingCustomers(true);
    const result = await productService.listActiveCustomers();
    setIsLoadingCustomers(false);

    if (result.success && result.customers) {
      setActiveCustomers(result.customers);
      customersFetchedRef.current = true;
    } else {
      setErrorMessage(result.error ?? "Gagal memuat daftar customer");
      setShowErrorPopup(true);
    }
  }, []);

  useEffect(() => {
    if (currentStep === 3) {
      void loadActiveCustomers();
      if (priceRows.length === 0) {
        setPriceRows([createEmptyPriceRow()]);
      }
    }
  }, [currentStep, loadActiveCustomers, priceRows.length]);

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
   * Memperbarui satu baris harga berdasarkan rowKey.
   */
  function updatePriceRow(
    rowKey: string,
    field: keyof Omit<PriceRowInput, "rowKey">,
    value: string
  ) {
    setPriceRows((prev) =>
      prev.map((row) =>
        row.rowKey === rowKey ? { ...row, [field]: value } : row
      )
    );
  }

  /**
   * Menambahkan baris harga customer baru.
   */
  function addPriceRow() {
    setPriceRows((prev) => [...prev, createEmptyPriceRow()]);
  }

  /**
   * Menghapus baris harga customer berdasarkan rowKey.
   */
  function removePriceRow(rowKey: string) {
    setPriceRows((prev) => prev.filter((row) => row.rowKey !== rowKey));
    setPriceRowErrors((prev) => {
      const next = { ...prev };
      delete next[rowKey];
      return next;
    });
  }

  /**
   * Berpindah ke step yang dipilih pengguna tanpa menghapus data sebelumnya.
   */
  function goToStep(step: number) {
    if (step <= maxStepReached) {
      setCurrentStep(step);
      setFieldErrors({});
      setPriceRowErrors({});
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
      return;
    }

    if (currentStep === 3) {
      setPriceRowErrors(step3Validation.rowErrors);
      if (!isStep3Valid) {
        return;
      }
      setMaxStepReached((prev) => Math.max(prev, 4));
      setCurrentStep(4);
      setPriceRowErrors({});
    }
  }

  /**
   * Mereset form ke kondisi awal setelah penyimpanan berhasil.
   */
  function resetForm() {
    setCurrentStep(1);
    setMaxStepReached(1);
    setNamaBarang("");
    setJenis("");
    setJumlahBarang("1");
    setSatuanBarang("");
    setTanggalMasuk(getTodayWibDateInputValue());
    setKeteranganBarang("");
    setPriceRows([]);
    setBarcodeImage(null);
    setFieldErrors({});
    setPriceRowErrors({});
    setShowSuccess(false);
    customersFetchedRef.current = false;
    setActiveCustomers([]);
  }

  /**
   * Menyimpan data Input Barang ke database secara serial melalui API.
   */
  async function handleSave() {
    const errors = {
      ...validateStep1({
        namaBarang,
        jenis,
        jumlahBarang,
        satuanBarang,
        tanggalMasuk,
      }),
      ...validateStep2(keteranganBarang),
      ...validateBarcodeImage(barcodeImage),
    };
    const step3Result = validateStep3(priceRows);

    setFieldErrors(errors);
    setPriceRowErrors(step3Result.rowErrors);

    if (
      !hasNoErrors(errors) ||
      !step3Result.isValid ||
      !barcodeImage ||
      !jenis ||
      !user
    ) {
      return;
    }

    setIsSaving(true);

    const result = await productService.saveInputBarang({
      namaBarang,
      jenis,
      jumlahBarang: Number(jumlahBarang),
      satuanBarang,
      tanggalMasuk,
      keteranganBarang,
      priceRows: priceRows.map((row) => ({
        cust_id: row.cust_id,
        currency: row.currency,
        harga: Number(row.harga),
      })),
      barcodeImage,
      username: user.username,
      name: user.name,
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
          <h2 className="text-xl font-semibold text-slate-900">Input Barang</h2>

          <nav
            className="mt-6"
            aria-label="Langkah pengisian form"
          >
            <ol className="flex items-center justify-between gap-1">
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
                        className={`hidden text-[10px] font-medium leading-tight sm:block lg:text-xs ${
                          isActive ? "text-slate-900" : "text-slate-500"
                        }`}
                      >
                        {step.label}
                      </span>
                    </button>

                    {index < FORM_STEPS.length - 1 && (
                      <div
                        className={`mx-0.5 hidden h-0.5 flex-1 sm:block ${
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

                <div>
                  <label
                    htmlFor="jumlahBarang"
                    className="mb-1.5 block text-sm font-medium text-slate-700"
                  >
                    Jumlah Barang
                  </label>
                  <input
                    id="jumlahBarang"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={jumlahBarang}
                    onChange={(event) => {
                      const value = event.target.value;
                      if (value === "" || /^\d+$/.test(value)) {
                        setJumlahBarang(value);
                      }
                    }}
                    placeholder="Masukkan jumlah barang"
                    className={inputClassName}
                  />
                  {fieldErrors.jumlahBarang && (
                    <p className="mt-1.5 text-sm text-red-600">
                      {fieldErrors.jumlahBarang}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="satuanBarang"
                    className="mb-1.5 block text-sm font-medium text-slate-700"
                  >
                    Satuan Barang
                  </label>
                  <input
                    id="satuanBarang"
                    type="text"
                    value={satuanBarang}
                    onChange={(event) => setSatuanBarang(event.target.value)}
                    placeholder="Contoh: Pcs, Set"
                    maxLength={MAX_SATUAN_BARANG_LENGTH}
                    className={inputClassName}
                  />
                  {fieldErrors.satuanBarang && (
                    <p className="mt-1.5 text-sm text-red-600">
                      {fieldErrors.satuanBarang}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="tanggalMasuk"
                    className="mb-1.5 block text-sm font-medium text-slate-700"
                  >
                    Tanggal Masuk Barang
                  </label>
                  <input
                    id="tanggalMasuk"
                    type="date"
                    value={tanggalMasuk}
                    max={getTodayWibDateInputValue()}
                    onChange={(event) => setTanggalMasuk(event.target.value)}
                    className={inputClassName}
                  />
                  {fieldErrors.tanggalMasuk && (
                    <p className="mt-1.5 text-sm text-red-600">
                      {fieldErrors.tanggalMasuk}
                    </p>
                  )}
                </div>
              </>
            )}

            {currentStep === 2 && (
              <div>
                <label
                  htmlFor="keteranganBarang"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Keterangan Barang
                </label>
                <textarea
                  id="keteranganBarang"
                  value={keteranganBarang}
                  onChange={(event) => setKeteranganBarang(event.target.value)}
                  placeholder={`Masukkan keterangan barang (maks. ${MAX_KETERANGAN_LENGTH} karakter)`}
                  rows={6}
                  maxLength={MAX_KETERANGAN_LENGTH}
                  className={`${inputClassName} resize-y`}
                />
                <div className="mt-1.5 flex items-center justify-between gap-2">
                  {fieldErrors.keteranganBarang ? (
                    <p className="text-sm text-red-600">
                      {fieldErrors.keteranganBarang}
                    </p>
                  ) : (
                    <span />
                  )}
                  <p className="text-xs text-slate-500">
                    {keteranganBarang.length}/{MAX_KETERANGAN_LENGTH}
                  </p>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-4">
                <p className="text-sm text-slate-600">
                  Tambahkan harga barang per customer. Minimal satu baris harga
                  wajib diisi.
                </p>

                {isLoadingCustomers ? (
                  <p className="py-6 text-center text-sm text-slate-500">
                    Memuat daftar customer...
                  </p>
                ) : (
                  <>
                    {priceRows.map((row, index) => {
                      const rowError = priceRowErrors[row.rowKey] ?? {};

                      return (
                        <div
                          key={row.rowKey}
                          className="rounded-xl border border-slate-200 bg-slate-50/50 p-4"
                        >
                          <div className="mb-3 flex items-center justify-between gap-2">
                            <p className="text-sm font-medium text-slate-700">
                              Harga #{index + 1}
                            </p>
                            <button
                              type="button"
                              onClick={() => removePriceRow(row.rowKey)}
                              className="rounded-lg p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                              aria-label={`Hapus baris harga ${index + 1}`}
                            >
                              <TrashIcon />
                            </button>
                          </div>

                          <div className="space-y-3">
                            <div>
                              <label
                                htmlFor={`customer-${row.rowKey}`}
                                className="mb-1.5 block text-sm font-medium text-slate-700"
                              >
                                Customer
                              </label>
                              <select
                                id={`customer-${row.rowKey}`}
                                value={row.cust_id}
                                onChange={(event) =>
                                  updatePriceRow(
                                    row.rowKey,
                                    "cust_id",
                                    event.target.value
                                  )
                                }
                                className={inputClassName}
                              >
                                <option value="" disabled>
                                  Pilih customer
                                </option>
                                {activeCustomers.map((customer) => (
                                  <option
                                    key={customer.cust_id}
                                    value={customer.cust_id}
                                  >
                                    {customer.cust_name}
                                  </option>
                                ))}
                              </select>
                              {rowError.cust_id && (
                                <p className="mt-1.5 text-sm text-red-600">
                                  {rowError.cust_id}
                                </p>
                              )}
                            </div>

                            <div>
                              <label
                                htmlFor={`harga-${row.rowKey}`}
                                className="mb-1.5 block text-sm font-medium text-slate-700"
                              >
                                Harga
                              </label>
                              <div className="grid grid-cols-5 gap-3">
                                <select
                                  id={`currency-${row.rowKey}`}
                                  value={row.currency}
                                  onChange={(event) =>
                                    updatePriceRow(
                                      row.rowKey,
                                      "currency",
                                      event.target.value
                                    )
                                  }
                                  className={`${inputClassName} col-span-2`}
                                  aria-label="Mata uang"
                                >
                                  {CURRENCY_OPTIONS.map((option) => (
                                    <option key={option.code} value={option.code}>
                                      {option.label}
                                    </option>
                                  ))}
                                </select>
                                <input
                                  id={`harga-${row.rowKey}`}
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={row.harga}
                                  onChange={(event) =>
                                    updatePriceRow(
                                      row.rowKey,
                                      "harga",
                                      event.target.value
                                    )
                                  }
                                  placeholder="Masukkan harga barang"
                                  className={`${inputClassName} col-span-3`}
                                />
                              </div>
                              {(rowError.harga || rowError.currency) && (
                                <p className="mt-1.5 text-sm text-red-600">
                                  {rowError.harga ?? rowError.currency}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    <button
                      type="button"
                      onClick={addPriceRow}
                      className="w-full rounded-xl border border-dashed border-slate-300 bg-white py-3 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                    >
                      + Tambah Customer & Harga
                    </button>
                  </>
                )}
              </div>
            )}

            {currentStep === 4 && (
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
            {currentStep < 4 ? (
              <button
                type="button"
                onClick={handleNextStep}
                disabled={
                  (currentStep === 1 && !isStep1Valid) ||
                  (currentStep === 2 && !isStep2Valid) ||
                  (currentStep === 3 && (!isStep3Valid || isLoadingCustomers))
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

      <LoadingOverlay visible={isSaving} />

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
                Input Barang Baru
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
