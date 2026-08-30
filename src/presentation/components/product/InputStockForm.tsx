"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { productService } from "@/application/services/ProductService";
import type {
  ActiveCustomerOption,
  PriceRowInput,
  ProductJenis,
} from "@/domain/entities/InputBarang";
import CustomSelect from "@/presentation/components/ui/CustomSelect";
import ConfirmDialog from "@/presentation/components/ui/ConfirmDialog";
import ErrorPopup from "@/presentation/components/ui/ErrorPopup";
import LoadingOverlay from "@/presentation/components/ui/LoadingOverlay";
import { useAuthSession } from "@/shared/hooks/useAuthSession";
import {
  areAllCustomersPaired,
  getAvailableCustomersForRow,
  useBlurFieldValidation,
} from "@/shared/hooks/useBlurFieldValidation";
import {
  CURRENCY_OPTIONS,
  MAX_KETERANGAN_LENGTH,
  MAX_SATUAN_BARANG_LENGTH,
  PRODUCT_JENIS_OPTIONS,
  SUPPORTED_BARCODE_IMAGE_EXTENSIONS,
} from "@/shared/constants/product";
import { formInputClassName, nominalInputClassName } from "@/shared/constants/formInput";
import {
  getStep1FieldError,
  getStep2FieldError,
  hasNoErrors,
  validateBarcodeImage,
  validatePriceRow,
  validateStep1,
  validateStep2,
  validateStep3,
  type Step1FieldName,
} from "@/shared/utils/inputBarangValidation";
import { toTitleCase } from "@/shared/utils/stringFormat";
import { getTodayWibDateInputValue } from "@/shared/utils/timestamp";

const FORM_STEPS = [
  { number: 1, label: "Informasi Barang" },
  { number: 2, label: "Keterangan Barang" },
  { number: 3, label: "Input Harga" },
  { number: 4, label: "Barcode" },
] as const;

