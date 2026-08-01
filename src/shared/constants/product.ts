/** Nama tabel product stock di Supabase. */
export const PRODUCT_STOCK_TABLE = "Admin_Ely_Product_Stock";

/** Nama bucket storage untuk gambar barcode product. */
export const PRODUCT_BARCODE_BUCKET = "product-barcode-images";

/** Opsi jenis barang pada form Input Stock. */
export const PRODUCT_JENIS_OPTIONS = [
  "Aksesoris",
  "Alat Tulis Kantor",
  "Pakaian",
  "Lain-lain",
] as const;

/** Opsi mata uang pada form Input Stock. */
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

/** Panjang maksimum detail barang. */
export const MAX_DETAIL_BARANG_LENGTH = 500;

/** Ekstensi gambar yang didukung untuk upload barcode. */
export const SUPPORTED_BARCODE_IMAGE_EXTENSIONS =
  "JPG, JPEG, PNG, GIF, WEBP, BMP, SVG";
