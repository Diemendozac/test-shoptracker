'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { ScoreRing } from '@/components/dashboard/score-ring'
import { PhaseBadge } from '@/components/tracker/phase-badge'
import { ProductArt } from './product-art'
import { RankArea } from './rank-area'
import { SampleTag } from './sample-tag'

// Mock del producto vivo del hero: un producto de EJEMPLO de una tienda del mercado que sube del
// puesto 38 al 6 en 14 días. Usa el ScoreRing y el PhaseBadge reales de la app. Todo el panel
// está rotulado como datos de ejemplo.
//
// Movimiento (02-prototipo-y-spec.md, "Movimiento"): avanza un día cada 900 ms, espera 2,4 s en
// el día 14 y vuelve a empezar con un fundido de 240 ms. Se pausa fuera de pantalla o con la
// pestaña oculta. Con movimiento reducido queda fijo en el día 14.
const RANK = [38, 37, 39, 33, 29, 26, 21, 17, 14, 11, 9, 8, 7, 6]
const SCORE = [18, 20, 19, 28, 35, 41, 49, 56, 61, 66, 69, 71, 72, 73]
const LAST = RANK.length - 1
const STEP_MS = 900
const HOLD_MS = 2400
const FADE_MS = 240

export function LiveProductMock() {
  const t = useTranslations('Landing')
  const ref = useRef<HTMLElement>(null)
  const [day, setDay] = useState(0)
  const [fading, setFading] = useState(false)
  const [running, setRunning] = useState(false)

  // Corre solo si se ve, la pestaña está visible y no hay movimiento reducido
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)')
    let inView = false
    const sync = () => {
      if (reduce.matches) {
        setRunning(false)
        setFading(false)
        setDay(LAST)
        return
      }
      setRunning(inView && !document.hidden)
    }
    const io = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting
      sync()
    })
    io.observe(el)
    document.addEventListener('visibilitychange', sync)
    reduce.addEventListener('change', sync)
    sync()
    return () => {
      io.disconnect()
      document.removeEventListener('visibilitychange', sync)
      reduce.removeEventListener('change', sync)
    }
  }, [])

  useEffect(() => {
    if (!running) return
    let timer: ReturnType<typeof setTimeout>
    if (fading) {
      timer = setTimeout(() => {
        setDay(0)
        setFading(false)
      }, FADE_MS)
    } else if (day < LAST) {
      timer = setTimeout(() => setDay((d) => Math.min(d + 1, LAST)), STEP_MS)
    } else {
      timer = setTimeout(() => setFading(true), HOLD_MS)
    }
    return () => clearTimeout(timer)
  }, [running, day, fading])

  const phase = day < 3 ? 'Meseta' : 'Despegue'

  return (
    <figure
      ref={ref}
      aria-labelledby="mock-caption"
      className="relative m-0 overflow-hidden rounded-2xl border border-border bg-card shadow-card"
    >
      <div className="flex items-center justify-between gap-2 border-b border-border px-3.5 py-2.5 font-mono text-xs text-subtle-foreground">
        <span className="inline-flex items-center gap-2 tracking-[0.06em] uppercase">
          <span aria-hidden="true" className="mock-live size-[7px] rounded-full bg-success" />
          {t('mock.title')}
        </span>
        <SampleTag>{t('sample')}</SampleTag>
      </div>
      <figcaption id="mock-caption" className="sr-only">{t('mock.caption')}</figcaption>

      <div aria-hidden="true" className={`mock-body grid gap-3.5 p-3.5 ${fading ? 'opacity-0' : 'opacity-100'}`}>
        <div className="flex min-w-0 items-center gap-3">
          <ProductArt kind="licuadora" />
          <div className="min-w-0">
            <strong className="block truncate text-[15px] leading-snug font-semibold">{t('mock.product')}</strong>
            <span className="text-[13px] text-subtle-foreground">
              {t('mock.store')} · <span className="tabular-nums">{t('mock.day', { day: day + 1 })}</span>
            </span>
          </div>
        </div>

        <RankArea
          ranks={RANK}
          upTo={day}
          maxRank={40}
          yTicks={[1, 20, 40]}
          xStart={t('mock.axisStart')}
          xEnd={t('mock.axisEnd', { day: RANK.length })}
        />

        <div className="grid grid-cols-[1fr_auto_auto] items-center gap-3">
          <div>
            <small className="block text-xs text-subtle-foreground">{t('mock.rankToday')}</small>
            <b className="block text-2xl leading-tight font-bold tabular-nums">#{RANK[day]}</b>
            <span className="text-xs text-subtle-foreground">{t('mock.entered', { rank: RANK[0] })}</span>
          </div>
          {/* Datos de ejemplo: la confianza crece con los días observados */}
          <ScoreRing score={SCORE[day]} size="md" showLabel={false} confidence={(day + 1) / RANK.length} />
          <span key={phase} className="mock-phase">
            <PhaseBadge phase={phase} size="md" />
          </span>
        </div>
      </div>

      <div aria-hidden="true" className="flex items-center justify-between gap-2 border-t border-border px-3.5 py-2.5 font-mono text-xs text-subtle-foreground">
        <span>{t('mock.footer')}</span>
        <span className="tabular-nums">{String(day + 1).padStart(2, '0')}/{RANK.length}</span>
      </div>
    </figure>
  )
}

