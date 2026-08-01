import type {
  CreateProductStockInput,
  SaveProductStockResult,
} from "@/domain/entities/ProductStock";

/**
 * Kontrak repository untuk operasi product stock (port layer domain).
 */
export interface ProductStockRepository {
  /**
   * Menyimpan product stock baru beserta upload gambar barcode.
   */
  save(input: CreateProductStockInput): Promise<SaveProductStockResult>;
}
