/**
 * Entitas customer dari tabel Admin_Ely_Customer.
 */
export interface Customer {
  cust_id: string;
  cust_name: string;
  address: string | null;
  front_code: string;
  back_code: string;
  status_customer: string;
  created_date?: string;
  last_edited?: string | null;
}

/**
 * Data input untuk menambahkan customer baru.
 */
export interface CreateCustomerInput {
  cust_name: string;
  address: string;
  front_code: string;
  back_code: string;
}

/**
 * Data input untuk memperbarui alamat customer.
 */
export interface UpdateCustomerAddressInput {
  cust_id: string;
  address: string;
}

/**
 * Data input untuk soft delete customer berdasarkan nama dan kode.
 */
export interface DeleteCustomerInput {
  cust_name: string;
  front_code: string;
  back_code: string;
}

/**
 * Parameter paginasi dan pencarian customer.
 */
export interface ListCustomersParams {
  page: number;
  limit: number;
  search?: string;
}

/**
 * Hasil operasi pengambilan daftar customer.
 */
export interface ListCustomersResult {
  success: boolean;
  customers?: Customer[];
  total?: number;
  page?: number;
  totalPages?: number;
  error?: string;
}

/**
 * Hasil operasi mutasi customer (create/update/delete).
 */
export interface CustomerMutationResult {
  success: boolean;
  customer?: Customer;
  error?: string;
}
