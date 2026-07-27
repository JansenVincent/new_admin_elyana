import type { LoginCredentials, LoginResult } from "@/domain/entities/AdminUser";

/**
 * Kontrak repository autentikasi (port layer domain).
 */
export interface AuthRepository {
  /**
   * Memvalidasi kredensial pengguna terhadap tabel Admin_Ely_Login.
   */
  login(credentials: LoginCredentials): Promise<LoginResult>;
}
