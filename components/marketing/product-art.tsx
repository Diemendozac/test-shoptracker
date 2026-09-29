import { cn } from '@/lib/utils'

// Ilustraciones provisorias de producto para los datos de ejemplo de la landing, hasta tener las
// fotos reales (C1 de docs/redesign/landing-auth-onboarding/01-diagnostico.md). Son decorativas:
// el nombre del producto siempre está en el texto de al lado.
const ART = {
  licuadora: (
    <>
      <rect x="30" y="14" width="40" height="12" rx="4" fill="#3F3A55" />
      <rect x="26" y="24" width="48" height="60" rx="14" fill="#D9E6F2" />
      <rect x="26" y="24" width="48" height="60" rx="14" fill="none" stroke="#B6C7D9" strokeWidth="2" />
      <rect x="30" y="80" width="40" height="10" rx="3" fill="#3F3A55" />
      <path d="M40 60h20" stroke="#9BB3CB" strokeWidth="3" strokeLinecap="round" />
    </>
  ),
  masajeador: (
    <>
      <path d="M22 60c0-22 12-36 28-36s28 14 28 36" fill="none" stroke="#C9CCD6" strokeWidth="12" strokeLinecap="round" />
      <circle cx="22" cy="64" r="9" fill="#E8E2D6" />
      <circle cx="78" cy="64" r="9" fill="#E8E2D6" />
    </>
  ),
  soporte: (
    <>
      <circle cx="50" cy="44" r="20" fill="#2F3440" />
      <circle cx="50" cy="44" r="10" fill="#5B8DEF" />
      <rect x="46" y="62" width="8" height="22" rx="3" fill="#2F3440" />
    </>
  ),
  bandas: (
    <>
      <rect x="18" y="32" width="64" height="12" rx="6" fill="#A7B8A0" />
      <rect x="18" y="48" width="64" height="12" rx="6" fill="#D6C7A8" />
      <rect x="18" y="64" width="64" height="12" rx="6" fill="#4B4F58" />
    </>
  ),
} as const

export type ProductArtKey = keyof typeof ART

export function ProductArt({ kind, size = 'md' }: { kind: ProductArtKey; size?: 'sm' | 'md' }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'grid flex-none place-items-center overflow-hidden border border-border bg-secondary',
        size === 'md' ? 'size-[52px] rounded-xl' : 'size-10 rounded-[10px]',
      )}
    >
      <svg viewBox="0 0 100 100" className="size-[86%]">
        {ART[kind]}
      </svg>
    </span>
  )
}
