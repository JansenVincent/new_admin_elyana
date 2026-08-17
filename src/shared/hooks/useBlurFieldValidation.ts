import { useCallback, useState } from "react";

/**
 * Hook untuk validasi field form saat blur (onBlur) dengan pesan error per field.
 */
export function useBlurFieldValidation() {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [blurredFields, setBlurredFields] = useState<Set<string>>(new Set());

  /**
   * Menandai field sudah di-blur dan memperbarui error validasinya.
   */
  const handleFieldBlur = useCallback((field: string, error?: string) => {
    setBlurredFields((prev) => new Set(prev).add(field));
    setFieldErrors((prev) => {
      const next = { ...prev };
      if (error) {
        next[field] = error;
      } else {
        delete next[field];
      }
      return next;
    });
  }, []);

  /**
   * Mengembalikan pesan error field jika field sudah pernah di-blur.
   */
  const getFieldError = useCallback(
    (field: string): string | undefined => {
      if (!blurredFields.has(field)) {
        return undefined;
      }
      return fieldErrors[field];
    },
    [blurredFields, fieldErrors]
  );

  /**
   * Menerapkan seluruh error validasi dan menandai semua field sebagai touched (saat submit).
   */
  const applySubmitErrors = useCallback((errors: Record<string, string>) => {
    setFieldErrors(errors);
    setBlurredFields(new Set(Object.keys(errors)));
  }, []);

  /**
   * Mereset state validasi blur ke kondisi awal.
   */
  const resetValidation = useCallback(() => {
    setFieldErrors({});
    setBlurredFields(new Set());
  }, []);

  return {
    fieldErrors,
    blurredFields,
    handleFieldBlur,
    getFieldError,
    applySubmitErrors,
    resetValidation,
    setFieldErrors,
  };
}

/**
 * Mengembalikan daftar customer yang tersedia untuk dropdown pada baris harga tertentu.
 */
export function getAvailableCustomersForRow(
  rowKey: string,
  priceRows: Array<{ rowKey: string; cust_id: string }>,
  activeCustomers: Array<{ cust_id: string; cust_name: string }>
): Array<{ cust_id: string; cust_name: string }> {
  const selectedInOtherRows = new Set(
    priceRows
      .filter((row) => row.rowKey !== rowKey && row.cust_id)
      .map((row) => row.cust_id)
  );

  const available = activeCustomers.filter(
    (customer) => !selectedInOtherRows.has(customer.cust_id)
  );

  const currentRow = priceRows.find((row) => row.rowKey === rowKey);
  if (
    currentRow?.cust_id &&
    !available.some((customer) => customer.cust_id === currentRow.cust_id)
  ) {
    const selectedCustomer = activeCustomers.find(
      (customer) => customer.cust_id === currentRow.cust_id
    );
    if (selectedCustomer) {
      return [selectedCustomer, ...available];
    }
  }

  return available;
}

/**
 * Mengecek apakah semua customer aktif sudah dipasangkan harga pada form Input Harga.
 */
export function areAllCustomersPaired(
  priceRows: Array<{ cust_id: string }>,
  activeCustomerCount: number
): boolean {
  if (activeCustomerCount === 0) {
    return false;
  }

  const selectedIds = priceRows
    .map((row) => row.cust_id)
    .filter(Boolean);

  return new Set(selectedIds).size === activeCustomerCount;
}
