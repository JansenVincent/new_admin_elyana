"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { suratJalanService } from "@/application/services/SuratJalanService";
import type {
  SuratJalanCustomerOption,
  SuratJalanLineItem,
  SuratJalanPemilikOption,
  SuratJalanProductOption,
  SuratJalanTokoOption,
} from "@/domain/entities/SuratJalan";
import CustomSelect from "@/presentation/components/ui/CustomSelect";
import ConfirmDialog from "@/presentation/components/ui/ConfirmDialog";
import ErrorPopup from "@/presentation/components/ui/ErrorPopup";
import LoadingOverlay from "@/presentation/components/ui/LoadingOverlay";
import WarningDialog from "@/presentation/components/ui/WarningDialog";
import { useAuthSession } from "@/shared/hooks/useAuthSession";
import { useBlurFieldValidation } from "@/shared/hooks/useBlurFieldValidation";
import { formInputClassName } from "@/shared/constants/formInput";
import {
  MAX_NOMOR_PO_LENGTH,
  MAX_NOMOR_SJ_LENGTH,
  MAX_PENGIRIMAN_LENGTH,
  SURAT_JALAN_SAVE_ERROR_MESSAGE,
} from "@/shared/constants/suratJalan";
import { toTitleCase } from "@/shared/utils/stringFormat";
import {
  getSuratJalanStep1FieldError,
  hasNoSuratJalanErrors,
  toDocumentUpperCase,
  validateSuratJalanStep1,
  validateSuratJalanStep2,
  type SuratJalanStep1FieldName,
} from "@/shared/utils/suratJalanValidation";
import { getTodayWibDateInputValue } from "@/shared/utils/timestamp";

const FORM_STEPS = [
  { number: 1, label: "Detail Pembelian" },
  { number: 2, label: "Detail Barang" },
  { number: 3, label: "Ringkasan Pembelian" },
] as const;

const inputClassName = formInputClassName;

/**
 * Memformat tanggal input (YYYY-MM-DD) untuk tampilan ringkasan.
 */
