import {
  MAX_NOMOR_PO_LENGTH,
  MAX_NOMOR_SJ_LENGTH,
  MAX_PENGIRIMAN_LENGTH,
} from "@/shared/constants/suratJalan";
import { getTodayWibDateInputValue } from "@/shared/utils/timestamp";
import { toTitleCase } from "@/shared/utils/stringFormat";

/**
 * Memeriksa apakah string tidak kosong setelah di-trim.
 */
function isNonEmptyString(value: string): boolean {
  return value.trim().length > 0;
}

/** Field yang dapat divalidasi pada step 1 Surat Jalan. */
export type SuratJalanStep1FieldName =
  | "nomorPo"
  | "pengiriman"
  | "tanggalSj"
  | "nomorSj"
  | "custId"
  | "tokoId"
  | "pemilikId";

/**
 * Memvalidasi field step 1 form Surat Jalan.
 */
export function validateSuratJalanStep1(input: {
  nomorPo: string;
  pengiriman: string;
  tanggalSj: string;
  nomorSj: string;
  custId: string;
  tokoId: string;
  pemilikId: string;
}): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!isNonEmptyString(input.nomorPo)) {
    errors.nomorPo = "Nomor PO tidak boleh kosong";
  } else if (input.nomorPo.trim().length > MAX_NOMOR_PO_LENGTH) {
    errors.nomorPo = `Nomor PO maksimal ${MAX_NOMOR_PO_LENGTH} karakter.`;
  }

  if (!isNonEmptyString(input.pengiriman)) {
    errors.pengiriman = "Pengiriman tidak boleh kosong";
  } else if (input.pengiriman.trim().length > MAX_PENGIRIMAN_LENGTH) {
    errors.pengiriman = `Pengiriman maksimal ${MAX_PENGIRIMAN_LENGTH} karakter.`;
  }

  if (!input.tanggalSj) {
    errors.tanggalSj = "Tanggal Surat Jalan wajib diisi.";
  } else if (input.tanggalSj > getTodayWibDateInputValue()) {
    errors.tanggalSj = "Tanggal Surat Jalan tidak boleh melebihi hari ini.";
  }

  if (!isNonEmptyString(input.nomorSj)) {
    errors.nomorSj = "Nomor Surat Jalan tidak boleh kosong";
  } else if (input.nomorSj.trim().length > MAX_NOMOR_SJ_LENGTH) {
    errors.nomorSj = `Nomor Surat Jalan maksimal ${MAX_NOMOR_SJ_LENGTH} karakter.`;
  }

  if (!input.custId) {
    errors.custId = "Nama Customer harus di pilih";
  }

  if (!input.tokoId) {
    errors.tokoId = "Nama Toko harus di pilih";
  }

  if (!input.pemilikId) {
    errors.pemilikId = "Nama Pemilik harus di pilih";
  }

  return errors;
}

/**
 * Mengembalikan pesan error untuk satu field step 1 Surat Jalan.
 */
export function getSuratJalanStep1FieldError(
  field: SuratJalanStep1FieldName,
  input: {
    nomorPo: string;
    pengiriman: string;
    tanggalSj: string;
    nomorSj: string;
    custId: string;
    tokoId: string;
    pemilikId: string;
  }
): string | undefined {
  return validateSuratJalanStep1(input)[field];
}

/**
 * Memvalidasi step 2 form Surat Jalan (minimal satu barang).
 */
export function validateSuratJalanStep2(
  lineItems: Array<{ product_id: string; kuantitas_beli: number }>
): boolean {
  return (
    lineItems.length > 0 &&
    lineItems.every(
      (item) =>
        Boolean(item.product_id) &&
        Number.isInteger(item.kuantitas_beli) &&
        item.kuantitas_beli > 0
    )
  );
}

/**
 * Mengecek apakah tidak ada error validasi.
 */
export function hasNoSuratJalanErrors(errors: Record<string, string>): boolean {
  return Object.keys(errors).length === 0;
}

/**
 * Mengubah input teks dokumen menjadi huruf kapital.
 */
export function toDocumentUpperCase(value: string): string {
  return value.toUpperCase();
}

/**
 * Memformat label product ringkasan Surat Jalan: FRONT_CODE NAMA_PRODUCT BACK_CODE (uppercase).
 */
export function formatSuratJalanProductLabel(
  frontCode: string,
  productName: string,
  backCode: string
): string {
  const parts = [
    frontCode.trim(),
    productName.trim(),
    backCode.trim(),
  ].filter(Boolean);

  return parts.join(" ").toUpperCase();
}

/** Data toko yang diperlukan untuk ringkasan Step 3 Surat Jalan. */
export interface SuratJalanTokoSummaryInput {
  nama_toko: string;
  keterangan_toko: string | null;
  alamat_toko: string;
}

/**
 * Memformat blok Nama Toko pada ringkasan Surat Jalan (multi-baris).
 */
export function formatSuratJalanTokoSummary(
  toko: SuratJalanTokoSummaryInput,
  nomorWhatsapp: string | null | undefined
): string {
  const whatsapp = nomorWhatsapp?.trim();

  return [
    toTitleCase(toko.nama_toko),
    toko.keterangan_toko?.trim() ?? "",
    toko.alamat_toko.trim(),
    whatsapp ? `Telp. ${whatsapp}` : "Telp. -",
  ].join("\n");
}
