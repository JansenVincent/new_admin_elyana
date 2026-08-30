import { NextResponse } from "next/server";
import { suratJalanRepository } from "@/infrastructure/repositories/SupabaseSuratJalanRepository";

/**
 * Endpoint server-side untuk opsi dropdown form Surat Jalan.
 */
export async function GET() {
  try {
    const result = await suratJalanRepository.getFormOptions();

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
