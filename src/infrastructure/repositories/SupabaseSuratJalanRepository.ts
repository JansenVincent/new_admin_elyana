import type { SuratJalanRepository } from "@/domain/repositories/SuratJalanRepository";
import type {
  GetSuratJalanOptionsResult,
  SaveSuratJalanInput,
  SaveSuratJalanResult,
  SuratJalanCustomerOption,
  SuratJalanPemilikOption,
  SuratJalanProductOption,
  SuratJalanTokoOption,
  ValidateSuratJalanHargaInput,
  ValidateSuratJalanHargaResult,
} from "@/domain/entities/SuratJalan";
import { getSupabaseServerClient } from "@/infrastructure/supabase/serverClient";
import { CUSTOMER_STATUS_ACTIVE, CUSTOMER_TABLE } from "@/shared/constants/customer";
import {
  HARGA_TABLE,
  HISTORI_KELUAR_TABLE,
  PRODUCT_STATUS_AVAILABLE,
  PRODUCT_TABLE,
} from "@/shared/constants/product";
import {
  DETAIL_PENJUALAN_TABLE,
  PEMILIK_TABLE,
  PO_TABLE,
  SURAT_JALAN_HARGA_NOT_FOUND_MESSAGE,
  SURAT_JALAN_SAVE_ERROR_MESSAGE,
  SURAT_JALAN_TABLE,
  TOKO_TABLE,
} from "@/shared/constants/suratJalan";
import { buildHistoriKeluarSuratJalanCatatan } from "@/shared/utils/formatCatatan";
import { getTodayWibDateInputValue } from "@/shared/utils/timestamp";

/** State insert sementara untuk rollback penyimpanan Surat Jalan. */
interface SuratJalanInsertState {
  poId?: string;
  sjId?: string;
  detailIds: string[];
  keluarIds: string[];
  productRollbacks: Array<{ productId: string; kuantitas: number }>;
}

/**
 * Implementasi SuratJalanRepository menggunakan Supabase service role.
 */
export class SupabaseSuratJalanRepository implements SuratJalanRepository {
  /**
   * Mengambil opsi dropdown dan daftar product untuk form Surat Jalan.
   */
  async getFormOptions(): Promise<GetSuratJalanOptionsResult> {
    try {
      const supabase = getSupabaseServerClient();

      const [customerResult, tokoResult, pemilikResult, productResult] =
        await Promise.all([
          supabase
            .from(CUSTOMER_TABLE)
            .select("cust_id, cust_name")
            .eq("status_customer", CUSTOMER_STATUS_ACTIVE)
            .order("cust_name", { ascending: true }),
          supabase
            .from(TOKO_TABLE)
            .select("toko_id, nama_toko")
            .order("nama_toko", { ascending: true }),
          supabase
            .from(PEMILIK_TABLE)
            .select("pemilik_id, nama_pemilik")
            .order("nama_pemilik", { ascending: true }),
          supabase
            .from(PRODUCT_TABLE)
            .select(
              "product_id, nama_barang, kuantitas, satuan_kuantitas, keterangan"
            )
            .eq("status_product", PRODUCT_STATUS_AVAILABLE)
            .gt("kuantitas", 0)
            .order("nama_barang", { ascending: true }),
        ]);

      if (
        customerResult.error ||
        tokoResult.error ||
        pemilikResult.error ||
        productResult.error
      ) {
        return {
          success: false,
          error:
            customerResult.error?.message ??
            tokoResult.error?.message ??
            pemilikResult.error?.message ??
            productResult.error?.message ??
            SURAT_JALAN_SAVE_ERROR_MESSAGE,
        };
      }

      const customers: SuratJalanCustomerOption[] = (customerResult.data ?? []).map(
        (row) => ({
          cust_id: String(row.cust_id),
          cust_name: String(row.cust_name ?? ""),
        })
      );

      const tokos: SuratJalanTokoOption[] = (tokoResult.data ?? []).map((row) => ({
        toko_id: String(row.toko_id),
        nama_toko: String(row.nama_toko ?? ""),
      }));

      const pemiliks: SuratJalanPemilikOption[] = (pemilikResult.data ?? []).map(
        (row) => ({
          pemilik_id: String(row.pemilik_id),
          nama_pemilik: String(row.nama_pemilik ?? ""),
        })
      );

      const products: SuratJalanProductOption[] = (productResult.data ?? []).map(
        (row) => ({
          product_id: String(row.product_id),
          nama_barang: String(row.nama_barang ?? ""),
          kuantitas: Number(row.kuantitas),
          satuan_kuantitas: String(row.satuan_kuantitas ?? ""),
          keterangan: row.keterangan ? String(row.keterangan) : null,
        })
      );

      return {
        success: true,
        customers,
        tokos,
        pemiliks,
        products,
      };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Terjadi kesalahan tidak terduga";
      return { success: false, error: message };
    }
  }

