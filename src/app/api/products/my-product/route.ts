import { NextResponse } from "next/server";
import { productRepository } from "@/infrastructure/repositories/SupabaseProductRepository";
import { MY_PRODUCT_PAGE_SIZE } from "@/shared/constants/product";

/**
 * Endpoint server-side untuk mengambil daftar product My Product dengan paginasi.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page") ?? "1");
    const limit = Number(
      searchParams.get("limit") ?? String(MY_PRODUCT_PAGE_SIZE)
    );
    const search = searchParams.get("search") ?? undefined;

    const result = await productRepository.listMyProducts({
      page,
      limit,
      search,
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
