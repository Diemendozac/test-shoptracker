import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Lock } from 'lucide-react'
import { DropspyIcon } from '@/components/ui/dropspy-logo'
import { buttonVariants } from '@/components/ui/button'
import { ShareAdVideo } from '@/components/share/share-ad-video'
import { cn, formatCurrency } from '@/lib/utils'
import { activeAds, countryName, getShareProduct, shareSignupHref, shareVerdict } from '@/lib/share'

// Página pública para compartir un producto — CHANGE-133 (Fase 2a del rediseño).
// Antes era un componente de cliente que pedía los datos después de cargar: WhatsApp e Instagram
// no veían el producto (el link salía sin imagen ni título propios) y la página mostraba a
// cualquiera el nombre de la tienda, el link al producto y todos los videos, que en la app
// dependen del plan. Ahora se arma en el servidor, trae su imagen de vista previa
// (opengraph-image.tsx) y es un adelanto: un anuncio visible, el resto detrás de la prueba.

type Params = Promise<{ candidateId: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { candidateId } = await params
  const product = await getShareProduct(candidateId)
  if (!product) return { title: 'Producto no disponible · Dropspy', robots: { index: false } }
  const description = shareVerdict(product)
  return {
    title: `${product.productTitle} · Dropspy`,
    description,
    // Sin indexar hasta decidir la regla de privacidad de las páginas públicas (propuesta de la app).
    robots: { index: false, follow: false },
    openGraph: { title: product.productTitle, description, type: 'website', siteName: 'Dropspy' },
    twitter: { card: 'summary_large_image', title: product.productTitle, description },
  }
}

export default async function SharePage({ params }: { params: Params }) {
  const { candidateId } = await params
  const product = await getShareProduct(candidateId)
  if (!product) notFound()

  const ads = activeAds(product)
  const [shown, ...hidden] = ads
  const signupHref = shareSignupHref(product.candidateId)
  const country = countryName(product.storeCountry)
  const image = product.productImage ? `/api/image-proxy?url=${encodeURIComponent(product.productImage)}` : null

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <DropspyIcon size={26} gradient />
            <span className="font-display text-lg font-bold tracking-tight">dropspy</span>
          </Link>
          <Link href={signupHref} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
            Probar 7 días gratis
          </Link>
        </div>
      </header>

      <main className="mx-auto grid max-w-2xl gap-6 px-4 py-8">
        <section className="grid gap-4 rounded-xl border border-border bg-card p-5 shadow-card">
          <div className="flex items-start gap-4">
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={image} alt="" className="h-20 w-20 shrink-0 rounded-xl object-cover" />
            ) : (
              <div className="h-20 w-20 shrink-0 rounded-xl bg-secondary" />
            )}
            <div className="min-w-0">
              <h1 className="font-display text-xl font-semibold leading-snug text-balance">{product.productTitle}</h1>
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                {product.productPrice != null && (
                  <span className="rounded-full border border-border px-2.5 py-0.5 font-medium tabular-nums">
                    {formatCurrency(product.productPrice, product.currency)}{product.currency ? ` ${product.currency}` : ''}
                  </span>
                )}
                {country && <span className="rounded-full border border-border px-2.5 py-0.5 text-muted-foreground">{country}</span>}
                {product.pagoAnticipado && (
                  <span className="rounded-full border border-primary-border bg-primary-subtle px-2.5 py-0.5 font-medium text-primary-text">Pago anticipado</span>
                )}
              </div>
            </div>
          </div>

          <p className="text-[15px] leading-relaxed">{shareVerdict(product)}</p>

          <dl className="grid grid-cols-3 gap-3 border-t border-border pt-4">
            <div>
              <dt className="text-xs text-subtle-foreground">Puesto hoy</dt>
              <dd className="font-display text-xl font-semibold tabular-nums">{product.currentRank != null ? `#${product.currentRank}` : '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-subtle-foreground">Mejor puesto</dt>
              <dd className="font-display text-xl font-semibold tabular-nums">{product.bestRank != null ? `#${product.bestRank}` : '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-subtle-foreground">Días en el ranking</dt>
              <dd className="font-display text-xl font-semibold tabular-nums">{product.daysInBestseller ?? '—'}</dd>
            </div>
          </dl>
        </section>

        {shown && (
          <section className="grid gap-3">
            <h2 className="text-sm font-semibold">
              {ads.length === 1 ? '1 anuncio activo' : `${ads.length} anuncios activos`}
            </h2>
            <div className="grid grid-cols-3 gap-3">
              <ShareAdVideo videoUrl={shown.video_url_r2} poster={shown.thumbnail_url} daysRunning={shown.days_running} />
              {/* El resto, borroso y sin video: se ven con la prueba */}
              {hidden.slice(0, 2).map((ad, i) => (
                <div key={ad.id} className="relative aspect-[9/16] overflow-hidden rounded-xl bg-secondary">
                  {ad.thumbnail_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={ad.thumbnail_url} alt="" className="h-full w-full scale-110 object-cover blur-md" />
                  )}
                  {i === Math.min(hidden.length, 2) - 1 && (
                    <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-sidebar/40 text-center text-xs font-medium text-sidebar-foreground">
                      <Lock className="h-4 w-4" />
                      {hidden.length === 1 ? '1 más' : `${hidden.length} más`}
                      <br />con tu prueba
                    </span>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="grid gap-3 rounded-xl border border-primary-border bg-primary-subtle p-5">
          <h2 className="font-display text-lg font-semibold">Este es uno de los productos que Dropspy vigila hoy</h2>
          <p className="text-sm text-muted-foreground">
            Mira los que más están subiendo en el mercado, con sus anuncios y las tiendas que los venden. 7 días gratis, sin tarjeta de crédito.
          </p>
          <Link href={signupHref} className={cn(buttonVariants({ variant: 'brand' }), 'w-fit')}>
            Ver el Radar gratis
          </Link>
        </section>

        <p className="text-center text-xs text-subtle-foreground">
          Dropspy · inteligencia competitiva para dropshippers
        </p>
      </main>
    </div>
  )
}
