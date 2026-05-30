interface DropspyIconProps {
  className?: string
  size?: number
}

export function DropspyIcon({ className, size = 32 }: DropspyIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 500 500"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        fillRule="evenodd"
        fill="currentColor"
        d={[
          // 4-pointed star (compass rose) — tips at ±225 from center, concave insets at ±72 diagonally
          'M250 25 L322 178 L475 250 L322 322 L250 475 L178 322 L25 250 L178 178Z',
          // Eye circle cutout (r=62, center 250,250)
          'M312 250 A62 62 0 1 0 188 250 A62 62 0 1 0 312 250Z',
          // Pupil refill (r=26, center 250,250)
          'M276 250 A26 26 0 1 0 224 250 A26 26 0 1 0 276 250Z',
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
