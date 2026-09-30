import { ImageResponse } from 'next/og'
import { activeAds, getShareProduct } from '@/lib/share'

// Imagen de vista previa de cada producto compartido (CHANGE-133): lo que aparece al pegar el
// link en WhatsApp, Instagram o Facebook. Mismos colores que la imagen de la landing
// (app/opengraph-image.tsx, tema oscuro de app/globals.css).
export const alt = 'Producto seguido por Dropspy'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const LOGO = 'M250 25 L322 178 L475 250 L322 322 L250 475 L178 322 L25 250 L178 178Z M312 250 A62 62 0 1 0 188 250 A62 62 0 1 0 312 250Z M276 250 A26 26 0 1 0 224 250 A26 26 0 1 0 276 250Z'

/**
 * La foto del producto como data URL. Se pide JPEG o PNG (el renderizador de la imagen no lee
 * WebP) y con tiempo límite: si falla, la imagen sale sin foto en vez de romperse.
 */
async function productPhoto(url: string | null): Promise<string | null> {
  if (!url) return null
  try {
    const res = await fetch(url, {
      headers: { Accept: 'image/jpeg,image/png' },
      signal: AbortSignal.timeout(4000),
    })
    const type = res.headers.get('content-type') ?? ''
    if (!res.ok || !/image\/(jpeg|png)/.test(type)) return null
    const buf = Buffer.from(await res.arrayBuffer())
    if (buf.byteLength > 4_000_000) return null
    return `data:${type.split(';')[0]};base64,${buf.toString('base64')}`
  } catch {
    return null
  }
}

export default async function ShareImage({ params }: { params: Promise<{ candidateId: string }> }) {
  const { candidateId } = await params
  const product = await getShareProduct(candidateId)
  const photo = await productPhoto(product?.productImage ?? null)
  const ads = product ? activeAds(product) : []

  const facts: string[] = []
  if (product?.currentRank != null) facts.push(`Puesto #${product.currentRank} en su tienda`)
  if (ads.length > 0) facts.push(ads.length === 1 ? '1 anuncio activo' : `${ads.length} anuncios activos`)

  const title = product?.productTitle ?? 'Producto no disponible'

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          gap: 56,
          padding: '64px 72px',
          background: '#080A15',
          backgroundImage: 'radial-gradient(900px 420px at 85% -10%, rgba(107, 78, 255, 0.35), transparent 70%)',
          color: '#F1F2FA',
        }}
      >
        {photo && (
          <div style={{ display: 'flex', width: 440, height: 502, borderRadius: 32, overflow: 'hidden', background: '#10132A', flexShrink: 0 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo} width={440} height={502} style={{ objectFit: 'cover' }} alt="" />
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <svg width="48" height="48" viewBox="0 0 500 500">
              <defs>
                <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#8B6CFF" />
                  <stop offset="0.5" stopColor="#4F7BFF" />
                  <stop offset="1" stopColor="#22D3EE" />
                </linearGradient>
              </defs>
              <path fillRule="evenodd" fill="url(#g)" d={LOGO} />
            </svg>
            <span style={{ fontSize: 34, fontWeight: 700, letterSpacing: -1 }}>dropspy</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
            <span style={{ fontSize: 22, color: '#B3A6FF', letterSpacing: 2, textTransform: 'uppercase' }}>
              Producto en el radar
            </span>
            <span style={{ fontSize: photo ? 54 : 68, fontWeight: 700, lineHeight: 1.1, letterSpacing: -1.5 }}>
              {title.length > 70 ? `${title.slice(0, 67)}…` : title}
            </span>
            {facts.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                {facts.map((f) => (
                  <span key={f} style={{ fontSize: 26, padding: '8px 18px', borderRadius: 999, background: '#161A34', color: '#F1F2FA' }}>
                    {f}
                  </span>
                ))}
              </div>
            )}
          </div>
          <span style={{ fontSize: 24, color: '#B3B8D6' }}>
            Mira qué más está ganando: 7 días gratis en getdropspy.com
          </span>
        </div>
      </div>
    ),
    { ...size },
  )
}
