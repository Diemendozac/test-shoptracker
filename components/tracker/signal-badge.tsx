import { cn } from '@/lib/utils'
import { SIGNAL_LABEL, type Signal } from '@/lib/signal'

// Distintivo de la escala de señal (CHANGE-134). Regla en lib/signal.ts.
// Color solo cuando significa algo: verde = sube, rojo = cae, ámbar = nuevo o poca confianza,
// neutro = estable. Con confianza baja nunca se usa el verde lleno (regla aprobada).

const HELP: Record<Signal['state'], string> = {
  nuevo: 'Lleva 2 días o menos en seguimiento: todavía no hay tendencia.',
  despegando: 'Subió 3 o más puestos y 20 % o más en sus últimos 7 registros, con 3 subidas seguidas y puntaje 50 o más.',
  creciendo: 'Subió 3 o más puestos y 10 % o más en sus últimos 7 registros.',
  estable: 'No se movió lo suficiente para subir o caer, o todavía tiene pocos registros de rank.',
  cayendo: 'Bajó 3 o más puestos y 20 % o más en sus últimos 7 registros, con 3 o más bajadas.',
}

const CONFIDENCE_TEXT: Record<Signal['confidence'], string> = {
  baja: 'Confianza baja',
  media: 'Confianza media',
  alta: 'Confianza alta',
}

export function SignalBadge({ signal, showConfidence = false, className }: {
  signal: Signal
  showConfidence?: boolean
  className?: string
}) {
  const weak = signal.confidence === 'baja'
  const tone =
    signal.state === 'despegando' && !weak ? 'border-transparent bg-success-foreground text-white'
    : (signal.state === 'despegando' || signal.state === 'creciendo') && weak ? 'border-warning-border bg-warning-subtle text-warning-foreground'
    : signal.state === 'creciendo' ? 'border-success-border bg-success-subtle text-success-foreground'
    : signal.state === 'cayendo' ? 'border-danger-border bg-danger-subtle text-danger-foreground'
    : signal.state === 'nuevo' ? 'border-warning-border bg-warning-subtle text-warning-foreground'
    : 'border-border bg-secondary text-muted-foreground'

  return (
    <span className={cn('inline-flex flex-col gap-0.5', className)}>
      <span
        title={`${HELP[signal.state]} ${CONFIDENCE_TEXT[signal.confidence]}: la confianza sube con los días de datos.`}
        className={cn('inline-flex w-fit items-center whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-semibold', tone)}
      >
        {SIGNAL_LABEL[signal.state]}
      </span>
      {showConfidence && (
        <span className="text-[11px] text-subtle-foreground">{CONFIDENCE_TEXT[signal.confidence]}</span>
      )}
    </span>
  )
}
