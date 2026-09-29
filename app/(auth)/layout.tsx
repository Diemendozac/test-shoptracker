import '../(marketing)/marketing.css'
import type { Viewport } from 'next'

// Registro e ingreso en oscuro, igual que la landing (fase 3.2): la clase .dark de globals.css en
// el contenedor, sin tocar <html> ni el tema claro del dashboard (D-7). .marketing-dark trae el
// fondo del body para el rebote de iOS y el movimiento de app/(marketing)/marketing.css.
// Ya no hace falta el <Suspense> que envolvía la página: el login no usa useSearchParams.

export const viewport: Viewport = { themeColor: '#080A15' }

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="dark marketing-dark relative min-h-screen overflow-x-clip bg-background font-sans text-foreground">
      {children}
    </div>
  )
}
