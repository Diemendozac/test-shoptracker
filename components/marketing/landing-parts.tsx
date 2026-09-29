import { DropspyIcon } from '@/components/ui/dropspy-logo'
import { cn } from '@/lib/utils'
import { SampleTag } from './sample-tag'

// Piezas de la landing (y de la cabecera del registro) sin estado: Server Components.

export function Brand({ size = 26, className }: { size?: number; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2 font-display text-xl leading-none font-bold tracking-[-0.01em]', className)}>
      <DropspyIcon size={size} gradient />
      <span>dropspy</span>
    </span>
  )
}

export function StoreRow({ letter, domain, cc }: { letter: string; domain: string; cc: string }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <span className="grid size-7 flex-none place-items-center rounded-lg bg-primary-subtle text-[13px] font-bold text-primary-text">{letter}</span>
      <b className="min-w-0 flex-1 truncate text-sm">{domain}</b>
      <span className="flex-none rounded-md border border-border px-1.5 py-1 font-mono text-xs leading-none font-semibold text-muted-foreground">{cc}</span>
    </div>
  )
}

export function HowCard({
  index, title, body, tag, d, children,
}: {
  index: string
  title: string
  body: string
  tag?: string
  d: number
  children: React.ReactNode
}) {
  return (
    <article data-reveal style={{ '--d': d } as React.CSSProperties} className="grid content-start gap-2.5 rounded-[14px] border border-border bg-card p-4">
      <div className="flex min-h-6 items-center justify-between gap-2">
        <span className="font-mono text-xs text-subtle-foreground">{index}</span>
        {tag && <SampleTag>{tag}</SampleTag>}
      </div>
      <div aria-hidden="true" className="relative min-h-24 overflow-hidden rounded-[10px] border border-border bg-background p-3">
        {children}
      </div>
      <h3 className="text-[17px] leading-snug font-semibold">{title}</h3>
      <p className="text-[15px] text-muted-foreground">{body}</p>
    </article>
  )
}
