/**
 * Entitas pengguna admin dari tabel Admin_Ely_Login.
 */
export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  password?: string;
  created_at?: string;
}

/**
 * Kredensial yang dikirim saat proses login.
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Hasil operasi login.
 */
export interface LoginResult {
  success: boolean;
  user?: AdminUser;
  error?: string;
}
