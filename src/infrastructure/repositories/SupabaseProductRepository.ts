import type { ProductRepository } from "@/domain/repositories/ProductRepository";
import type {
  ActiveCustomerOption,
  InputBarangSaveErrorStage,
  SaveInputBarangInput,
  SaveInputBarangResult,
} from "@/domain/entities/InputBarang";
import { getSupabaseServerClient } from "@/infrastructure/supabase/serverClient";
import {
  HARGA_TABLE,
  HISTORI_HARGA_TABLE,
  HISTORI_MASUK_TABLE,
  INPUT_BARANG_ERROR_BARCODE_BUCKET,
  INPUT_BARANG_ERROR_BARCODE_UPLOAD,
  INPUT_BARANG_ERROR_MESSAGES,
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

/** State insert sementara untuk rollback jika salah satu step gagal. */
interface InputBarangInsertState {
  barcodeStoragePath?: string;
  productId?: string;
  hargaIds: string[];
  histHargaIds: string[];
}

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
  ): Promise<{ url: string; storagePath: string } | { error: string }> {
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

    return { url: data.publicUrl, storagePath };
  }

  /**
   * Menghapus file barcode dari storage saat rollback.
   */
  private async deleteBarcodeImage(storagePath: string): Promise<void> {
    const supabase = getSupabaseServerClient();
    await supabase.storage.from(PRODUCT_BARCODE_BUCKET).remove([storagePath]);
  }

  /**
   * Melakukan rollback data yang sudah ter-insert jika salah satu step gagal.
   */
  private async rollbackInputBarang(state: InputBarangInsertState): Promise<void> {
    const supabase = getSupabaseServerClient();

    if (state.histHargaIds.length > 0) {
      await supabase
        .from(HISTORI_HARGA_TABLE)
        .delete()
        .in("hist_harga_id", state.histHargaIds);
    }

    if (state.hargaIds.length > 0) {
      await supabase.from(HARGA_TABLE).delete().in("harga_id", state.hargaIds);
    }

    if (state.productId) {
      await supabase
        .from(HISTORI_MASUK_TABLE)
        .delete()
        .eq("product_id", state.productId);

      await supabase
        .from(PRODUCT_TABLE)
        .delete()
        .eq("product_id", state.productId);
    }

    if (state.barcodeStoragePath) {
      await this.deleteBarcodeImage(state.barcodeStoragePath);
    }
  }

  /**
   * Mengembalikan hasil gagal dengan tahap error dan pesan popup standar.
   */
  private buildFailureResult(
    stage: InputBarangSaveErrorStage
  ): SaveInputBarangResult {
    return {
      success: false,
      errorStage: stage,
      error: INPUT_BARANG_ERROR_MESSAGES[stage],
    };
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
   * Menyimpan data Input Barang secara serial dengan rollback jika salah satu insert gagal.
   */
  async saveInputBarang(
    input: SaveInputBarangInput
  ): Promise<SaveInputBarangResult> {
    const insertState: InputBarangInsertState = {
      hargaIds: [],
      histHargaIds: [],
    };

    try {
      const uploadResult = await this.uploadBarcodeImage(
        input.barcodeImage,
        input.username
      );

      if ("error" in uploadResult) {
        const uploadMessage = uploadResult.error.toLowerCase();

        if (uploadMessage.includes("bucket not found")) {
          return {
            success: false,
            error: INPUT_BARANG_ERROR_BARCODE_BUCKET,
          };
        }

        return {
          success: false,
          error: INPUT_BARANG_ERROR_BARCODE_UPLOAD,
        };
      }

      insertState.barcodeStoragePath = uploadResult.storagePath;

      const supabase = getSupabaseServerClient();
      const now = new Date();

      try {
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
          throw new Error(productError?.message ?? "insert product failed");
        }

        insertState.productId = String(productData.product_id);
      } catch {
        await this.rollbackInputBarang(insertState);
        return this.buildFailureResult("product");
      }

      const productId = insertState.productId!;
      const masukCatatan = buildHistoriMasukCatatan(
        input.username,
        input.name,
        now
      );

      try {
        const { error: masukError } = await supabase
          .from(HISTORI_MASUK_TABLE)
          .insert({
            product_id: productId,
            tanggal_masuk: input.tanggalMasuk,
            kuantitas_masuk: input.jumlahBarang,
            catatan: masukCatatan.slice(0, 250),
          });

        if (masukError) {
          throw new Error(masukError.message);
        }
      } catch {
        await this.rollbackInputBarang(insertState);
        return this.buildFailureResult("histori_masuk");
      }

      for (const priceRow of input.priceRows) {
        let hargaId: string | undefined;

        try {
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
            throw new Error(hargaError?.message ?? "insert harga failed");
          }

          hargaId = String(hargaData.harga_id);
          insertState.hargaIds.push(hargaId);
        } catch {
          await this.rollbackInputBarang(insertState);
          return this.buildFailureResult("harga");
        }

        const hargaCatatan = buildHistoriHargaCatatan(
          input.username,
          input.name,
          priceRow.currency,
          priceRow.harga,
          now
        );

        try {
          const { data: histData, error: histHargaError } = await supabase
            .from(HISTORI_HARGA_TABLE)
            .insert({
              harga_id: hargaId,
              catatan: hargaCatatan.slice(0, 250),
            })
            .select("hist_harga_id")
            .single();

          if (histHargaError || !histData) {
            throw new Error(
              histHargaError?.message ?? "insert histori harga failed"
            );
          }

          insertState.histHargaIds.push(String(histData.hist_harga_id));
        } catch {
          await this.rollbackInputBarang(insertState);
          return this.buildFailureResult("histori_harga");
        }
      }

      return { success: true, product_id: productId };
    } catch (err) {
      await this.rollbackInputBarang(insertState);

      if (err instanceof Error && err.name === "AbortError") {
        return {
          success: false,
          errorStage: "product",
          error: "Request timeout (60 detik)",
        };
      }

      return this.buildFailureResult("product");
    }
  }
}

/** Singleton instance repository product server-side. */
export const productRepository = new SupabaseProductRepository();
