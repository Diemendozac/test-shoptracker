interface DropspyIconProps {
  className?: string
  size?: number
}

/**
 * Dropspy teardrop+eye icon — single even-odd compound path.
 * Cutouts are transparent so it works on any background.
 * Replace the path data with the exact SVG export from Freepik for pixel-perfect output.
 */
export function DropspyIcon({ className, size = 32 }: DropspyIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 104"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        fillRule="evenodd"
        fill="currentColor"
        d={[
          // Outer teardrop: tip (50,0), circle centre (50,65) r=39, bottom at y=104
          'M50 0 C62 18 89 43 89 65 A39 39 0 1 1 11 65 C11 43 38 18 50 0Z',
          // Eye lens punch-out: tips (14,67)→(86,67), half-height ≈16
          'M14 67 Q50 35 86 67 Q50 99 14 67Z',
          // Iris ring fill: centre (50,67) r=15
          'M35 67 A15 15 0 1 0 65 67 A15 15 0 1 0 35 67Z',
          // Pupil punch-out: centre (50,67) r=7
          'M43 67 A7 7 0 1 0 57 67 A7 7 0 1 0 43 67Z',
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
