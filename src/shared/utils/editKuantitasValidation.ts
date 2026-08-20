import type { KuantitasEditMode } from "@/domain/entities/UpdateKuantitas";
import { MAX_EDIT_KUANTITAS_CATATAN_LENGTH } from "@/shared/constants/product";
import { getTodayWibDateInputValue } from "@/shared/utils/timestamp";

/**
 * Memvalidasi step 1 form edit kuantitas (mode dan jumlah).
 */
export function validateEditKuantitasStep1(input: {
  mode: KuantitasEditMode | "";
  jumlah: string;
  currentKuantitas: number;
}): Record<string, string> {
  const errors: Record<string, string> = {};

  if (input.mode !== "tambah" && input.mode !== "kurang") {
    errors.mode = "Pilih jenis perubahan kuantitas.";
  }

  const jumlah = input.jumlah.trim();
  if (!jumlah) {
    errors.jumlah = "Jumlah kuantitas wajib diisi.";
  } else if (!/^\d+$/.test(jumlah)) {
    errors.jumlah = "Jumlah kuantitas harus berupa angka bulat.";
  } else if (Number(jumlah) <= 0) {
    errors.jumlah = "Jumlah kuantitas harus lebih dari 0.";
  } else if (
    input.mode === "kurang" &&
    Number(jumlah) > input.currentKuantitas
  ) {
    errors.jumlah = `Jumlah pengurangan tidak boleh melebihi kuantitas saat ini (${input.currentKuantitas}).`;
  }

  return errors;
}

/**
 * Memvalidasi step 2 form edit kuantitas (tanggal).
 */
export function validateEditKuantitasStep2(tanggal: string): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!tanggal) {
    errors.tanggal = "Tanggal wajib diisi.";
  } else if (tanggal > getTodayWibDateInputValue()) {
    errors.tanggal = "Tanggal tidak boleh melebihi hari ini.";
  }

  return errors;
}

/**
 * Memvalidasi step 3 form edit kuantitas (catatan opsional).
 */
export function validateEditKuantitasStep3(catatan: string): Record<string, string> {
  const errors: Record<string, string> = {};

  if (catatan.trim().length > MAX_EDIT_KUANTITAS_CATATAN_LENGTH) {
    errors.catatan = `Catatan maksimal ${MAX_EDIT_KUANTITAS_CATATAN_LENGTH} karakter.`;
  }

  return errors;
}

/**
 * Mengecek apakah tidak ada error validasi.
 */
export function hasNoEditKuantitasErrors(
  errors: Record<string, string>
): boolean {
  return Object.keys(errors).length === 0;
}
