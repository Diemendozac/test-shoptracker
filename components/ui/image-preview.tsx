'use client'

import { useState } from 'react'

interface HoverImagePreviewProps {
  src: string | null
  fallback: string
  /** Wrap the src with the image proxy route (for internal tracker images) */
  proxy?: boolean
  size?: number
  previewSize?: number
}

export function HoverImagePreview({
  src,
  fallback,
  proxy = false,
  size = 72,
  previewSize = 240,
}: HoverImagePreviewProps) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)

  const imgSrc = src && proxy
    ? `/api/image-proxy?url=${encodeURIComponent(src)}`
    : src

  return (
    <div
      className="overflow-hidden rounded-xl"
      style={{ width: size, height: size, flexShrink: 0 }}
      onMouseEnter={(e) => {
        if (!imgSrc) return
        const r = e.currentTarget.getBoundingClientRect()
        setPos({ x: r.left + r.width / 2, y: r.top })
      }}
      onMouseLeave={() => setPos(null)}
    >
      {imgSrc ? (
        <img
          src={imgSrc}
          alt=""
          style={{ width: size, height: size }}
          className="object-cover"
          onError={(e) => { e.currentTarget.style.display = 'none' }}
        />
      ) : (
        <div
          style={{ width: size, height: size }}
          className="flex items-center justify-center bg-secondary text-xl font-bold text-muted-foreground"
        >
          {fallback}
        </div>
      )}

      {/* Fixed popup — escapes overflow-hidden on any ancestor */}
      {pos && imgSrc && (
        <div
          className="pointer-events-none fixed z-50"
          style={{
            left: pos.x,
            top: pos.y,
            transform: 'translate(-50%, calc(-100% - 10px))',
          }}
        >
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
            <img
              src={imgSrc}
              alt=""
              style={{ width: previewSize, height: previewSize }}
              className="object-cover"
            />
          </div>
        </div>
      )}
    </div>
  )
}
