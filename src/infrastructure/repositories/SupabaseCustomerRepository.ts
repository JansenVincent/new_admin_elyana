import type { CustomerRepository } from "@/domain/repositories/CustomerRepository";
import type {
  CreateCustomerInput,
  Customer,
  CustomerMutationResult,
  DeleteCustomerInput,
  ListCustomersParams,
  ListCustomersResult,
  UpdateCustomerAddressInput,
} from "@/domain/entities/Customer";
import { getSupabaseServerClient } from "@/infrastructure/supabase/serverClient";
import {
  CUSTOMER_STATUS_ACTIVE,
  CUSTOMER_STATUS_INACTIVE,
  CUSTOMER_TABLE,
} from "@/shared/constants/customer";
import { getWibTimestampForDb } from "@/shared/utils/timestamp";

/**
 * Memetakan baris database ke entitas Customer.
 */
function mapRowToCustomer(row: Record<string, unknown>): Customer {
  return {
    cust_id: String(row.cust_id),
    cust_name: String(row.cust_name ?? ""),
    address: row.address ? String(row.address) : null,
    front_code: String(row.front_code ?? ""),
    back_code: String(row.back_code ?? ""),
    status_customer: String(row.status_customer ?? CUSTOMER_STATUS_ACTIVE),
    created_date: row.created_date ? String(row.created_date) : undefined,
    last_edited: row.last_edited ? String(row.last_edited) : null,
  };
}

/**
 * Implementasi CustomerRepository menggunakan Supabase service role (server-side only).
 */
export class SupabaseCustomerRepository implements CustomerRepository {
  /**
   * Mengambil daftar customer aktif dengan paginasi, sort A-Z, dan pencarian substring.
   */
  async list(params: ListCustomersParams): Promise<ListCustomersResult> {
    try {
      const supabase = getSupabaseServerClient();
      const page = Math.max(1, params.page);
      const limit = Math.max(1, params.limit);
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      let query = supabase
        .from(CUSTOMER_TABLE)
        .select("*", { count: "exact" })
        .eq("status_customer", CUSTOMER_STATUS_ACTIVE)
        .order("cust_name", { ascending: true });

      if (params.search?.trim()) {
        query = query.ilike("cust_name", `%${params.search.trim()}%`);
      }

      const { data, error, count } = await query.range(from, to);

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      const total = count ?? 0;
      const totalPages = Math.max(1, Math.ceil(total / limit));

      return {
        success: true,
        customers: (data ?? []).map((row) => mapRowToCustomer(row)),
        total,
        page,
        totalPages,
      };
    } catch (err) {
      const message =
        err instanceof Error && err.name === "AbortError"
          ? "Request timeout (60 detik)"
          : err instanceof Error
            ? err.message
            : "Terjadi kesalahan tidak terduga";

      return {
        success: false,
        error: message,
      };
    }
  }

  /**
   * Menambahkan customer baru ke database.
   */
  async create(input: CreateCustomerInput): Promise<CustomerMutationResult> {
    try {
      const supabase = getSupabaseServerClient();
      const createdDate = getWibTimestampForDb();

      const { data, error } = await supabase
        .from(CUSTOMER_TABLE)
        .insert({
          cust_name: input.cust_name.trim(),
          address: input.address.trim(),
          front_code: input.front_code.trim(),
          back_code: input.back_code.trim(),
          status_customer: CUSTOMER_STATUS_ACTIVE,
          created_date: createdDate,
          last_edited: null,
        })
        .select("*")
        .single();

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        customer: mapRowToCustomer(data),
      };
    } catch (err) {
      const message =
        err instanceof Error && err.name === "AbortError"
          ? "Request timeout (60 detik)"
          : err instanceof Error
            ? err.message
            : "Terjadi kesalahan tidak terduga";

      return {
        success: false,
        error: message,
      };
    }
  }

  /**
   * Memperbarui alamat customer berdasarkan cust_id.
   */
  async updateAddress(
    input: UpdateCustomerAddressInput
  ): Promise<CustomerMutationResult> {
    try {
      const supabase = getSupabaseServerClient();
      const lastEdited = getWibTimestampForDb();

      const { data, error } = await supabase
        .from(CUSTOMER_TABLE)
        .update({
          address: input.address.trim(),
          last_edited: lastEdited,
        })
        .eq("cust_id", input.cust_id)
        .eq("status_customer", CUSTOMER_STATUS_ACTIVE)
        .select("*")
        .maybeSingle();

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      if (!data) {
        return {
          success: false,
          error: "Customer tidak ditemukan",
        };
      }

      return {
        success: true,
        customer: mapRowToCustomer(data),
      };
    } catch (err) {
      const message =
        err instanceof Error && err.name === "AbortError"
          ? "Request timeout (60 detik)"
          : err instanceof Error
            ? err.message
            : "Terjadi kesalahan tidak terduga";

      return {
        success: false,
        error: message,
      };
    }
  }

  /**
   * Soft delete customer dengan mengubah status_customer menjadi Inactive.
   */
  async delete(input: DeleteCustomerInput): Promise<CustomerMutationResult> {
    try {
      const supabase = getSupabaseServerClient();
      const lastEdited = getWibTimestampForDb();

      const { data, error } = await supabase
        .from(CUSTOMER_TABLE)
        .update({
          status_customer: CUSTOMER_STATUS_INACTIVE,
          last_edited: lastEdited,
        })
        .eq("cust_name", input.cust_name.trim())
        .eq("front_code", input.front_code.trim())
        .eq("back_code", input.back_code.trim())
        .eq("status_customer", CUSTOMER_STATUS_ACTIVE)
        .select("cust_id")
        .maybeSingle();

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      if (!data) {
        return {
          success: false,
          error: "Customer tidak ditemukan",
        };
      }

      return {
        success: true,
      };
    } catch (err) {
      const message =
        err instanceof Error && err.name === "AbortError"
          ? "Request timeout (60 detik)"
          : err instanceof Error
            ? err.message
            : "Terjadi kesalahan tidak terduga";

      return {
        success: false,
        error: message,
      };
    }
  }
}

/** Singleton instance repository customer (server-side). */
export const customerRepository = new SupabaseCustomerRepository();
