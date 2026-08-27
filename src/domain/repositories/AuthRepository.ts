import type {
  CreateUserInput,
  CreateUserResult,
  DeleteUserInput,
  DeleteUserResult,
  ListNonAdminUsersResult,
  LoginCredentials,
  LoginResult,
} from "@/domain/entities/AdminUser";

/**
 * Kontrak repository autentikasi (port layer domain).
 */
export interface AuthRepository {
  /**
   * Memvalidasi kredensial pengguna terhadap tabel Admin_Ely_Login.
   */
  login(credentials: LoginCredentials): Promise<LoginResult>;

  /**
   * Mendaftarkan user admin baru ke tabel Admin_Ely_Login.
   */
  createUser(input: CreateUserInput): Promise<CreateUserResult>;

  /**
   * Mengambil daftar user dengan role selain admin.
   */
  listNonAdminUsers(): Promise<ListNonAdminUsersResult>;

  /**
   * Menandai user karyawan sebagai Inactive berdasarkan name dan username.
   */
  deleteUser(input: DeleteUserInput): Promise<DeleteUserResult>;
}
