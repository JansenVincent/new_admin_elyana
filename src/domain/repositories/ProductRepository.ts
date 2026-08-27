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
import type { DeleteProductResult } from "@/domain/entities/DeleteProduct";
import type {
  AddProductHargaInput,
  AddProductHargaResult,
  UpdateProductHargaInput,
  UpdateProductHargaResult,
} from "@/domain/entities/UpdateHarga";
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
   * Mengambil detail product beserta harga dan histori barang berdasarkan slug_id.
   */
  getMyProductDetailBySlug(slugId: string): Promise<GetMyProductDetailResult>;

  /**
   * Memperbarui kuantitas product dan mencatat histori masuk/keluar berdasarkan slug_id.
   */
  updateProductKuantitasBySlug(
    slugId: string,
    input: Omit<UpdateProductKuantitasInput, "productId">
  ): Promise<UpdateProductKuantitasResult>;

  /**
   * Memperbarui harga product existing dan mencatat histori harga berdasarkan slug_id.
   */
  updateProductHargaBySlug(
    slugId: string,
    input: UpdateProductHargaInput
  ): Promise<UpdateProductHargaResult>;

  /**
   * Menambahkan harga product untuk customer baru berdasarkan slug_id.
   */
  addProductHargaBySlug(
    slugId: string,
    input: AddProductHargaInput
  ): Promise<AddProductHargaResult>;

  /**
   * Menandai product sebagai Not Available (soft delete) berdasarkan slug_id.
   */
  deleteProductBySlug(slugId: string): Promise<DeleteProductResult>;
}
