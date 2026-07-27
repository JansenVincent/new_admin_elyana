import { redirect } from "next/navigation";

/**
 * Halaman root — mengarahkan pengguna ke halaman login.
 */
export default function RootPage() {
  redirect("/login");
}
