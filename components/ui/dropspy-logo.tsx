interface DropspyIconProps {
  className?: string
  size?: number
}

/**
 * Dropspy teardrop+eye icon using a single even-odd compound path.
 * Cutouts are transparent, so the icon works on any background color.
 * Set `color` via className (e.g. `text-white` or `text-foreground`).
 */
export function DropspyIcon({ className, size = 32 }: DropspyIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 115"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        fillRule="evenodd"
        fill="currentColor"
        d={[
          // 1. Outer teardrop — tip at (50,3), circle center (50,74) radius 40
          'M50 3 C65 15 90 50 90 74 A40 40 0 1 1 10 74 C10 50 35 15 50 3Z',
          // 2. Eye lens cutout — center (50,77), tips at x=15 and x=85
          'M15 77 Q50 51 85 77 Q50 103 15 77Z',
          // 3. Iris ring fill — circle (50,77) r=13
          'M37 77 A13 13 0 1 0 63 77 A13 13 0 1 0 37 77Z',
          // 4. Pupil cutout — circle (50,77) r=6
          'M44 77 A6 6 0 1 0 56 77 A6 6 0 1 0 44 77Z',
        ].join(' ')}
      />
    </svg>
  )
}

/** Full horizontal lockup: icon + "Dropspy" wordmark. */
export function DropspyWordmark({ className }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ''}`}>
      <DropspyIcon size={28} />
      <span
        className="text-xl font-bold tracking-tight leading-none"
        style={{ fontFamily: 'var(--font-outfit, var(--font-inter, sans-serif))' }}
      >
        Dropspy
      </span>
    </span>
  )
}
