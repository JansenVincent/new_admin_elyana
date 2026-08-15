/**
 * Mengubah string menjadi PascalCase (setiap kata diawali huruf kapital, tanpa spasi).
 */
export function toPascalCase(value: string): string {
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join("");
}

/**
 * Mengubah string menjadi Title Case (setiap kata diawali huruf kapital, dipisah spasi).
 */
export function toTitleCase(value: string): string {
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Mengubah string menjadi huruf kecil seluruhnya.
 */
export function toLowerCaseText(value: string): string {
  return value.trim().toLowerCase();
}
