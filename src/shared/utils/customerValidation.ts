import {
  MAX_ADDRESS_LENGTH,
  MAX_CODE_LENGTH,
  MAX_CUST_NAME_LENGTH,
  MIN_CUSTOMER_FIELD_LENGTH,
} from "@/shared/constants/customer";

/**
 * Membatasi panjang input field customer.
 */
export function clampCustomerField(
  value: string,
  maxLength: number
): string {
  return value.slice(0, maxLength);
}

/**
 * Memvalidasi form tambah customer baru.
 */
export function validateCreateCustomerForm(input: {
  custName: string;
  address: string;
  frontCode: string;
  backCode: string;
}): Record<string, string> {
  const errors: Record<string, string> = {};
  const custName = input.custName.trim();
  const address = input.address.trim();
  const frontCode = input.frontCode.trim();
  const backCode = input.backCode.trim();

  if (custName.length < MIN_CUSTOMER_FIELD_LENGTH) {
    errors.custName = "Nama customer wajib diisi (min. 1 karakter).";
  } else if (custName.length > MAX_CUST_NAME_LENGTH) {
    errors.custName = `Nama customer maksimal ${MAX_CUST_NAME_LENGTH} karakter.`;
  }

  if (address.length < MIN_CUSTOMER_FIELD_LENGTH) {
    errors.address = "Alamat wajib diisi (min. 1 karakter).";
  } else if (address.length > MAX_ADDRESS_LENGTH) {
    errors.address = `Alamat maksimal ${MAX_ADDRESS_LENGTH} karakter.`;
  }

  if (frontCode.length < MIN_CUSTOMER_FIELD_LENGTH) {
    errors.frontCode = "Kode depan wajib diisi (min. 1 karakter).";
  } else if (frontCode.length > MAX_CODE_LENGTH) {
    errors.frontCode = `Kode depan maksimal ${MAX_CODE_LENGTH} karakter.`;
  }

  if (backCode.length < MIN_CUSTOMER_FIELD_LENGTH) {
    errors.backCode = "Kode belakang wajib diisi (min. 1 karakter).";
  } else if (backCode.length > MAX_CODE_LENGTH) {
    errors.backCode = `Kode belakang maksimal ${MAX_CODE_LENGTH} karakter.`;
  }

  return errors;
}

/**
 * Mengembalikan pesan error untuk satu field form tambah customer.
 */
export function getCreateCustomerFieldError(
  field: "custName" | "address" | "frontCode" | "backCode",
  input: {
    custName: string;
    address: string;
    frontCode: string;
    backCode: string;
  }
): string | undefined {
  return validateCreateCustomerForm(input)[field];
}

/**
 * Mengecek apakah form tambah customer valid.
 */
export function isCreateCustomerFormValid(input: {
  custName: string;
  address: string;
  frontCode: string;
  backCode: string;
}): boolean {
  return Object.keys(validateCreateCustomerForm(input)).length === 0;
}

/**
 * Memvalidasi alamat customer pada form sunting.
 */
export function validateEditAddress(address: string): Record<string, string> {
  const errors: Record<string, string> = {};
  const trimmed = address.trim();

  if (trimmed.length < MIN_CUSTOMER_FIELD_LENGTH) {
    errors.address = "Alamat wajib diisi (min. 1 karakter).";
  } else if (trimmed.length > MAX_ADDRESS_LENGTH) {
    errors.address = `Alamat maksimal ${MAX_ADDRESS_LENGTH} karakter.`;
  }

  return errors;
}

/**
 * Memformat kode customer dari front_code dan back_code menjadi uppercase.
 */
export function formatCustomerCode(frontCode: string, backCode: string): string {
  return `${frontCode}-${backCode}`.toUpperCase();
}
