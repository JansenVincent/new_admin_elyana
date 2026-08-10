import { NextResponse } from "next/server";
import { authRepository } from "@/infrastructure/repositories/SupabaseAuthRepository";
import type { LoginCredentials } from "@/domain/entities/AdminUser";

/**
 * Endpoint server-side untuk proses login admin dengan verifikasi password ter-hash.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as LoginCredentials;

    if (!body.username?.trim() || !body.password) {
      return NextResponse.json(
        { success: false, error: "Username dan password wajib diisi" },
        { status: 400 }
      );
    }

    const result = await authRepository.login({
      username: body.username,
      password: body.password,
    });

    if (!result.success) {
      return NextResponse.json(result, { status: 401 });
    }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan tidak terduga" },
      { status: 500 }
    );
  }
}
