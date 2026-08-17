/** Nama tabel product di Supabase. */
export const PRODUCT_TABLE = "Admin_Ely_Product";

/** Nama tabel histori masuk product di Supabase. */
export const HISTORI_MASUK_TABLE = "Admin_Ely_Histori_Masuk_Product";

/** Nama tabel harga product per customer di Supabase. */
export const HARGA_TABLE = "Admin_Ely_Harga";

/** Nama tabel histori harga di Supabase. */
export const HISTORI_HARGA_TABLE = "Admin_Ely_Histori_Harga";

/** Nama bucket storage untuk gambar barcode product. */
export const PRODUCT_BARCODE_BUCKET = "product-barcode-images";

/** @deprecated Gunakan PRODUCT_TABLE. Tabel lama Input Stock sebelum refactor flow. */
export const PRODUCT_STOCK_TABLE = "Admin_Ely_Product_Stock";

/** Opsi jenis barang pada form Input Barang. */
export const PRODUCT_JENIS_OPTIONS = [
  "Aksesoris",
  "Alat Tulis Kantor",
  "Boneka",
  "Kaos Kaki",
  "Lain-lain",
] as const;

/** Opsi mata uang pada form Input Barang. */
export const CURRENCY_OPTIONS = [
  { code: "IDR", label: "IDR - Rupiah Indonesia" },
  { code: "USD", label: "USD - US Dollar" },
  { code: "EUR", label: "EUR - Euro" },
  { code: "SGD", label: "SGD - Singapore Dollar" },
  { code: "MYR", label: "MYR - Malaysian Ringgit" },
  { code: "JPY", label: "JPY - Japanese Yen" },
  { code: "CNY", label: "CNY - Chinese Yuan" },
  { code: "AUD", label: "AUD - Australian Dollar" },
] as const;

/** Ukuran maksimum upload gambar barcode (5MB). */
export const MAX_BARCODE_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

/** Panjang maksimum keterangan barang. */
export const MAX_KETERANGAN_LENGTH = 250;

/** Panjang maksimum satuan barang. */
export const MAX_SATUAN_BARANG_LENGTH = 50;

/** @deprecated Gunakan MAX_KETERANGAN_LENGTH */
export const MAX_DETAIL_BARANG_LENGTH = MAX_KETERANGAN_LENGTH;

/** Ekstensi gambar yang didukung untuk upload barcode. */
export const SUPPORTED_BARCODE_IMAGE_EXTENSIONS =
  "JPG, JPEG, PNG, GIF, WEBP, BMP, SVG";
