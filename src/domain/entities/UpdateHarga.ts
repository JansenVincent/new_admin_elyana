/** Payload update harga product existing dari client ke API. */
export interface UpdateProductHargaInput {
  harga_id: string;
  harga: number;
  username: string;
  name: string;
}

/** Satu baris harga baru untuk product existing. */
export interface AddProductHargaPriceRow {
  cust_id: string;
  currency: string;
  harga: number;
}

/** Payload penambahan harga product dari client ke API. */
export interface AddProductHargaInput {
  priceRows: AddProductHargaPriceRow[];
  username: string;
  name: string;
}

/** Tahap penyimpanan update/penambahan harga yang gagal. */
export type UpdateHargaErrorStage = "harga" | "histori_harga";

/** Hasil operasi update harga product. */
export interface UpdateProductHargaResult {
  success: boolean;
  error?: string;
  errorStage?: UpdateHargaErrorStage;
}

/** Hasil operasi penambahan harga product. */
export interface AddProductHargaResult {
  success: boolean;
  error?: string;
  errorStage?: UpdateHargaErrorStage;
}
