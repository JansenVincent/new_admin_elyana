import { NextResponse } from "next/server";
import type { KuantitasEditMode } from "@/domain/entities/UpdateKuantitas";
import { productRepository } from "@/infrastructure/repositories/SupabaseProductRepository";
import { getTodayWibDateInputValue } from "@/shared/utils/timestamp";
import { MAX_EDIT_KUANTITAS_CATATAN_LENGTH } from "@/shared/constants/product";

/**
 * Endpoint server-side untuk memperbarui kuantitas product dari My Product.
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await context.params;
    const body = (await request.json()) as {
      mode?: KuantitasEditMode;
      jumlah?: number;
      tanggal?: string;
      catatan?: string;
      username?: string;
      name?: string;
    };

    if (!productId?.trim()) {
      return NextResponse.json(
        { success: false, error: "product_id wajib diisi" },
        { status: 400 }
      );
    }

    const mode = body.mode;
    const jumlah = body.jumlah;
    const tanggal = body.tanggal?.trim() ?? "";
    const catatan = body.catatan?.trim() ?? "";
    const username = body.username?.trim() ?? "";
    const name = body.name?.trim() ?? "";

    if (
      (mode !== "tambah" && mode !== "kurang") ||
      typeof jumlah !== "number" ||
      !Number.isInteger(jumlah) ||
      jumlah <= 0 ||
      !tanggal ||
      tanggal > getTodayWibDateInputValue() ||
      catatan.length > MAX_EDIT_KUANTITAS_CATATAN_LENGTH ||
      !username ||
      !name
    ) {
      return NextResponse.json(
        { success: false, error: "Data form tidak valid" },
        { status: 400 }
      );
    }

    const result = await productRepository.updateProductKuantitas({
      productId: productId.trim(),
      mode,
      jumlah,
      tanggal,
      catatan,
      username,
      name,
    });

    if (!result.success) {
      const status = result.error === "Product tidak ditemukan" ? 404 : 500;
      return NextResponse.json(result, { status });
    }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan tidak terduga" },
      { status: 500 }
    );
  }
}
