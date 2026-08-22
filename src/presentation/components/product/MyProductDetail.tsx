"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { productService } from "@/application/services/ProductService";
import type { ActiveCustomerOption } from "@/domain/entities/InputBarang";
import type { MyProductDetail, MyProductPriceByCustomer } from "@/domain/entities/MyProduct";
import AddHargaDialog from "@/presentation/components/product/AddHargaDialog";
import EditHargaDialog from "@/presentation/components/product/EditHargaDialog";
import EditKuantitasDialog from "@/presentation/components/product/EditKuantitasDialog";
import ConfirmDialog from "@/presentation/components/ui/ConfirmDialog";
import ErrorPopup from "@/presentation/components/ui/ErrorPopup";
import LoadingOverlay from "@/presentation/components/ui/LoadingOverlay";
import { useAuthSession } from "@/shared/hooks/useAuthSession";
import { DELETE_PRODUCT_ERROR_MESSAGE } from "@/shared/constants/product";
import { formatHargaDisplay } from "@/shared/utils/formatCatatan";
import {
  formatHistoriBarangDate,
  formatHistoriKuantitasDisplay,
  formatKuantitasDisplay,
} from "@/shared/utils/productDisplayFormat";
import { toTitleCase } from "@/shared/utils/stringFormat";

interface MyProductDetailViewProps {
  /** Slug ID product yang akan ditampilkan detailnya. */
  slugId: string;
}

/**
 * Halaman detail product pada menu My Product.
 */
