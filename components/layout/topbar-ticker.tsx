'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useGetInsightsQuery } from '@/app/(dashboard)/services/dashboardApi'
import type { DashboardInsight } from '@/app/(dashboard)/types'

const FALLBACK: DashboardInsight = {
  type: 'total',
  isTask: false,
  emoji: '',
  message: 'Sincroniza para ver insights del día',
  cta: 'Sincronizar',
  ctaPath: '/stores',
}

const ACCENT: Record<string, string> = {
  rising:       'text-orange-500',
  streak:       'text-amber-500',
  score:        'text-violet-500',
  alert:        'text-rose-500',
  total:        'text-blue-500',
  task_stores:  'text-emerald-600',
  task_scale:   'text-primary',
  task_pending: 'text-amber-600',
}

export function TopbarTicker() {
  const { data: rawItems = [] } = useGetInsightsQuery()
  const items = rawItems.length > 0 ? rawItems : [FALLBACK]
  const [idx, setIdx] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    if (items.length <= 1) return
    const id = setInterval(() => {
      setVisible(false)
      const t = setTimeout(() => {
        setIdx((i) => (i + 1) % items.length)
        setVisible(true)
      }, 350)
      return () => clearTimeout(t)
    }, 5000)
    return () => clearInterval(id)
  }, [items.length])

  const msg = items[idx % items.length]
  const accent = ACCENT[msg.type] ?? 'text-primary'
  const isTask = msg.isTask

  return (
    <div className="flex items-center justify-center min-w-0">
      <Link
        href={msg.ctaPath}
        className={cn(
          'group flex min-w-0 items-center gap-2 rounded-full border px-3.5 py-1.5 shadow-sm',
          'transition-all duration-300',
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1.5',
          isTask
            ? 'border-amber-400/50 bg-amber-500/5 hover:border-amber-400/80 hover:bg-amber-500/10'
            : 'border-border/60 bg-card hover:border-border hover:shadow-md',
        )}
      >
        {/* Task indicator dot */}
        {isTask && (
          <span className="relative flex h-1.5 w-1.5 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-amber-400" />
          </span>
        )}

        <span className={cn('min-w-0 truncate text-xs font-medium', accent)}>
          {msg.message}
        </span>

        <span className="flex shrink-0 items-center gap-0.5 text-[10px] font-semibold text-muted-foreground transition-colors group-hover:text-foreground">
          {isTask && <CheckCircle2 className="mr-0.5 h-3 w-3 text-amber-500" />}
          {msg.cta}
          <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
        </span>
      </Link>
    </div>
  )
}
