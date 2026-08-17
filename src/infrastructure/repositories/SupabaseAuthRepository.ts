import type { AuthRepository } from "@/domain/repositories/AuthRepository";
import type {
  AdminUser,
  AdminUserListItem,
  CreateUserInput,
  CreateUserResult,
  DeleteUserInput,
  DeleteUserResult,
  ListNonAdminUsersResult,
  LoginCredentials,
  LoginResult,
} from "@/domain/entities/AdminUser";
import { getSupabaseServerClient } from "@/infrastructure/supabase/serverClient";
import { ADMIN_ROLE, DEFAULT_USER_ROLE } from "@/shared/constants/account";
import { ADMIN_LOGIN_TABLE } from "@/shared/constants/auth";
import { toTitleCase } from "@/shared/utils/stringFormat";
import {
  hashPassword,
  isPasswordHashed,
  verifyPassword,
} from "@/shared/utils/password";
import { getWibTimestampForDb } from "@/shared/utils/timestamp";

/**
 * Memetakan baris database ke entitas AdminUser tanpa password.
 */
function mapRowToAdminUser(row: Record<string, unknown>): AdminUser {
  return {
    user_id: String(row.user_id),
    username: String(row.username ?? ""),
    name: String(row.name ?? ""),
    role: String(row.role ?? ""),
    created_date: row.created_date ? String(row.created_date) : undefined,
    last_login: row.last_login ? String(row.last_login) : undefined,
  };
}

/**
 * Implementasi AuthRepository menggunakan Supabase service role (server-side only).
 */
export class SupabaseAuthRepository implements AuthRepository {
  /**
   * Memvalidasi username dan password pengguna, lalu memperbarui last_login.
   */
  async login(credentials: LoginCredentials): Promise<LoginResult> {
    try {
      const supabase = getSupabaseServerClient();
      const username = credentials.username.trim();

      const { data, error } = await supabase
        .from(ADMIN_LOGIN_TABLE)
        .select("*")
        .eq("username", username)
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

      const storedPassword = String(data.password ?? "");
      const isValidPassword = await verifyPassword(
        credentials.password,
        storedPassword
      );

      if (!isValidPassword) {
        return {
          success: false,
          error: "Username atau password salah",
        };
      }

      const lastLogin = getWibTimestampForDb();
      const updatePayload: Record<string, string> = {
        last_login: lastLogin,
      };

      if (!isPasswordHashed(storedPassword)) {
        updatePayload.password = await hashPassword(credentials.password);
      }

      const { error: updateError } = await supabase
        .from(ADMIN_LOGIN_TABLE)
        .update(updatePayload)
        .eq("user_id", data.user_id);

      if (updateError) {
        return {
          success: false,
          error: updateError.message,
        };
      }

      const user = mapRowToAdminUser({
        ...data,
        last_login: lastLogin,
      });

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
   * Mendaftarkan user admin baru dengan password ter-hash dan created_date UTC.
   */
  async createUser(input: CreateUserInput): Promise<CreateUserResult> {
    try {
      const supabase = getSupabaseServerClient();
      const username = input.username.trim();
      const createdDate = getWibTimestampForDb();
      const hashedPassword = await hashPassword(input.password);

      const { data: existingUser, error: checkError } = await supabase
        .from(ADMIN_LOGIN_TABLE)
        .select("user_id")
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
          name: toTitleCase(input.nama),
          username,
          password: hashedPassword,
          role: DEFAULT_USER_ROLE,
          created_date: createdDate,
          last_login: null,
        })
        .select("*")
        .single();

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        user: mapRowToAdminUser(data),
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
   * Mengambil daftar user dengan role selain admin dari tabel Admin_Ely_Login.
   */
  async listNonAdminUsers(): Promise<ListNonAdminUsersResult> {
    try {
      const supabase = getSupabaseServerClient();

      const { data, error } = await supabase
        .from(ADMIN_LOGIN_TABLE)
        .select("user_id, name, username")
        .neq("role", ADMIN_ROLE)
        .order("name", { ascending: true });

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      const users: AdminUserListItem[] = (data ?? []).map((row) => ({
        user_id: String(row.user_id),
        name: String(row.name ?? ""),
        username: String(row.username ?? ""),
      }));

      return {
        success: true,
        users,
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
   * Menghapus user karyawan berdasarkan name dan username.
   */
  async deleteUser(input: DeleteUserInput): Promise<DeleteUserResult> {
    try {
      const supabase = getSupabaseServerClient();

      const { data, error } = await supabase
        .from(ADMIN_LOGIN_TABLE)
        .delete()
        .eq("name", input.name.trim())
        .eq("username", input.username.trim())
        .eq("role", DEFAULT_USER_ROLE)
        .select("user_id")
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
          error: "User tidak ditemukan atau tidak dapat dihapus",
        };
      }

      return {
        success: true,
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

/** Singleton instance repository autentikasi (server-side). */
export const authRepository = new SupabaseAuthRepository();
