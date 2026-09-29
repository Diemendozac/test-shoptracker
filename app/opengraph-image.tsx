import { ImageResponse } from 'next/og'

// Imagen para compartir la landing (C4 del diagnóstico). Colores del tema oscuro de
// app/globals.css (.dark): fondo #080A15, texto #F1F2FA, secundario #B3B8D6, acento #B3A6FF.
// Sin cifras: el bloque de escala todavía no tiene los conteos de Diego.
export const alt = 'Dropspy: ya vigilamos el mercado, tú ves qué está ganando'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const LOGO = 'M250 25 L322 178 L475 250 L322 322 L250 475 L178 322 L25 250 L178 178Z M312 250 A62 62 0 1 0 188 250 A62 62 0 1 0 312 250Z M276 250 A26 26 0 1 0 224 250 A26 26 0 1 0 276 250Z'

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px 80px',
          background: '#080A15',
          backgroundImage: 'radial-gradient(900px 420px at 85% -10%, rgba(107, 78, 255, 0.35), transparent 70%)',
          color: '#F1F2FA',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <svg width="64" height="64" viewBox="0 0 500 500">
            <defs>
              <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#8B6CFF" />
                <stop offset="0.5" stopColor="#4F7BFF" />
                <stop offset="1" stopColor="#22D3EE" />
              </linearGradient>
            </defs>
            <path fillRule="evenodd" fill="url(#g)" d={LOGO} />
          </svg>
          <span style={{ fontSize: 44, fontWeight: 700, letterSpacing: -1 }}>dropspy</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={{ fontSize: 26, color: '#B3A6FF', letterSpacing: 2, textTransform: 'uppercase' }}>
            Inteligencia de productos · LATAM
          </span>
          <span style={{ fontSize: 76, fontWeight: 700, lineHeight: 1.05, letterSpacing: -2 }}>Ya vigilamos el mercado.</span>
          <span style={{ fontSize: 76, fontWeight: 700, lineHeight: 1.05, letterSpacing: -2, color: '#B3A6FF' }}>
            Tú ves qué está ganando.
          </span>
        </div>
        <span style={{ fontSize: 28, color: '#B3B8D6' }}>
          El ranking de más vendidos de tiendas Shopify, revisado todos los días.
        </span>
      </div>
    ),
    { ...size },
  )
}
