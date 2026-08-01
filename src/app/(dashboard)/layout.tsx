import DashboardLayout from "@/presentation/components/layout/DashboardLayout";

/**
 * Layout bersama untuk halaman dashboard setelah login.
 */
export default function DashboardRouteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
