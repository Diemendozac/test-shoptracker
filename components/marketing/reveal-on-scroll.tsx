'use client'

import { useEffect } from 'react'

// Entrada de las secciones de la landing al hacer scroll: 240 ms, 12 px, 60 ms entre elementos
// (--d en cada [data-reveal]), una sola vez. Mejora progresiva: el HTML del servidor se ve
// completo; recién al hidratar se ocultan los elementos que todavía están debajo del pliegue,
// y los que ya se ven quedan como están. Con movimiento reducido no hace nada.
// Los estilos están en app/(marketing)/marketing.css.
export function RevealOnScroll({ rootId }: { rootId: string }) {
  useEffect(() => {
    const root = document.getElementById(rootId)
    if (!root) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const items = Array.from(root.querySelectorAll<HTMLElement>('[data-reveal]'))
    const pending = items.filter((el) => el.getBoundingClientRect().top >= window.innerHeight)
    items.forEach((el) => { if (!pending.includes(el)) el.classList.add('is-in') })
    root.classList.add('reveal-ready')

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          entry.target.classList.add('is-in')
          io.unobserve(entry.target)
        }
      },
      { rootMargin: '0px 0px -8% 0px' },
    )
    pending.forEach((el) => io.observe(el))
    return () => {
      io.disconnect()
      root.classList.remove('reveal-ready')
    }
  }, [rootId])

  return null
}
