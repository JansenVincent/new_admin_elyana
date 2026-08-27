import { NextResponse } from "next/server";
import { authRepository } from "@/infrastructure/repositories/SupabaseAuthRepository";
import type {
  CreateUserInput,
  DeleteUserInput,
} from "@/domain/entities/AdminUser";

/**
 * Endpoint server-side untuk mengambil daftar user non-admin.
 */
export async function GET() {
  try {
    const result = await authRepository.listNonAdminUsers();

    if (!result.success) {
      return NextResponse.json(result, { status: 500 });
    }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan tidak terduga" },
      { status: 500 }
    );
  }
}

/**
 * Endpoint server-side untuk mendaftarkan user admin baru.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateUserInput;

    if (!body.nama?.trim() || !body.username?.trim() || !body.password) {
      return NextResponse.json(
        { success: false, error: "Semua field wajib diisi" },
        { status: 400 }
      );
    }

    const result = await authRepository.createUser(body);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan tidak terduga" },
      { status: 500 }
    );
  }
}

/**
 * Endpoint server-side untuk soft delete user karyawan (status Inactive).
 */
export async function DELETE(request: Request) {
  try {
    const body = (await request.json()) as DeleteUserInput;

    if (!body.name?.trim() || !body.username?.trim()) {
      return NextResponse.json(
        { success: false, error: "Name dan username wajib diisi" },
        { status: 400 }
      );
    }

    const result = await authRepository.deleteUser(body);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan tidak terduga" },
      { status: 500 }
    );
  }
}