  /**
   * Menyimpan data PO, Surat Jalan, detail penjualan, update stok, dan histori keluar.
   */
  async saveSuratJalan(input: SaveSuratJalanInput): Promise<SaveSuratJalanResult> {
    const insertState: SuratJalanInsertState = {
      detailIds: [],
      keluarIds: [],
      productRollbacks: [],
    };

    try {
      const supabase = getSupabaseServerClient();
      const now = new Date();
      const tanggalKeluar = getTodayWibDateInputValue();
      const keluarCatatan = buildHistoriKeluarSuratJalanCatatan(
        input.username,
        input.name,
        input.nomorSj,
        now
      ).slice(0, 250);

      let poId = "";

      try {
        const { data: poData, error: poError } = await supabase
          .from(PO_TABLE)
          .insert({
            nomor_po: input.nomorPo.trim(),
            cust_id: input.custId,
            toko_id: input.tokoId,
            pemilik_id: input.pemilikId,
            pengiriman: input.pengiriman.trim().toUpperCase(),
          })
          .select("po_id")
          .single();

        if (poError || !poData) {
          throw new Error(poError?.message ?? "insert po failed");
        }

        poId = String(poData.po_id);
        insertState.poId = poId;
      } catch {
        return { success: false, error: SURAT_JALAN_SAVE_ERROR_MESSAGE };
      }

      try {
        const { data: sjData, error: sjError } = await supabase
          .from(SURAT_JALAN_TABLE)
          .insert({
            po_id: poId,
            nomor_sj: input.nomorSj.trim(),
            tanggal_sj: input.tanggalSj,
          })
          .select("sj_id")
          .single();

        if (sjError || !sjData) {
          throw new Error(sjError?.message ?? "insert surat jalan failed");
        }

        insertState.sjId = String(sjData.sj_id);
      } catch {
        await this.rollbackSuratJalan(insertState);
        return { success: false, error: SURAT_JALAN_SAVE_ERROR_MESSAGE };
      }

      for (const lineItem of input.lineItems) {
        const { data: productRow, error: productError } = await supabase
          .from(PRODUCT_TABLE)
          .select("product_id, kuantitas")
          .eq("product_id", lineItem.productId)
          .eq("status_product", PRODUCT_STATUS_AVAILABLE)
          .maybeSingle();

        if (productError || !productRow) {
          await this.rollbackSuratJalan(insertState);
          return { success: false, error: SURAT_JALAN_SAVE_ERROR_MESSAGE };
        }

        const currentKuantitas = Number(productRow.kuantitas);
        if (lineItem.kuantitasBeli > currentKuantitas) {
          await this.rollbackSuratJalan(insertState);
          return { success: false, error: SURAT_JALAN_SAVE_ERROR_MESSAGE };
        }

        const { data: hargaRow, error: hargaError } = await supabase
          .from(HARGA_TABLE)
          .select("harga_id, harga, mata_uang")
          .eq("product_id", lineItem.productId)
          .eq("cust_id", input.custId)
          .maybeSingle();

        if (
          hargaError ||
          !hargaRow ||
          hargaRow.harga == null ||
          !String(hargaRow.mata_uang ?? "").trim()
        ) {
          await this.rollbackSuratJalan(insertState);
          return {
            success: false,
            error: SURAT_JALAN_HARGA_NOT_FOUND_MESSAGE,
          };
        }

        const hargaId = String(hargaRow.harga_id);
        let detailId = "";

        try {
          const { data: detailData, error: detailError } = await supabase
            .from(DETAIL_PENJUALAN_TABLE)
            .insert({
              po_id: poId,
              product_id: lineItem.productId,
              harga_satuan_id: hargaId,
              kuantitas_beli: lineItem.kuantitasBeli,
            })
            .select("jual_detail_id")
            .single();

          if (detailError || !detailData) {
            throw new Error(detailError?.message ?? "insert detail failed");
          }

          detailId = String(detailData.jual_detail_id);
          insertState.detailIds.push(detailId);
        } catch {
          await this.rollbackSuratJalan(insertState);
          return { success: false, error: SURAT_JALAN_SAVE_ERROR_MESSAGE };
        }

        const nextKuantitas = currentKuantitas - lineItem.kuantitasBeli;

        try {
          const { error: updateError } = await supabase
            .from(PRODUCT_TABLE)
            .update({ kuantitas: nextKuantitas })
            .eq("product_id", lineItem.productId);

          if (updateError) {
            throw new Error(updateError.message);
          }

          insertState.productRollbacks.push({
            productId: lineItem.productId,
            kuantitas: currentKuantitas,
          });
        } catch {
          await this.rollbackSuratJalan(insertState);
          return { success: false, error: SURAT_JALAN_SAVE_ERROR_MESSAGE };
        }

        try {
          const { data: keluarData, error: keluarError } = await supabase
            .from(HISTORI_KELUAR_TABLE)
            .insert({
              product_id: lineItem.productId,
              tanggal_keluar: tanggalKeluar,
              kuantitas_keluar: lineItem.kuantitasBeli,
              catatan: keluarCatatan,
            })
            .select("keluar_id")
            .single();

          if (keluarError || !keluarData) {
            throw new Error(keluarError?.message ?? "insert histori keluar failed");
          }

          insertState.keluarIds.push(String(keluarData.keluar_id));
        } catch {
          await this.rollbackSuratJalan(insertState);
          return { success: false, error: SURAT_JALAN_SAVE_ERROR_MESSAGE };
        }
      }

      return {
        success: true,
        po_id: insertState.poId,
        sj_id: insertState.sjId,
      };
    } catch (err) {
      await this.rollbackSuratJalan(insertState);

      if (err instanceof Error && err.message === SURAT_JALAN_HARGA_NOT_FOUND_MESSAGE) {
        return {
          success: false,
          error: SURAT_JALAN_HARGA_NOT_FOUND_MESSAGE,
        };
      }

      return { success: false, error: SURAT_JALAN_SAVE_ERROR_MESSAGE };
    }
  }

