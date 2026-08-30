import type {
  GetSuratJalanOptionsResult,
  SaveSuratJalanInput,
  SaveSuratJalanResult,
  ValidateSuratJalanHargaInput,
  ValidateSuratJalanHargaResult,
} from "@/domain/entities/SuratJalan";

/**
 * Kontrak repository untuk operasi Surat Jalan.
 */
export interface SuratJalanRepository {
  /**
   * Mengambil opsi dropdown dan daftar product untuk form Surat Jalan.
   */
  getFormOptions(): Promise<GetSuratJalanOptionsResult>;

  /**
   * Menyimpan data PO, Surat Jalan, detail penjualan, dan histori keluar.
   */
  saveSuratJalan(input: SaveSuratJalanInput): Promise<SaveSuratJalanResult>;

  /**
   * Memvalidasi harga dan mata uang setiap product untuk customer terpilih.
   */
  validateLineItemHarga(
    input: ValidateSuratJalanHargaInput
  ): Promise<ValidateSuratJalanHargaResult>;
}
