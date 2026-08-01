import type { ProductStockRepository } from "@/domain/repositories/ProductStockRepository";
import type {
  CreateProductStockInput,
  ProductStock,
  SaveProductStockResult,
} from "@/domain/entities/ProductStock";
import { getSupabaseClient } from "@/infrastructure/supabase/client";
import {
  PRODUCT_BARCODE_BUCKET,
  PRODUCT_STOCK_TABLE,
} from "@/shared/constants/product";

/**
 * Implementasi ProductStockRepository menggunakan Supabase (adapter layer infrastructure).
 */
export class SupabaseProductStockRepository implements ProductStockRepository {
  /**
   * Mengunggah gambar barcode ke Supabase Storage dan mengembalikan URL publik.
   */
  private async uploadBarcodeImage(
    file: File,
    createdBy?: string
  ): Promise<{ url: string } | { error: string }> {
    const supabase = getSupabaseClient();
    const extension = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const uniqueName = `${createdBy ?? "admin"}-${Date.now()}-${crypto.randomUUID()}.${extension}`;
    const storagePath = `barcodes/${uniqueName}`;

    const { error: uploadError } = await supabase.storage
      .from(PRODUCT_BARCODE_BUCKET)
      .upload(storagePath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) {
      return { error: uploadError.message };
    }

    const { data } = supabase.storage
      .from(PRODUCT_BARCODE_BUCKET)
      .getPublicUrl(storagePath);

    return { url: data.publicUrl };
  }

  /**
   * Menyimpan product stock baru beserta upload gambar barcode ke Supabase.
   */
  async save(input: CreateProductStockInput): Promise<SaveProductStockResult> {
    try {
      const uploadResult = await this.uploadBarcodeImage(
        input.barcodeImage,
        input.createdBy
      );

      if ("error" in uploadResult) {
        return {
          success: false,
          error: uploadResult.error,
        };
      }

      const supabase = getSupabaseClient();

      const { data, error } = await supabase
        .from(PRODUCT_STOCK_TABLE)
        .insert({
          nama_barang: input.namaBarang.trim(),
          harga: input.harga,
          currency: input.currency,
          jenis: input.jenis,
          detail_barang: input.detailBarang.trim(),
          barcode_image_url: uploadResult.url,
          created_by: input.createdBy ?? null,
        })
        .select("*")
        .single();

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      const product: ProductStock = {
        id: String(data.id),
        nama_barang: data.nama_barang,
        harga: Number(data.harga),
        currency: data.currency,
        jenis: data.jenis,
        detail_barang: data.detail_barang,
        barcode_image_url: data.barcode_image_url,
        created_at: data.created_at,
        created_by: data.created_by ?? undefined,
      };

      return {
        success: true,
        product,
      };
    } catch (err) {
      const message =
        err instanceof Error && err.name === "AbortError"
          ? "Request timeout (60 detik)"
          : err instanceof Error
            ? err.message
            : "Terjadi kesalahan tidak terduga";

      return {
        success: false,
        error: message,
      };
    }
  }
}

/** Singleton instance repository product stock. */
export const productStockRepository = new SupabaseProductStockRepository();
