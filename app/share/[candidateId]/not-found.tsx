import Link from 'next/link'
import { DropspyIcon } from '@/components/ui/dropspy-logo'
import { buttonVariants } from '@/components/ui/button'

// Link vencido o producto que ya no está en seguimiento (CHANGE-133).
export default function ShareNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-background px-4 text-center text-foreground">
      <DropspyIcon size={40} gradient />
      <div>
        <h1 className="font-display text-lg font-semibold">Este producto ya no está disponible</h1>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          El link puede haber vencido o el producto dejó de estar en seguimiento.
        </p>
      </div>
      <Link href="/" className={buttonVariants({ variant: 'brand' })}>Ir a Dropspy</Link>
    </div>
  )
}
