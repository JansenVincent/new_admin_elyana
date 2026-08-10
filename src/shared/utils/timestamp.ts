/** Timezone Waktu Indonesia Barat untuk kolom timestamp di database. */
export const WIB_TIMEZONE = "Asia/Jakarta";

/**
 * Menghasilkan timestamp WIB dengan format `YYYY-MM-DD HH:MM:SS` tanpa fractional seconds.
 */
export function getWibTimestampForDb(): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: WIB_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(new Date());
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "00";

  return `${get("year")}-${get("month")}-${get("day")} ${get("hour")}:${get("minute")}:${get("second")}`;
}
