/** Nama tabel product di Supabase. */
export const PRODUCT_TABLE = "Admin_Ely_Product";

/** Nama tabel histori masuk product di Supabase. */
export const HISTORI_MASUK_TABLE = "Admin_Ely_Histori_Masuk_Product";

/** Nama tabel histori keluar product di Supabase. */
export const HISTORI_KELUAR_TABLE = "Admin_Ely_Histori_Keluar_Product";

/** Nama tabel harga product per customer di Supabase. */
export const HARGA_TABLE = "Admin_Ely_Harga";

/** Nama tabel histori harga di Supabase. */
export const HISTORI_HARGA_TABLE = "Admin_Ely_Histori_Harga";

/** Nama bucket storage untuk gambar barcode product. */
export const PRODUCT_BARCODE_BUCKET = "product-barcode-images";

/** Jumlah baris product per halaman pada My Product. */
export const MY_PRODUCT_PAGE_SIZE = 10;

/** Panjang maksimum catatan edit kuantitas My Product. */
export const MAX_EDIT_KUANTITAS_CATATAN_LENGTH = 200;

/** Pesan error saat gagal update kuantitas di Admin_Ely_Product. */
export const UPDATE_KUANTITAS_ERROR_PRODUCT =
  "Gagal menyimpan data 'Product'. Silakan coba beberapa saat lagi";

/** Pesan error saat gagal insert histori masuk saat edit kuantitas. */
export const UPDATE_KUANTITAS_ERROR_HISTORI_MASUK =
  "Gagal menyimpan data 'Histori Product'. Silakan coba beberapa saat lagi";

/** Pesan error saat gagal insert histori keluar saat edit kuantitas. */
export const UPDATE_KUANTITAS_ERROR_HISTORI_KELUAR =
  "Gagal menyimpan data 'Histori Keluar Product'. Silakan coba beberapa saat lagi";

/** Memetakan tahap error update kuantitas ke pesan popup. */
export const UPDATE_KUANTITAS_ERROR_MESSAGES = {
  product: UPDATE_KUANTITAS_ERROR_PRODUCT,
  histori_masuk: UPDATE_KUANTITAS_ERROR_HISTORI_MASUK,
  histori_keluar: UPDATE_KUANTITAS_ERROR_HISTORI_KELUAR,
} as const;

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

/** Ekstensi gambar yang didukung untuk upload barcode. */
export const SUPPORTED_BARCODE_IMAGE_EXTENSIONS =
  "JPG, JPEG, PNG, GIF, WEBP, BMP, SVG";

/** Tahap penyimpanan update kuantitas yang gagal. */
export type UpdateKuantitasErrorStage = "product" | "histori_masuk" | "histori_keluar";

/** Tahap penyimpanan update/penambahan harga My Product yang gagal. */
export type UpdateHargaErrorStage = "harga" | "histori_harga";

/** Pesan error saat gagal update/insert ke Admin_Ely_Harga dari My Product. */
export const UPDATE_HARGA_ERROR_HARGA =
  "Gagal menyimpan data 'Harga'. Silakan coba beberapa saat lagi";

/** Pesan error saat gagal insert ke Admin_Ely_Histori_Harga dari My Product. */
export const UPDATE_HARGA_ERROR_HISTORI_HARGA =
  "Gagal menyimpan data 'Histori Harga'. Silakan coba beberapa saat lagi";

/** Memetakan tahap error update/penambahan harga ke pesan popup. */
export const UPDATE_HARGA_ERROR_MESSAGES: Record<
  UpdateHargaErrorStage,
  string
> = {
  harga: UPDATE_HARGA_ERROR_HARGA,
  histori_harga: UPDATE_HARGA_ERROR_HISTORI_HARGA,
};

/** Pesan error saat gagal menghapus product dari My Product. */
export const DELETE_PRODUCT_ERROR_MESSAGE =
  "Gagal menghapus data. Silakan coba beberapa saat lagi";

/** Tahap penyimpanan Input Barang yang gagal di database. */
export type InputBarangSaveErrorStage =
  | "product"
  | "histori_masuk"
  | "harga"
  | "histori_harga";

/** Pesan error popup saat gagal insert ke Admin_Ely_Product. */
export const INPUT_BARANG_ERROR_PRODUCT =
  "Gagal menyimpan data 'Product'. Silakan coba beberapa saat lagi";

/** Pesan error popup saat gagal insert ke Admin_Ely_Histori_Masuk_Product. */
export const INPUT_BARANG_ERROR_HISTORI_MASUK =
  "Gagal menyimpan data 'Histori Product'. Silakan coba beberapa saat lagi";

/** Pesan error popup saat gagal insert ke Admin_Ely_Harga. */
export const INPUT_BARANG_ERROR_HARGA =
  "Gagal menyimpan data 'Harga'. Silakan coba beberapa saat lagi";

/** Pesan error popup saat gagal insert ke Admin_Ely_Histori_Harga. */
export const INPUT_BARANG_ERROR_HISTORI_HARGA =
  "Gagal menyimpan data 'Histori Harga'. Silakan coba beberapa saat lagi";

/** Pesan error saat bucket storage barcode belum tersedia. */
export const INPUT_BARANG_ERROR_BARCODE_BUCKET =
  "Bucket storage 'product-barcode-images' belum dibuat. Buat bucket tersebut di Supabase Dashboard (Storage) lalu coba lagi.";

/** Pesan error saat upload gambar barcode gagal (selain bucket tidak ditemukan). */
export const INPUT_BARANG_ERROR_BARCODE_UPLOAD =
  "Gagal mengunggah gambar barcode. Silakan coba beberapa saat lagi.";

/** Memetakan tahap error penyimpanan ke pesan popup. */
export const INPUT_BARANG_ERROR_MESSAGES: Record<
  InputBarangSaveErrorStage,
  string
> = {
  product: INPUT_BARANG_ERROR_PRODUCT,
  histori_masuk: INPUT_BARANG_ERROR_HISTORI_MASUK,
  harga: INPUT_BARANG_ERROR_HARGA,
  histori_harga: INPUT_BARANG_ERROR_HISTORI_HARGA,
};
