import { NextResponse } from "next/server";
import { suratJalanRepository } from "@/infrastructure/repositories/SupabaseSuratJalanRepository";
import type { ValidateSuratJalanHargaInput } from "@/domain/entities/SuratJalan";

/**
 * Endpoint server-side untuk validasi harga product per customer pada Surat Jalan.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ValidateSuratJalanHargaInput;
    const custId = body.custId?.trim() ?? "";
    const lineItems = body.lineItems ?? [];

    if (
      !custId ||
      !Array.isArray(lineItems) ||
      lineItems.length === 0 ||
      lineItems.some((item) => !item.productId || !item.namaBarang?.trim())
    ) {
      return NextResponse.json(
        { success: false, error: "Data validasi tidak valid" },
        { status: 400 }
      );
    }

    const result = await suratJalanRepository.validateLineItemHarga({
      custId,
      lineItems: lineItems.map((item) => ({
        productId: item.productId,
        namaBarang: item.namaBarang.trim(),
      })),
    });

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
