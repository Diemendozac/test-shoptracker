'use client'

// FIX-070: descripción real del producto (texto + imágenes), tomada de Shopify products.json.
// Solo existe para candidatos con video de ads — si no hay nada, el componente no renderiza
// nada (no hay una sección vacía confundiendo al usuario).
//
// El texto SIEMPRE se renderiza como texto plano (nunca dangerouslySetInnerHTML) — el backend
// ya lo limpia con Jsoup antes de guardarlo, pero esta es la segunda capa de seguridad: aunque
// llegara HTML crudo por algún motivo, acá nunca se interpreta como markup.

import { useState } from 'react'
import { cn } from '@/lib/utils'

interface ProductDescriptionSectionProps {
  descriptionText: string | null
  descriptionImages: string | null // JSON array de URLs, sin parsear
}

function parseImages(raw: string | null): string[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((u): u is string => typeof u === 'string') : []
  } catch {
    return []
  }
}

export function ProductDescriptionSection({ descriptionText, descriptionImages }: ProductDescriptionSectionProps) {
  const images = parseImages(descriptionImages)
  const [activeImage, setActiveImage] = useState(0)

  if (!descriptionText && images.length === 0) return null

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-4">
        <h3 className="font-semibold text-foreground">Descripción del producto</h3>
        <p className="text-sm text-muted-foreground">Tal como aparece en la tienda de origen</p>
      </div>

      <div className={cn('grid gap-6', images.length > 0 && 'md:grid-cols-[minmax(0,280px)_1fr]')}>
        {images.length > 0 && (
          <div>
            <div className="aspect-square overflow-hidden rounded-lg border border-border bg-secondary/30">
              {/* eslint-disable-next-line @next/next/no-img-element -- imágenes externas de dominios de tiendas arbitrarios, no vale la pena configurar next/image por dominio */}
              <img src={images[activeImage]} alt="Imagen del producto" className="h-full w-full object-cover" />
            </div>
            {images.length > 1 && (
              <div className="mt-2 flex gap-2 overflow-x-auto">
                {images.map((src, i) => (
                  <button
                    key={src}
                    onClick={() => setActiveImage(i)}
                    className={cn(
                      'h-14 w-14 flex-shrink-0 overflow-hidden rounded-md border-2 transition-colors',
                      i === activeImage ? 'border-primary' : 'border-transparent opacity-70 hover:opacity-100',
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {descriptionText && (
          <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
            {descriptionText}
          </p>
        )}
      </div>
    </div>
  )
}
