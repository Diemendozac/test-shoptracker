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
          // Outer teardrop — proportions from Freepik file (tip ~251,26 · circle centre ~250,343 · r166)
          'M251 26 C268 53 416 174 416 343 A166 166 0 1 1 84 343 C84 174 234 53 251 26Z',
          // Eye lens cutout — wide almond centred ~y318
          'M104 318 Q251 248 397 318 Q251 388 104 318Z',
          // Iris ring fill — centre ~251,325 r55
          'M196 325 A55 55 0 1 0 306 325 A55 55 0 1 0 196 325Z',
          // Pupil cutout — exact path from Freepik SVG (centre ~251,333 r25)
          'M253.332092 310.525055 C270.707703 314.979462 277.872986 331.082886 269.445374 345.916260 C264.338806 354.904297 250.112244 359.274414 240.927567 354.676361 C229.458847 348.934875 223.865494 335.355530 228.672607 324.924347 C233.556625 314.326355 241.480804 309.591980 253.332092 310.525055Z',
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
        Dropspy
      </span>
    </span>
  )
}