export default function MyProductDetailView({
  slugId,
}: MyProductDetailViewProps) {
  const router = useRouter();
  const { user } = useAuthSession();
  const [product, setProduct] = useState<MyProductDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [showEditKuantitas, setShowEditKuantitas] = useState(false);
  const [showAddHarga, setShowAddHarga] = useState(false);
  const [showEditHarga, setShowEditHarga] = useState(false);
  const [selectedPrice, setSelectedPrice] =
    useState<MyProductPriceByCustomer | null>(null);
  const [activeCustomers, setActiveCustomers] = useState<ActiveCustomerOption[]>(
    []
  );
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteError, setShowDeleteError] = useState(false);

  /**
   * Mengambil detail product beserta harga dan histori barang.
   */
  const fetchProductDetail = useCallback(async () => {
    setIsLoading(true);
    setLoadError(false);
    setNotFound(false);

    const result = await productService.getMyProductDetail(slugId);

    if (!result.success) {
      if (result.error === "Product tidak ditemukan") {
        setNotFound(true);
      } else {
        setLoadError(true);
      }
      setProduct(null);
      setIsLoading(false);
      return;
    }

    setProduct(result.product ?? null);
    setIsLoading(false);
  }, [slugId]);

  useEffect(() => {
    void fetchProductDetail();
  }, [fetchProductDetail]);

  /**
   * Memuat daftar customer aktif untuk menentukan ketersediaan tambah harga.
   */
  const fetchActiveCustomers = useCallback(async () => {
    if (!user) {
      setActiveCustomers([]);
      return;
    }

    setIsLoadingCustomers(true);
    const result = await productService.listActiveCustomers();
    setActiveCustomers(result.success ? (result.customers ?? []) : []);
    setIsLoadingCustomers(false);
  }, [user]);

  useEffect(() => {
    void fetchActiveCustomers();
  }, [fetchActiveCustomers]);

  const existingCustIds = useMemo(
    () => product?.pricesByCustomer.map((price) => price.cust_id) ?? [],
    [product]
  );

  const unpricedCustomerCount = useMemo(() => {
    const existingSet = new Set(existingCustIds);
    return activeCustomers.filter(
      (customer) => !existingSet.has(customer.cust_id)
    ).length;
  }, [activeCustomers, existingCustIds]);

  const allCustomersPriced =
    activeCustomers.length > 0 && unpricedCustomerCount === 0;

  /**
   * Membuka dialog edit harga untuk customer tertentu.
   */
  function handleOpenEditHarga(price: MyProductPriceByCustomer) {
    setSelectedPrice(price);
    setShowEditHarga(true);
  }

  /**
   * Menghapus product beserta seluruh data terkait setelah konfirmasi.
   */
  async function handleConfirmDeleteProduct() {
    if (!product) {
      return;
    }

    setShowDeleteConfirm(false);
    setIsDeleting(true);

    const result = await productService.deleteProduct(product.slug_id);

    setIsDeleting(false);

    if (result.success) {
      router.push("/product/my-product");
      return;
    }

    setShowDeleteError(true);
  }

  if (notFound && !isLoading) {
    return (
      <section className="mx-auto max-w-3xl">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Product tidak ditemukan
          </h2>
          <Link
            href="/product/my-product"
            className="mt-6 inline-block rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Kembali ke My Product
          </Link>
        </div>
      </section>
    );
  }

  if (loadError && !isLoading) {
    return (
      <>
        <section className="mx-auto max-w-3xl">
          <div className="rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              Gagal memuat data
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Terjadi kesalahan saat mengambil data. Silakan coba lagi.
            </p>
            <button
              type="button"
              onClick={fetchProductDetail}
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

  if (!product) {
    return <LoadingOverlay visible={isLoading} />;
  }

  return (
    <>
      <section className="mx-auto max-w-3xl space-y-6">
        <Link
          href="/product/my-product"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-900"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-4 w-4"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Kembali ke My Product
        </Link>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">
                {toTitleCase(product.nama_barang)}
              </h2>
              <p className="mt-3 inline-flex rounded-full bg-slate-100 px-4 py-1.5 text-sm font-medium text-slate-800">
                Kuantitas:{" "}
                {formatKuantitasDisplay(
                  product.kuantitas,
                  product.satuan_kuantitas
                )}
              </p>
            </div>
            {user && (
              <div className="flex shrink-0 flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditKuantitas(true)}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="h-4 w-4"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  Edit Kuantitas
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="h-4 w-4"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  Hapus Produk
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <h3 className="text-lg font-semibold text-slate-900">
              Harga per Customer
            </h3>

            {user && !allCustomersPriced && !isLoadingCustomers && (
              <button
                type="button"
                onClick={() => setShowAddHarga(true)}
                className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                <span className="text-base leading-none">+</span>
                Tambah Customer &amp; Harga
              </button>
            )}
          </div>

          {user && allCustomersPriced && (
            <p className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              Seluruh customer Anda sudah dipasangkan harga untuk product{" "}
              <span className="font-medium text-slate-900">
                {toTitleCase(product.nama_barang)}
              </span>
              .
            </p>
          )}

          {product.pricesByCustomer.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">
              Belum ada data harga untuk product ini.
            </p>
          ) : (
            <ul className="mt-5 space-y-4">
              {product.pricesByCustomer.map((price) => (
                <li
                  key={price.harga_id}
                  className="rounded-xl border border-slate-200 bg-slate-50/50 p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <p className="font-medium text-slate-900">
                      {toTitleCase(price.cust_name)} :{" "}
                      {formatHargaDisplay(price.mata_uang, price.harga)}
                    </p>

                    {user && (
                      <button
                        type="button"
                        onClick={() => handleOpenEditHarga(price)}
                        className="inline-flex shrink-0 items-center gap-2 self-start rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100 sm:text-sm"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className="h-3.5 w-3.5"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                        Edit Harga
                      </button>
                    )}
                  </div>

                  {price.historiLogs.length > 0 && (
                    <ul className="mt-3 space-y-2 border-t border-slate-200 pt-3">
                      {price.historiLogs.map((log, index) => (
                        <li
                          key={`${price.harga_id}-log-${index}`}
                          className="flex gap-2 text-sm text-slate-600"
                        >
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
                          <span>{log.catatan}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <h3 className="text-lg font-semibold text-slate-900">
            Catatan Histori Barang
          </h3>

          {product.historiBarang.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">
              Belum ada histori barang masuk atau keluar.
            </p>
          ) : (
            <ol className="relative mt-6 space-y-0 border-l border-slate-200 pl-6">
              {product.historiBarang.map((entry, index) => (
                <li key={`${entry.tanggal}-${entry.type}-${index}`} className="pb-6 last:pb-0">
                  <span
                    className={`absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border-2 border-white ${
                      entry.type === "masuk" ? "bg-green-500" : "bg-red-500"
                    }`}
                    aria-hidden="true"
                  />
                  <p className="text-sm font-semibold text-slate-900">
                    {formatHistoriBarangDate(entry.tanggal)}
                  </p>
                  <p
                    className={`mt-1 text-sm font-medium ${
                      entry.type === "masuk" ? "text-green-700" : "text-red-700"
                    }`}
                  >
                    {formatHistoriKuantitasDisplay(
                      entry.quantityPrefix,
                      entry.quantity,
                      entry.satuan_kuantitas
                    )}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    {entry.catatan}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>

      {user && (
        <>
          <EditKuantitasDialog
            visible={showEditKuantitas}
            slugId={product.slug_id}
            currentKuantitas={product.kuantitas}
            satuanKuantitas={product.satuan_kuantitas}
            username={user.username}
            name={user.name}
            onClose={() => setShowEditKuantitas(false)}
            onSaved={fetchProductDetail}
          />

          <EditHargaDialog
            visible={showEditHarga}
            slugId={product.slug_id}
            price={selectedPrice}
            username={user.username}
            name={user.name}
            onClose={() => {
              setShowEditHarga(false);
              setSelectedPrice(null);
            }}
            onSaved={fetchProductDetail}
          />

          <AddHargaDialog
            visible={showAddHarga}
            slugId={product.slug_id}
            existingCustIds={existingCustIds}
            username={user.username}
            name={user.name}
            onClose={() => setShowAddHarga(false)}
            onSaved={fetchProductDetail}
          />
        </>
      )}

      <ConfirmDialog
        visible={showDeleteConfirm}
        message={`Apakah Anda yakin akan menghapus seluruh data terkait produk ${toTitleCase(product.nama_barang)}?`}
        note="Catatan: Data produk yang sudah di hapus tidak akan bisa di kembalikan."
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleConfirmDeleteProduct}
        isLoading={isDeleting}
      />

      <ErrorPopup
        visible={showDeleteError}
        message={DELETE_PRODUCT_ERROR_MESSAGE}
        onClose={() => setShowDeleteError(false)}
      />

      <LoadingOverlay visible={isLoading || isDeleting} />
    </>
  );
}