function formatDateDisplay(dateValue: string): string {
  if (!dateValue) {
    return "-";
  }

  const date = new Date(`${dateValue}T00:00:00`);
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

/**
 * Form multi-step Surat Jalan untuk pengisian PO, surat jalan, dan detail penjualan.
 */
export default function SuratJalanForm() {
  const router = useRouter();
  const { user } = useAuthSession();

  const [currentStep, setCurrentStep] = useState(1);
  const [maxStepReached, setMaxStepReached] = useState(1);

  const [nomorPo, setNomorPo] = useState("");
  const [pengiriman, setPengiriman] = useState("");
  const [tanggalSj, setTanggalSj] = useState(getTodayWibDateInputValue());
  const [nomorSj, setNomorSj] = useState("");
  const [custId, setCustId] = useState("");
  const [tokoId, setTokoId] = useState("");
  const [pemilikId, setPemilikId] = useState("");

  const [customers, setCustomers] = useState<SuratJalanCustomerOption[]>([]);
  const [tokos, setTokos] = useState<SuratJalanTokoOption[]>([]);
  const [pemiliks, setPemiliks] = useState<SuratJalanPemilikOption[]>([]);
  const [products, setProducts] = useState<SuratJalanProductOption[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);
  const [loadOptionsError, setLoadOptionsError] = useState(false);

  const [lineItems, setLineItems] = useState<SuratJalanLineItem[]>([]);
  const [draftProductId, setDraftProductId] = useState("");
  const [draftKuantitas, setDraftKuantitas] = useState("1");
  const [draftError, setDraftError] = useState<string | undefined>();

  const [isSaving, setIsSaving] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [errorMessage, setErrorMessage] = useState(SURAT_JALAN_SAVE_ERROR_MESSAGE);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showHargaWarning, setShowHargaWarning] = useState(false);
  const [hargaWarningProducts, setHargaWarningProducts] = useState<string[]>(
    []
  );
  const [isValidatingHarga, setIsValidatingHarga] = useState(false);
  const prevCustTokoRef = useRef({ custId: "", tokoId: "" });

  const {
    handleFieldBlur,
    getFieldError,
    applySubmitErrors,
    resetValidation,
  } = useBlurFieldValidation();

  const step1Values = {
    nomorPo,
    pengiriman,
    tanggalSj,
    nomorSj,
    custId,
    tokoId,
    pemilikId,
  };

  const step1Errors = useMemo(
    () => validateSuratJalanStep1(step1Values),
    [nomorPo, pengiriman, tanggalSj, nomorSj, custId, tokoId, pemilikId]
  );

  const isStep1Valid = hasNoSuratJalanErrors(step1Errors);
  const isStep2Valid = validateSuratJalanStep2(lineItems);

  const selectedProductIds = useMemo(
    () => new Set(lineItems.map((item) => item.product_id)),
    [lineItems]
  );

  const availableProducts = useMemo(
    () => products.filter((product) => !selectedProductIds.has(product.product_id)),
    [products, selectedProductIds]
  );

  const draftProduct = products.find(
    (product) => product.product_id === draftProductId
  );

  const selectedCustomer = customers.find((item) => item.cust_id === custId);
  const selectedToko = tokos.find((item) => item.toko_id === tokoId);
  const selectedPemilik = pemiliks.find((item) => item.pemilik_id === pemilikId);

  /**
   * Mengambil opsi dropdown dan product dari API.
   */
  const fetchOptions = useCallback(async () => {
    setIsLoadingOptions(true);
    setLoadOptionsError(false);

    const result = await suratJalanService.getFormOptions();

    if (result.success) {
      setCustomers(result.customers ?? []);
      setTokos(result.tokos ?? []);
      setPemiliks(result.pemiliks ?? []);
      setProducts(result.products ?? []);
      setIsLoadingOptions(false);
      return;
    }

    setLoadOptionsError(true);
    setIsLoadingOptions(false);
  }, []);

  useEffect(() => {
    fetchOptions();
  }, [fetchOptions]);

  /**
   * Mereset data Step 2 dan Step 3 serta mengunci navigasi lanjutan.
   */
  function resetDownstreamSteps() {
    setLineItems([]);
    setDraftProductId("");
    setDraftKuantitas("1");
    setDraftError(undefined);
    setShowHargaWarning(false);
    setHargaWarningProducts([]);
    setMaxStepReached(1);
  }

  /**
   * Mengunci akses Step 3 setelah daftar product di Step 2 diubah.
   */
  function invalidateStep3Access() {
    setMaxStepReached((prev) => (prev >= 3 ? 2 : prev));
    setShowHargaWarning(false);
    setHargaWarningProducts([]);
  }

  useEffect(() => {
    const previous = prevCustTokoRef.current;
    const custChanged = previous.custId !== "" && previous.custId !== custId;
    const tokoChanged = previous.tokoId !== "" && previous.tokoId !== tokoId;

    if (custChanged || tokoChanged) {
      resetDownstreamSteps();
    }

    prevCustTokoRef.current = { custId, tokoId };
  }, [custId, tokoId]);

  /**
   * Menangani blur field step 1 dengan validasi langsung.
   */
  function handleStep1FieldBlur(
    field: SuratJalanStep1FieldName,
    selectedValue?: string
  ) {
    const nextValues = {
      ...step1Values,
      ...(field === "custId" && selectedValue !== undefined
        ? { custId: selectedValue }
        : {}),
      ...(field === "tokoId" && selectedValue !== undefined
        ? { tokoId: selectedValue }
        : {}),
      ...(field === "pemilikId" && selectedValue !== undefined
        ? { pemilikId: selectedValue }
        : {}),
    };

    handleFieldBlur(field, getSuratJalanStep1FieldError(field, nextValues));
  }

  /**
   * Berpindah ke step yang sudah pernah dicapai tanpa menghapus data.
   */
  function goToStep(step: number) {
    if (step <= maxStepReached) {
      setCurrentStep(step);
    }
  }

  /**
   * Kembali ke step sebelumnya tanpa mereset data Step 2 dan 3.
   */
  function handleBackStep() {
    if (currentStep > 1) {
      setCurrentStep((step) => step - 1);
    }
  }

  /**
   * Melanjutkan ke step berikutnya setelah validasi step saat ini berhasil.
   */
  async function handleNextStep() {
    if (currentStep === 1) {
      applySubmitErrors(step1Errors);
      if (!isStep1Valid) {
        return;
      }
      setCurrentStep(2);
      setMaxStepReached((prev) => Math.max(prev, 2));
      return;
    }

    if (currentStep === 2) {
      if (!isStep2Valid || !custId) {
        return;
      }

      setIsValidatingHarga(true);

      const validationResult = await suratJalanService.validateLineItemHarga({
        custId,
        lineItems: lineItems.map((item) => ({
          productId: item.product_id,
          namaBarang: item.nama_barang,
        })),
      });

      setIsValidatingHarga(false);

      if (!validationResult.success) {
        setErrorMessage(SURAT_JALAN_SAVE_ERROR_MESSAGE);
        setShowErrorPopup(true);
        return;
      }

      if (!validationResult.isValid) {
        setHargaWarningProducts(validationResult.missingProductNames ?? []);
        setShowHargaWarning(true);
        return;
      }

      setCurrentStep(3);
      setMaxStepReached((prev) => Math.max(prev, 3));
    }
  }

  /**
   * Mengarahkan pengguna ke halaman My Product untuk input harga.
   */
  function handleGoToMyProduct() {
    setShowHargaWarning(false);
    router.push("/product/my-product");
  }

  /**
   * Menambahkan product ke daftar pembelian step 2.
   */
  function handleAddLineItem() {
    if (!draftProduct) {
      setDraftError("Product harus dipilih.");
      return;
    }

    const kuantitasValue = draftKuantitas.trim();
    if (!kuantitasValue || !/^\d+$/.test(kuantitasValue)) {
      setDraftError("Kuantitas harus berupa angka.");
      return;
    }

    const kuantitasNumber = Number(kuantitasValue);
    if (kuantitasNumber <= 0) {
      setDraftError("Kuantitas harus lebih dari 0.");
      return;
    }

    const cappedKuantitas = Math.min(kuantitasNumber, draftProduct.kuantitas);
    if (cappedKuantitas <= 0) {
      setDraftError("Stok product tidak tersedia.");
      return;
    }

    setLineItems((prev) => [
      ...prev,
      {
        rowKey: crypto.randomUUID(),
        product_id: draftProduct.product_id,
        nama_barang: draftProduct.nama_barang,
        kuantitas_beli: cappedKuantitas,
        satuan_kuantitas: draftProduct.satuan_kuantitas,
        keterangan: draftProduct.keterangan,
      },
    ]);

    setDraftProductId("");
    setDraftKuantitas("1");
    setDraftError(undefined);
    invalidateStep3Access();
  }

  /**
   * Menghapus baris product dari daftar pembelian.
   */
  function handleRemoveLineItem(rowKey: string) {
    setLineItems((prev) => prev.filter((item) => item.rowKey !== rowKey));
    invalidateStep3Access();
  }

  /**
   * Mereset seluruh form ke kondisi awal.
   */
  function resetForm() {
    setCurrentStep(1);
    setNomorPo("");
    setPengiriman("");
    setTanggalSj(getTodayWibDateInputValue());
    setNomorSj("");
    setCustId("");
    setTokoId("");
    setPemilikId("");
    prevCustTokoRef.current = { custId: "", tokoId: "" };
    resetDownstreamSteps();
    resetValidation();
    setShowSuccess(false);
    fetchOptions();
  }

  /**
   * Membuka dialog konfirmasi simpan.
   */
  function handleOpenSaveConfirm() {
    applySubmitErrors(step1Errors);
    if (!isStep1Valid || !isStep2Valid || !user) {
      return;
    }
    setShowSaveConfirm(true);
  }

  /**
   * Menyimpan Surat Jalan setelah konfirmasi pengguna.
   */
  async function handleConfirmSave() {
    if (!user) {
      return;
    }

    setShowSaveConfirm(false);
    setIsSaving(true);

    const result = await suratJalanService.saveSuratJalan({
      nomorPo: nomorPo.trim(),
      pengiriman: pengiriman.trim(),
      tanggalSj,
      nomorSj: nomorSj.trim(),
      custId,
      tokoId,
      pemilikId,
      lineItems: lineItems.map((item) => ({
        productId: item.product_id,
        kuantitasBeli: item.kuantitas_beli,
      })),
      username: user.username,
      name: user.name,
    });

    setIsSaving(false);

    if (result.success) {
      setShowSuccess(true);
      return;
    }

    setErrorMessage(result.error ?? SURAT_JALAN_SAVE_ERROR_MESSAGE);
    setShowErrorPopup(true);
  }

  if (loadOptionsError && !isLoadingOptions) {
    return (
      <section className="mx-auto max-w-2xl">
        <div className="rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Gagal memuat data form
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Terjadi kesalahan saat mengambil data. Silakan coba lagi.
          </p>
          <button
            type="button"
            onClick={fetchOptions}
            className="mt-6 rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Refresh
          </button>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="mx-auto max-w-3xl">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <h2 className="text-xl font-semibold text-slate-900">Surat Jalan</h2>

          <nav className="mt-6" aria-label="Langkah pengisian form">
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
                    htmlFor="nomorPo"
                    className="mb-1.5 block text-sm font-medium text-slate-700"
                  >
                    Nomor PO
                  </label>
                  <input
                    id="nomorPo"
                    type="text"
                    value={nomorPo}
                    maxLength={MAX_NOMOR_PO_LENGTH}
                    onChange={(event) =>
                      setNomorPo(toDocumentUpperCase(event.target.value))
                    }
                    onBlur={() => handleStep1FieldBlur("nomorPo")}
                    placeholder="Masukkan nomor PO"
                    className={inputClassName}
                  />
                  {getFieldError("nomorPo") && (
                    <p className="mt-1.5 text-sm text-red-600">
                      {getFieldError("nomorPo")}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="pengiriman"
                    className="mb-1.5 block text-sm font-medium text-slate-700"
                  >
                    Pengiriman
                  </label>
                  <input
                    id="pengiriman"
                    type="text"
                    value={pengiriman}
                    maxLength={MAX_PENGIRIMAN_LENGTH}
                    onChange={(event) =>
                      setPengiriman(toDocumentUpperCase(event.target.value))
                    }
                    onBlur={() => handleStep1FieldBlur("pengiriman")}
                    placeholder="Masukkan detail pengiriman"
                    className={inputClassName}
                  />
                  {getFieldError("pengiriman") && (
                    <p className="mt-1.5 text-sm text-red-600">
                      {getFieldError("pengiriman")}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="tanggalSj"
                    className="mb-1.5 block text-sm font-medium text-slate-700"
                  >
                    Tanggal Surat Jalan
                  </label>
                  <input
                    id="tanggalSj"
                    type="date"
                    value={tanggalSj}
                    max={getTodayWibDateInputValue()}
                    onChange={(event) => setTanggalSj(event.target.value)}
                    onBlur={() => handleStep1FieldBlur("tanggalSj")}
                    className={inputClassName}
                  />
                  {getFieldError("tanggalSj") && (
                    <p className="mt-1.5 text-sm text-red-600">
                      {getFieldError("tanggalSj")}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="nomorSj"
                    className="mb-1.5 block text-sm font-medium text-slate-700"
                  >
                    Nomor Surat Jalan
                  </label>
                  <input
                    id="nomorSj"
                    type="text"
                    value={nomorSj}
                    maxLength={MAX_NOMOR_SJ_LENGTH}
                    onChange={(event) =>
                      setNomorSj(toDocumentUpperCase(event.target.value))
                    }
                    onBlur={() => handleStep1FieldBlur("nomorSj")}
                    placeholder="Masukkan nomor surat jalan"
                    className={inputClassName}
                  />
                  {getFieldError("nomorSj") && (
                    <p className="mt-1.5 text-sm text-red-600">
                      {getFieldError("nomorSj")}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="custId"
                    className="mb-1.5 block text-sm font-medium text-slate-700"
                  >
                    Nama Customer
                  </label>
                  <CustomSelect
                    id="custId"
                    value={custId}
                    onChange={setCustId}
                    onBlur={(selectedValue) =>
                      handleStep1FieldBlur("custId", selectedValue)
                    }
                    placeholder="Pilih customer"
                    disabled={isLoadingOptions}
                    options={customers.map((customer) => ({
                      value: customer.cust_id,
                      label: toTitleCase(customer.cust_name),
                    }))}
                  />
                  {getFieldError("custId") && (
                    <p className="mt-1.5 text-sm text-red-600">
                      {getFieldError("custId")}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="tokoId"
                    className="mb-1.5 block text-sm font-medium text-slate-700"
                  >
                    Nama Toko
                  </label>
                  <CustomSelect
                    id="tokoId"
                    value={tokoId}
                    onChange={setTokoId}
                    onBlur={(selectedValue) =>
                      handleStep1FieldBlur("tokoId", selectedValue)
                    }
                    placeholder="Pilih toko"
                    disabled={isLoadingOptions}
                    options={tokos.map((toko) => ({
                      value: toko.toko_id,
                      label: toTitleCase(toko.nama_toko),
                    }))}
                  />
                  {getFieldError("tokoId") && (
                    <p className="mt-1.5 text-sm text-red-600">
                      {getFieldError("tokoId")}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="pemilikId"
                    className="mb-1.5 block text-sm font-medium text-slate-700"
                  >
                    Nama Pemilik
                  </label>
                  <CustomSelect
                    id="pemilikId"
                    value={pemilikId}
                    onChange={setPemilikId}
                    onBlur={(selectedValue) =>
                      handleStep1FieldBlur("pemilikId", selectedValue)
                    }
                    placeholder="Pilih pemilik"
                    disabled={isLoadingOptions}
                    options={pemiliks.map((pemilik) => ({
                      value: pemilik.pemilik_id,
                      label: toTitleCase(pemilik.nama_pemilik),
                    }))}
                  />
                  {getFieldError("pemilikId") && (
                    <p className="mt-1.5 text-sm text-red-600">
                      {getFieldError("pemilikId")}
                    </p>
                  )}
                </div>
              </>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <p className="text-sm text-slate-600">
                  Pilih product dan isi kuantitas pembelian. Product yang sudah
                  dipilih tidak akan muncul lagi di daftar pilihan.
                </p>

                {isLoadingOptions ? (
                  <p className="py-6 text-center text-sm text-slate-500">
                    Memuat daftar product...
                  </p>
                ) : availableProducts.length === 0 && lineItems.length === 0 ? (
                  <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    Tidak ada product tersedia dengan stok.
                  </p>
                ) : (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 md:p-5">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label
                          htmlFor="draftProductId"
                          className="mb-1.5 block text-sm font-medium text-slate-700"
                        >
                          Product
                        </label>
                        <CustomSelect
                          id="draftProductId"
                          value={draftProductId}
                          onChange={(value) => {
                            setDraftProductId(value);
                            setDraftKuantitas("1");
                            setDraftError(undefined);
                          }}
                          placeholder="Pilih product"
                          options={availableProducts.map((product) => ({
                            value: product.product_id,
                            label: toTitleCase(product.nama_barang),
                          }))}
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="draftKuantitas"
                          className="mb-1.5 block text-sm font-medium text-slate-700"
                        >
                          Kuantitas Beli
                        </label>
                        <input
                          id="draftKuantitas"
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={draftKuantitas}
                          disabled={!draftProductId}
                          onChange={(event) => {
                            const value = event.target.value;
                            if (value !== "" && !/^\d+$/.test(value)) {
                              return;
                            }

                            if (draftProduct && value !== "") {
                              const num = Number(value);
                              if (num > draftProduct.kuantitas) {
                                setDraftKuantitas(String(draftProduct.kuantitas));
                                return;
                              }
                            }

                            setDraftKuantitas(value);
                            setDraftError(undefined);
                          }}
                          placeholder="Masukkan kuantitas"
                          className={inputClassName}
                        />
                        {draftProduct && (
                          <p className="mt-1.5 text-xs text-slate-500">
                            Stok tersedia: {draftProduct.kuantitas}{" "}
                            {draftProduct.satuan_kuantitas}
                          </p>
                        )}
                      </div>
                    </div>

                    {draftError && (
                      <p className="mt-3 text-sm text-red-600">{draftError}</p>
                    )}

                    <button
                      type="button"
                      onClick={handleAddLineItem}
                      disabled={availableProducts.length === 0}
                      className="mt-4 inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <span className="text-base leading-none">+</span>
                      Tambah Product
                    </button>
                  </div>
                )}

                {lineItems.length > 0 && (
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="min-w-full divide-y divide-slate-200">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                            Product
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                            Jumlah Beli
                          </th>
                          <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        {lineItems.map((item) => (
                          <tr key={item.rowKey}>
                            <td className="px-4 py-3 text-sm text-slate-900">
                              {toTitleCase(item.nama_barang)}
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-700">
                              {item.kuantitas_beli} {item.satuan_kuantitas}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveLineItem(item.rowKey)}
                                className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-100"
                              >
                                Hapus
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 md:p-5">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Detail Pembelian
                  </h3>
                  <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div>
                      <dt className="text-xs text-slate-500">Nomor PO</dt>
                      <dd className="text-sm font-medium text-slate-900">
                        {nomorPo}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-500">Pengiriman</dt>
                      <dd className="text-sm font-medium text-slate-900">
                        {pengiriman}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-500">
                        Tanggal Surat Jalan
                      </dt>
                      <dd className="text-sm font-medium text-slate-900">
                        {formatDateDisplay(tanggalSj)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-500">
                        Nomor Surat Jalan
                      </dt>
                      <dd className="text-sm font-medium text-slate-900">
                        {nomorSj}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-500">Nama Customer</dt>
                      <dd className="text-sm font-medium text-slate-900">
                        {selectedCustomer
                          ? toTitleCase(selectedCustomer.cust_name)
                          : "-"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-500">Nama Toko</dt>
                      <dd className="text-sm font-medium text-slate-900">
                        {selectedToko ? toTitleCase(selectedToko.nama_toko) : "-"}
                      </dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="text-xs text-slate-500">Nama Pemilik</dt>
                      <dd className="text-sm font-medium text-slate-900">
                        {selectedPemilik
                          ? toTitleCase(selectedPemilik.nama_pemilik)
                          : "-"}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                          Product
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                          Jumlah Beli
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                          Keterangan
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {lineItems.map((item) => (
                        <tr key={item.rowKey}>
                          <td className="px-4 py-3 text-sm text-slate-900">
                            {toTitleCase(item.nama_barang)}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-700">
                            {item.kuantitas_beli} {item.satuan_kuantitas}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600">
                            {item.keterangan?.trim()
                              ? item.keterangan
                              : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handleBackStep}
                className="rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Kembali
              </button>
            ) : (
              <span />
            )}

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
                onClick={handleOpenSaveConfirm}
                disabled={!isStep1Valid || !isStep2Valid || !user}
                className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Simpan
              </button>
            )}
          </div>
        </div>
      </section>

      <ConfirmDialog
        visible={showSaveConfirm}
        message="Apakah Anda yakin pengisian sudah sesuai? Lanjut menyimpan Surat Jalan?"
        onClose={() => setShowSaveConfirm(false)}
        onConfirm={handleConfirmSave}
        isLoading={isSaving}
      />

      <WarningDialog
        visible={showHargaWarning}
        message={
          <>
            Harga untuk{" "}
            {hargaWarningProducts.map((name) => toTitleCase(name)).join(", ")}{" "}
            dengan customer{" "}
            <strong>
              {selectedCustomer
                ? toTitleCase(selectedCustomer.cust_name)
                : "-"}
            </strong>{" "}
            belum diinput. Pastikan harga sudah diinput via sistem.
          </>
        }
        primaryLabel="Ke Input Harga"
        onPrimaryAction={handleGoToMyProduct}
        onClose={() => setShowHargaWarning(false)}
      />

      <ErrorPopup
        visible={showErrorPopup}
        message={errorMessage}
        onClose={() => setShowErrorPopup(false)}
      />

      <LoadingOverlay visible={isSaving || isLoadingOptions || isValidatingHarga} />

      {showSuccess && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="surat-jalan-success-title"
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
                id="surat-jalan-success-title"
                className="text-lg font-semibold text-slate-900"
              >
                Surat Jalan berhasil disimpan
              </p>
              <button
                type="button"
                onClick={resetForm}
                className="mt-6 w-full rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Buat Surat Jalan Baru
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
