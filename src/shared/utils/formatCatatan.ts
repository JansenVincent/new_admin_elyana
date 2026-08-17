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
