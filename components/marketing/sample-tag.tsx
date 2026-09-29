/** Rótulo de datos de ejemplo (el mismo tratamiento que en el prototipo 2B). */
export function SampleTag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-warning-border bg-warning-subtle px-2 py-1 font-sans text-xs leading-none font-semibold whitespace-nowrap text-warning-foreground">
      {children}
    </span>
  )
}
