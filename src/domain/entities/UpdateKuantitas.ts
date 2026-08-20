/** Mode perubahan kuantitas product pada My Product. */
export type KuantitasEditMode = "tambah" | "kurang";

/** Payload update kuantitas product dari client ke API. */
export interface UpdateProductKuantitasInput {
  mode: KuantitasEditMode;
  jumlah: number;
  tanggal: string;
  catatan: string;
  username: string;
  name: string;
}

/** Tahap penyimpanan update kuantitas yang gagal. */
export type UpdateKuantitasErrorStage = "product" | "histori_masuk" | "histori_keluar";

/** Hasil operasi update kuantitas product. */
export interface UpdateProductKuantitasResult {
  success: boolean;
  newKuantitas?: number;
  error?: string;
  errorStage?: UpdateKuantitasErrorStage;
}
