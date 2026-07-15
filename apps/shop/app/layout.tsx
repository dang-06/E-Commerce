import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ưu đãi khách hàng thân thiết",
  description: "Kiểm tra ưu đãi bằng số điện thoại và đặt hàng nhanh trên di động.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0f766e",
  colorScheme: "light",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>): React.ReactElement {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
