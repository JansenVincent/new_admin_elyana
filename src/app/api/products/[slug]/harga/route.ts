import { NextResponse } from "next/server";
import { productRepository } from "@/infrastructure/repositories/SupabaseProductRepository";

/**
 * Endpoint server-side untuk menambahkan harga product per customer berdasarkan slug_id.
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const body = (await request.json()) as {
      priceRows?: Array<{
        cust_id?: string;
        currency?: string;
        harga?: number;
      }>;
      username?: string;
      name?: string;
    };

    if (!slug?.trim()) {
      return NextResponse.json(
        { success: false, error: "slug wajib diisi" },
        { status: 400 }
      );
    }

    const priceRows = body.priceRows ?? [];
    const username = body.username?.trim() ?? "";
    const name = body.name?.trim() ?? "";

    if (
      priceRows.length === 0 ||
      !username ||
      !name ||
      priceRows.some(
        (row) =>
          !row.cust_id?.trim() ||
          !row.currency?.trim() ||
          typeof row.harga !== "number" ||
          row.harga <= 0
      )
    ) {
      return NextResponse.json(
        { success: false, error: "Data form tidak valid" },
        { status: 400 }
      );
    }

    const result = await productRepository.addProductHargaBySlug(slug.trim(), {
      priceRows: priceRows.map((row) => ({
        cust_id: row.cust_id!.trim(),
        currency: row.currency!.trim(),
        harga: row.harga!,
      })),
      username,
      name,
    });

    if (!result.success) {
      const status =
        result.error === "Product tidak ditemukan" ||
        result.error === "Customer sudah memiliki harga untuk product ini"
          ? 400
          : 500;
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
 * Endpoint server-side untuk memperbarui harga product existing berdasarkan slug_id.
 */
export async function PATCH(
  request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const body = (await request.json()) as {
      harga_id?: string;
      harga?: number;
      username?: string;
      name?: string;
    };

    if (!slug?.trim()) {
      return NextResponse.json(
        { success: false, error: "slug wajib diisi" },
        { status: 400 }
      );
    }

    const hargaId = body.harga_id?.trim() ?? "";
    const harga = body.harga;
    const username = body.username?.trim() ?? "";
    const name = body.name?.trim() ?? "";

    if (
      !hargaId ||
      typeof harga !== "number" ||
      harga <= 0 ||
      !username ||
      !name
    ) {
      return NextResponse.json(
        { success: false, error: "Data form tidak valid" },
        { status: 400 }
      );
    }

    const result = await productRepository.updateProductHargaBySlug(
      slug.trim(),
      {
        harga_id: hargaId,
        harga,
        username,
        name,
      }
    );

    if (!result.success) {
      const status =
        result.error === "Product tidak ditemukan" ||
        result.error === "Data harga tidak ditemukan" ||
        result.error === "Nominal harga tidak berubah"
          ? 400
          : 500;
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
