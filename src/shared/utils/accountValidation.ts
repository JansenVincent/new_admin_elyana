import {
  MAX_ACCOUNT_FIELD_LENGTH,
  MIN_PASSWORD_LENGTH,
  MIN_USERNAME_LENGTH,
} from "@/shared/constants/account";

/**
 * Memeriksa apakah string tidak kosong setelah di-trim.
 */
export function isNonEmptyString(value: string): boolean {
  return value.trim().length > 0;
}

/**
 * Membatasi input agar tidak melebihi panjang maksimum.
 */
export function clampFieldLength(value: string): string {
  return value.slice(0, MAX_ACCOUNT_FIELD_LENGTH);
}

/**
 * Memeriksa apakah username memenuhi aturan minimal 6 karakter dengan huruf dan angka.
 */
export function isUsernameFormatValid(username: string): boolean {
  const trimmed = username.trim();
  if (trimmed.length < MIN_USERNAME_LENGTH) {
    return false;
  }

  const hasLetter = /[a-zA-Z]/.test(trimmed);
  const hasNumber = /\d/.test(trimmed);

  return hasLetter && hasNumber;
}

/**
 * Aturan validasi password untuk form Add User.
 */
export interface PasswordRuleStatus {
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
}

/**
 * Mengevaluasi setiap aturan regex password.
 */
export function getPasswordRuleStatus(password: string): PasswordRuleStatus {
  return {
    minLength: password.length >= MIN_PASSWORD_LENGTH,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
  };
}

/**
 * Memeriksa apakah password memenuhi semua aturan keamanan.
 */
export function isPasswordFormatValid(password: string): boolean {
  const rules = getPasswordRuleStatus(password);
  return (
    rules.minLength &&
    rules.hasUppercase &&
    rules.hasLowercase &&
    rules.hasNumber &&
    password.length <= MAX_ACCOUNT_FIELD_LENGTH
  );
}

/**
 * Memvalidasi seluruh field form Add User.
 */
export function validateAddUserForm(input: {
  nama: string;
  username: string;
  password: string;
  ulangiPassword: string;
}): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!isNonEmptyString(input.nama)) {
    errors.nama = "Nama wajib diisi.";
  } else if (input.nama.trim().length > MAX_ACCOUNT_FIELD_LENGTH) {
    errors.nama = `Nama maksimal ${MAX_ACCOUNT_FIELD_LENGTH} karakter.`;
  }

  if (!isNonEmptyString(input.username)) {
    errors.username = "Username wajib diisi.";
  } else if (!isUsernameFormatValid(input.username)) {
    errors.username =
      "Username minimal 6 karakter dan harus mengandung huruf serta angka.";
  }

  if (!isNonEmptyString(input.password)) {
    errors.password = "Password wajib diisi.";
  } else if (!isPasswordFormatValid(input.password)) {
    errors.password = "Password belum memenuhi semua aturan keamanan.";
  }

  if (!isNonEmptyString(input.ulangiPassword)) {
    errors.ulangiPassword = "Ulangi password wajib diisi.";
  } else if (input.password !== input.ulangiPassword) {
    errors.ulangiPassword = "Password dan ulangi password harus sama.";
  }

  return errors;
}

/**
 * Mengecek apakah form Add User valid tanpa error.
 */
export function isAddUserFormValid(input: {
  nama: string;
  username: string;
  password: string;
  ulangiPassword: string;
}): boolean {
  return Object.keys(validateAddUserForm(input)).length === 0;
}

/**
 * Memvalidasi field login (username dan password tidak kosong).
 */
export function isLoginFormValid(username: string, password: string): boolean {
  return isNonEmptyString(username) && isNonEmptyString(password);
}
