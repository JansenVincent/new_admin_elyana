import { NextResponse } from "next/server";
import { suratJalanRepository } from "@/infrastructure/repositories/SupabaseSuratJalanRepository";
import type { SaveSuratJalanInput } from "@/domain/entities/SuratJalan";
import {
  MAX_NOMOR_PO_LENGTH,
  MAX_NOMOR_SJ_LENGTH,
  MAX_PENGIRIMAN_LENGTH,
} from "@/shared/constants/suratJalan";
import { getTodayWibDateInputValue } from "@/shared/utils/timestamp";

/**
 * Endpoint server-side untuk menyimpan data Surat Jalan.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SaveSuratJalanInput;

    const nomorPo = body.nomorPo?.trim() ?? "";
    const pengiriman = body.pengiriman?.trim() ?? "";
    const tanggalSj = body.tanggalSj?.trim() ?? "";
    const nomorSj = body.nomorSj?.trim() ?? "";
    const custId = body.custId?.trim() ?? "";
    const tokoId = body.tokoId?.trim() ?? "";
    const pemilikId = body.pemilikId?.trim() ?? "";
    const username = body.username?.trim() ?? "";
    const name = body.name?.trim() ?? "";
    const lineItems = body.lineItems ?? [];

    if (
      !nomorPo ||
      nomorPo.length > MAX_NOMOR_PO_LENGTH ||
      !pengiriman ||
      pengiriman.length > MAX_PENGIRIMAN_LENGTH ||
      !tanggalSj ||
      tanggalSj > getTodayWibDateInputValue() ||
      !nomorSj ||
      nomorSj.length > MAX_NOMOR_SJ_LENGTH ||
      !custId ||
      !tokoId ||
      !pemilikId ||
      !username ||
      !name ||
      !Array.isArray(lineItems) ||
      lineItems.length === 0 ||
      lineItems.some(
        (item) =>
          !item.productId ||
          !Number.isInteger(item.kuantitasBeli) ||
          item.kuantitasBeli <= 0
      )
    ) {
      return NextResponse.json(
        { success: false, error: "Data form tidak valid" },
        { status: 400 }
      );
    }

    const result = await suratJalanRepository.saveSuratJalan({
      nomorPo,
      pengiriman,
      tanggalSj,
      nomorSj,
      custId,
      tokoId,
      pemilikId,
      lineItems: lineItems.map((item) => ({
        productId: item.productId,
        kuantitasBeli: item.kuantitasBeli,
      })),
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
