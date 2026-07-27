import type { AuthRepository } from "@/domain/repositories/AuthRepository";
import type {
  AdminUser,
  LoginCredentials,
  LoginResult,
} from "@/domain/entities/AdminUser";
import { getSupabaseClient } from "@/infrastructure/supabase/client";
import { ADMIN_LOGIN_TABLE } from "@/shared/constants/auth";

/**
 * Implementasi AuthRepository menggunakan Supabase (adapter layer infrastructure).
 */
export class SupabaseAuthRepository implements AuthRepository {
  /**
   * Memvalidasi email dan password pengguna di tabel Admin_Ely_Login.
   */
  async login(credentials: LoginCredentials): Promise<LoginResult> {
    try {
      const supabase = getSupabaseClient();

      const { data, error } = await supabase
        .from(ADMIN_LOGIN_TABLE)
        .select("*")
        .eq("email", credentials.email)
        .eq("password", credentials.password)
        .maybeSingle();

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      if (!data) {
        return {
          success: false,
          error: "Email atau password salah",
        };
      }

      const user: AdminUser = {
        id: String(data.id),
        email: data.email,
        created_at: data.created_at,
      };

      return {
        success: true,
        user,
      };
    } catch (err) {
      const message =
        err instanceof Error && err.name === "AbortError"
          ? "Request timeout (60 detik)"
          : err instanceof Error
            ? err.message
            : "Terjadi kesalahan tidak terduga";

      return {
        success: false,
        error: message,
      };
    }
  }
}

/** Singleton instance repository autentikasi. */
export const authRepository = new SupabaseAuthRepository();
