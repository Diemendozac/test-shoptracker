import { useId } from 'react'

interface DropspyIconProps {
  className?: string
  size?: number
  /** Relleno con el degradado de marca (--grad-brand) en vez de currentColor */
  gradient?: boolean
}

export function DropspyIcon({ className, size = 32, gradient = false }: DropspyIconProps) {
  const gradientId = useId()
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 500 500"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {gradient && (
        <defs>
          {/* Mismos stops que --grad-brand en app/globals.css */}
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#7C5CFF" />
            <stop offset="0.5" stopColor="#4F7BFF" />
            <stop offset="1" stopColor="#22C3E6" />
          </linearGradient>
        </defs>
      )}
      <path
        fillRule="evenodd"
        fill={gradient ? `url(#${gradientId})` : 'currentColor'}
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