  /**
   * Memvalidasi harga dan mata uang setiap product untuk customer terpilih.
   */
  async validateLineItemHarga(
    input: ValidateSuratJalanHargaInput
  ): Promise<ValidateSuratJalanHargaResult> {
    try {
      if (!input.custId || input.lineItems.length === 0) {
        return { success: true, isValid: false, missingProductNames: [] };
      }

      const supabase = getSupabaseServerClient();
      const productIds = input.lineItems.map((item) => item.productId);

      const { data: hargaRows, error } = await supabase
        .from(HARGA_TABLE)
        .select("product_id, harga, mata_uang")
        .eq("cust_id", input.custId)
        .in("product_id", productIds);

      if (error) {
        return { success: false, error: error.message };
      }

      const validProductIds = new Set(
        (hargaRows ?? [])
          .filter(
            (row) =>
              row.harga != null && String(row.mata_uang ?? "").trim().length > 0
          )
          .map((row) => String(row.product_id))
      );

      const missingProductNames = input.lineItems
        .filter((item) => !validProductIds.has(item.productId))
        .map((item) => item.namaBarang);

      return {
        success: true,
        isValid: missingProductNames.length === 0,
        missingProductNames,
      };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Terjadi kesalahan tidak terduga";
      return { success: false, error: message };
    }
  }

  /**
   * Mengembalikan data yang sudah tersimpan sebagian ke kondisi semula.
   */
  private async rollbackSuratJalan(state: SuratJalanInsertState): Promise<void> {
    const supabase = getSupabaseServerClient();

    if (state.keluarIds.length > 0) {
      await supabase
        .from(HISTORI_KELUAR_TABLE)
        .delete()
        .in("keluar_id", state.keluarIds);
    }

    for (const rollback of state.productRollbacks) {
      await supabase
        .from(PRODUCT_TABLE)
        .update({ kuantitas: rollback.kuantitas })
        .eq("product_id", rollback.productId);
    }

    if (state.detailIds.length > 0) {
      await supabase
        .from(DETAIL_PENJUALAN_TABLE)
        .delete()
        .in("jual_detail_id", state.detailIds);
    }

    if (state.sjId) {
      await supabase.from(SURAT_JALAN_TABLE).delete().eq("sj_id", state.sjId);
    }

    if (state.poId) {
      await supabase.from(PO_TABLE).delete().eq("po_id", state.poId);
    }
  }
}

/** Singleton instance repository Surat Jalan server-side. */
export const suratJalanRepository = new SupabaseSuratJalanRepository();
