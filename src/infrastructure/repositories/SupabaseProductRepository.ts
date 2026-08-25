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
import type { DeleteProductResult } from "@/domain/entities/DeleteProduct";
import type {
  AddProductHargaInput,
  AddProductHargaResult,
  UpdateHargaErrorStage,
  UpdateProductHargaInput,
  UpdateProductHargaResult,
} from "@/domain/entities/UpdateHarga";
import type {
  UpdateKuantitasErrorStage,
  UpdateProductKuantitasInput,
  UpdateProductKuantitasResult,
} from "@/domain/entities/UpdateKuantitas";
import { getSupabaseServerClient } from "@/infrastructure/supabase/serverClient";
import {
  DELETE_PRODUCT_ERROR_MESSAGE,
  HARGA_TABLE,
  HISTORI_HARGA_TABLE,
  HISTORI_KELUAR_TABLE,
  HISTORI_MASUK_TABLE,
  INPUT_BARANG_ERROR_BARCODE_BUCKET,
  INPUT_BARANG_ERROR_BARCODE_UPLOAD,
  INPUT_BARANG_ERROR_MESSAGES,
  UPDATE_KUANTITAS_ERROR_MESSAGES,
  UPDATE_HARGA_ERROR_MESSAGES,
  PRODUCT_BARCODE_BUCKET,
  PRODUCT_TABLE,
} from "@/shared/constants/product";
import {
  CUSTOMER_STATUS_ACTIVE,
  CUSTOMER_TABLE,
} from "@/shared/constants/customer";
import {
  buildHistoriAddHargaMyProductCatatan,
  buildHistoriEditHargaMyProductCatatan,
  buildHistoriEditKuantitasCatatan,
  buildHistoriHargaCatatan,
  buildHistoriMasukCatatan,
} from "@/shared/utils/formatCatatan";
import {
  generateProductShortId,
  generateProductSlugId,
  slugifyProductName,
} from "@/shared/utils/productSlug";

/** Snapshot data product untuk rollback penghapusan. */
interface DeleteProductSnapshot {
  product: {
    product_id: string;
    slug_id: string;
    nama_barang: string;
    tipe_barang: string;
    kuantitas: number;
    satuan_kuantitas: string;
    keterangan: string | null;
    barcode: string;
  } | null;
  historiMasukRows: Array<{
    masuk_id: string;
    product_id: string;
    tanggal_masuk: string;
    kuantitas_masuk: number;
    catatan: string;
  }>;
  historiKeluarRows: Array<{
    keluar_id: string;
    product_id: string;
    tanggal_keluar: string;
    kuantitas_keluar: number;
    catatan: string;
  }>;
  hargaRows: Array<{
    harga_id: string;
    product_id: string;
    cust_id: string;
    harga: number;
    mata_uang: string;
  }>;
  historiHargaRows: Array<{
    hist_harga_id: string;
    harga_id: string;
    catatan: string;
  }>;
}

/** Progress penghapusan product untuk kebutuhan rollback. */
interface DeleteProductProgress {
  snapshot: DeleteProductSnapshot;
  deletedHistoriHarga: boolean;
  deletedHarga: boolean;
  deletedHistoriMasuk: boolean;
  deletedHistoriKeluar: boolean;
  deletedProduct: boolean;
}

