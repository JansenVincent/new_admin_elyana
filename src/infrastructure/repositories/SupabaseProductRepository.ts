import type { ProductRepository } from "@/domain/repositories/ProductRepository";
import type {
  ActiveCustomerOption,
  SaveInputBarangInput,
  SaveInputBarangResult,
} from "@/domain/entities/InputBarang";
import { getSupabaseServerClient } from "@/infrastructure/supabase/serverClient";
import {
  HARGA_TABLE,
  HISTORI_HARGA_TABLE,
  HISTORI_MASUK_TABLE,
  PRODUCT_BARCODE_BUCKET,
  PRODUCT_TABLE,
} from "@/shared/constants/product";
import {
  CUSTOMER_STATUS_ACTIVE,
  CUSTOMER_TABLE,
} from "@/shared/constants/customer";
import {
  buildHistoriHargaCatatan,
  buildHistoriMasukCatatan,
} from "@/shared/utils/formatCatatan";

/**
 * Implementasi ProductRepository menggunakan Supabase service role (server-side only).
 */
export class SupabaseProductRepository implements ProductRepository {
  /**
   * Mengunggah gambar barcode ke Supabase Storage dan mengembalikan URL publik.
   */
  private async uploadBarcodeImage(
    file: File,
    username: string
  ): Promise<{ url: string } | { error: string }> {
    const supabase = getSupabaseServerClient();
    const extension = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const uniqueName = `${username}-${Date.now()}-${crypto.randomUUID()}.${extension}`;
    const storagePath = `barcodes/${uniqueName}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from(PRODUCT_BARCODE_BUCKET)
      .upload(storagePath, buffer, {
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
   * Mengambil daftar customer aktif untuk dropdown Input Harga.
   */
  async listActiveCustomers(): Promise<{
    success: boolean;
    customers?: ActiveCustomerOption[];
    error?: string;
  }> {
    try {
      const supabase = getSupabaseServerClient();

      const { data, error } = await supabase
        .from(CUSTOMER_TABLE)
        .select("cust_id, cust_name")
        .eq("status_customer", CUSTOMER_STATUS_ACTIVE)
        .order("cust_name", { ascending: true });

      if (error) {
        return { success: false, error: error.message };
      }

      const customers: ActiveCustomerOption[] = (data ?? []).map((row) => ({
        cust_id: String(row.cust_id),
        cust_name: String(row.cust_name ?? ""),
      }));

      return { success: true, customers };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Terjadi kesalahan tidak terduga";
      return { success: false, error: message };
    }
  }

  /**
   * Menyimpan data Input Barang secara serial ke Admin_Ely_Product, histori masuk, harga, dan histori harga.
   */
  async saveInputBarang(
    input: SaveInputBarangInput
  ): Promise<SaveInputBarangResult> {
    try {
      const uploadResult = await this.uploadBarcodeImage(
        input.barcodeImage,
        input.username
      );

      if ("error" in uploadResult) {
        return { success: false, error: uploadResult.error };
      }

      const supabase = getSupabaseServerClient();
      const now = new Date();

      const { data: productData, error: productError } = await supabase
        .from(PRODUCT_TABLE)
        .insert({
          nama_barang: input.namaBarang.trim(),
          tipe_barang: input.jenis,
          kuantitas: input.jumlahBarang,
          satuan_kuantitas: input.satuanBarang.trim(),
          keterangan: input.keteranganBarang.trim(),
          barcode: uploadResult.url,
        })
        .select("product_id")
        .single();

      if (productError || !productData) {
        return {
          success: false,
          error: productError?.message ?? "Gagal menyimpan product",
        };
      }

      const productId = String(productData.product_id);
      const masukCatatan = buildHistoriMasukCatatan(
        input.username,
        input.name,
        now
      );

      const { error: masukError } = await supabase
        .from(HISTORI_MASUK_TABLE)
        .insert({
          product_id: productId,
          tanggal_masuk: `${input.tanggalMasuk} 00:00:00`,
          kuantitas_masuk: input.jumlahBarang,
          catatan: masukCatatan.slice(0, 250),
        });

      if (masukError) {
        return { success: false, error: masukError.message };
      }

      for (const priceRow of input.priceRows) {
        const { data: hargaData, error: hargaError } = await supabase
          .from(HARGA_TABLE)
          .insert({
            product_id: productId,
            cust_id: priceRow.cust_id,
            harga: priceRow.harga,
            mata_uang: priceRow.currency,
          })
          .select("harga_id")
          .single();

        if (hargaError || !hargaData) {
          return {
            success: false,
            error: hargaError?.message ?? "Gagal menyimpan harga",
          };
        }

        const hargaCatatan = buildHistoriHargaCatatan(
          input.username,
          input.name,
          priceRow.currency,
          priceRow.harga,
          now
        );

        const { error: histHargaError } = await supabase
          .from(HISTORI_HARGA_TABLE)
          .insert({
            harga_id: String(hargaData.harga_id),
            catatan: hargaCatatan.slice(0, 250),
          });

        if (histHargaError) {
          return { success: false, error: histHargaError.message };
        }
      }

      return { success: true, product_id: productId };
    } catch (err) {
      const message =
        err instanceof Error && err.name === "AbortError"
          ? "Request timeout (60 detik)"
          : err instanceof Error
            ? err.message
            : "Terjadi kesalahan tidak terduga";

      return { success: false, error: message };
    }
  }
}

/** Singleton instance repository product server-side. */
export const productRepository = new SupabaseProductRepository();
