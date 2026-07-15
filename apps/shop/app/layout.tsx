import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import './globals.css'

export const metadata: Metadata = {
  title: 'VietShop - Thời trang chất lượng cao',
  description: 'Cửa hàng thời trang trực tuyến uy tín, cung cấp các sản phẩm chất lượng với giá tốt nhất',
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#F44747',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="vi" className="bg-background">
      <body className="antialiased flex flex-col min-h-screen text-foreground">
        <Header />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
