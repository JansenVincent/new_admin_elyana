import { redirect } from "next/navigation";

/**
 * Redirect /account ke sub-menu Add User karena Account tidak memiliki halaman sendiri.
 */
export default function AccountPage() {
  redirect("/account/add-user");
}
