"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { productService } from "@/application/services/ProductService";
import type { ActiveCustomerOption, PriceRowInput } from "@/domain/entities/InputBarang";
import ConfirmDialog from "@/presentation/components/ui/ConfirmDialog";
import ErrorPopup from "@/presentation/components/ui/ErrorPopup";
import LoadingOverlay from "@/presentation/components/ui/LoadingOverlay";
import {
  areAllCustomersPaired,
  getAvailableCustomersForRow,
} from "@/shared/hooks/useBlurFieldValidation";
import { CURRENCY_OPTIONS } from "@/shared/constants/product";
import { validatePriceRow, validateStep3 } from "@/shared/utils/inputBarangValidation";

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

interface AddHargaDialogProps {
  /** Apakah dialog tambah harga ditampilkan. */
  visible: boolean;
  /** Slug ID product yang sedang ditambahkan harganya. */
  slugId: string;
  /** Daftar cust_id customer yang sudah memiliki harga. */
  existingCustIds: string[];
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
 * Dialog untuk menambahkan harga product per customer baru pada My Product.
 */
export default function AddHargaDialog({
  visible,
  slugId,
  existingCustIds,
  username,
  name,
  onClose,
  onSaved,
}: AddHargaDialogProps) {
  const [priceRows, setPriceRows] = useState<PriceRowInput[]>([]);
  const [availableCustomers, setAvailableCustomers] = useState<
    ActiveCustomerOption[]
  >([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("Gagal menyimpan data");
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [priceRowErrors, setPriceRowErrors] = useState<
    Record<string, Record<string, string>>
  >({});
  const [blurredPriceFields, setBlurredPriceFields] = useState<
    Record<string, Set<string>>
  >({});

  const step3Validation = useMemo(
    () => validateStep3(priceRows),
    [priceRows]
  );
  const isStep3Valid = step3Validation.isValid;
  const canAddPriceRow = priceRows.length < availableCustomers.length;
  const allCustomersPaired = areAllCustomersPaired(
    priceRows,
    availableCustomers.length
  );

  /**
   * Memuat customer aktif yang belum memiliki harga untuk product ini.
   */
  const loadAvailableCustomers = useCallback(async () => {
    setIsLoadingCustomers(true);

    const result = await productService.listActiveCustomers();

    if (result.success && result.customers) {
      const existingSet = new Set(existingCustIds);
      const filtered = result.customers.filter(
        (customer) => !existingSet.has(customer.cust_id)
      );
      setAvailableCustomers(filtered);
    } else {
      setAvailableCustomers([]);
    }

    setIsLoadingCustomers(false);
  }, [existingCustIds]);

  /**
   * Menginisialisasi form saat dialog dibuka.
   */
  useEffect(() => {
    if (visible) {
      void loadAvailableCustomers();
      setPriceRows([createEmptyPriceRow()]);
      setPriceRowErrors({});
      setBlurredPriceFields({});
      setShowConfirm(false);
      setShowSuccess(false);
    }
  }, [visible, loadAvailableCustomers]);

  /**
   * Mengembalikan pesan error field baris harga jika sudah pernah di-blur.
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
  function handlePriceRowFieldBlur(rowKey: string, field: string) {
    const row = priceRows.find((item) => item.rowKey === rowKey);
    if (!row) {
      return;
    }

    const errors = validatePriceRow(row);
    setBlurredPriceFields((prev) => ({
      ...prev,
      [rowKey]: new Set(prev[rowKey] ?? []).add(field),
    }));
    setPriceRowErrors((prev) => ({
      ...prev,
      [rowKey]: errors,
    }));
  }

  /**
   * Memperbarui nilai field pada baris harga tertentu.
   */
  function updatePriceRow(
    rowKey: string,
    field: keyof Omit<PriceRowInput, "rowKey">,
    value: string
  ) {
    setPriceRows((prev) =>
      prev.map((row) => {
        if (row.rowKey !== rowKey) {
          return row;
        }

        if (field === "cust_id") {
          return { ...row, cust_id: value };
        }

        if (field === "currency") {
          return { ...row, currency: value };
        }

        return { ...row, harga: value };
      })
    );
  }

  /**
   * Menambahkan baris harga baru ke form.
   */
  function addPriceRow() {
    if (!canAddPriceRow) {
      return;
    }
    setPriceRows((prev) => [...prev, createEmptyPriceRow()]);
  }

  /**
   * Menghapus baris harga dari form.
   */
  function removePriceRow(rowKey: string) {
    setPriceRows((prev) => {
      if (prev.length <= 1) {
        return prev;
      }
      return prev.filter((row) => row.rowKey !== rowKey);
    });
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
   * Mereset form tambah harga ke kondisi awal.
   */
  function resetForm() {
    setPriceRows([createEmptyPriceRow()]);
    setPriceRowErrors({});
    setBlurredPriceFields({});
    setShowConfirm(false);
    setShowSuccess(false);
  }

  /**
   * Menutup dialog dan mereset form.
   */
  function handleClose() {
    resetForm();
    onClose();
  }

  /**
   * Membuka popup konfirmasi sebelum menyimpan harga baru.
   */
  function handleOpenConfirm() {
    setPriceRowErrors(step3Validation.rowErrors);
    setBlurredPriceFields(
      Object.fromEntries(
        priceRows.map((row) => [
          row.rowKey,
          new Set(["cust_id", "currency", "harga"]),
        ])
      )
    );

    if (!isStep3Valid) {
      return;
    }

    setShowConfirm(true);
  }

  /**
   * Menyimpan harga baru ke database.
   */
  async function handleConfirmSave() {
    setShowConfirm(false);
    setIsSaving(true);

    const result = await productService.addProductHarga({
      slugId,
      priceRows: priceRows.map((row) => ({
        cust_id: row.cust_id,
        currency: row.currency,
        harga: Number(row.harga),
      })),
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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
        <div
          className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl md:p-8"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-harga-title"
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

          <h3 id="add-harga-title" className="text-lg font-semibold text-slate-900">
            Tambah Customer &amp; Harga
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            Tambahkan harga untuk customer yang belum memiliki harga pada product
            ini.
          </p>

          <div className="mt-6 space-y-4">
            {isLoadingCustomers ? (
              <p className="py-6 text-center text-sm text-slate-500">
                Memuat daftar customer...
              </p>
            ) : availableCustomers.length === 0 ? (
              <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Semua customer aktif sudah memiliki harga untuk product ini.
              </p>
            ) : (
              <>
                {priceRows.map((row, index) => {
                  const customersForRow = getAvailableCustomersForRow(
                    row.rowKey,
                    priceRows,
                    availableCustomers
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
                        {priceRows.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removePriceRow(row.rowKey)}
                            className="rounded-lg p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                            aria-label={`Hapus baris harga ${index + 1}`}
                          >
                            <TrashIcon />
                          </button>
                        )}
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label
                            htmlFor={`add-customer-${row.rowKey}`}
                            className="mb-1.5 block text-sm font-medium text-slate-700"
                          >
                            Customer
                          </label>
                          <select
                            id={`add-customer-${row.rowKey}`}
                            value={row.cust_id}
                            onChange={(event) =>
                              updatePriceRow(row.rowKey, "cust_id", event.target.value)
                            }
                            onBlur={() =>
                              handlePriceRowFieldBlur(row.rowKey, "cust_id")
                            }
                            className={inputClassName}
                          >
                            <option value="" disabled>
                              Pilih customer
                            </option>
                            {customersForRow.map((customer) => (
                              <option key={customer.cust_id} value={customer.cust_id}>
                                {customer.cust_name}
                              </option>
                            ))}
                          </select>
                          {getPriceRowFieldError(row.rowKey, "cust_id") && (
                            <p className="mt-1.5 text-sm text-red-600">
                              {getPriceRowFieldError(row.rowKey, "cust_id")}
                            </p>
                          )}
                        </div>

                        <div>
                          <label
                            htmlFor={`add-harga-${row.rowKey}`}
                            className="mb-1.5 block text-sm font-medium text-slate-700"
                          >
                            Harga
                          </label>
                          <div className="grid grid-cols-5 gap-3">
                            <select
                              id={`add-currency-${row.rowKey}`}
                              value={row.currency}
                              onChange={(event) =>
                                updatePriceRow(
                                  row.rowKey,
                                  "currency",
                                  event.target.value
                                )
                              }
                              onBlur={() =>
                                handlePriceRowFieldBlur(row.rowKey, "currency")
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
                              id={`add-harga-${row.rowKey}`}
                              type="number"
                              min="0"
                              step="0.01"
                              value={row.harga}
                              onChange={(event) =>
                                updatePriceRow(row.rowKey, "harga", event.target.value)
                              }
                              onBlur={() =>
                                handlePriceRowFieldBlur(row.rowKey, "harga")
                              }
                              placeholder="Nominal"
                              className={`${inputClassName} col-span-3`}
                            />
                          </div>
                          {(getPriceRowFieldError(row.rowKey, "currency") ||
                            getPriceRowFieldError(row.rowKey, "harga")) && (
                            <p className="mt-1.5 text-sm text-red-600">
                              {getPriceRowFieldError(row.rowKey, "currency") ??
                                getPriceRowFieldError(row.rowKey, "harga")}
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
                  disabled={!canAddPriceRow || allCustomersPaired}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className="text-lg leading-none">+</span>
                  Tambah Customer &amp; Harga
                </button>
              </>
            )}
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
              disabled={
                !isStep3Valid ||
                isSaving ||
                availableCustomers.length === 0 ||
                isLoadingCustomers
              }
              className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Simpan
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        visible={showConfirm}
        message="Apakah Anda yakin ingin menyimpan harga customer baru?"
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
          aria-labelledby="add-harga-success-title"
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
                id="add-harga-success-title"
                className="text-lg font-semibold text-slate-900"
              >
                Penambahan data harga berhasil
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
