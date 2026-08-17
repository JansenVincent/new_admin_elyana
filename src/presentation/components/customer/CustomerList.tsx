"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { customerService } from "@/application/services/CustomerService";
import type { Customer } from "@/domain/entities/Customer";
import ConfirmDialog from "@/presentation/components/ui/ConfirmDialog";
import LoadingOverlay from "@/presentation/components/ui/LoadingOverlay";
import ResultDialog from "@/presentation/components/ui/ResultDialog";
import {
  CUSTOMER_PAGE_SIZE,
  MAX_ADDRESS_LENGTH,
  MAX_CODE_LENGTH,
  MAX_CUST_NAME_LENGTH,
} from "@/shared/constants/customer";
import {
  clampCustomerField,
  formatCustomerCode,
  isCreateCustomerFormValid,
  validateCreateCustomerForm,
  validateEditAddress,
} from "@/shared/utils/customerValidation";
import { toTitleCase } from "@/shared/utils/stringFormat";

const inputClassName =
  "w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-500 focus:bg-white focus:ring-2 focus:ring-slate-200";

/**
 * Halaman daftar customer dengan paginasi, pencarian, tambah, sunting, dan hapus.
 */
export default function CustomerList() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [activeSearch, setActiveSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const [showSearchOverlay, setShowSearchOverlay] = useState(false);
  const [searchInput, setSearchInput] = useState("");

  const [showAddForm, setShowAddForm] = useState(false);
  const [custName, setCustName] = useState("");
  const [address, setAddress] = useState("");
  const [frontCode, setFrontCode] = useState("");
  const [backCode, setBackCode] = useState("");
  const [addFieldErrors, setAddFieldErrors] = useState<Record<string, string>>(
    {}
  );
  const [showAddConfirm, setShowAddConfirm] = useState(false);
  const [addResult, setAddResult] = useState<"success" | "error" | null>(null);

  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [editAddress, setEditAddress] = useState("");
  const [editFieldErrors, setEditFieldErrors] = useState<Record<string, string>>(
    {}
  );
  const [showEditCancelConfirm, setShowEditCancelConfirm] = useState(false);
  const [editResult, setEditResult] = useState<"success" | "error" | null>(
    null
  );

  const [deleteCustomer, setDeleteCustomer] = useState<Customer | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteResult, setDeleteResult] = useState<"success" | "error" | null>(
    null
  );

  const [searchError, setSearchError] = useState(false);

  const isAddFormValid = isCreateCustomerFormValid({
    custName,
    address,
    frontCode,
    backCode,
  });

  const isEditAddressValid = useMemo(
    () => Object.keys(validateEditAddress(editAddress)).length === 0,
    [editAddress]
  );

  const editAddressChanged = editCustomer
    ? editAddress.trim() !== (editCustomer.address ?? "").trim()
    : false;

  /**
   * Mengambil daftar customer dari API dengan paginasi dan pencarian.
   */
  const fetchCustomers = useCallback(async () => {
    setIsLoading(true);
    setLoadError(false);

    const result = await customerService.listCustomers({
      page,
      limit: CUSTOMER_PAGE_SIZE,
      search: activeSearch || undefined,
    });

    if (!result.success) {
      setLoadError(true);
      setCustomers([]);
      setIsLoading(false);
      return;
    }

    setCustomers(result.customers ?? []);
    setTotal(result.total ?? 0);
    setTotalPages(result.totalPages ?? 1);

    if (result.page && result.page !== page) {
      setPage(result.page);
    }

    setIsLoading(false);
  }, [page, activeSearch]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  /**
   * Mereset form tambah customer ke kondisi awal.
   */
  function resetAddForm() {
    setCustName("");
    setAddress("");
    setFrontCode("");
    setBackCode("");
    setAddFieldErrors({});
    setShowAddForm(false);
    setShowAddConfirm(false);
  }

  /**
   * Menutup form sunting dan mereset state terkait.
   */
  function closeEditForm() {
    setEditCustomer(null);
    setEditAddress("");
    setEditFieldErrors({});
    setShowEditCancelConfirm(false);
  }

  /**
   * Membuka form sunting alamat customer.
   */
  function handleOpenEdit(customer: Customer) {
    setEditCustomer(customer);
    setEditAddress(customer.address ?? "");
    setEditFieldErrors({});
  }

  /**
   * Menutup form sunting dengan pengecekan perubahan alamat.
   */
  function handleCloseEditForm() {
    if (editAddressChanged) {
      setShowEditCancelConfirm(true);
      return;
    }

    closeEditForm();
  }

  /**
   * Menyimpan perubahan alamat customer.
   */
  async function handleSaveEdit() {
    if (!editCustomer) {
      return;
    }

    const errors = validateEditAddress(editAddress);
    setEditFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    setIsLoading(true);

    const result = await customerService.updateCustomerAddress({
      cust_id: editCustomer.cust_id,
      address: editAddress.trim(),
    });

    setIsLoading(false);
    closeEditForm();
    setEditResult(result.success ? "success" : "error");
  }

  /**
   * Menghapus customer setelah konfirmasi.
   */
  async function handleConfirmDelete() {
    if (!deleteCustomer) {
      return;
    }

    setShowDeleteConfirm(false);
    setIsLoading(true);

    const result = await customerService.deleteCustomer({
      cust_name: deleteCustomer.cust_name,
      front_code: deleteCustomer.front_code,
      back_code: deleteCustomer.back_code,
    });

    setIsLoading(false);
    setDeleteCustomer(null);
    setDeleteResult(result.success ? "success" : "error");
  }

  /**
   * Menyimpan customer baru setelah konfirmasi.
   */
  async function handleConfirmAdd() {
    const errors = validateCreateCustomerForm({
      custName,
      address,
      frontCode,
      backCode,
    });

    setAddFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    setShowAddConfirm(false);
    setIsLoading(true);

    const result = await customerService.createCustomer({
      cust_name: custName.trim(),
      address: address.trim(),
      front_code: frontCode.trim(),
      back_code: backCode.trim(),
    });

    setIsLoading(false);

    if (result.success) {
      setAddResult("success");
      return;
    }

    setAddResult("error");
  }

  /**
   * Menjalankan pencarian customer berdasarkan keyword.
   */
  async function handleSearchSubmit() {
    const keyword = searchInput.trim();

    if (!keyword) {
      return;
    }

    setIsLoading(true);
    setSearchError(false);

    const result = await customerService.listCustomers({
      page: 1,
      limit: CUSTOMER_PAGE_SIZE,
      search: keyword,
    });

    setIsLoading(false);

    if (!result.success) {
      setSearchError(true);
      return;
    }

    setActiveSearch(keyword);
    setPage(1);
    setCustomers(result.customers ?? []);
    setTotal(result.total ?? 0);
    setTotalPages(result.totalPages ?? 1);
    setShowSearchOverlay(false);
    setSearchInput("");
  }

  /**
   * Mereset pencarian dan memuat ulang seluruh data customer seperti load awal.
   */
  function handleResetSearch() {
    setActiveSearch("");
    setPage(1);
    setSearchInput("");
    setShowSearchOverlay(false);
  }

  /**
   * Menutup popup hasil dan me-refresh tabel.
   */
  function handleCloseResultAndRefresh() {
    setAddResult(null);
    setEditResult(null);
    setDeleteResult(null);
    fetchCustomers();
  }

  if (loadError && !isLoading) {
    return (
      <>
        <section className="mx-auto max-w-5xl">
          <div className="rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-7 w-7 text-red-500"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-slate-900">
              Gagal memuat data customer
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Terjadi kesalahan saat mengambil data. Silakan coba lagi.
            </p>
            <button
              type="button"
              onClick={fetchCustomers}
              className="mt-6 rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Refresh
            </button>
          </div>
        </section>
        <LoadingOverlay visible={isLoading} />
      </>
    );
  }

  return (
    <>
      <section className="mx-auto max-w-5xl">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Customer</h2>
              <p className="mt-1 text-sm text-slate-600">
                {activeSearch
                  ? `Hasil pencarian: "${activeSearch}" (${total} data)`
                  : `Total ${total} customer`}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {activeSearch ? (
                <button
                  type="button"
                  onClick={handleResetSearch}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  Reset Pencarian
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowAddForm(true)}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  <span className="text-lg leading-none">+</span>
                  Tambah Customer
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowSearchOverlay(true)}
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white p-2.5 text-slate-700 transition hover:bg-slate-100"
                aria-label="Cari customer"
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
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </button>
            </div>
          </div>

          <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 md:px-6">
                    No
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 md:px-6">
                    Nama Customer
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 md:px-6">
                    Kode
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 md:px-6">
                    Alamat Customer
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700 md:px-6">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {customers.length === 0 && !isLoading && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-8 text-center text-sm text-slate-500 md:px-6"
                    >
                      Tidak ada data customer.
                    </td>
                  </tr>
                )}

                {customers.map((customer, index) => {
                  const rowNumber = (page - 1) * CUSTOMER_PAGE_SIZE + index + 1;

                  return (
                    <tr key={customer.cust_id} className="transition hover:bg-slate-50">
                      <td className="px-4 py-4 text-sm text-slate-600 md:px-6">
                        {rowNumber}
                      </td>
                      <td className="px-4 py-4 text-sm font-medium text-slate-900 md:px-6">
                        {toTitleCase(customer.cust_name)}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-700 md:px-6">
                        {formatCustomerCode(
                          customer.front_code,
                          customer.back_code
                        )}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-600 md:px-6">
                        {customer.address ?? "-"}
                      </td>
                      <td className="px-4 py-4 text-center md:px-6">
                        <div className="flex flex-wrap justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(customer)}
                            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                          >
                            Sunting
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setDeleteCustomer(customer);
                              setShowDeleteConfirm(true);
                            }}
                            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-100"
                          >
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex flex-col items-center justify-between gap-3 sm:flex-row">
            <p className="text-sm text-slate-600">
              Halaman {page} dari {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page <= 1 || isLoading}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Sebelum
              </button>
              <button
                type="button"
                onClick={() =>
                  setPage((current) => Math.min(totalPages, current + 1))
                }
                disabled={page >= totalPages || isLoading}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        </div>
      </section>

      {showSearchOverlay && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 px-4 pt-24"
          onClick={() => setShowSearchOverlay(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white p-4 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="relative">
              <input
                type="text"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    handleSearchSubmit();
                  }
                }}
                placeholder="Cari nama customer..."
                autoFocus
                className="w-full rounded-xl border border-slate-300 bg-slate-50 py-3 pl-4 pr-12 text-slate-900 outline-none transition focus:border-slate-500 focus:bg-white focus:ring-2 focus:ring-slate-200"
              />
              {searchInput.trim().length > 0 && (
                <button
                  type="button"
                  onClick={handleSearchSubmit}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                  aria-label="Cari"
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
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl md:p-8">
            <h3 className="text-lg font-semibold text-slate-900">
              Tambah Customer
            </h3>

            <form
              className="mt-6 space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                if (!isAddFormValid) {
                  return;
                }
                setShowAddConfirm(true);
              }}
            >
              <div>
                <label htmlFor="custName" className="mb-1.5 block text-sm font-medium text-slate-700">
                  Nama Customer
                </label>
                <input
                  id="custName"
                  type="text"
                  value={custName}
                  onChange={(event) =>
                    setCustName(
                      clampCustomerField(event.target.value, MAX_CUST_NAME_LENGTH)
                    )
                  }
                  maxLength={MAX_CUST_NAME_LENGTH}
                  placeholder="Masukkan nama customer baru"
                  className={inputClassName}
                />
                {addFieldErrors.custName && (
                  <p className="mt-1.5 text-sm text-red-600">{addFieldErrors.custName}</p>
                )}
              </div>

              <div>
                <label htmlFor="address" className="mb-1.5 block text-sm font-medium text-slate-700">
                  Alamat
                </label>
                <textarea
                  id="address"
                  value={address}
                  onChange={(event) =>
                    setAddress(
                      clampCustomerField(event.target.value, MAX_ADDRESS_LENGTH)
                    )
                  }
                  maxLength={MAX_ADDRESS_LENGTH}
                  placeholder="Masukkan alamat customer baru"
                  rows={3}
                  className={`${inputClassName} resize-y`}
                />
                {addFieldErrors.address && (
                  <p className="mt-1.5 text-sm text-red-600">{addFieldErrors.address}</p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="frontCode" className="mb-1.5 block text-sm font-medium text-slate-700">
                    Kode Depan
                  </label>
                  <input
                    id="frontCode"
                    type="text"
                    value={frontCode}
                    onChange={(event) =>
                      setFrontCode(
                        clampCustomerField(event.target.value, MAX_CODE_LENGTH)
                      )
                    }
                    maxLength={MAX_CODE_LENGTH}
                    placeholder="Masukkan kode depan"
                    className={inputClassName}
                  />
                  {addFieldErrors.frontCode && (
                    <p className="mt-1.5 text-sm text-red-600">{addFieldErrors.frontCode}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="backCode" className="mb-1.5 block text-sm font-medium text-slate-700">
                    Kode Belakang
                  </label>
                  <input
                    id="backCode"
                    type="text"
                    value={backCode}
                    onChange={(event) =>
                      setBackCode(
                        clampCustomerField(event.target.value, MAX_CODE_LENGTH)
                      )
                    }
                    maxLength={MAX_CODE_LENGTH}
                    placeholder="Masukkan kode belakang"
                    className={inputClassName}
                  />
                  {addFieldErrors.backCode && (
                    <p className="mt-1.5 text-sm text-red-600">{addFieldErrors.backCode}</p>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={resetAddForm}
                  className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  Kembali
                </button>
                <button
                  type="submit"
                  disabled={!isAddFormValid}
                  className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Tambah
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl md:p-8">
            <button
              type="button"
              onClick={handleCloseEditForm}
              className="absolute right-4 top-4 text-slate-400 transition hover:text-slate-600"
              aria-label="Tutup form"
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

            <h3 className="text-lg font-semibold text-slate-900">Sunting Customer</h3>

            <div className="mt-6 space-y-4">
              <div>
                <p className="text-sm font-medium text-slate-700">Nama Customer</p>
                <p className="mt-1 text-sm text-slate-900">
                  {toTitleCase(editCustomer.cust_name)}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-slate-700">Kode Depan</p>
                  <p className="mt-1 text-sm text-slate-900">
                    {editCustomer.front_code.toUpperCase()}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">Kode Belakang</p>
                  <p className="mt-1 text-sm text-slate-900">
                    {editCustomer.back_code.toUpperCase()}
                  </p>
                </div>
              </div>

              <div>
                <label htmlFor="editAddress" className="mb-1.5 block text-sm font-medium text-slate-700">
                  Alamat
                </label>
                <textarea
                  id="editAddress"
                  value={editAddress}
                  onChange={(event) =>
                    setEditAddress(
                      clampCustomerField(event.target.value, MAX_ADDRESS_LENGTH)
                    )
                  }
                  maxLength={MAX_ADDRESS_LENGTH}
                  placeholder="Masukkan alamat customer"
                  rows={4}
                  className={`${inputClassName} resize-y`}
                />
                {editFieldErrors.address && (
                  <p className="mt-1.5 text-sm text-red-600">{editFieldErrors.address}</p>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={!isEditAddressValid}
                  className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Ubah
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        visible={showDeleteConfirm}
        message={
          deleteCustomer
            ? `Apakah Anda yakin akan menghapus ${toTitleCase(deleteCustomer.cust_name)}?`
            : ""
        }
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeleteCustomer(null);
        }}
        onConfirm={handleConfirmDelete}
      />

      <ConfirmDialog
        visible={showAddConfirm}
        message={`Apakah Anda yakin akan menambahkan customer dengan nama ${toTitleCase(custName)}?`}
        onClose={() => setShowAddConfirm(false)}
        onConfirm={handleConfirmAdd}
      />

      <ConfirmDialog
        visible={showEditCancelConfirm}
        message="Apakah Anda ingin membatalkan perubahan alamat?"
        onClose={() => setShowEditCancelConfirm(false)}
        onConfirm={() => {
          setShowEditCancelConfirm(false);
          closeEditForm();
        }}
      />

      <ResultDialog
        visible={deleteResult === "success"}
        variant="success"
        message="Berhasil menghapus."
        onClose={handleCloseResultAndRefresh}
      />

      <ResultDialog
        visible={deleteResult === "error"}
        variant="error"
        message="Gagal menghapus."
        onClose={() => setDeleteResult(null)}
      />

      <ResultDialog
        visible={editResult === "success"}
        variant="success"
        message="Berhasil merubah data."
        onClose={handleCloseResultAndRefresh}
      />

      <ResultDialog
        visible={editResult === "error"}
        variant="error"
        message="Gagal merubah data."
        onClose={() => setEditResult(null)}
      />

      {addResult === "success" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
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
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-lg font-semibold text-slate-900">Data berhasil disimpan</p>
              <button
                type="button"
                onClick={() => {
                  resetAddForm();
                  setAddResult(null);
                  fetchCustomers();
                }}
                className="mt-6 w-full rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Ok
              </button>
            </div>
          </div>
        </div>
      )}

      {addResult === "error" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  className="h-7 w-7 text-red-500"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <p className="text-lg font-semibold text-slate-900">Data gagal disimpan</p>
              <button
                type="button"
                onClick={() => setAddResult(null)}
                className="mt-6 w-full rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Ok
              </button>
            </div>
          </div>
        </div>
      )}

      <ResultDialog
        visible={searchError}
        variant="error"
        message="Gagal melakukan pencarian."
        onClose={() => setSearchError(false)}
      />

      <LoadingOverlay visible={isLoading} />
    </>
  );
}
