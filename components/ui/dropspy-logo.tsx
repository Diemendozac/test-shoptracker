interface DropspyIconProps {
  className?: string
  size?: number
}

export function DropspyIcon({ className, size = 32 }: DropspyIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 108"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        fillRule="evenodd"
        fill="currentColor"
        d={[
          // Teardrop: sharp tip (50,2) → circle centre (50,71) r=37
          'M50 2 C61 19 87 46 87 71 A37 37 0 1 1 13 71 C13 46 39 19 50 2Z',
          // Eye lens cutout: wide almond centred at (50,70)
          'M17 70 Q50 47 83 70 Q50 93 17 70Z',
          // Iris ring fill: centre (50,70) r=16
          'M34 70 A16 16 0 1 0 66 70 A16 16 0 1 0 34 70Z',
          // Pupil cutout: centre (50,70) r=7
          'M43 70 A7 7 0 1 0 57 70 A7 7 0 1 0 43 70Z',
        ].join(' ')}
      />
    </svg>
  )
}

export function DropspyWordmark({ className }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ''}`}>
      <DropspyIcon size={28} />
      <span
        className="text-xl font-bold tracking-tight leading-none"
        style={{ fontFamily: 'var(--font-outfit, var(--font-inter, sans-serif))' }}
      >
        dropspy
      </span>
    </span>
  )
}
