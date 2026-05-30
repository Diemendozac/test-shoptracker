import type { Metadata, Viewport } from 'next'
import { Inter, Geist_Mono, Outfit } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { StoreProvider } from '@/store/providers/StoreProvider';

const inter = Inter({
  subsets: ["latin"],
  variable: '--font-inter',
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: '--font-geist-mono',
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: '--font-outfit',
  weight: ['400', '600', '700'],
});

export const metadata: Metadata = {
  title: 'Dropspy - Competitive Intelligence for Dropshippers',
  description: 'Detecta productos ganadores antes que la competencia. Rastrea tiendas Shopify, detecta tendencias y mide el rendimiento en tiempo real.',
  generator: 'v0.app',
}

export const viewport: Viewport = {
  themeColor: '#f5f7ff',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${geistMono.variable} ${outfit.variable} font-sans antialiased`}>
        <StoreProvider>
          {children}
        </StoreProvider>
        <Analytics />
      </body>
    </html>
  )
}
