"use client";

import { useEffect, useMemo, useState } from "react";
import { productService } from "@/application/services/ProductService";
import type { MyProductPriceByCustomer } from "@/domain/entities/MyProduct";
import ConfirmDialog from "@/presentation/components/ui/ConfirmDialog";
import ErrorPopup from "@/presentation/components/ui/ErrorPopup";
import LoadingOverlay from "@/presentation/components/ui/LoadingOverlay";
import { useBlurFieldValidation } from "@/shared/hooks/useBlurFieldValidation";
import { formatHargaDisplay } from "@/shared/utils/formatCatatan";
import {
  hasHargaValueChanged,
  validateEditHargaNominal,
} from "@/shared/utils/editHargaValidation";
import { toTitleCase } from "@/shared/utils/stringFormat";

import { nominalInputClassName } from "@/shared/constants/formInput";

interface EditHargaDialogProps {
  /** Apakah dialog edit harga ditampilkan. */
  visible: boolean;
  /** Slug ID product yang sedang diedit. */
  slugId: string;
  /** Data harga customer yang akan diedit. */
  price: MyProductPriceByCustomer | null;
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
 * Dialog untuk mengedit nominal harga customer pada My Product.
 */
export default function EditHargaDialog({
  visible,
  slugId,
  price,
  username,
  name,
  onClose,
  onSaved,
}: EditHargaDialogProps) {
  const [harga, setHarga] = useState("");
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

  /**
   * Menginisialisasi nilai harga dari data database saat dialog dibuka.
   */
  useEffect(() => {
    if (visible && price) {
      setHarga(String(price.harga));
      resetValidation();
      setShowConfirm(false);
      setShowSuccess(false);
    }
  }, [visible, price, resetValidation]);

  const hargaError = useMemo(
    () => validateEditHargaNominal(harga),
    [harga]
  );

  const isValid = !hargaError;
  const hasChanged = price ? hasHargaValueChanged(harga, price.harga) : false;
  const canSave = isValid && hasChanged;

  /**
   * Mereset form edit harga ke kondisi awal.
   */
  function resetForm() {
    setHarga(price ? String(price.harga) : "");
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
   * Membuka popup konfirmasi sebelum menyimpan perubahan harga.
   */
  function handleOpenConfirm() {
    const error = validateEditHargaNominal(harga);
    applySubmitErrors(error ? { harga: error } : {});

    if (!canSave || !price) {
      return;
    }

    setShowConfirm(true);
  }

  /**
   * Menyimpan perubahan harga ke database.
   */
  async function handleConfirmSave() {
    setShowConfirm(false);

    if (!price) {
      return;
    }

    setIsSaving(true);

    const result = await productService.updateProductHarga({
      slugId,
      hargaId: price.harga_id,
      harga: Number(harga),
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

  if (!visible || !price) {
    return null;
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
        <div
          className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl md:p-8"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-harga-title"
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

          <h3 id="edit-harga-title" className="text-lg font-semibold text-slate-900">
            Edit Harga Customer
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            {toTitleCase(price.cust_name)}
          </p>

          <div className="mt-6 space-y-5">
            <div>
              <p className="mb-1.5 text-sm font-medium text-slate-700">Mata Uang</p>
              <p className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm font-medium text-slate-800">
                {price.mata_uang}
              </p>
            </div>

            <div>
              <p className="mb-1.5 text-sm font-medium text-slate-700">
                Harga Saat Ini
              </p>
              <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                {formatHargaDisplay(price.mata_uang, price.harga)}
              </p>
            </div>

            <div>
              <label
                htmlFor="editHargaNominal"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Nominal Harga Baru
              </label>
              <input
                id="editHargaNominal"
                type="text"
                inputMode="decimal"
                value={harga}
                onChange={(event) => setHarga(event.target.value)}
                onBlur={() => handleFieldBlur("harga", hargaError)}
                placeholder="Masukkan nominal harga"
                className={nominalInputClassName}
              />
              {getFieldError("harga") && (
                <p className="mt-1.5 text-sm text-red-600">{getFieldError("harga")}</p>
              )}
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleOpenConfirm}
              disabled={!canSave || isSaving}
              className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Simpan
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        visible={showConfirm}
        message="Apakah Anda yakin akan mengubah harga customer ini?"
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
          aria-labelledby="edit-harga-success-title"
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
                id="edit-harga-success-title"
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