/** State insert sementara untuk rollback penambahan harga My Product. */
interface AddHargaInsertState {
  hargaIds: string[];
  histHargaIds: string[];
}

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
   * Menghasilkan slug_id unik untuk product baru.
   */
  private async generateUniqueSlugId(namaBarang: string): Promise<string> {
    const supabase = getSupabaseServerClient();

    for (let attempt = 0; attempt < 10; attempt++) {
      const slugId = generateProductSlugId(namaBarang);

      const { data } = await supabase
        .from(PRODUCT_TABLE)
        .select("product_id")
        .eq("slug_id", slugId)
        .maybeSingle();

      if (!data) {
        return slugId;
      }
    }

    return `${slugifyProductName(namaBarang)}-${generateProductShortId(8)}`;
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
      let savedSlugId = "";

      try {
        const slugId = await this.generateUniqueSlugId(input.namaBarang.trim());

        const { data: productData, error: productError } = await supabase
          .from(PRODUCT_TABLE)
          .insert({
            slug_id: slugId,
            nama_barang: input.namaBarang.trim(),
            tipe_barang: input.jenis,
            kuantitas: input.jumlahBarang,
            satuan_kuantitas: input.satuanBarang.trim(),
            keterangan: input.keteranganBarang.trim(),
            barcode: uploadResult.url,
          })
          .select("product_id, slug_id")
          .single();

        if (productError || !productData) {
          throw new Error(productError?.message ?? "insert product failed");
        }

        insertState.productId = String(productData.product_id);
        savedSlugId = String(productData.slug_id);
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

      return {
        success: true,
        product_id: productId,
        slug_id: savedSlugId,
      };
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
        .select("product_id, slug_id, nama_barang", { count: "exact" })
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
        slug_id: String(row.slug_id ?? ""),
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
   * Mengambil detail product berdasarkan slug_id URL.
   */
  async getMyProductDetailBySlug(
    slugId: string
  ): Promise<GetMyProductDetailResult> {
    try {
      const supabase = getSupabaseServerClient();

      const { data: productRow, error: productError } = await supabase
        .from(PRODUCT_TABLE)
        .select("product_id, slug_id, nama_barang, kuantitas, satuan_kuantitas")
        .eq("slug_id", slugId)
        .maybeSingle();

      if (productError) {
        return { success: false, error: productError.message };
      }

      if (!productRow) {
        return { success: false, error: "Product tidak ditemukan" };
      }

      return this.buildMyProductDetail(String(productRow.product_id), productRow);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Terjadi kesalahan tidak terduga";
      return { success: false, error: message };
    }
  }

  /**
   * Membangun detail product lengkap berdasarkan product_id.
   */
  private async buildMyProductDetail(
    productId: string,
    productRow: {
      product_id: unknown;
      slug_id: unknown;
      nama_barang: unknown;
      kuantitas: unknown;
      satuan_kuantitas: unknown;
    }
  ): Promise<GetMyProductDetailResult> {
    try {
      const supabase = getSupabaseServerClient();

      const { data: hargaRows, error: hargaError } = await supabase
        .from(HARGA_TABLE)
        .select(
          `
          harga_id,
          cust_id,
          harga,
          mata_uang,
          Admin_Ely_Customer!inner ( cust_name )
        `
        )
        .eq("product_id", productId)
        .eq("Admin_Ely_Customer.status_customer", CUSTOMER_STATUS_ACTIVE);

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
            harga_id: String(row.harga_id),
            cust_id: String(row.cust_id ?? ""),
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
        slug_id: String(productRow.slug_id ?? ""),
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
   * Memperbarui kuantitas product berdasarkan slug_id URL.
   */
  async updateProductKuantitasBySlug(
    slugId: string,
    input: Omit<UpdateProductKuantitasInput, "productId">
  ): Promise<UpdateProductKuantitasResult> {
    try {
      const supabase = getSupabaseServerClient();

      const { data: productRow, error: fetchError } = await supabase
        .from(PRODUCT_TABLE)
        .select("product_id")
        .eq("slug_id", slugId)
        .maybeSingle();

      if (fetchError) {
        return this.buildUpdateKuantitasFailureResult("product");
      }

      if (!productRow) {
        return { success: false, error: "Product tidak ditemukan" };
      }

      return this.updateProductKuantitasInternal(
        String(productRow.product_id),
        input
      );
    } catch {
      return this.buildUpdateKuantitasFailureResult("product");
    }
  }

  /**
   * Memperbarui kuantitas product dan insert histori masuk/keluar dengan rollback.
   */
  private async updateProductKuantitasInternal(
    productId: string,
    input: Omit<UpdateProductKuantitasInput, "productId">
  ): Promise<UpdateProductKuantitasResult> {
    try {
      const supabase = getSupabaseServerClient();
      const now = new Date();

      const { data: productRow, error: fetchError } = await supabase
        .from(PRODUCT_TABLE)
        .select("kuantitas")
        .eq("product_id", productId)
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
          .eq("product_id", productId);

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
              product_id: productId,
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
              product_id: productId,
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
          .eq("product_id", productId);

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

  /**
   * Mengembalikan hasil gagal update/penambahan harga dengan pesan popup standar.
   */
  private buildUpdateHargaFailureResult(
    stage: UpdateHargaErrorStage
  ): UpdateProductHargaResult | AddProductHargaResult {
    return {
      success: false,
      errorStage: stage,
      error: UPDATE_HARGA_ERROR_MESSAGES[stage],
    };
  }

  /**
   * Melakukan rollback insert harga dan histori harga saat penambahan gagal.
   */
  private async rollbackAddHarga(state: AddHargaInsertState): Promise<void> {
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
  }

  /**
   * Mengambil product_id dari slug_id untuk operasi harga My Product.
   */
  private async getProductIdBySlug(
    slugId: string
  ): Promise<{ productId: string } | { error: string }> {
    const supabase = getSupabaseServerClient();

    const { data: productRow, error } = await supabase
      .from(PRODUCT_TABLE)
      .select("product_id")
      .eq("slug_id", slugId)
      .maybeSingle();

    if (error) {
      return { error: error.message };
    }

    if (!productRow) {
      return { error: "Product tidak ditemukan" };
    }

    return { productId: String(productRow.product_id) };
  }

  /**
   * Memperbarui harga product existing dan insert histori harga berdasarkan slug_id.
   */
  async updateProductHargaBySlug(
    slugId: string,
    input: UpdateProductHargaInput
  ): Promise<UpdateProductHargaResult> {
    try {
      const productLookup = await this.getProductIdBySlug(slugId);

      if ("error" in productLookup) {
        return { success: false, error: productLookup.error };
      }

      const supabase = getSupabaseServerClient();
      const now = new Date();
      const productId = productLookup.productId;

      const { data: hargaRow, error: fetchError } = await supabase
        .from(HARGA_TABLE)
        .select("harga_id, harga, mata_uang")
        .eq("harga_id", input.harga_id)
        .eq("product_id", productId)
        .maybeSingle();

      if (fetchError) {
        return this.buildUpdateHargaFailureResult("harga");
      }

      if (!hargaRow) {
        return { success: false, error: "Data harga tidak ditemukan" };
      }

      const oldHarga = Number(hargaRow.harga);
      const mataUang = String(hargaRow.mata_uang ?? "IDR");

      if (Math.abs(oldHarga - input.harga) <= 0.001) {
        return { success: false, error: "Nominal harga tidak berubah" };
      }

      try {
        const { error: updateError } = await supabase
          .from(HARGA_TABLE)
          .update({ harga: input.harga })
          .eq("harga_id", input.harga_id)
          .eq("product_id", productId);

        if (updateError) {
          throw new Error(updateError.message);
        }
      } catch {
        return this.buildUpdateHargaFailureResult("harga");
      }

      const catatan = buildHistoriEditHargaMyProductCatatan(
        input.username,
        input.name,
        mataUang,
        input.harga,
        now
      ).slice(0, 250);

      try {
        const { error: historiError } = await supabase
          .from(HISTORI_HARGA_TABLE)
          .insert({
            harga_id: input.harga_id,
            catatan,
          });

        if (historiError) {
          throw new Error(historiError.message);
        }
      } catch {
        await supabase
          .from(HARGA_TABLE)
          .update({ harga: oldHarga })
          .eq("harga_id", input.harga_id);

        return this.buildUpdateHargaFailureResult("histori_harga");
      }

      return { success: true };
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        return {
          success: false,
          errorStage: "harga",
          error: "Request timeout (60 detik)",
        };
      }

      return this.buildUpdateHargaFailureResult("harga");
    }
  }

  /**
   * Menambahkan harga product untuk customer baru berdasarkan slug_id.
   */
  async addProductHargaBySlug(
    slugId: string,
    input: AddProductHargaInput
  ): Promise<AddProductHargaResult> {
    const insertState: AddHargaInsertState = {
      hargaIds: [],
      histHargaIds: [],
    };

    try {
      const productLookup = await this.getProductIdBySlug(slugId);

      if ("error" in productLookup) {
        return { success: false, error: productLookup.error };
      }

      const supabase = getSupabaseServerClient();
      const now = new Date();
      const productId = productLookup.productId;

      const { data: existingHargaRows, error: existingError } = await supabase
        .from(HARGA_TABLE)
        .select("cust_id")
        .eq("product_id", productId);

      if (existingError) {
        return this.buildUpdateHargaFailureResult("harga");
      }

      const existingCustIds = new Set(
        (existingHargaRows ?? []).map((row) => String(row.cust_id))
      );

      for (const priceRow of input.priceRows) {
        if (existingCustIds.has(priceRow.cust_id)) {
          return {
            success: false,
            error: "Customer sudah memiliki harga untuk product ini",
          };
        }
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
          existingCustIds.add(priceRow.cust_id);
        } catch {
          await this.rollbackAddHarga(insertState);
          return this.buildUpdateHargaFailureResult("harga");
        }

        const hargaCatatan = buildHistoriAddHargaMyProductCatatan(
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
          await this.rollbackAddHarga(insertState);
          return this.buildUpdateHargaFailureResult("histori_harga");
        }
      }

      return { success: true };
    } catch (err) {
      await this.rollbackAddHarga(insertState);

      if (err instanceof Error && err.name === "AbortError") {
        return {
          success: false,
          errorStage: "harga",
          error: "Request timeout (60 detik)",
        };
      }

      return this.buildUpdateHargaFailureResult("harga");
    }
  }

  /**
   * Mengembalikan data product yang sudah terhapus sebagian ke database.
   */
  private async rollbackDeleteProduct(progress: DeleteProductProgress): Promise<void> {
    const supabase = getSupabaseServerClient();
    const { snapshot } = progress;

    if (progress.deletedProduct && snapshot.product) {
      await supabase.from(PRODUCT_TABLE).insert(snapshot.product);
    }

    if (progress.deletedHarga && snapshot.hargaRows.length > 0) {
      await supabase.from(HARGA_TABLE).insert(snapshot.hargaRows);
    }

    if (progress.deletedHistoriMasuk && snapshot.historiMasukRows.length > 0) {
      await supabase.from(HISTORI_MASUK_TABLE).insert(snapshot.historiMasukRows);
    }

    if (progress.deletedHistoriKeluar && snapshot.historiKeluarRows.length > 0) {
      await supabase.from(HISTORI_KELUAR_TABLE).insert(snapshot.historiKeluarRows);
    }

    if (progress.deletedHistoriHarga && snapshot.historiHargaRows.length > 0) {
      await supabase.from(HISTORI_HARGA_TABLE).insert(snapshot.historiHargaRows);
    }
  }

  /**
   * Mengambil snapshot seluruh data terkait product sebelum penghapusan.
   */
  private async fetchDeleteProductSnapshot(
    productId: string
  ): Promise<DeleteProductSnapshot | null> {
    const supabase = getSupabaseServerClient();

    const { data: productRow, error: productError } = await supabase
      .from(PRODUCT_TABLE)
      .select(
        "product_id, slug_id, nama_barang, tipe_barang, kuantitas, satuan_kuantitas, keterangan, barcode"
      )
      .eq("product_id", productId)
      .maybeSingle();

    if (productError || !productRow) {
      return null;
    }

    const { data: hargaRows } = await supabase
      .from(HARGA_TABLE)
      .select("harga_id, product_id, cust_id, harga, mata_uang")
      .eq("product_id", productId);

    const hargaIds = (hargaRows ?? []).map((row) => String(row.harga_id));

    let historiHargaRows: DeleteProductSnapshot["historiHargaRows"] = [];

    if (hargaIds.length > 0) {
      const { data: historiHargaData } = await supabase
        .from(HISTORI_HARGA_TABLE)
        .select("hist_harga_id, harga_id, catatan")
        .in("harga_id", hargaIds);

      historiHargaRows = (historiHargaData ?? []).map((row) => ({
        hist_harga_id: String(row.hist_harga_id),
        harga_id: String(row.harga_id),
        catatan: String(row.catatan ?? ""),
      }));
    }

    const { data: historiMasukRows } = await supabase
      .from(HISTORI_MASUK_TABLE)
      .select("masuk_id, product_id, tanggal_masuk, kuantitas_masuk, catatan")
      .eq("product_id", productId);

    const { data: historiKeluarRows } = await supabase
      .from(HISTORI_KELUAR_TABLE)
      .select("keluar_id, product_id, tanggal_keluar, kuantitas_keluar, catatan")
      .eq("product_id", productId);

    return {
      product: {
        product_id: String(productRow.product_id),
        slug_id: String(productRow.slug_id ?? ""),
        nama_barang: String(productRow.nama_barang ?? ""),
        tipe_barang: String(productRow.tipe_barang ?? ""),
        kuantitas: Number(productRow.kuantitas),
        satuan_kuantitas: String(productRow.satuan_kuantitas ?? ""),
        keterangan: productRow.keterangan
          ? String(productRow.keterangan)
          : null,
        barcode: String(productRow.barcode ?? ""),
      },
      historiMasukRows: (historiMasukRows ?? []).map((row) => ({
        masuk_id: String(row.masuk_id),
        product_id: String(row.product_id),
        tanggal_masuk: String(row.tanggal_masuk).slice(0, 10),
        kuantitas_masuk: Number(row.kuantitas_masuk),
        catatan: String(row.catatan ?? ""),
      })),
      historiKeluarRows: (historiKeluarRows ?? []).map((row) => ({
        keluar_id: String(row.keluar_id),
        product_id: String(row.product_id),
        tanggal_keluar: String(row.tanggal_keluar).slice(0, 10),
        kuantitas_keluar: Number(row.kuantitas_keluar),
        catatan: String(row.catatan ?? ""),
      })),
      hargaRows: (hargaRows ?? []).map((row) => ({
        harga_id: String(row.harga_id),
        product_id: String(row.product_id),
        cust_id: String(row.cust_id),
        harga: Number(row.harga),
        mata_uang: String(row.mata_uang ?? "IDR"),
      })),
      historiHargaRows,
    };
  }

  /**
   * Menghapus product beserta seluruh data terkait secara berurutan dengan rollback.
   */
  async deleteProductBySlug(slugId: string): Promise<DeleteProductResult> {
    const progress: DeleteProductProgress = {
      snapshot: {
        product: null,
        historiMasukRows: [],
        historiKeluarRows: [],
        hargaRows: [],
        historiHargaRows: [],
      },
      deletedHistoriHarga: false,
      deletedHarga: false,
      deletedHistoriMasuk: false,
      deletedHistoriKeluar: false,
      deletedProduct: false,
    };

    try {
      const productLookup = await this.getProductIdBySlug(slugId);

      if ("error" in productLookup) {
        return { success: false, error: productLookup.error };
      }

      const productId = productLookup.productId;
      const snapshot = await this.fetchDeleteProductSnapshot(productId);

      if (!snapshot?.product) {
        return { success: false, error: "Product tidak ditemukan" };
      }

      progress.snapshot = snapshot;
      const supabase = getSupabaseServerClient();
      const hargaIds = snapshot.hargaRows.map((row) => row.harga_id);

      try {
        if (hargaIds.length > 0) {
          const { error } = await supabase
            .from(HISTORI_HARGA_TABLE)
            .delete()
            .in("harga_id", hargaIds);

          if (error) {
            throw new Error(error.message);
          }
        }

        progress.deletedHistoriHarga = true;
      } catch {
        await this.rollbackDeleteProduct(progress);
        return { success: false, error: DELETE_PRODUCT_ERROR_MESSAGE };
      }

      try {
        const { error } = await supabase
          .from(HARGA_TABLE)
          .delete()
          .eq("product_id", productId);

        if (error) {
          throw new Error(error.message);
        }

        progress.deletedHarga = true;
      } catch {
        await this.rollbackDeleteProduct(progress);
        return { success: false, error: DELETE_PRODUCT_ERROR_MESSAGE };
      }

      try {
        const { error } = await supabase
          .from(HISTORI_MASUK_TABLE)
          .delete()
          .eq("product_id", productId);

        if (error) {
          throw new Error(error.message);
        }

        progress.deletedHistoriMasuk = true;
      } catch {
        await this.rollbackDeleteProduct(progress);
        return { success: false, error: DELETE_PRODUCT_ERROR_MESSAGE };
      }

      try {
        const { error } = await supabase
          .from(HISTORI_KELUAR_TABLE)
          .delete()
          .eq("product_id", productId);

        if (error) {
          throw new Error(error.message);
        }

        progress.deletedHistoriKeluar = true;
      } catch {
        await this.rollbackDeleteProduct(progress);
        return { success: false, error: DELETE_PRODUCT_ERROR_MESSAGE };
      }

      try {
        const { error } = await supabase
          .from(PRODUCT_TABLE)
          .delete()
          .eq("product_id", productId);

        if (error) {
          throw new Error(error.message);
        }

        progress.deletedProduct = true;
      } catch {
        await this.rollbackDeleteProduct(progress);
        return { success: false, error: DELETE_PRODUCT_ERROR_MESSAGE };
      }

      return { success: true };
    } catch (err) {
      await this.rollbackDeleteProduct(progress);

      if (err instanceof Error && err.name === "AbortError") {
        return { success: false, error: DELETE_PRODUCT_ERROR_MESSAGE };
      }

      return { success: false, error: DELETE_PRODUCT_ERROR_MESSAGE };
    }
  }
}

/** Singleton instance repository product server-side. */
export const productRepository = new SupabaseProductRepository();
