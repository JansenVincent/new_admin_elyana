import type {
  GetSuratJalanOptionsResult,
  SaveSuratJalanInput,
  SaveSuratJalanResult,
  ValidateSuratJalanHargaInput,
  ValidateSuratJalanHargaResult,
} from "@/domain/entities/SuratJalan";

/**
 * Service Surat Jalan client-side yang memanggil API route server-side.
 */
export class SuratJalanService {
  /**
   * Mengambil opsi dropdown dan product untuk form Surat Jalan.
   */
  async getFormOptions(): Promise<GetSuratJalanOptionsResult> {
    const response = await fetch("/api/surat-jalan/options");
    return (await response.json()) as GetSuratJalanOptionsResult;
  }

  /**
   * Menyimpan data Surat Jalan melalui API server-side.
   */
  async saveSuratJalan(input: SaveSuratJalanInput): Promise<SaveSuratJalanResult> {
    const response = await fetch("/api/surat-jalan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    return (await response.json()) as SaveSuratJalanResult;
  }

  /**
   * Memvalidasi harga product per customer sebelum lanjut ke ringkasan.
   */
  async validateLineItemHarga(
    input: ValidateSuratJalanHargaInput
  ): Promise<ValidateSuratJalanHargaResult> {
    const response = await fetch("/api/surat-jalan/validate-harga", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    return (await response.json()) as ValidateSuratJalanHargaResult;
  }
}

/** Singleton instance service Surat Jalan client-side. */
export const suratJalanService = new SuratJalanService();
