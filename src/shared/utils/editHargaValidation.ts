/**
 * Memvalidasi nominal harga pada form edit harga My Product.
 */
export function validateEditHargaNominal(harga: string): string | undefined {
  const hargaValue = harga.trim();

  if (!hargaValue) {
    return "Harga wajib diisi.";
  }

  if (!/^\d+(\.\d{1,2})?$/.test(hargaValue)) {
    return "Harga harus berupa angka valid (maks. 2 desimal).";
  }

  if (Number(hargaValue) <= 0) {
    return "Harga harus lebih dari 0.";
  }

  return undefined;
}

/**
 * Memeriksa apakah nominal harga berbeda dari nilai yang tersimpan di database.
 */
export function hasHargaValueChanged(
  inputHarga: string,
  storedHarga: number
): boolean {
  const parsed = Number(inputHarga.trim());
  if (Number.isNaN(parsed)) {
    return false;
  }

  return Math.abs(parsed - storedHarga) > 0.001;
}
