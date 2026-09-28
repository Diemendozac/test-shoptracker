'use client'

interface PageLayoutProps {
  children: React.ReactNode
  title?: string
  description?: string
}

export function PageLayout({ children, title, description }: PageLayoutProps) {
  return (
    <div className="p-7">
      {(title || description) && (
        <div className="mb-6">
          {title && <h1 className="font-display text-[26px] font-semibold leading-8 tracking-tight text-foreground">{title}</h1>}
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      )}
      {children}
    </div>
  )
}
