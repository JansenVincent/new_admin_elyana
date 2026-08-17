import { NextResponse } from "next/server";
import type { ProductJenis } from "@/domain/entities/InputBarang";
import { productRepository } from "@/infrastructure/repositories/SupabaseProductRepository";
import { VALID_PRODUCT_JENIS } from "@/application/services/ProductService";
import { getTodayWibDateInputValue } from "@/shared/utils/timestamp";

/**
 * Endpoint server-side untuk menyimpan data Input Barang secara serial.
 */
export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const namaBarang = String(formData.get("namaBarang") ?? "").trim();
    const jenis = String(formData.get("jenis") ?? "") as ProductJenis;
    const jumlahBarang = Number(formData.get("jumlahBarang"));
    const satuanBarang = String(formData.get("satuanBarang") ?? "").trim();
    const tanggalMasuk = String(formData.get("tanggalMasuk") ?? "");
    const keteranganBarang = String(formData.get("keteranganBarang") ?? "").trim();
    const username = String(formData.get("username") ?? "").trim();
    const name = String(formData.get("name") ?? "").trim();
    const barcodeImage = formData.get("barcodeImage");
    const priceRowsRaw = formData.get("priceRows");

    if (
      !namaBarang ||
      !VALID_PRODUCT_JENIS.includes(jenis) ||
      !Number.isInteger(jumlahBarang) ||
      jumlahBarang <= 0 ||
      !satuanBarang ||
      satuanBarang.length > 50 ||
      !tanggalMasuk ||
      tanggalMasuk > getTodayWibDateInputValue() ||
      !keteranganBarang ||
      !username ||
      !name ||
      !(barcodeImage instanceof File)
    ) {
      return NextResponse.json(
        { success: false, error: "Data form tidak valid" },
        { status: 400 }
      );
    }

    let priceRows: Array<{ cust_id: string; currency: string; harga: number }> =
      [];

    try {
      priceRows = JSON.parse(String(priceRowsRaw ?? "[]")) as Array<{
        cust_id: string;
        currency: string;
        harga: number;
      }>;
    } catch {
      return NextResponse.json(
        { success: false, error: "Format data harga tidak valid" },
        { status: 400 }
      );
    }

    if (
      !Array.isArray(priceRows) ||
      priceRows.length === 0 ||
      priceRows.some(
        (row) =>
          !row.cust_id ||
          !row.currency ||
          typeof row.harga !== "number" ||
          row.harga <= 0
      )
    ) {
      return NextResponse.json(
        { success: false, error: "Minimal satu baris harga customer wajib diisi" },
        { status: 400 }
      );
    }

    const result = await productRepository.saveInputBarang({
      namaBarang,
      jenis,
      jumlahBarang,
      satuanBarang,
      tanggalMasuk,
      keteranganBarang,
      priceRows,
      barcodeImage,
      username,
      name,
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
