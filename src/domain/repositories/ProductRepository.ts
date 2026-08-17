import type {
  ActiveCustomerOption,
  SaveInputBarangInput,
  SaveInputBarangResult,
} from "@/domain/entities/InputBarang";

/**
 * Kontrak repository untuk operasi product Input Barang.
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
}
