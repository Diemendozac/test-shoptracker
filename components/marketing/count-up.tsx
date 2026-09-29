'use client'

import { useEffect, useRef, useState } from 'react'

// Contador del bloque de escala. El HTML del servidor ya trae el número final (SEO, sin JS).
// Si el contador está debajo del pliegue al hidratar, arranca en 0 y cuenta hasta el valor en
// 700 ms (desaceleración cúbica) la primera vez que entra en pantalla. Si ya se ve, o hay
// movimiento reducido, se queda quieto en el valor final.
const DURATION_MS = 700
const nf = new Intl.NumberFormat('es-CO')

export function CountUp({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [shown, setShown] = useState(value)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (el.getBoundingClientRect().top < window.innerHeight) return

    setShown(0)
    let frame = 0
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      io.disconnect()
      const start = performance.now()
      const step = (now: number) => {
        const p = Math.min((now - start) / DURATION_MS, 1)
        setShown(Math.round(value * (1 - Math.pow(1 - p, 3))))
        if (p < 1) frame = requestAnimationFrame(step)
      }
      frame = requestAnimationFrame(step)
    })
    io.observe(el)
    return () => {
      io.disconnect()
      cancelAnimationFrame(frame)
      setShown(value)
    }
  }, [value])

  // El lector de pantalla siempre lee el valor final, nunca un número a medio contar
  return (
    <span className="tabular-nums">
      <span ref={ref} aria-hidden="true">{nf.format(shown)}</span>
      <span className="sr-only">{nf.format(value)}</span>
    </span>
  )
}
