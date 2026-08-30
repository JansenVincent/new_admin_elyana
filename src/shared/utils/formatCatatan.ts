import { WIB_TIMEZONE } from "@/shared/utils/timestamp";

/**
 * Memformat tanggal waktu WIB untuk template catatan histori.
 */
export function formatWibDateTimeForCatatan(date: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat("id-ID", {
    timeZone: WIB_TIMEZONE,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return `${get("day")} ${get("month")} ${get("year")}, ${get("hour")}:${get("minute")} WIB`;
}

/**
 * Memformat nominal harga dengan pemisah ribuan untuk template catatan.
 */
export function formatHargaDisplay(mataUang: string, nominal: number): string {
  const formattedNumber = new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(nominal);

  return `${mataUang} ${formattedNumber}`;
}

/**
 * Membuat catatan histori masuk product.
 */
export function buildHistoriMasukCatatan(
  username: string,
  name: string,
  date: Date = new Date()
): string {
  const timestamp = formatWibDateTimeForCatatan(date);
  return `Data diinput pada tanggal ${timestamp} melalui menu Product > Input Barang oleh ${username}-${name}.`;
}

/**
 * Membuat catatan histori harga product.
 */
export function buildHistoriHargaCatatan(
  username: string,
  name: string,
  mataUang: string,
  nominal: number,
  date: Date = new Date()
): string {
  const timestamp = formatWibDateTimeForCatatan(date);
  const hargaDisplay = formatHargaDisplay(mataUang, nominal);
  return `Data diinput pada tanggal ${timestamp} melalui menu Product > Input Barang oleh ${username}-${name} dengan harga ${hargaDisplay}.`;
}

/**
 * Membuat catatan histori harga product dari menu My Product (penambahan).
 */
export function buildHistoriAddHargaMyProductCatatan(
  username: string,
  name: string,
  mataUang: string,
  nominal: number,
  date: Date = new Date()
): string {
  const timestamp = formatWibDateTimeForCatatan(date);
  const hargaDisplay = formatHargaDisplay(mataUang, nominal);
  return `Data diinput pada tanggal ${timestamp} melalui menu Product > My Product oleh ${username}-${name} dengan harga ${hargaDisplay}.`;
}

/**
 * Membuat catatan histori perubahan harga product dari menu My Product.
 */
export function buildHistoriEditHargaMyProductCatatan(
  username: string,
  name: string,
  mataUang: string,
  nominal: number,
  date: Date = new Date()
): string {
  const timestamp = formatWibDateTimeForCatatan(date);
  const hargaDisplay = formatHargaDisplay(mataUang, nominal);
  return `Data diubah pada tanggal ${timestamp} melalui menu Product > My Product oleh ${username}-${name} menjadi harga ${hargaDisplay}.`;
}

/**
 * Membuat catatan histori keluar product dari menu Surat Jalan.
 */
export function buildHistoriKeluarSuratJalanCatatan(
  username: string,
  name: string,
  nomorSuratJalan: string,
  date: Date = new Date()
): string {
  const timestamp = formatWibDateTimeForCatatan(date);
  return `Data diupdate pada tanggal ${timestamp} melalui Surat Jalan oleh ${username}-${name}, dengan nomor surat jalan '${nomorSuratJalan.trim()}'.`;
}

/**
 * Membuat catatan histori perubahan kuantitas dari My Product.
 */
export function buildHistoriEditKuantitasCatatan(
  username: string,
  name: string,
  userCatatan: string,
  date: Date = new Date()
): string {
  const timestamp = formatWibDateTimeForCatatan(date);
  const base = `Data diubah pada tanggal ${timestamp} melalui menu Product > My Product oleh ${username}-${name}`;

  const trimmed = userCatatan.trim();
  if (!trimmed) {
    return `${base}, dengan tidak ada catatan`;
  }

  return `${base}, dengan catatan ${trimmed.toLowerCase()}.`;
}
