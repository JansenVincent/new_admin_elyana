import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Admin Ely",
  description: "Panel Admin Ely",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
