import type { ProductJenis } from "@/domain/entities/ProductStock";
import {
  MAX_BARCODE_IMAGE_SIZE_BYTES,
  MAX_DETAIL_BARANG_LENGTH,
  PRODUCT_JENIS_OPTIONS,
} from "@/shared/constants/product";

/**
 * Memeriksa apakah string tidak kosong setelah di-trim.
 */
export function isNonEmptyString(value: string): boolean {
  return value.trim().length > 0;
}

/**
 * Memvalidasi field step 1 form Input Stock.
 */
export function validateStep1(input: {
  namaBarang: string;
  harga: string;
  currency: string;
  jenis: string;
}): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!isNonEmptyString(input.namaBarang)) {
    errors.namaBarang = "Nama barang wajib diisi.";
  }

  const hargaValue = input.harga.trim();
  if (!hargaValue) {
    errors.harga = "Harga wajib diisi.";
  } else if (!/^\d+(\.\d{1,2})?$/.test(hargaValue)) {
    errors.harga = "Harga harus berupa angka valid (maks. 2 desimal).";
  } else if (Number(hargaValue) <= 0) {
    errors.harga = "Harga harus lebih dari 0.";
  }

  if (!input.currency) {
    errors.currency = "Mata uang wajib dipilih.";
  }

  if (
    !input.jenis ||
    !PRODUCT_JENIS_OPTIONS.includes(input.jenis as ProductJenis)
  ) {
    errors.jenis = "Jenis barang wajib dipilih.";
  }

  return errors;
}

/**
 * Memvalidasi field step 2 form Input Stock.
 */
export function validateStep2(detailBarang: string): Record<string, string> {
  const errors: Record<string, string> = {};
  const trimmed = detailBarang.trim();

  if (!trimmed) {
    errors.detailBarang = "Detail barang wajib diisi.";
  } else if (trimmed.length > MAX_DETAIL_BARANG_LENGTH) {
    errors.detailBarang = `Detail barang maksimal ${MAX_DETAIL_BARANG_LENGTH} karakter.`;
  }

  return errors;
}

/**
 * Memvalidasi file gambar barcode pada step 3 form Input Stock.
 */
export function validateBarcodeImage(file: File | null): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!file) {
    errors.barcodeImage = "Gambar barcode wajib diunggah.";
    return errors;
  }

  if (!file.type.startsWith("image/")) {
    errors.barcodeImage = "File harus berupa gambar.";
  }

  if (file.size > MAX_BARCODE_IMAGE_SIZE_BYTES) {
    errors.barcodeImage = "Ukuran file maksimal 5MB.";
  }

  return errors;
}

/**
 * Mengecek apakah tidak ada error validasi.
 */
export function hasNoErrors(errors: Record<string, string>): boolean {
  return Object.keys(errors).length === 0;
}
