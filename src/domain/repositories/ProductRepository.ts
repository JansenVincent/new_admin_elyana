import type {
  ActiveCustomerOption,
  SaveInputBarangInput,
  SaveInputBarangResult,
} from "@/domain/entities/InputBarang";
import type {
  GetMyProductDetailResult,
  ListMyProductsParams,
  ListMyProductsResult,
} from "@/domain/entities/MyProduct";
import type {
  UpdateProductKuantitasInput,
  UpdateProductKuantitasResult,
} from "@/domain/entities/UpdateKuantitas";

/**
 * Kontrak repository untuk operasi product.
 */
export interface ProductRepository {
  /**
   * Mengambil daftar customer aktif untuk dropdown Input Harga.
   */
  listActiveCustomers(): Promise<{
    success: boolean;
    customers?: ActiveCustomerOption[];
    error?: string;
  }>;

  /**
   * Menyimpan data Input Barang secara serial ke beberapa tabel terkait.
   */
  saveInputBarang(input: SaveInputBarangInput): Promise<SaveInputBarangResult>;

  /**
   * Mengambil daftar product untuk halaman My Product dengan paginasi.
   */
  listMyProducts(params: ListMyProductsParams): Promise<ListMyProductsResult>;

  /**
   * Mengambil detail product beserta harga dan histori barang.
   */
  getMyProductDetail(productId: string): Promise<GetMyProductDetailResult>;

  /**
   * Memperbarui kuantitas product dan mencatat histori masuk/keluar.
   */
  updateProductKuantitas(
    input: UpdateProductKuantitasInput
  ): Promise<UpdateProductKuantitasResult>;
}
