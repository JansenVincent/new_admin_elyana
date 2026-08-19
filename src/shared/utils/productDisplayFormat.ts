/**
 * Memformat tanggal ISO (YYYY-MM-DD) untuk tampilan histori barang.
 */
export function formatHistoriBarangDate(dateValue: string): string {
  const [year, month, day] = dateValue.split("-").map(Number);

  if (!year || !month || !day) {
    return dateValue;
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}

/**
 * Memformat kuantitas product dengan satuan lowercase (contoh: 100 pcs).
 */
export function formatKuantitasDisplay(
  kuantitas: number,
  satuan: string
): string {
  return `${kuantitas} ${satuan.trim().toLowerCase()}`;
}

/**
 * Memformat kuantitas histori dengan prefix + atau - dan satuan lowercase.
 */
export function formatHistoriKuantitasDisplay(
  prefix: "+" | "-",
  quantity: number,
  satuan: string
): string {
  return `${prefix}${quantity} ${satuan.trim().toLowerCase()}`;
}
