import type {
  ActiveCustomerOption,
  ProductJenis,
  SaveInputBarangResult,
} from "@/domain/entities/InputBarang";
import type {
  GetMyProductDetailResult,
  ListMyProductsParams,
  ListMyProductsResult,
} from "@/domain/entities/MyProduct";
import { PRODUCT_JENIS_OPTIONS } from "@/shared/constants/product";

/**
 * Service product client-side yang memanggil API route server-side.
 */
export class ProductService {
  /**
   * Mengambil daftar customer aktif untuk dropdown Input Harga.
   */
  async listActiveCustomers(): Promise<{
    success: boolean;
    customers?: ActiveCustomerOption[];
    error?: string;
  }> {
    const response = await fetch("/api/products/active-customers");
    return (await response.json()) as {
      success: boolean;
      customers?: ActiveCustomerOption[];
      error?: string;
    };
  }

  /**
   * Menyimpan data Input Barang melalui API server-side.
   */
  async saveInputBarang(input: {
    namaBarang: string;
    jenis: ProductJenis;
    jumlahBarang: number;
    satuanBarang: string;
    tanggalMasuk: string;
    keteranganBarang: string;
    priceRows: Array<{
      cust_id: string;
      currency: string;
      harga: number;
    }>;
    barcodeImage: File;
    username: string;
    name: string;
  }): Promise<SaveInputBarangResult> {
    const formData = new FormData();
    formData.append("namaBarang", input.namaBarang);
    formData.append("jenis", input.jenis);
    formData.append("jumlahBarang", String(input.jumlahBarang));
    formData.append("satuanBarang", input.satuanBarang);
    formData.append("tanggalMasuk", input.tanggalMasuk);
    formData.append("keteranganBarang", input.keteranganBarang);
    formData.append("priceRows", JSON.stringify(input.priceRows));
    formData.append("username", input.username);
    formData.append("name", input.name);
    formData.append("barcodeImage", input.barcodeImage);

    const response = await fetch("/api/products/input-barang", {
      method: "POST",
      body: formData,
    });

    return (await response.json()) as SaveInputBarangResult;
  }

  /**
   * Mengambil daftar product untuk halaman My Product dengan paginasi.
   */
  async listMyProducts(
    params: ListMyProductsParams
  ): Promise<ListMyProductsResult> {
    const searchParams = new URLSearchParams({
      page: String(params.page),
      limit: String(params.limit),
    });

    if (params.search?.trim()) {
      searchParams.set("search", params.search.trim());
    }

    const response = await fetch(`/api/products/my-product?${searchParams.toString()}`);
    return (await response.json()) as ListMyProductsResult;
  }

  /**
   * Mengambil detail product untuk halaman My Product.
   */
  async getMyProductDetail(productId: string): Promise<GetMyProductDetailResult> {
    const response = await fetch(
      `/api/products/my-product/${encodeURIComponent(productId)}`
    );
    return (await response.json()) as GetMyProductDetailResult;
  }
}

/** Singleton instance service product client-side. */
export const productService = new ProductService();

/** Opsi jenis untuk validasi API. */
export const VALID_PRODUCT_JENIS = PRODUCT_JENIS_OPTIONS;
