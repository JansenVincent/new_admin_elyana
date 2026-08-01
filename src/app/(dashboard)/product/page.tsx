import { redirect } from "next/navigation";

/**
 * Redirect /product ke sub-menu Input Stock karena Product tidak memiliki halaman sendiri.
 */
export default function ProductPage() {
  redirect("/product/input-stock");
}
