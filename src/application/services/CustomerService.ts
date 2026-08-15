import type {
  CreateCustomerInput,
  CustomerMutationResult,
  DeleteCustomerInput,
  ListCustomersParams,
  ListCustomersResult,
  UpdateCustomerAddressInput,
} from "@/domain/entities/Customer";

/**
 * Service customer client-side yang memanggil API route server-side.
 */
export class CustomerService {
  /**
   * Mengambil daftar customer dengan paginasi dan pencarian.
   */
  async listCustomers(params: ListCustomersParams): Promise<ListCustomersResult> {
    const searchParams = new URLSearchParams({
      page: String(params.page),
      limit: String(params.limit),
    });

    if (params.search?.trim()) {
      searchParams.set("search", params.search.trim());
    }

    const response = await fetch(`/api/customers?${searchParams.toString()}`);
    return (await response.json()) as ListCustomersResult;
  }

  /**
   * Menambahkan customer baru melalui API server-side.
   */
  async createCustomer(input: CreateCustomerInput): Promise<CustomerMutationResult> {
    const response = await fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    return (await response.json()) as CustomerMutationResult;
  }

  /**
   * Memperbarui alamat customer melalui API server-side.
   */
  async updateCustomerAddress(
    input: UpdateCustomerAddressInput
  ): Promise<CustomerMutationResult> {
    const response = await fetch("/api/customers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    return (await response.json()) as CustomerMutationResult;
  }

  /**
   * Menghapus customer melalui API server-side.
   */
  async deleteCustomer(input: DeleteCustomerInput): Promise<CustomerMutationResult> {
    const response = await fetch("/api/customers", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    return (await response.json()) as CustomerMutationResult;
  }
}

/** Singleton instance service customer client-side. */
export const customerService = new CustomerService();
