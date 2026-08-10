import bcrypt from "bcryptjs";

/** Jumlah salt rounds bcrypt untuk hashing password. */
const SALT_ROUNDS = 12;

/**
 * Memeriksa apakah password sudah di-hash dengan bcrypt.
 */
export function isPasswordHashed(storedPassword: string): boolean {
  return storedPassword.startsWith("$2a$") || storedPassword.startsWith("$2b$");
}

/**
 * Meng-hash password plain text menggunakan bcrypt.
 */
export async function hashPassword(plainPassword: string): Promise<string> {
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
}

/**
 * Memverifikasi password input terhadap hash bcrypt.
 */
export async function verifyHashedPassword(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword);
}

/**
 * Memverifikasi password dan mendukung migrasi dari plain text legacy ke bcrypt.
 */
export async function verifyPassword(
  plainPassword: string,
  storedPassword: string
): Promise<boolean> {
  if (isPasswordHashed(storedPassword)) {
    return verifyHashedPassword(plainPassword, storedPassword);
  }

  return plainPassword === storedPassword;
}
