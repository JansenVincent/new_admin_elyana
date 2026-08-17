import { NextResponse } from "next/server";
import { productRepository } from "@/infrastructure/repositories/SupabaseProductRepository";

/**
 * Endpoint server-side untuk mengambil customer aktif pada form Input Harga.
 */
export async function GET() {
  try {
    const result = await productRepository.listActiveCustomers();

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
