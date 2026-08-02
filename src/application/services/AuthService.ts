import type {
  CreateUserInput,
  CreateUserResult,
  DeleteUserInput,
  DeleteUserResult,
  ListNonAdminUsersResult,
  LoginCredentials,
  LoginResult,
} from "@/domain/entities/AdminUser";
import { authRepository } from "@/infrastructure/repositories/SupabaseAuthRepository";
import { AUTH_SESSION_KEY } from "@/shared/constants/auth";

/**
 * Service autentikasi (use case layer application).
 */
export class AuthService {
  /**
   * Menjalankan proses login dan menyimpan session jika berhasil.
   */
  async login(credentials: LoginCredentials): Promise<LoginResult> {
    const result = await authRepository.login(credentials);

    if (result.success && result.user && typeof window !== "undefined") {
      sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(result.user));
    }

    return result;
  }

  /**
   * Mendaftarkan user admin baru ke database Supabase.
   */
  async createUser(input: CreateUserInput): Promise<CreateUserResult> {
    return authRepository.createUser(input);
  }

  /**
   * Mengambil daftar user non-admin untuk halaman Delete User.
   */
  async listNonAdminUsers(): Promise<ListNonAdminUsersResult> {
    return authRepository.listNonAdminUsers();
  }

  /**
   * Menghapus user karyawan dari database Supabase.
   */
  async deleteUser(input: DeleteUserInput): Promise<DeleteUserResult> {
    return authRepository.deleteUser(input);
  }

  /**
   * Menghapus session pengguna yang sedang login.
   */
  logout(): void {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(AUTH_SESSION_KEY);
    }
  }
}

/** Singleton instance service autentikasi. */
export const authService = new AuthService();
