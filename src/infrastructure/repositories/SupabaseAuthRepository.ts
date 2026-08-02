import type { AuthRepository } from "@/domain/repositories/AuthRepository";
import type {
  AdminUser,
  CreateUserInput,
  CreateUserResult,
  LoginCredentials,
  LoginResult,
} from "@/domain/entities/AdminUser";
import { getSupabaseClient } from "@/infrastructure/supabase/client";
import { DEFAULT_USER_ROLE } from "@/shared/constants/account";
import { ADMIN_LOGIN_TABLE } from "@/shared/constants/auth";

/**
 * Implementasi AuthRepository menggunakan Supabase (adapter layer infrastructure).
 */
export class SupabaseAuthRepository implements AuthRepository {
  /**
   * Memvalidasi username dan password pengguna di tabel Admin_Ely_Login.
   */
  async login(credentials: LoginCredentials): Promise<LoginResult> {
    try {
      const supabase = getSupabaseClient();

      const { data, error } = await supabase
        .from(ADMIN_LOGIN_TABLE)
        .select("*")
        .eq("username", credentials.username.trim())
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
          error: "Username atau password salah",
        };
      }

      const user: AdminUser = {
        id: String(data.id),
        username: data.username,
        name: String(data.name ?? ""),
        role: String(data.role ?? ""),
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

  /**
   * Mendaftarkan user admin baru dengan role default karyawan.
   */
  async createUser(input: CreateUserInput): Promise<CreateUserResult> {
    try {
      const supabase = getSupabaseClient();
      const username = input.username.trim();

      const { data: existingUser, error: checkError } = await supabase
        .from(ADMIN_LOGIN_TABLE)
        .select("id")
        .eq("username", username)
        .maybeSingle();

      if (checkError) {
        return {
          success: false,
          error: checkError.message,
        };
      }

      if (existingUser) {
        return {
          success: false,
          error: "Username sudah digunakan",
        };
      }

      const { data, error } = await supabase
        .from(ADMIN_LOGIN_TABLE)
        .insert({
          name: input.nama.trim(),
          username,
          password: input.password,
          role: DEFAULT_USER_ROLE,
        })
        .select("*")
        .single();

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      const user: AdminUser = {
        id: String(data.id),
        username: data.username,
        name: String(data.name ?? ""),
        role: String(data.role ?? ""),
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
