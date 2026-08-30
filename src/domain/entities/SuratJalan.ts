/** Opsi customer aktif untuk form Surat Jalan. */
export interface SuratJalanCustomerOption {
  cust_id: string;
  cust_name: string;
  front_code: string;
  back_code: string;
}

/** Opsi toko untuk form Surat Jalan. */
export interface SuratJalanTokoOption {
  toko_id: string;
  nama_toko: string;
}

/** Opsi pemilik untuk form Surat Jalan. */
export interface SuratJalanPemilikOption {
  pemilik_id: string;
  nama_pemilik: string;
}

/** Product tersedia untuk form Surat Jalan step Detail Barang. */
export interface SuratJalanProductOption {
  product_id: string;
  nama_barang: string;
  kuantitas: number;
  satuan_kuantitas: string;
  keterangan: string | null;
}

/** Baris product yang dipilih pada step Detail Barang. */
export interface SuratJalanLineItem {
  rowKey: string;
  product_id: string;
  nama_barang: string;
  kuantitas_beli: number;
  satuan_kuantitas: string;
  keterangan: string | null;
}

/** Hasil pengambilan opsi dropdown Surat Jalan. */
export interface GetSuratJalanOptionsResult {
  success: boolean;
  customers?: SuratJalanCustomerOption[];
  tokos?: SuratJalanTokoOption[];
  pemiliks?: SuratJalanPemilikOption[];
  products?: SuratJalanProductOption[];
  error?: string;
}

/** Input penyimpanan Surat Jalan dari form. */
export interface SaveSuratJalanInput {
  nomorPo: string;
  pengiriman: string;
  tanggalSj: string;
  nomorSj: string;
  custId: string;
  tokoId: string;
  pemilikId: string;
  lineItems: Array<{
    productId: string;
    kuantitasBeli: number;
  }>;
  username: string;
  name: string;
}

/** Hasil penyimpanan Surat Jalan. */
export interface SaveSuratJalanResult {
  success: boolean;
  po_id?: string;
  sj_id?: string;
  error?: string;
}

/** Input validasi harga product per customer pada step 2. */
export interface ValidateSuratJalanHargaInput {
  custId: string;
  lineItems: Array<{
    productId: string;
    namaBarang: string;
  }>;
}

/** Hasil validasi harga product per customer. */
export interface ValidateSuratJalanHargaResult {
  success: boolean;
  isValid?: boolean;
  missingProductNames?: string[];
  error?: string;
}
