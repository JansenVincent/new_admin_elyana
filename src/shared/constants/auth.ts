/** Timeout request/response ke Supabase dalam milidetik (60 detik). */
export const SUPABASE_TIMEOUT_MS = 60_000;

/** Nama tabel login admin di Supabase. */
export const ADMIN_LOGIN_TABLE = "Admin_Ely_Login";

/** Status user aktif (dapat login). */
export const USER_STATUS_ACTIVE = "Active";

/** Status user nonaktif (soft delete dari Delete User). */
export const USER_STATUS_INACTIVE = "Inactive";

/** Kunci session storage untuk data pengguna yang sudah login. */
export const AUTH_SESSION_KEY = "admin_ely_user";
