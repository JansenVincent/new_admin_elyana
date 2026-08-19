import { NextResponse } from "next/server";
import { productRepository } from "@/infrastructure/repositories/SupabaseProductRepository";

/**
 * Endpoint server-side untuk mengambil detail product My Product.
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await context.params;

    if (!productId?.trim()) {
      return NextResponse.json(
        { success: false, error: "product_id wajib diisi" },
        { status: 400 }
      );
    }

    const result = await productRepository.getMyProductDetail(productId.trim());

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
