'use client'

import { useState } from 'react'
import { Share2, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

// Copia el link público del producto (/share/[id]). Se movió desde pool-winners.tsx sin
// cambios de comportamiento (CHANGE-134); pool-winners lo sigue re-exportando.
export function ShareButton({ candidateId }: { candidateId: string }) {
  const [copied, setCopied] = useState(false)

  function handleShare(e: React.MouseEvent) {
    e.preventDefault()
    const url = `${window.location.origin}/share/${candidateId}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <button
      onClick={handleShare}
      title="Copiar link para compartir"
      className={cn(
        'flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium transition-colors',
        copied
          ? 'bg-emerald-500/15 text-emerald-600'
          : 'bg-secondary text-muted-foreground hover:bg-primary/10 hover:text-primary',
      )}
    >
      {copied
        ? <><Check className="h-3 w-3" /> Copiado</>
        : <><Share2 className="h-3 w-3" /> Link</>
      }
    </button>
  )
}
