'use client'

// FIX-070 (rediseño): descripción real del producto como popup, con los bloques (texto/imagen)
// en el mismo orden en que aparecen en la tienda de origen — la mayoría son solo imágenes
// (la "landing" completa subida como galería de fotos), algunas intercalan texto real.
//
// El texto SIEMPRE se renderiza como texto plano (nunca dangerouslySetInnerHTML) — el backend
// ya lo limpia con Jsoup antes de guardarlo, pero esta es la segunda capa de seguridad.

import { useState } from 'react'
import { Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

interface DescriptionBlock {
  type: 'text' | 'image'
  value: string
}

interface ProductDescriptionModalProps {
  descriptionBlocks: string | null // JSON crudo, sin parsear
}

function parseBlocks(raw: string | null): DescriptionBlock[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (b): b is DescriptionBlock =>
        b && (b.type === 'text' || b.type === 'image') && typeof b.value === 'string',
    )
  } catch {
    return []
  }
}

export function ProductDescriptionModal({ descriptionBlocks }: ProductDescriptionModalProps) {
  const [open, setOpen] = useState(false)
  const blocks = parseBlocks(descriptionBlocks)

  if (blocks.length === 0) return null

  const imageCount = blocks.filter(b => b.type === 'image').length

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div className="rounded-xl border border-border bg-card p-4">
        <button
          onClick={() => setOpen(true)}
          className="flex w-full items-center justify-between text-left"
        >
          <div>
            <h3 className="font-semibold text-foreground">Descripción del producto</h3>
            <p className="text-sm text-muted-foreground">
              {imageCount > 0 ? `${imageCount} imagen${imageCount === 1 ? '' : 'es'} · ` : ''}
              Tal como aparece en la tienda de origen
            </p>
          </div>
          <Button variant="outline" size="sm" className="gap-1.5 flex-shrink-0">
            <Eye className="h-3.5 w-3.5" />
            Ver completa
          </Button>
        </button>
      </div>

      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Descripción del producto</DialogTitle>
          <DialogDescription>Tal como aparece en la tienda de origen, en orden</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {blocks.map((block, i) =>
            block.type === 'image' ? (
              // eslint-disable-next-line @next/next/no-img-element -- imágenes externas de dominios de tiendas arbitrarios
              <img
                key={i}
                src={block.value}
                alt=""
                className="w-full rounded-lg border border-border"
              />
            ) : (
              <p key={i} className="whitespace-pre-line text-sm leading-relaxed text-foreground">
                {block.value}
              </p>
            ),
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
