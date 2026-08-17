import type { ProductJenis } from "@/domain/entities/InputBarang";
import type { PriceRowInput } from "@/domain/entities/InputBarang";
import {
  MAX_KETERANGAN_LENGTH,
  MAX_SATUAN_BARANG_LENGTH,
  PRODUCT_JENIS_OPTIONS,
} from "@/shared/constants/product";
import { getTodayWibDateInputValue } from "@/shared/utils/timestamp";

/**
 * Memeriksa apakah string tidak kosong setelah di-trim.
 */
export function isNonEmptyString(value: string): boolean {
  return value.trim().length > 0;
}

/**
 * Memvalidasi field step 1 form Input Barang.
 */
export function validateStep1(input: {
  namaBarang: string;
  jenis: string;
  jumlahBarang: string;
  satuanBarang: string;
  tanggalMasuk: string;
}): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!isNonEmptyString(input.namaBarang)) {
    errors.namaBarang = "Nama barang wajib diisi.";
  }

  if (
    !input.jenis ||
    !PRODUCT_JENIS_OPTIONS.includes(input.jenis as ProductJenis)
  ) {
    errors.jenis = "Jenis barang wajib dipilih.";
  }

  const jumlah = input.jumlahBarang.trim();
  if (!jumlah) {
    errors.jumlahBarang = "Jumlah barang wajib diisi.";
  } else if (!/^\d+$/.test(jumlah)) {
    errors.jumlahBarang = "Jumlah barang harus berupa angka bulat.";
  } else if (Number(jumlah) <= 0) {
    errors.jumlahBarang = "Jumlah barang harus lebih dari 0.";
  }

  const satuan = input.satuanBarang.trim();
  if (!satuan) {
    errors.satuanBarang = "Satuan barang wajib diisi.";
  } else if (satuan.length > MAX_SATUAN_BARANG_LENGTH) {
    errors.satuanBarang = `Satuan barang maksimal ${MAX_SATUAN_BARANG_LENGTH} karakter.`;
  }

  if (!input.tanggalMasuk) {
    errors.tanggalMasuk = "Tanggal masuk barang wajib diisi.";
  } else if (input.tanggalMasuk > getTodayWibDateInputValue()) {
    errors.tanggalMasuk =
      "Tanggal masuk barang tidak boleh melebihi hari ini.";
  }

  return errors;
}

/**
 * Memvalidasi field step 2 form Input Barang (keterangan).
 */
export function validateStep2(keteranganBarang: string): Record<string, string> {
  const errors: Record<string, string> = {};
  const trimmed = keteranganBarang.trim();

  if (!trimmed) {
    errors.keteranganBarang = "Keterangan barang wajib diisi.";
  } else if (trimmed.length > MAX_KETERANGAN_LENGTH) {
    errors.keteranganBarang = `Keterangan barang maksimal ${MAX_KETERANGAN_LENGTH} karakter.`;
  }

  return errors;
}

/**
 * Memvalidasi satu baris harga customer pada step 3.
 */
export function validatePriceRow(row: PriceRowInput): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!row.cust_id) {
    errors.cust_id = "Customer wajib dipilih.";
  }

  if (!row.currency) {
    errors.currency = "Mata uang wajib dipilih.";
  }

  const hargaValue = row.harga.trim();
  if (!hargaValue) {
    errors.harga = "Harga wajib diisi.";
  } else if (!/^\d+(\.\d{1,2})?$/.test(hargaValue)) {
    errors.harga = "Harga harus berupa angka valid (maks. 2 desimal).";
  } else if (Number(hargaValue) <= 0) {
    errors.harga = "Harga harus lebih dari 0.";
  }

  return errors;
}

/**
 * Memvalidasi seluruh baris harga pada step 3.
 */
export function validateStep3(priceRows: PriceRowInput[]): {
  isValid: boolean;
  rowErrors: Record<string, Record<string, string>>;
} {
  const rowErrors: Record<string, Record<string, string>> = {};

  if (priceRows.length === 0) {
    return { isValid: false, rowErrors };
  }

  let isValid = true;

  priceRows.forEach((row) => {
    const errors = validatePriceRow(row);
    if (Object.keys(errors).length > 0) {
      isValid = false;
      rowErrors[row.rowKey] = errors;
    }
  });

  return { isValid, rowErrors };
}

/**
 * Memvalidasi file gambar barcode pada step 4.
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

  if (file.size > 5 * 1024 * 1024) {
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
