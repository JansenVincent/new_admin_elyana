"use client";

import { useMemo, useState } from "react";
import { productService } from "@/application/services/ProductService";
import type { KuantitasEditMode } from "@/domain/entities/UpdateKuantitas";
import ConfirmDialog from "@/presentation/components/ui/ConfirmDialog";
import ErrorPopup from "@/presentation/components/ui/ErrorPopup";
import LoadingOverlay from "@/presentation/components/ui/LoadingOverlay";
import { MAX_EDIT_KUANTITAS_CATATAN_LENGTH } from "@/shared/constants/product";
import { formInputClassName } from "@/shared/constants/formInput";
import { useBlurFieldValidation } from "@/shared/hooks/useBlurFieldValidation";
import {
  hasNoEditKuantitasErrors,
  validateEditKuantitasStep1,
  validateEditKuantitasStep2,
  validateEditKuantitasStep3,
} from "@/shared/utils/editKuantitasValidation";
import { getTodayWibDateInputValue } from "@/shared/utils/timestamp";

const inputClassName = formInputClassName;

interface EditKuantitasDialogProps {
  /** Apakah dialog edit kuantitas ditampilkan. */
  visible: boolean;
  /** Slug ID product yang sedang diedit. */
  slugId: string;
  /** Kuantitas product saat ini. */
  currentKuantitas: number;
  /** Satuan kuantitas product. */
  satuanKuantitas: string;
  /** Username admin dari session aktif. */
  username: string;
  /** Nama admin dari session aktif. */
  name: string;
  /** Callback saat dialog ditutup. */
  onClose: () => void;
  /** Callback setelah penyimpanan berhasil untuk refresh data. */
  onSaved: () => void;
}

/**
 * Dialog multi-step untuk mengedit kuantitas product pada My Product.
 */
