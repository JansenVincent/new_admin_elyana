/**
 * Mengubah nama barang menjadi slug URL yang aman.
 */
export function slugifyProductName(namaBarang: string): string {
  const slug = namaBarang
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  if (!slug) {
    return "product";
  }

  return slug.slice(0, 80);
}

/**
 * Menghasilkan short id alfanumerik lowercase untuk suffix slug product.
 */
export function generateProductShortId(length = 5): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = crypto.getRandomValues(new Uint8Array(length));

  return Array.from(bytes, (byte) => chars[byte % chars.length]).join("");
}

/**
 * Menghasilkan slug_id product dari kombinasi slug nama barang dan short id.
 */
export function generateProductSlugId(namaBarang: string): string {
  return `${slugifyProductName(namaBarang)}-${generateProductShortId()}`;
}
