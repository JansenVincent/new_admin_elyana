import { NextResponse } from "next/server";
import { productRepository } from "@/infrastructure/repositories/SupabaseProductRepository";

/**
 * Endpoint server-side untuk mengambil detail product berdasarkan slug_id.
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;

    if (!slug?.trim()) {
      return NextResponse.json(
        { success: false, error: "slug wajib diisi" },
        { status: 400 }
      );
    }

    const result = await productRepository.getMyProductDetailBySlug(slug.trim());

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

/**
 * Endpoint server-side untuk soft delete product (status Not Available).
 */
export async function DELETE(
  _request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;

    if (!slug?.trim()) {
      return NextResponse.json(
        { success: false, error: "slug wajib diisi" },
        { status: 400 }
      );
    }

    const result = await productRepository.deleteProductBySlug(slug.trim());

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
