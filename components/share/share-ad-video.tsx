'use client'

import { useRef, useState } from 'react'
import { Volume2, VolumeX } from 'lucide-react'

// El único anuncio que la página pública muestra completo (CHANGE-133). Arranca sin sonido,
// como piden los navegadores para reproducir solo; el botón lo activa.
export function ShareAdVideo({ videoUrl, poster, daysRunning }: {
  videoUrl: string | null
  poster: string | null
  daysRunning: number | null
}) {
  const [muted, setMuted] = useState(true)
  const videoRef = useRef<HTMLVideoElement>(null)

  function toggleMute() {
    const next = !muted
    setMuted(next)
    if (videoRef.current) videoRef.current.muted = next
  }

  return (
    <div className="relative aspect-[9/16] w-full overflow-hidden rounded-xl bg-sidebar">
      {videoUrl ? (
        <>
          <video
            ref={videoRef}
            src={videoUrl}
            poster={poster ?? undefined}
            autoPlay
            loop
            muted
            playsInline
            className="h-full w-full object-cover"
          />
          <button
            type="button"
            onClick={toggleMute}
            aria-label={muted ? 'Activar sonido' : 'Silenciar'}
            className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-sidebar/80 text-sidebar-foreground"
          >
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
        </>
      ) : poster ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={poster} alt="" className="h-full w-full object-cover" />
      ) : null}
      {daysRunning != null && daysRunning > 0 && (
        <span className="absolute left-2 top-2 rounded-full bg-sidebar/80 px-2 py-0.5 text-xs font-medium text-sidebar-foreground">
          {daysRunning} {daysRunning === 1 ? 'día' : 'días'} al aire
        </span>
      )}
    </div>
  )
}
