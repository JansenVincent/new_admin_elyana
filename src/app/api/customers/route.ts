import { NextResponse } from "next/server";
import { customerRepository } from "@/infrastructure/repositories/SupabaseCustomerRepository";
import type {
  CreateCustomerInput,
  DeleteCustomerInput,
  UpdateCustomerAddressInput,
} from "@/domain/entities/Customer";
import { CUSTOMER_PAGE_SIZE } from "@/shared/constants/customer";

/**
 * Endpoint server-side untuk mengambil daftar customer dengan paginasi dan pencarian.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page") ?? "1");
    const limit = Number(searchParams.get("limit") ?? String(CUSTOMER_PAGE_SIZE));
    const search = searchParams.get("search") ?? undefined;

    const result = await customerRepository.list({ page, limit, search });

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

/**
 * Endpoint server-side untuk menambahkan customer baru.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateCustomerInput;

    if (
      !body.cust_name?.trim() ||
      !body.address?.trim() ||
      !body.front_code?.trim() ||
      !body.back_code?.trim()
    ) {
      return NextResponse.json(
        { success: false, error: "Semua field wajib diisi" },
        { status: 400 }
      );
    }

    const result = await customerRepository.create(body);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
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
 * Endpoint server-side untuk memperbarui alamat customer.
 */
export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as UpdateCustomerAddressInput;

    if (!body.id || !body.address?.trim()) {
      return NextResponse.json(
        { success: false, error: "ID dan alamat wajib diisi" },
        { status: 400 }
      );
    }

    const result = await customerRepository.updateAddress(body);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
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
 * Endpoint server-side untuk menghapus customer.
 */
export async function DELETE(request: Request) {
  try {
    const body = (await request.json()) as DeleteCustomerInput;

    if (
      !body.cust_name?.trim() ||
      !body.front_code?.trim() ||
      !body.back_code?.trim()
    ) {
      return NextResponse.json(
        { success: false, error: "Nama dan kode customer wajib diisi" },
        { status: 400 }
      );
    }

    const result = await customerRepository.delete(body);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan tidak terduga" },
      { status: 500 }
    );
  }
}
