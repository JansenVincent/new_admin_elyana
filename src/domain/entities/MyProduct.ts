/** Item product pada daftar My Product. */
export interface MyProductListItem {
  product_id: string;
  slug_id: string;
  nama_barang: string;
}

/** Parameter paginasi dan pencarian daftar My Product. */
export interface ListMyProductsParams {
  page: number;
  limit: number;
  search?: string;
}

/** Hasil pengambilan daftar product My Product. */
export interface ListMyProductsResult {
  success: boolean;
  products?: MyProductListItem[];
  total?: number;
  page?: number;
  totalPages?: number;
  error?: string;
}

/** Log histori harga per customer. */
export interface MyProductPriceHistoriLog {
  catatan: string;
}

/** Harga product per customer beserta log histori. */
export interface MyProductPriceByCustomer {
  harga_id: string;
  cust_id: string;
  cust_name: string;
  mata_uang: string;
  harga: number;
  historiLogs: MyProductPriceHistoriLog[];
}

/** Satu entri catatan histori barang masuk/keluar. */
export interface MyProductHistoriBarangEntry {
  tanggal: string;
  quantityPrefix: "+" | "-";
  quantity: number;
  satuan_kuantitas: string;
  catatan: string;
  type: "masuk" | "keluar";
}

/** Detail lengkap product untuk halaman My Product. */
export interface MyProductDetail {
  product_id: string;
  slug_id: string;
  nama_barang: string;
  kuantitas: number;
  satuan_kuantitas: string;
  pricesByCustomer: MyProductPriceByCustomer[];
  historiBarang: MyProductHistoriBarangEntry[];
}

/** Hasil pengambilan detail product My Product. */
export interface GetMyProductDetailResult {
  success: boolean;
  product?: MyProductDetail;
  error?: string;
}
