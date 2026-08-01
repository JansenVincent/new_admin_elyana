import type {
  CreateProductStockInput,
  SaveProductStockResult,
} from "@/domain/entities/ProductStock";
import { productStockRepository } from "@/infrastructure/repositories/SupabaseProductStockRepository";

/**
 * Service product stock (use case layer application).
 */
export class ProductStockService {
  /**
   * Menyimpan data product stock baru ke database Supabase.
   */
  async saveProductStock(
    input: CreateProductStockInput
  ): Promise<SaveProductStockResult> {
    return productStockRepository.save(input);
  }
}

/** Singleton instance service product stock. */
export const productStockService = new ProductStockService();
