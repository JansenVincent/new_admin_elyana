/**
 * Entitas pengguna admin dari tabel Admin_Ely_Login.
 */
export interface AdminUser {
  id: string;
  username: string;
  name: string;
  role: string;
  password?: string;
  created_date?: string;
  last_login?: string;
}

/**
 * Kredensial yang dikirim saat proses login.
 */
export interface LoginCredentials {
  username: string;
  password: string;
}

/**
 * Data input untuk mendaftarkan user admin baru.
 */
export interface CreateUserInput {
  nama: string;
  username: string;
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

/**
 * Hasil operasi pendaftaran user baru.
 */
export interface CreateUserResult {
  success: boolean;
  user?: AdminUser;
  error?: string;
}

/**
 * Item user untuk ditampilkan pada tabel Delete User.
 */
export interface AdminUserListItem {
  id: string;
  name: string;
  username: string;
}

/**
 * Hasil operasi pengambilan daftar user non-admin.
 */
export interface ListNonAdminUsersResult {
  success: boolean;
  users?: AdminUserListItem[];
  error?: string;
}

/**
 * Data input untuk menghapus user karyawan.
 */
export interface DeleteUserInput {
  name: string;
  username: string;
}

/**
 * Hasil operasi penghapusan user.
 */
export interface DeleteUserResult {
  success: boolean;
  error?: string;
}
