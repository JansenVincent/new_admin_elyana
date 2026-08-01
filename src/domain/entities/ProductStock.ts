import type { PRODUCT_JENIS_OPTIONS } from "@/shared/constants/product";

/** Jenis barang yang valid pada form Input Stock. */
export type ProductJenis = (typeof PRODUCT_JENIS_OPTIONS)[number];

/**
 * Entitas product stock dari tabel Admin_Ely_Product_Stock.
 */
export interface ProductStock {
  id: string;
  nama_barang: string;
  harga: number;
  currency: string;
  jenis: ProductJenis;
  detail_barang: string;
  barcode_image_url: string;
  created_at?: string;
  created_by?: string;
}

/**
 * Data input untuk menyimpan product stock baru.
 */
export interface CreateProductStockInput {
  namaBarang: string;
  harga: number;
  currency: string;
  jenis: ProductJenis;
  detailBarang: string;
  barcodeImage: File;
  createdBy?: string;
}

/**
 * Hasil operasi penyimpanan product stock.
 */
export interface SaveProductStockResult {
  success: boolean;
  product?: ProductStock;
  error?: string;
}
