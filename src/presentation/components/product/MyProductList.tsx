"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { productService } from "@/application/services/ProductService";
import type { MyProductListItem } from "@/domain/entities/MyProduct";
import LoadingOverlay from "@/presentation/components/ui/LoadingOverlay";
import { MY_PRODUCT_PAGE_SIZE } from "@/shared/constants/product";
import { toTitleCase } from "@/shared/utils/stringFormat";

/**
 * Halaman error saat gagal memuat data My Product.
 */
function MyProductLoadError({ onRefresh }: { onRefresh: () => void }) {
  return (
    <section className="mx-auto max-w-4xl">
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
        <h2 className="text-lg font-semibold text-slate-900">Gagal memuat data</h2>
        <p className="mt-2 text-sm text-slate-600">
          Terjadi kesalahan saat mengambil data. Silakan coba lagi.
        </p>
        <button
          type="button"
          onClick={onRefresh}
          className="mt-6 rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Refresh
        </button>
      </div>
    </section>
  );
}

/**
 * Halaman daftar product untuk dipilih pada menu My Product.
 */
export default function MyProductList() {
  const [products, setProducts] = useState<MyProductListItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
      setPage(1);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  /**
   * Mengambil daftar product dari database dengan paginasi dan pencarian.
   */
  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setLoadError(false);

    const result = await productService.listMyProducts({
      page,
      limit: MY_PRODUCT_PAGE_SIZE,
      search: debouncedSearch || undefined,
    });

    if (!result.success) {
      setLoadError(true);
      setProducts([]);
      setIsLoading(false);
      return;
    }

    setProducts(result.products ?? []);
    setTotal(result.total ?? 0);
    setTotalPages(result.totalPages ?? 1);

    if (result.page && result.page !== page) {
      setPage(result.page);
    }

    setIsLoading(false);
  }, [page, debouncedSearch]);

  useEffect(() => {
    void fetchProducts();
  }, [fetchProducts]);

  if (loadError && !isLoading) {
    return (
      <>
        <MyProductLoadError onRefresh={fetchProducts} />
        <LoadingOverlay visible={isLoading} />
      </>
    );
  }

  return (
    <>
      <section className="mx-auto max-w-4xl">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <h2 className="text-xl font-semibold text-slate-900">My Product</h2>
          <p className="mt-2 text-sm text-slate-600">
            Pilih product untuk melihat detail kuantitas, harga per customer, dan
            histori barang.
          </p>

          <div className="mt-6">
            <label htmlFor="searchProduct" className="sr-only">
              Cari product
            </label>
            <input
              id="searchProduct"
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Cari nama barang..."
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-500 focus:bg-white focus:ring-2 focus:ring-slate-200"
            />
          </div>

          {!isLoading && products.length === 0 && (
            <p className="mt-8 text-center text-sm text-slate-500">
              {debouncedSearch
                ? "Product tidak ditemukan."
                : "Belum ada product tersimpan."}
            </p>
          )}

          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {products.map((product) => (
              <li key={product.product_id}>
                <Link
                  href={`/product/my-product/${encodeURIComponent(product.product_id)}`}
                  className="group flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-4 transition hover:border-slate-300 hover:bg-white hover:shadow-sm"
                >
                  <span className="font-medium text-slate-900 group-hover:text-slate-950">
                    {toTitleCase(product.nama_barang)}
                  </span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="h-5 w-5 shrink-0 text-slate-400 transition group-hover:text-slate-600"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </Link>
              </li>
            ))}
          </ul>

          {total > 0 && (
            <div className="mt-6 flex flex-col items-center justify-between gap-3 sm:flex-row">
              <p className="text-sm text-slate-600">
                Halaman {page} dari {totalPages} ({total} product)
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
          )}
        </div>
      </section>

      <LoadingOverlay visible={isLoading} />
    </>
  );
}
