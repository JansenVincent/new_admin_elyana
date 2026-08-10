import type {
  CreateUserInput,
  CreateUserResult,
  DeleteUserInput,
  DeleteUserResult,
  ListNonAdminUsersResult,
  LoginCredentials,
  LoginResult,
} from "@/domain/entities/AdminUser";
import { AUTH_SESSION_KEY } from "@/shared/constants/auth";

/**
 * Service autentikasi client-side yang memanggil API route server-side.
 */
export class AuthService {
  /**
   * Menjalankan proses login dan menyimpan session jika berhasil.
   */
  async login(credentials: LoginCredentials): Promise<LoginResult> {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });

    const result = (await response.json()) as LoginResult;

    if (result.success && result.user && typeof window !== "undefined") {
      sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(result.user));
    }

    return result;
  }

  /**
   * Mendaftarkan user admin baru melalui API server-side.
   */
  async createUser(input: CreateUserInput): Promise<CreateUserResult> {
    const response = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    return (await response.json()) as CreateUserResult;
  }

  /**
   * Mengambil daftar user non-admin melalui API server-side.
   */
  async listNonAdminUsers(): Promise<ListNonAdminUsersResult> {
    const response = await fetch("/api/users");
    return (await response.json()) as ListNonAdminUsersResult;
  }

  /**
   * Menghapus user karyawan melalui API server-side.
   */
  async deleteUser(input: DeleteUserInput): Promise<DeleteUserResult> {
    const response = await fetch("/api/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    return (await response.json()) as DeleteUserResult;
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

/** Singleton instance service autentikasi client-side. */
export const authService = new AuthService();
