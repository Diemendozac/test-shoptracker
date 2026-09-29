import type { Metadata, Viewport } from 'next'
import { Inter, Geist_Mono, Outfit } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, getTranslations } from 'next-intl/server'
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

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Landing.meta')
  return {
    title: 'Dropspy - Inteligencia Competitiva para Dropshippers',
    // Sin "en tiempo real": el ranking se revisa una vez por día (B1 del diagnóstico de landing)
    description: 'Dropspy revisa todos los días el ranking de más vendidos de tiendas Shopify y te muestra qué productos nuevos están subiendo: en qué tienda, cuánto subieron, su puntaje y su fase.',
    // La tarjeta para compartir es la de la landing en todas las rutas. La imagen sale de
    // app/opengraph-image.tsx y Next la agrega acá porque este nivel no define images.
    openGraph: {
      title: t('title'),
      description: t('description'),
      siteName: 'Dropspy',
      type: 'website',
      locale: 'es_419',
    },
  }
}

export const viewport: Viewport = {
  themeColor: '#F5F5FA',
  width: 'device-width',
  initialScale: 1,
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const messages = await getMessages()

  return (
    <html lang="es">
      <body className={`${inter.variable} ${geistMono.variable} ${outfit.variable} font-sans antialiased overflow-x-hidden`}>
        <NextIntlClientProvider messages={messages}>
          <StoreProvider>
            {children}
          </StoreProvider>
        </NextIntlClientProvider>
        <Analytics />
      </body>
    </html>
  )
}
