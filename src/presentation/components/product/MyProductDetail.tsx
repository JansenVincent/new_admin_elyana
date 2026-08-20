"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { productService } from "@/application/services/ProductService";
import type { MyProductDetail } from "@/domain/entities/MyProduct";
import EditKuantitasDialog from "@/presentation/components/product/EditKuantitasDialog";
import LoadingOverlay from "@/presentation/components/ui/LoadingOverlay";
import { useAuthSession } from "@/shared/hooks/useAuthSession";
import { formatHargaDisplay } from "@/shared/utils/formatCatatan";
import {
  formatHistoriBarangDate,
  formatHistoriKuantitasDisplay,
  formatKuantitasDisplay,
} from "@/shared/utils/productDisplayFormat";
import { toTitleCase } from "@/shared/utils/stringFormat";

interface MyProductDetailViewProps {
  /** ID product yang akan ditampilkan detailnya. */
  productId: string;
}

/**
 * Halaman detail product pada menu My Product.
 */
export default function MyProductDetailView({
  productId,
}: MyProductDetailViewProps) {
  const { user } = useAuthSession();
  const [product, setProduct] = useState<MyProductDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [showEditKuantitas, setShowEditKuantitas] = useState(false);

  /**
   * Mengambil detail product beserta harga dan histori barang.
   */
  const fetchProductDetail = useCallback(async () => {
    setIsLoading(true);
    setLoadError(false);
    setNotFound(false);

    const result = await productService.getMyProductDetail(productId);

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
  }, [productId]);

  useEffect(() => {
    void fetchProductDetail();
  }, [fetchProductDetail]);

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
              <button
                type="button"
                onClick={() => setShowEditKuantitas(true)}
                className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
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
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <h3 className="text-lg font-semibold text-slate-900">
            Harga per Customer
          </h3>

          {product.pricesByCustomer.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">
              Belum ada data harga untuk product ini.
            </p>
          ) : (
            <ul className="mt-5 space-y-4">
              {product.pricesByCustomer.map((price) => (
                <li
                  key={`${price.cust_name}-${price.mata_uang}-${price.harga}`}
                  className="rounded-xl border border-slate-200 bg-slate-50/50 p-4"
                >
                  <p className="font-medium text-slate-900">
                    {toTitleCase(price.cust_name)} :{" "}
                    {formatHargaDisplay(price.mata_uang, price.harga)}
                  </p>

                  {price.historiLogs.length > 0 && (
                    <ul className="mt-3 space-y-2 border-t border-slate-200 pt-3">
                      {price.historiLogs.map((log, index) => (
                        <li
                          key={`${price.cust_name}-log-${index}`}
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
        <EditKuantitasDialog
          visible={showEditKuantitas}
          productId={product.product_id}
          currentKuantitas={product.kuantitas}
          satuanKuantitas={product.satuan_kuantitas}
          username={user.username}
          name={user.name}
          onClose={() => setShowEditKuantitas(false)}
          onSaved={fetchProductDetail}
        />
      )}

      <LoadingOverlay visible={isLoading} />
    </>
  );
}