export default function EditKuantitasDialog({
  visible,
  slugId,
  currentKuantitas,
  satuanKuantitas,
  username,
  name,
  onClose,
  onSaved,
}: EditKuantitasDialogProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [mode, setMode] = useState<KuantitasEditMode | "">("");
  const [jumlah, setJumlah] = useState("");
  const [tanggal, setTanggal] = useState(getTodayWibDateInputValue());
  const [catatan, setCatatan] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("Gagal menyimpan data");
  const [showErrorPopup, setShowErrorPopup] = useState(false);

  const {
    handleFieldBlur,
    getFieldError,
    applySubmitErrors,
    resetValidation,
  } = useBlurFieldValidation();

  const satuanLower = satuanKuantitas.trim().toLowerCase();

  const step1Errors = useMemo(
    () => validateEditKuantitasStep1({ mode, jumlah, currentKuantitas }),
    [mode, jumlah, currentKuantitas]
  );
  const step2Errors = useMemo(
    () => validateEditKuantitasStep2(tanggal),
    [tanggal]
  );
  const step3Errors = useMemo(
    () => validateEditKuantitasStep3(catatan),
    [catatan]
  );

  const isStep1Valid = hasNoEditKuantitasErrors(step1Errors);
  const isStep2Valid = hasNoEditKuantitasErrors(step2Errors);
  const isStep3Valid = hasNoEditKuantitasErrors(step3Errors);
  const canSave = isStep1Valid && isStep2Valid && isStep3Valid;

  const previewPrefix = mode === "tambah" ? "+" : mode === "kurang" ? "-" : "";
  const previewJumlah = jumlah.trim() || "0";

  const tanggalLabel =
    mode === "kurang" ? "Tanggal Keluar Barang" : "Tanggal Masuk Barang";

  const catatanLabel =
    mode === "kurang" ? "Catatan Keluar Barang" : "Catatan Masuk Barang";

  /**
   * Mereset form edit kuantitas ke kondisi awal.
   */
  function resetForm() {
    setCurrentStep(1);
    setMode("");
    setJumlah("");
    setTanggal(getTodayWibDateInputValue());
    setCatatan("");
    setShowConfirm(false);
    setShowSuccess(false);
    resetValidation();
  }

  /**
   * Menutup dialog dan mereset form.
   */
  function handleClose() {
    resetForm();
    onClose();
  }

  /**
   * Melanjutkan ke step berikutnya setelah validasi.
   */
  function handleNextStep() {
    if (currentStep === 1) {
      applySubmitErrors(step1Errors);
      if (!isStep1Valid) {
        return;
      }
      setCurrentStep(2);
      resetValidation();
      return;
    }

    if (currentStep === 2) {
      applySubmitErrors(step2Errors);
      if (!isStep2Valid) {
        return;
      }
      setCurrentStep(3);
      resetValidation();
    }
  }

  /**
   * Membuka popup konfirmasi sebelum menyimpan perubahan kuantitas.
   */
  function handleOpenConfirm() {
    applySubmitErrors({
      ...step1Errors,
      ...step2Errors,
      ...step3Errors,
    });

    if (!canSave || !mode) {
      return;
    }

    setShowConfirm(true);
  }

  /**
   * Menyimpan perubahan kuantitas ke database.
   */
  async function handleConfirmSave() {
    setShowConfirm(false);

    if (!mode) {
      return;
    }

    setIsSaving(true);

    const result = await productService.updateProductKuantitas({
      slugId,
      mode,
      jumlah: Number(jumlah),
      tanggal,
      catatan,
      username,
      name,
    });

    setIsSaving(false);

    if (result.success) {
      setShowSuccess(true);
      return;
    }

    setErrorMessage(result.error ?? "Gagal menyimpan data");
    setShowErrorPopup(true);
  }

  /**
   * Menutup popup sukses dan me-refresh halaman detail.
   */
  function handleSuccessOk() {
    resetForm();
    onSaved();
    onClose();
  }

  if (!visible) {
    return null;
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
        <div
          className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl md:p-8"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-kuantitas-title"
        >
          <button
            type="button"
            onClick={handleClose}
            className="absolute right-4 top-4 text-slate-400 transition hover:text-slate-600"
            aria-label="Tutup dialog"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <h3 id="edit-kuantitas-title" className="text-lg font-semibold text-slate-900">
            Edit Kuantitas
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            Kuantitas saat ini: {currentKuantitas} {satuanLower}
          </p>

          <div className="mt-4 flex gap-2">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`h-1.5 flex-1 rounded-full ${
                  step <= currentStep ? "bg-slate-900" : "bg-slate-200"
                }`}
                aria-hidden="true"
              />
            ))}
          </div>

          <div className="mt-6 space-y-5">
            {currentStep === 1 && (
              <>
                <div>
                  <p className="mb-3 text-sm font-medium text-slate-700">
                    Pilih jenis perubahan
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setMode("tambah")}
                      className={`rounded-xl border-2 px-4 py-4 text-left transition ${
                        mode === "tambah"
                          ? "border-green-500 bg-green-50"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <span className="text-2xl font-bold text-green-600">+</span>
                      <p className="mt-1 text-sm font-medium text-slate-900">
                        Tambah Kuantitas
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode("kurang")}
                      className={`rounded-xl border-2 px-4 py-4 text-left transition ${
                        mode === "kurang"
                          ? "border-red-500 bg-red-50"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <span className="text-2xl font-bold text-red-600">−</span>
                      <p className="mt-1 text-sm font-medium text-slate-900">
                        Kurangi Kuantitas
                      </p>
                    </button>
                  </div>
                  {getFieldError("mode") && (
                    <p className="mt-1.5 text-sm text-red-600">{getFieldError("mode")}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="editJumlah"
                    className="mb-1.5 block text-sm font-medium text-slate-700"
                  >
                    Jumlah Kuantitas
                  </label>
                  <input
                    id="editJumlah"
                    type="text"
                    inputMode="numeric"
                    value={jumlah}
                    onChange={(event) => {
                      const value = event.target.value;
                      if (value === "" || /^\d+$/.test(value)) {
                        setJumlah(value);
                      }
                    }}
                    onBlur={() =>
                      handleFieldBlur("jumlah", step1Errors.jumlah)
                    }
                    placeholder="Masukkan jumlah kuantitas"
                    className={inputClassName}
                  />
                  {getFieldError("jumlah") && (
                    <p className="mt-1.5 text-sm text-red-600">
                      {getFieldError("jumlah")}
                    </p>
                  )}
                </div>

                {mode && jumlah.trim() && (
                  <div
                    className={`rounded-xl px-4 py-3 text-center text-lg font-semibold ${
                      mode === "tambah"
                        ? "bg-green-50 text-green-700"
                        : "bg-red-50 text-red-700"
                    }`}
                  >
                    {previewPrefix}
                    {previewJumlah} {satuanLower}
                  </div>
                )}
              </>
            )}

            {currentStep === 2 && (
              <div>
                <label
                  htmlFor="editTanggal"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  {tanggalLabel}
                </label>
                <input
                  id="editTanggal"
                  type="date"
                  value={tanggal}
                  max={getTodayWibDateInputValue()}
                  onChange={(event) => setTanggal(event.target.value)}
                  onBlur={() =>
                    handleFieldBlur("tanggal", step2Errors.tanggal)
                  }
                  className={inputClassName}
                />
                {getFieldError("tanggal") && (
                  <p className="mt-1.5 text-sm text-red-600">
                    {getFieldError("tanggal")}
                  </p>
                )}
              </div>
            )}

            {currentStep === 3 && (
              <div>
                <label
                  htmlFor="editCatatan"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  {catatanLabel}
                </label>
                <textarea
                  id="editCatatan"
                  value={catatan}
                  onChange={(event) => setCatatan(event.target.value)}
                  onBlur={() =>
                    handleFieldBlur("catatan", step3Errors.catatan)
                  }
                  placeholder={`Opsional (maks. ${MAX_EDIT_KUANTITAS_CATATAN_LENGTH} karakter)`}
                  rows={5}
                  maxLength={MAX_EDIT_KUANTITAS_CATATAN_LENGTH}
                  className={`${inputClassName} resize-y`}
                />
                <div className="mt-1.5 flex items-center justify-between gap-2">
                  {getFieldError("catatan") ? (
                    <p className="text-sm text-red-600">{getFieldError("catatan")}</p>
                  ) : (
                    <span />
                  )}
                  <p className="text-xs text-slate-500">
                    {catatan.length}/{MAX_EDIT_KUANTITAS_CATATAN_LENGTH}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 flex justify-end gap-3">
            {currentStep > 1 && currentStep < 3 && (
              <button
                type="button"
                onClick={() => setCurrentStep((step) => step - 1)}
                className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Kembali
              </button>
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
                onClick={handleOpenConfirm}
                disabled={!canSave || isSaving}
                className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Simpan
              </button>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        visible={showConfirm}
        message="Apakah Anda yakin ingin menyimpan perubahan Kuantitas barang?"
        onClose={() => setShowConfirm(false)}
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
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="edit-kuantitas-success-title"
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
                id="edit-kuantitas-success-title"
                className="text-lg font-semibold text-slate-900"
              >
                Perubahan data berhasil di simpan
              </p>
              <button
                type="button"
                onClick={handleSuccessOk}
                className="mt-6 w-full rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
