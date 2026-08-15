import type {
  CreateCustomerInput,
  CustomerMutationResult,
  DeleteCustomerInput,
  ListCustomersParams,
  ListCustomersResult,
  UpdateCustomerAddressInput,
} from "@/domain/entities/Customer";

/**
 * Kontrak repository customer (port layer domain).
 */
export interface CustomerRepository {
  /**
   * Mengambil daftar customer dengan paginasi dan pencarian opsional.
   */
  list(params: ListCustomersParams): Promise<ListCustomersResult>;

  /**
   * Menambahkan customer baru ke database.
   */
  create(input: CreateCustomerInput): Promise<CustomerMutationResult>;

  /**
   * Memperbarui alamat customer berdasarkan id.
   */
  updateAddress(input: UpdateCustomerAddressInput): Promise<CustomerMutationResult>;

  /**
   * Menghapus customer berdasarkan nama dan kode.
   */
  delete(input: DeleteCustomerInput): Promise<CustomerMutationResult>;
}
