/** Jenis barang yang didukung pada form Input Barang. */
export type ProductJenis =
  | "Aksesoris"
  | "Alat Tulis Kantor"
  | "Boneka"
  | "Kaos Kaki"
  | "Lain-lain";

/** Satu baris harga per customer pada step Input Harga. */
export interface PriceRowInput {
  rowKey: string;
  cust_id: string;
  currency: string;
  harga: string;
}

/** Customer aktif untuk dropdown Input Harga. */
export interface ActiveCustomerOption {
  cust_id: string;
  cust_name: string;
}

/** Payload penyimpanan Input Barang dari client ke API. */
export interface SaveInputBarangInput {
  namaBarang: string;
  jenis: ProductJenis;
  jumlahBarang: number;
  satuanBarang: string;
  tanggalMasuk: string;
  keteranganBarang: string;
  priceRows: Array<{
    cust_id: string;
    currency: string;
    harga: number;
  }>;
  barcodeImage: File;
  username: string;
  name: string;
}

/** Hasil operasi penyimpanan Input Barang. */
export interface SaveInputBarangResult {
  success: boolean;
  product_id?: string;
  error?: string;
}

/** Product yang tersimpan di Admin_Ely_Product. */
export interface Product {
  product_id: string;
  nama_barang: string;
  tipe_barang: ProductJenis;
  kuantitas: number;
  satuan_kuantitas: string;
  keterangan: string;
  barcode: string;
}
