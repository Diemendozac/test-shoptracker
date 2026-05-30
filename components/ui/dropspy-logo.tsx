interface DropspyIconProps {
  className?: string
  size?: number
}

/** The Dropspy teardrop+eye icon. Inherits `currentColor`. */
export function DropspyIcon({ className, size = 32 }: DropspyIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Teardrop body */}
      <path
        d="M50 5 C68 20 90 50 90 76 C90 99 72 116 50 116 C28 116 10 99 10 76 C10 50 32 20 50 5 Z"
        fill="currentColor"
      />
      {/* Eye white (lens shape with pointed ends) */}
      <path
        d="M14 80 Q50 55 86 80 Q50 105 14 80 Z"
        fill="white"
      />
      {/* Iris ring */}
      <circle cx="50" cy="80" r="19" fill="currentColor" />
      {/* Pupil */}
      <circle cx="50" cy="80" r="9" fill="white" />
    </svg>
  )
}

/** Full horizontal lockup: icon + "dropspy" wordmark. */
export function DropspyWordmark({ className }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ''}`}>
      <DropspyIcon size={28} />
      <span
        className="font-brand text-xl font-bold tracking-tight leading-none"
        style={{ fontFamily: 'var(--font-outfit, var(--font-inter, sans-serif))' }}
      >
        dropspy
      </span>
    </span>
  )
}