const inputClassName = formInputClassName;

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
  const [barcodeError, setBarcodeError] = useState<string | undefined>();
  const {
    handleFieldBlur,
    getFieldError,
    applySubmitErrors,
    resetValidation,
  } = useBlurFieldValidation();
  const [priceRowErrors, setPriceRowErrors] = useState<
    Record<string, Record<string, string>>
  >({});
  const [blurredPriceFields, setBlurredPriceFields] = useState<
    Record<string, Set<string>>
  >({});
  const [isDragging, setIsDragging] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
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

  const step1Values = {
    namaBarang,
    jenis,
    jumlahBarang,
    satuanBarang,
    tanggalMasuk,
  };

  const canAddPriceRow = priceRows.length < activeCustomers.length;
  const allCustomersPaired = areAllCustomersPaired(
    priceRows,
    activeCustomers.length
  );

  /**
   * Menangani blur field step 1 dengan validasi langsung.
   */
  function handleStep1FieldBlur(field: Step1FieldName, selectedValue?: string) {
    const nextValues = {
      ...step1Values,
      ...(field === "jenis" && selectedValue !== undefined
        ? { jenis: selectedValue }
        : {}),
    };

    handleFieldBlur(field, getStep1FieldError(field, nextValues));
  }

  /**
   * Menangani blur field keterangan barang (step 2).
   */
  function handleKeteranganBlur() {
    handleFieldBlur("keteranganBarang", getStep2FieldError(keteranganBarang));
  }

  /**
   * Mengembalikan error field baris harga jika field sudah di-blur.
   */
  function getPriceRowFieldError(
    rowKey: string,
    field: string
  ): string | undefined {
    if (!blurredPriceFields[rowKey]?.has(field)) {
      return undefined;
    }
    return priceRowErrors[rowKey]?.[field];
  }

  /**
   * Menangani blur field baris harga dengan validasi langsung.
   */
  function handlePriceRowFieldBlur(
    rowKey: string,
    field: "cust_id" | "harga" | "currency",
    overrides?: Partial<Pick<PriceRowInput, "cust_id" | "currency" | "harga">>
  ) {
    const row = priceRows.find((item) => item.rowKey === rowKey);
    if (!row) {
      return;
    }

    const rowToValidate = overrides ? { ...row, ...overrides } : row;
    const errors = validatePriceRow(rowToValidate);

    setBlurredPriceFields((prev) => ({
      ...prev,
      [rowKey]: new Set(prev[rowKey] ?? []).add(field),
    }));

    setPriceRowErrors((prev) => {
      const rowErr = { ...(prev[rowKey] ?? {}) };
      if (errors[field]) {
        rowErr[field] = errors[field];
      } else {
        delete rowErr[field];
      }

      if (Object.keys(rowErr).length === 0) {
        const next = { ...prev };
        delete next[rowKey];
        return next;
      }

      return { ...prev, [rowKey]: rowErr };
    });
  }

  /**
   * Menandai seluruh field baris harga sebagai touched saat validasi submit step 3.
   */
  function markAllPriceRowsTouched(rowErrors: Record<string, Record<string, string>>) {
    const nextBlurred: Record<string, Set<string>> = {};
    priceRows.forEach((row) => {
      nextBlurred[row.rowKey] = new Set(["cust_id", "harga", "currency"]);
    });
    setBlurredPriceFields(nextBlurred);
    setPriceRowErrors(rowErrors);
  }

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
    setBarcodeError(errors.barcodeImage);

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
   * Memperbarui nominal harga dengan input angka saja (maks. 2 desimal).
   */
  function updatePriceRowHarga(rowKey: string, rawValue: string) {
    if (rawValue === "" || /^\d+(\.\d{0,2})?$/.test(rawValue)) {
      updatePriceRow(rowKey, "harga", rawValue);
    }
  }

  /**
   * Memperbarui satu baris harga berdasarkan rowKey.
   */
  function updatePriceRow(
    rowKey: string,
    field: keyof Omit<PriceRowInput, "rowKey">,
    value: string
  ) {
    setPriceRows((prev) => {
      const updated = prev.map((row) =>
        row.rowKey === rowKey ? { ...row, [field]: value } : row
      );

      if (field === "cust_id" && value) {
        return updated.map((row) =>
          row.rowKey !== rowKey && row.cust_id === value
            ? { ...row, cust_id: "" }
            : row
        );
      }

      return updated;
    });
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
    setBlurredPriceFields((prev) => {
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
      resetValidation();
      setPriceRowErrors({});
      setBlurredPriceFields({});
    }
  }

  /**
   * Melanjutkan ke step berikutnya setelah validasi step saat ini berhasil.
   */
  function handleNextStep() {
    if (currentStep === 1) {
      applySubmitErrors(step1Errors);
      if (!isStep1Valid) {
        return;
      }
      setMaxStepReached((prev) => Math.max(prev, 2));
      setCurrentStep(2);
      resetValidation();
      return;
    }

    if (currentStep === 2) {
      applySubmitErrors(step2Errors);
      if (!isStep2Valid) {
        return;
      }
      setMaxStepReached((prev) => Math.max(prev, 3));
      setCurrentStep(3);
      resetValidation();
      return;
    }

    if (currentStep === 3) {
      markAllPriceRowsTouched(step3Validation.rowErrors);
      if (!isStep3Valid) {
        return;
      }
      setMaxStepReached((prev) => Math.max(prev, 4));
      setCurrentStep(4);
      setPriceRowErrors({});
      setBlurredPriceFields({});
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
    setBarcodeError(undefined);
    resetValidation();
    setPriceRowErrors({});
    setBlurredPriceFields({});
    setShowSaveConfirm(false);
    setShowSuccess(false);
    customersFetchedRef.current = false;
    setActiveCustomers([]);
  }

  /**
   * Membuka popup konfirmasi sebelum menyimpan data Input Barang.
   */
  function handleOpenSaveConfirm() {
    const errors = {
      ...validateStep1(step1Values),
      ...validateStep2(keteranganBarang),
      ...validateBarcodeImage(barcodeImage),
    };
    const step3Result = validateStep3(priceRows);

    applySubmitErrors(errors);
    markAllPriceRowsTouched(step3Result.rowErrors);
    setBarcodeError(errors.barcodeImage);

    if (
      !hasNoErrors(errors) ||
      !step3Result.isValid ||
      !barcodeImage ||
      !jenis ||
      !user
    ) {
      return;
    }

    setShowSaveConfirm(true);
  }

  /**
   * Menyimpan data Input Barang ke database secara serial melalui API.
   */
  async function handleConfirmSave() {
    setShowSaveConfirm(false);

    if (!barcodeImage || !jenis || !user) {
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
                    onChange={(event) =>
                      setNamaBarang(event.target.value.toUpperCase())
                    }
                    onBlur={() => handleStep1FieldBlur("namaBarang")}
                    placeholder="Masukkan nama barang"
                    className={inputClassName}
                  />
                  {getFieldError("namaBarang") && (
                    <p className="mt-1.5 text-sm text-red-600">
                      {getFieldError("namaBarang")}
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
                  <CustomSelect
                    id="jenis"
                    value={jenis}
                    onChange={(nextValue) =>
                      setJenis(nextValue as ProductJenis | "")
                    }
                    onBlur={(selectedValue) =>
                      handleStep1FieldBlur("jenis", selectedValue)
                    }
                    placeholder="Pilih jenis barang"
                    options={PRODUCT_JENIS_OPTIONS.map((option) => ({
                      value: option,
                      label: option,
                    }))}
                  />
                  {getFieldError("jenis") && (
                    <p className="mt-1.5 text-sm text-red-600">
                      {getFieldError("jenis")}
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
                    onBlur={() => handleStep1FieldBlur("jumlahBarang")}
                    placeholder="Masukkan jumlah barang"
                    className={inputClassName}
                  />
                  {getFieldError("jumlahBarang") && (
                    <p className="mt-1.5 text-sm text-red-600">
                      {getFieldError("jumlahBarang")}
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
                    onChange={(event) =>
                      setSatuanBarang(toTitleCase(event.target.value))
                    }
                    onBlur={() => handleStep1FieldBlur("satuanBarang")}
                    placeholder="Contoh: Pcs, Set"
                    maxLength={MAX_SATUAN_BARANG_LENGTH}
                    className={inputClassName}
                  />
                  {getFieldError("satuanBarang") && (
                    <p className="mt-1.5 text-sm text-red-600">
                      {getFieldError("satuanBarang")}
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
                    onBlur={() => handleStep1FieldBlur("tanggalMasuk")}
                    className={inputClassName}
                  />
                  {getFieldError("tanggalMasuk") && (
                    <p className="mt-1.5 text-sm text-red-600">
                      {getFieldError("tanggalMasuk")}
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
                  onBlur={handleKeteranganBlur}
                  placeholder={`Masukkan keterangan barang (maks. ${MAX_KETERANGAN_LENGTH} karakter)`}
                  rows={6}
                  maxLength={MAX_KETERANGAN_LENGTH}
                  className={`${inputClassName} resize-y`}
                />
                <div className="mt-1.5 flex items-center justify-between gap-2">
                  {getFieldError("keteranganBarang") ? (
                    <p className="text-sm text-red-600">
                      {getFieldError("keteranganBarang")}
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
                      const availableCustomers = getAvailableCustomersForRow(
                        row.rowKey,
                        priceRows,
                        activeCustomers
                      );

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
                              <CustomSelect
                                id={`customer-${row.rowKey}`}
                                value={row.cust_id}
                                onChange={(nextValue) =>
                                  updatePriceRow(row.rowKey, "cust_id", nextValue)
                                }
                                onBlur={(selectedValue) =>
                                  handlePriceRowFieldBlur(
                                    row.rowKey,
                                    "cust_id",
                                    selectedValue
                                      ? { cust_id: selectedValue }
                                      : undefined
                                  )
                                }
                                placeholder="Pilih customer"
                                options={availableCustomers.map((customer) => ({
                                  value: customer.cust_id,
                                  label: customer.cust_name,
                                }))}
                              />
                              {getPriceRowFieldError(row.rowKey, "cust_id") && (
                                <p className="mt-1.5 text-sm text-red-600">
                                  {getPriceRowFieldError(row.rowKey, "cust_id")}
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
                              <div className="flex gap-3">
                                <CustomSelect
                                  id={`currency-${row.rowKey}`}
                                  value={row.currency}
                                  onChange={(nextValue) =>
                                    updatePriceRow(row.rowKey, "currency", nextValue)
                                  }
                                  onBlur={(selectedValue) =>
                                    handlePriceRowFieldBlur(
                                      row.rowKey,
                                      "currency",
                                      selectedValue
                                        ? { currency: selectedValue }
                                        : undefined
                                    )
                                  }
                                  options={CURRENCY_OPTIONS.map((option) => ({
                                    value: option.code,
                                    label: option.label,
                                  }))}
                                  className="w-[40%] shrink-0"
                                  aria-label="Mata uang"
                                />
                                <input
                                  id={`harga-${row.rowKey}`}
                                  type="text"
                                  inputMode="numeric"
                                  pattern="[0-9]*"
                                  value={row.harga}
                                  onChange={(event) =>
                                    updatePriceRowHarga(
                                      row.rowKey,
                                      event.target.value
                                    )
                                  }
                                  onBlur={() =>
                                    handlePriceRowFieldBlur(row.rowKey, "harga")
                                  }
                                  placeholder="Masukkan harga barang"
                                  className={`${nominalInputClassName} min-w-0 flex-1`}
                                />
                              </div>
                              {(getPriceRowFieldError(row.rowKey, "harga") ||
                                getPriceRowFieldError(row.rowKey, "currency")) && (
                                <p className="mt-1.5 text-sm text-red-600">
                                  {getPriceRowFieldError(row.rowKey, "harga") ??
                                    getPriceRowFieldError(row.rowKey, "currency")}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {allCustomersPaired && (
                      <p className="text-center text-sm font-medium text-slate-600">
                        Semua Customer sudah di pasangkan harga
                      </p>
                    )}

                    <button
                      type="button"
                      onClick={addPriceRow}
                      disabled={!canAddPriceRow}
                      className="w-full rounded-xl border border-dashed border-slate-300 bg-white py-3 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
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

                {barcodeError && (
                  <p className="mt-2 text-sm text-red-600">
                    {barcodeError}
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
                onClick={handleOpenSaveConfirm}
                disabled={!canSave || isSaving}
                className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSaving ? "Menyimpan..." : "Simpan"}
              </button>
            )}
          </div>
        </div>
      </section>

      <ConfirmDialog
        visible={showSaveConfirm}
        message="Apakah Anda yakin pengisian sudah sesuai? Lanjut menyimpan?"
        onClose={() => setShowSaveConfirm(false)}
        onConfirm={handleConfirmSave}
        isLoading={isSaving}
      />

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
