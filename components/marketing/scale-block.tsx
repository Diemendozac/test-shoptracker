import { getTranslations } from 'next-intl/server'
import { countryRows, type PublishableScale } from '@/lib/marketing/scale'
import { CountUp } from './count-up'

// Bloque de escala de la landing: "No empiezas de cero: la base ya existe". Solo se monta con
// cifras publicables (publishableScale en lib/marketing/scale.ts); la página decide eso y
// también si mostrar el enlace "El mercado". Se renderiza en el servidor: el HTML trae los
// números finales y el contador (CountUp) es la única isla cliente.

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sept', 'oct', 'nov', 'dic']
/** 'AAAA-MM-DD' → "1 oct 2026", sin pasar por la zona horaria */
function formatDay(value: string): string {
  const [y, m, d] = value.split('-').map(Number)
  return `${d} ${MESES[m - 1]} ${y}`
}

const regionNames = new Intl.DisplayNames(['es'], { type: 'region' })
const nf = new Intl.NumberFormat('es-CO')

export async function ScaleBlock({ scale }: { scale: PublishableScale }) {
  const t = await getTranslations('Landing.scale')
  const rows = scale.paises ? countryRows(scale.paises) : []
  const top = rows.reduce((m, r) => Math.max(m, r.stores), 0)

  const stats = [
    { key: 'stores', value: scale.tiendas, def: t('storesDef') },
    { key: 'products', value: scale.productos, def: t('productsDef') },
    {
      key: 'days',
      value: scale.dias,
      def: scale.desde ? t('daysDefSince', { date: formatDay(scale.desde) }) : t('daysDef'),
    },
  ] as const

  return (
    <section id="mercado" aria-labelledby="h-mercado" className="scroll-mt-20 pt-6 pb-14 lg:pb-[88px]">
      <div className="mx-auto w-full max-w-[1200px] px-5 lg:px-8">
        <span data-reveal className="font-mono text-xs font-semibold tracking-[0.06em] text-primary-text uppercase">{t('kicker')}</span>
        <h2 id="h-mercado" data-reveal style={{ '--d': 1 } as React.CSSProperties} className="mkt-h2">{t('title')}</h2>
        <p data-reveal style={{ '--d': 2 } as React.CSSProperties} className="max-w-[40em] text-muted-foreground">{t('subtitle')}</p>

        <div data-reveal style={{ '--d': 3 } as React.CSSProperties} className="mt-6 overflow-hidden rounded-2xl border border-border bg-card shadow-card">
          <div className="flex items-center justify-between gap-2 border-b border-border px-3.5 py-2.5 font-mono text-xs text-subtle-foreground">
            <span className="tracking-[0.06em] uppercase">{t('panel')}</span>
            <span>{t('cutoff', { date: formatDay(scale.corte) })}</span>
          </div>
          <dl className="grid lg:grid-cols-3">
            {stats.map((s) => (
              <div key={s.key} className="grid content-start gap-1.5 border-b border-border px-4 py-[18px] lg:border-r lg:px-[22px] lg:py-6 lg:last:border-r-0">
                <dt className="font-mono text-xs tracking-[0.06em] text-primary-text uppercase">{t(s.key)}</dt>
                <dd className="m-0 font-display text-[44px] leading-[1.1] font-semibold tracking-[-0.02em] lg:text-[52px]">
                  <CountUp value={s.value} />
                </dd>
                <dd className="m-0 text-sm text-muted-foreground">{s.def}</dd>
              </div>
            ))}
          </dl>

          {rows.length > 0 && (
            <div className="px-4 py-[18px] lg:p-[22px]">
              <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1.5">
                <h3 className="text-base font-semibold">{t('countriesTitle')}</h3>
                <span className="font-mono text-xs text-subtle-foreground">{t('countriesHint')}</span>
              </div>
              <ul data-reveal className="mkt-bars grid gap-2.5">
                {rows.map((r) => (
                  <li key={r.code ?? 'otros'} className="grid grid-cols-[112px_1fr_auto] items-center gap-3 text-sm lg:grid-cols-[160px_1fr_96px]">
                    <span className="truncate">{r.code ? regionNames.of(r.code) ?? r.code : t('otherCountries')}</span>
                    <span aria-hidden="true" className="block h-2 overflow-hidden rounded bg-border">
                      <i className="block h-full origin-left bg-primary" style={{ transform: `scaleX(${top ? r.stores / top : 0})` }} />
                    </span>
                    <span className="min-w-16 text-right text-[13px] font-medium text-muted-foreground tabular-nums">{nf.format(r.stores)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
