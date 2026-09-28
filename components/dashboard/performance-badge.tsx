'use client'

import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus, Eye, Sparkles } from 'lucide-react'

/**
 * Labels soportados por la UI (sistema cerrado)
 */
export type PerformanceLabel =
  | 'Rising'
  | 'Watching'
  | 'Declining'
  | 'Stable'
  | 'New'

interface PerformanceBadgeProps {
  label: string // 👈 ahora acepta cualquier string (viene de API)
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
}

/**
 * Configuración visual por label
 */
const labelConfig: Record<
  PerformanceLabel,
  {
    color: string
    bgColor: string
    borderColor: string
    icon: typeof TrendingUp
  }
> = {
  Rising: {
    color: 'text-success-foreground',
    bgColor: 'bg-success-subtle',
    borderColor: 'border-success-border',
    icon: TrendingUp,
  },
  // Neutro: "en observación" no es una alerta. El ámbar queda para señal débil.
  Watching: {
    color: 'text-muted-foreground',
    bgColor: 'bg-neutral-subtle',
    borderColor: 'border-border',
    icon: Eye,
  },
  // Pendiente decisión de Diego (docs/redesign/03-spec-fase-2.md, D-2): el
  // usuario no debería ver Declining. Mientras tanto se mantiene su color.
  Declining: {
    color: 'text-danger-foreground',
    bgColor: 'bg-danger-subtle',
    borderColor: 'border-danger-border',
    icon: TrendingDown,
  },
  Stable: {
    color: 'text-info-foreground',
    bgColor: 'bg-info-subtle',
    borderColor: 'border-info-border',
    icon: Minus,
  },
  New: {
    color: 'text-primary-text',
    bgColor: 'bg-primary-subtle',
    borderColor: 'border-primary-border',
    icon: Sparkles,
  },
}

/**
 * Texto visible al usuario por label — el valor interno (Rising/Watching/...)
 * se mantiene en inglés porque otro código lo compara por string exacto
 * (ver resolveDisplayLabel en lib/label-utils y su uso en home/page.tsx).
 */
const labelText: Record<PerformanceLabel, string> = {
  Rising: 'En alza',
  Watching: 'En observación',
  Declining: 'En baja',
  Stable: 'Estable',
  New: 'Nuevo',
}

/**
 * Mapper: API → UI
 */
function mapPerformanceLabel(apiLabel: string): PerformanceLabel {
  if (!apiLabel) return 'Stable'

  const map: Record<string, PerformanceLabel> = {
    rocket: 'Rising',
    rising: 'Rising',
    watching: 'Watching',
    declining: 'Declining',
    stable: 'Stable',
    new: 'New',
  }

  return map[apiLabel.toLowerCase()] ?? 'Stable'
}

export function PerformanceBadge({
  label,
  size = 'md',
  showIcon = true,
}: PerformanceBadgeProps) {
  const normalizedLabel = mapPerformanceLabel(label)
  const config = labelConfig[normalizedLabel]

  // Extra safety (nunca debería fallar, pero protege en runtime)
  if (!config) {
    console.error('Invalid PerformanceLabel:', label)
    return null
  }

  const Icon = config.icon

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium',
        config.color,
        config.bgColor,
        config.borderColor,
        size === 'sm' && 'px-2 py-0.5 text-xs',
        size === 'md' && 'px-2.5 py-1 text-xs',
        size === 'lg' && 'px-3 py-1.5 text-sm'
      )}
    >
      {showIcon && (
        <Icon
          className={cn(
            size === 'sm' && 'h-3 w-3',
            size === 'md' && 'h-3.5 w-3.5',
            size === 'lg' && 'h-4 w-4'
          )}
        />
      )}
      {labelText[normalizedLabel]}
    </span>
  )
}