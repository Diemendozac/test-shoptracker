'use client'

import { useLayoutEffect, useRef, useState } from 'react'
import { useMediaQuery } from '@/hooks/use-media-query'
import { formatCurrency } from '@/lib/utils'

// Precio de una tarjeta de /pricing. Al cargar no se anima: el HTML del servidor ya trae el valor
// final. Cuando cambia la facturación, cuenta desde el valor que se veía hasta el nuevo en 240 ms
// (desaceleración cúbica); si se interrumpe, sigue desde donde iba. Con movimiento reducido cambia
// de una. El lector de pantalla lee siempre el valor final, nunca uno a medio contar.
const DURATION_MS = 240

export function PriceAmount({ value, currency, className }: { value: number; currency: string; className?: string }) {
  const reduced = useMediaQuery('(prefers-reduced-motion: reduce)')
  const [shown, setShown] = useState(value)
  const painted = useRef(value)

  // Layout effect: el cambio sin animación se aplica antes de pintar, sin un cuadro con el valor viejo
  useLayoutEffect(() => {
    const from = painted.current
    if (from === value) return
    if (reduced) {
      painted.current = value
      setShown(value)
      return
    }
    let frame = 0
    const start = performance.now()
    const step = (now: number) => {
      const p = Math.min((now - start) / DURATION_MS, 1)
      painted.current = Math.round(from + (value - from) * (1 - (1 - p) ** 3))
      setShown(painted.current)
      if (p < 1) frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [value, reduced])

  return (
    <span className={className}>
      <span aria-hidden="true" className="tabular-nums">{formatCurrency(shown, currency)}</span>
      <span className="sr-only">{formatCurrency(value, currency)}</span>
    </span>
  )
}
