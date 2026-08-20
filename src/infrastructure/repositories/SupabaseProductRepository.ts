import type { ProductRepository } from "@/domain/repositories/ProductRepository";
import type {
  ActiveCustomerOption,
  InputBarangSaveErrorStage,
  SaveInputBarangInput,
  SaveInputBarangResult,
} from "@/domain/entities/InputBarang";
import type {
  GetMyProductDetailResult,
  ListMyProductsParams,
  ListMyProductsResult,
  MyProductDetail,
  MyProductHistoriBarangEntry,
  MyProductListItem,
  MyProductPriceByCustomer,
} from "@/domain/entities/MyProduct";
import type {
  UpdateKuantitasErrorStage,
  UpdateProductKuantitasInput,
  UpdateProductKuantitasResult,
} from "@/domain/entities/UpdateKuantitas";
import { getSupabaseServerClient } from "@/infrastructure/supabase/serverClient";
import {
  HARGA_TABLE,
  HISTORI_HARGA_TABLE,
  HISTORI_KELUAR_TABLE,
  HISTORI_MASUK_TABLE,
  INPUT_BARANG_ERROR_BARCODE_BUCKET,
  INPUT_BARANG_ERROR_BARCODE_UPLOAD,
  INPUT_BARANG_ERROR_MESSAGES,
  UPDATE_KUANTITAS_ERROR_MESSAGES,
  PRODUCT_BARCODE_BUCKET,
  PRODUCT_TABLE,
} from "@/shared/constants/product";
import {
  CUSTOMER_STATUS_ACTIVE,
  CUSTOMER_TABLE,
} from "@/shared/constants/customer";
import {
  buildHistoriEditKuantitasCatatan,
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

  /**
   * Mengambil daftar product untuk halaman My Product dengan paginasi dan pencarian.
   */
  async listMyProducts(
    params: ListMyProductsParams
  ): Promise<ListMyProductsResult> {
    try {
      const supabase = getSupabaseServerClient();
      const page = Math.max(1, params.page);
      const limit = Math.max(1, params.limit);
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      let query = supabase
        .from(PRODUCT_TABLE)
        .select("product_id, nama_barang", { count: "exact" })
        .order("nama_barang", { ascending: true });

      if (params.search?.trim()) {
        query = query.ilike("nama_barang", `%${params.search.trim()}%`);
      }

      const { data, error, count } = await query.range(from, to);

      if (error) {
        return { success: false, error: error.message };
      }

      const total = count ?? 0;
      const totalPages = Math.max(1, Math.ceil(total / limit));
      const safePage = total === 0 ? 1 : Math.min(page, totalPages);

      const products: MyProductListItem[] = (data ?? []).map((row) => ({
        product_id: String(row.product_id),
        nama_barang: String(row.nama_barang ?? ""),
      }));

      return {
        success: true,
        products,
        total,
        page: safePage,
        totalPages,
      };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Terjadi kesalahan tidak terduga";
      return { success: false, error: message };
    }
  }

  /**
   * Mengambil detail product beserta harga per customer dan histori barang.
   */
  async getMyProductDetail(productId: string): Promise<GetMyProductDetailResult> {
    try {
      const supabase = getSupabaseServerClient();

      const { data: productRow, error: productError } = await supabase
        .from(PRODUCT_TABLE)
        .select("product_id, nama_barang, kuantitas, satuan_kuantitas")
        .eq("product_id", productId)
        .maybeSingle();

      if (productError) {
        return { success: false, error: productError.message };
      }

      if (!productRow) {
        return { success: false, error: "Product tidak ditemukan" };
      }

      const { data: hargaRows, error: hargaError } = await supabase
        .from(HARGA_TABLE)
        .select(
          `
          harga_id,
          harga,
          mata_uang,
          Admin_Ely_Customer ( cust_name )
        `
        )
        .eq("product_id", productId);

      if (hargaError) {
        return { success: false, error: hargaError.message };
      }

      const hargaIds = (hargaRows ?? []).map((row) => String(row.harga_id));

      let historiHargaRows: Array<{
        harga_id: string;
        catatan: string;
        hist_harga_id: string;
      }> = [];

      if (hargaIds.length > 0) {
        const { data: historiData, error: historiHargaError } = await supabase
          .from(HISTORI_HARGA_TABLE)
          .select("harga_id, catatan, hist_harga_id")
          .in("harga_id", hargaIds)
          .order("hist_harga_id", { ascending: true });

        if (historiHargaError) {
          return { success: false, error: historiHargaError.message };
        }

        historiHargaRows = (historiData ?? []).map((row) => ({
          harga_id: String(row.harga_id),
          catatan: String(row.catatan ?? ""),
          hist_harga_id: String(row.hist_harga_id),
        }));
      }

      const historiByHargaId = new Map<string, string[]>();
      historiHargaRows.forEach((row) => {
        const logs = historiByHargaId.get(row.harga_id) ?? [];
        logs.push(row.catatan);
        historiByHargaId.set(row.harga_id, logs);
      });

      const pricesByCustomer: MyProductPriceByCustomer[] = (hargaRows ?? [])
        .map((row) => {
          const customer = row.Admin_Ely_Customer as
            | { cust_name: string }
            | { cust_name: string }[]
            | null;

          const custName = Array.isArray(customer)
            ? customer[0]?.cust_name
            : customer?.cust_name;

          return {
            cust_name: String(custName ?? "-"),
            mata_uang: String(row.mata_uang ?? "IDR"),
            harga: Number(row.harga),
            historiLogs: (historiByHargaId.get(String(row.harga_id)) ?? []).map(
              (catatan) => ({ catatan })
            ),
          };
        })
        .sort((a, b) => a.cust_name.localeCompare(b.cust_name, "id"));

      const { data: masukRows, error: masukError } = await supabase
        .from(HISTORI_MASUK_TABLE)
        .select("tanggal_masuk, kuantitas_masuk, catatan")
        .eq("product_id", productId);

      if (masukError) {
        return { success: false, error: masukError.message };
      }

      const { data: keluarRows, error: keluarError } = await supabase
        .from(HISTORI_KELUAR_TABLE)
        .select("tanggal_keluar, kuantitas_keluar, catatan")
        .eq("product_id", productId);

      if (keluarError) {
        return { success: false, error: keluarError.message };
      }

      const satuan = String(productRow.satuan_kuantitas ?? "");

      const historiBarang: MyProductHistoriBarangEntry[] = [
        ...(masukRows ?? []).map((row) => ({
          tanggal: String(row.tanggal_masuk).slice(0, 10),
          quantityPrefix: "+" as const,
          quantity: Number(row.kuantitas_masuk),
          satuan_kuantitas: satuan,
          catatan: String(row.catatan ?? ""),
          type: "masuk" as const,
        })),
        ...(keluarRows ?? []).map((row) => ({
          tanggal: String(row.tanggal_keluar).slice(0, 10),
          quantityPrefix: "-" as const,
          quantity: Number(row.kuantitas_keluar),
          satuan_kuantitas: satuan,
          catatan: String(row.catatan ?? ""),
          type: "keluar" as const,
        })),
      ].sort((a, b) => a.tanggal.localeCompare(b.tanggal));

      const product: MyProductDetail = {
        product_id: String(productRow.product_id),
        nama_barang: String(productRow.nama_barang ?? ""),
        kuantitas: Number(productRow.kuantitas),
        satuan_kuantitas: satuan,
        pricesByCustomer,
        historiBarang,
      };

      return { success: true, product };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Terjadi kesalahan tidak terduga";
      return { success: false, error: message };
    }
  }

  /**
   * Mengembalikan hasil gagal update kuantitas dengan pesan popup standar.
   */
  private buildUpdateKuantitasFailureResult(
    stage: UpdateKuantitasErrorStage
  ): UpdateProductKuantitasResult {
    return {
      success: false,
      errorStage: stage,
      error: UPDATE_KUANTITAS_ERROR_MESSAGES[stage],
    };
  }

  /**
   * Memperbarui kuantitas product dan insert histori masuk/keluar dengan rollback.
   */
  async updateProductKuantitas(
    input: UpdateProductKuantitasInput
  ): Promise<UpdateProductKuantitasResult> {
    try {
      const supabase = getSupabaseServerClient();
      const now = new Date();

      const { data: productRow, error: fetchError } = await supabase
        .from(PRODUCT_TABLE)
        .select("kuantitas")
        .eq("product_id", input.productId)
        .maybeSingle();

      if (fetchError) {
        return this.buildUpdateKuantitasFailureResult("product");
      }

      if (!productRow) {
        return { success: false, error: "Product tidak ditemukan" };
      }

      const oldKuantitas = Number(productRow.kuantitas);
      const newKuantitas =
        input.mode === "tambah"
          ? oldKuantitas + input.jumlah
          : oldKuantitas - input.jumlah;

      if (newKuantitas < 0) {
        return {
          success: false,
          error: "Kuantitas product tidak boleh kurang dari 0",
        };
      }

      try {
        const { error: updateError } = await supabase
          .from(PRODUCT_TABLE)
          .update({ kuantitas: newKuantitas })
          .eq("product_id", input.productId);

        if (updateError) {
          throw new Error(updateError.message);
        }
      } catch {
        return this.buildUpdateKuantitasFailureResult("product");
      }

      const catatan = buildHistoriEditKuantitasCatatan(
        input.username,
        input.name,
        input.catatan,
        now
      ).slice(0, 250);

      try {
        if (input.mode === "tambah") {
          const { error: masukError } = await supabase
            .from(HISTORI_MASUK_TABLE)
            .insert({
              product_id: input.productId,
              tanggal_masuk: input.tanggal,
              kuantitas_masuk: input.jumlah,
              catatan,
            });

          if (masukError) {
            throw new Error(masukError.message);
          }
        } else {
          const { error: keluarError } = await supabase
            .from(HISTORI_KELUAR_TABLE)
            .insert({
              product_id: input.productId,
              tanggal_keluar: input.tanggal,
              kuantitas_keluar: input.jumlah,
              catatan,
            });

          if (keluarError) {
            throw new Error(keluarError.message);
          }
        }
      } catch {
        await supabase
          .from(PRODUCT_TABLE)
          .update({ kuantitas: oldKuantitas })
          .eq("product_id", input.productId);

        return this.buildUpdateKuantitasFailureResult(
          input.mode === "tambah" ? "histori_masuk" : "histori_keluar"
        );
      }

      return { success: true, newKuantitas };
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        return {
          success: false,
          errorStage: "product",
          error: "Request timeout (60 detik)",
        };
      }

      return this.buildUpdateKuantitasFailureResult("product");
    }
  }
}

/** Singleton instance repository product server-side. */
export const productRepository = new SupabaseProductRepository();
