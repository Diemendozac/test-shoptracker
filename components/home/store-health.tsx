'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { StoreHealthRow } from '@/lib/today'

// Salud de tus tiendas (CHANGE-136). Con cupos limitados por plan, una tienda quieta es un cupo
// perdido: la pantalla lo dice.

const TONE: Record<StoreHealthRow['tone'], string> = {
  ok: 'border-success-border bg-success-subtle text-success-foreground',
  warn: 'border-warning-border bg-warning-subtle text-warning-foreground',
  bad: 'border-danger-border bg-danger-subtle text-danger-foreground',
  none: 'border-border bg-secondary text-muted-foreground',
}

export function StoreHealth({ rows }: { rows: StoreHealthRow[] }) {
  const quiet = rows.filter((r) => r.tone === 'bad').length
  return (
    <section className="rounded-xl border border-border bg-card shadow-card" aria-labelledby="hoy-tiendas">
      <div className="flex items-baseline justify-between gap-3 border-b border-border px-5 py-3">
        <h2 id="hoy-tiendas" className="text-sm font-semibold text-foreground">Tus tiendas</h2>
        <Link href="/stores" className="text-xs font-medium text-primary-text hover:underline">Competidores →</Link>
      </div>
      <ul className="divide-y divide-border">
        {rows.slice(0, 8).map((r) => (
          <li key={r.store.storeId}>
            <Link href={`/stores/${r.store.storeId}`} className="flex items-center gap-3 px-5 py-2.5 transition-colors hover:bg-secondary/40">
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">{r.store.storeName}</span>
              <span className="whitespace-nowrap text-xs tabular-nums text-subtle-foreground">
                {r.newThisWeek === 0 ? 'sin nuevos' : r.newThisWeek === 1 ? '1 nuevo' : `${r.newThisWeek} nuevos`} · 7 días
              </span>
              <span className={cn('whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-semibold', TONE[r.tone])}>{r.label}</span>
            </Link>
          </li>
        ))}
      </ul>
      {quiet > 0 && (
        <p className="border-t border-border px-5 py-3 text-xs text-danger-foreground">
          {quiet === 1 ? '1 tienda está quieta: estás usando un cupo en ella.' : `${quiet} tiendas están quietas: estás usando ${quiet} cupos en ellas.`}{' '}
          <Link href="/stores" className="font-medium underline">Revisar</Link>
        </p>
      )}
      {rows.length > 8 && (
        <p className="border-t border-border px-5 py-2 text-xs text-subtle-foreground">y {rows.length - 8} más en Competidores</p>
      )}
    </section>
  )
}
