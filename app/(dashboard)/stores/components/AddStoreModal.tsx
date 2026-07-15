'use client'

import { useState, useEffect } from 'react'
import { X, Store, Link, ArrowRight, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useStores } from '../hooks/useStores'
import { cn } from '@/lib/utils'

// ─── constants ───────────────────────────────────────────────────────────────

const DEFAULT_BESTSELLER_PATH = '/collections/all?sort_by=best-selling'

// ─── helpers ─────────────────────────────────────────────────────────────────

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:'
  } catch {
    return false
  }
}

interface FieldState {
  value: string
  touched: boolean
  error: string
}

const makeField = (value = ''): FieldState => ({ value, touched: false, error: '' })

function validateStoreName(v: string): string {
  if (!v.trim()) return 'El nombre de la tienda es obligatorio'
  if (v.trim().length < 2) return 'Debe tener al menos 2 caracteres'
  return ''
}

function validateUrl(v: string, label: string): string {
  if (!v.trim()) return `${label} es obligatoria`
  if (!isValidUrl(v.trim())) return 'Debe ser una URL válida (https://…)'
  return ''
}

function extractApiError(err: unknown): string {
  if (err && typeof err === 'object') {
    const e = err as Record<string, unknown>
    if (e.data && typeof e.data === 'object') {
      const d = e.data as Record<string, unknown>
      // Our GlobalExceptionHandler / Spring Boot default: { message: "..." }
      if (typeof d.message === 'string' && d.message.trim()) return d.message.trim()
      // RFC 7807 Problem Details: { detail: "..." }
      if (typeof d.detail === 'string' && d.detail.trim()) return d.detail.trim()
      // Spring default fallback: { error: "Bad Request" }
      if (typeof d.error === 'string' && d.error.trim()) return d.error.trim()
    }
    if (typeof e.error === 'string' && e.error.trim()) return e.error.trim()
    // HTTP status hints
    if (e.status === 409) return 'Ya tienes esta tienda registrada. Puedes reactivarla desde tu panel.'
    if (e.status === 400) return 'No se pudo agregar la tienda. Verifica la URL e intenta de nuevo.'
    if (e.status === 403) return 'No tienes permiso para realizar esta acción.'
    if (e.status === 429) return 'Demasiados intentos. Espera un momento e intenta de nuevo.'
  }
  return 'Algo salió mal. Por favor intenta de nuevo.'
}

// ─── component ───────────────────────────────────────────────────────────────

export function AddStoreModal() {
  const { isAddModalOpen, closeAddModal, addStore, isCreating } = useStores()

  const [storeName, setStoreName]           = useState<FieldState>(makeField())
  const [baseUrl, setBaseUrl]               = useState<FieldState>(makeField())
  const [submitError, setSubmitError]       = useState<string | null>(null)
  const [subscribedInfo, setSubscribedInfo] = useState(false)

  // reset everything when modal closes
  useEffect(() => {
    if (!isAddModalOpen) {
      setStoreName(makeField())
      setBaseUrl(makeField())
      setSubmitError(null)
      setSubscribedInfo(false)
    }
  }, [isAddModalOpen])

  if (!isAddModalOpen) return null

  // ── submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setSubmitError(null)
    const snErr = validateStoreName(storeName.value)
    const buErr = validateUrl(baseUrl.value, 'URL base')
    setStoreName((f) => ({ ...f, touched: true, error: snErr }))
    setBaseUrl((f)   => ({ ...f, touched: true, error: buErr }))
    if (snErr || buErr) return

    try {
      const parsed = new URL(baseUrl.value.trim())
      const result = await addStore({
        storeName:     storeName.value.trim(),
        baseUrl:       parsed.origin,
        bestsellerUrl: parsed.origin + DEFAULT_BESTSELLER_PATH,
      })
      if (result?.subscribedToExisting) {
        setSubscribedInfo(true)
        setTimeout(() => closeAddModal(), 2500)
      }
    } catch (err) {
      setSubmitError(extractApiError(err))
    }
  }

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget && !isCreating) closeAddModal() }}
    >
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />

      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-black/20">

        {/* accent line */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

        {/* header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Store className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">Agregar nueva tienda</h2>
              <p className="text-xs text-muted-foreground">Rastrea a un competidor de Shopify</p>
            </div>
          </div>
          <button
            onClick={closeAddModal}
            disabled={isCreating}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-40"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mx-6 h-px bg-border" />

        {/* body */}
        <div className="space-y-4 px-6 py-5">

          <Field
            label="Nombre de la tienda"
            hint="Nombre para mostrar"
            icon={<Store className="h-3.5 w-3.5" />}
            value={storeName.value}
            error={storeName.touched ? storeName.error : ''}
            disabled={isCreating}
            placeholder="ej. Netviral"
            onChange={(v) => setStoreName((f) => ({ ...f, value: v, error: '' }))}
            onBlur={() => setStoreName((f) => ({ ...f, touched: true, error: validateStoreName(f.value) }))}
          />

          <Field
            label="URL base de la tienda"
            hint="Solo el dominio raíz"
            icon={<Link className="h-3.5 w-3.5" />}
            value={baseUrl.value}
            error={baseUrl.touched ? baseUrl.error : ''}
            disabled={isCreating}
            placeholder="https://netviral.shop"
            onChange={(v) => setBaseUrl((f) => ({ ...f, value: v, error: '' }))}
            onBlur={() => setBaseUrl((f) => ({ ...f, touched: true, error: validateUrl(f.value, 'URL base') }))}
          />

          {/* auto-generated preview */}
          <div className="rounded-lg border border-border/60 bg-secondary/30 px-3 py-3 space-y-2">
            <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
              Rutas generadas automáticamente
            </p>
            <PreviewRow label="Más vendidos" value={baseUrl.value.trim().replace(/\/$/, '') + DEFAULT_BESTSELLER_PATH} />
          </div>

          {/* subscribed to existing store */}
          {subscribedInfo && (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5 text-xs text-emerald-600">
              <Store className="h-3.5 w-3.5 shrink-0" />
              Esta tienda ya está siendo trackeada. Conectándote a los datos existentes…
            </div>
          )}

          {/* server error */}
          {submitError && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-xs text-destructive">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              {submitError}
            </div>
          )}
        </div>

        {/* footer */}
        <div className="flex items-center justify-end gap-2 border-t border-border px-6 py-4">
          <Button
            variant="ghost" size="sm"
            onClick={closeAddModal} disabled={isCreating}
            className="text-muted-foreground"
          >
            Cancelar
          </Button>
          <Button size="sm" className="gap-2" onClick={handleSubmit} disabled={isCreating}>
            {isCreating
              ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Agregando tienda…</>
              : <>Agregar tienda<ArrowRight className="h-3.5 w-3.5" /></>
            }
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── sub-components ───────────────────────────────────────────────────────────

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 w-16 shrink-0 text-[10px] text-muted-foreground">{label}</span>
      <span className="break-all font-mono text-[10px] text-foreground/70">{value}</span>
    </div>
  )
}

// ─── field ────────────────────────────────────────────────────────────────────

interface FieldProps {
  label: string
  hint?: string
  icon?: React.ReactNode
  value: string
  error: string
  disabled?: boolean
  placeholder?: string
  onChange: (v: string) => void
  onBlur?: () => void
}

function Field({ label, hint, icon, value, error, disabled, placeholder, onChange, onBlur }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-1.5 text-xs font-medium text-foreground">
          {icon && <span className="text-muted-foreground">{icon}</span>}
          {label}
        </label>
        {hint && <span className="text-[10px] text-muted-foreground">{hint}</span>}
      </div>
      <input
        type="text"
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        className={cn(
          'w-full rounded-lg border bg-secondary/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50',
          'outline-none transition-colors',
          'focus:border-primary/60 focus:bg-secondary focus:ring-2 focus:ring-primary/20',
          'disabled:cursor-not-allowed disabled:opacity-50',
          error ? 'border-destructive/60 focus:border-destructive focus:ring-destructive/20' : 'border-border'
        )}
      />
      {error && (
        <p className="flex items-center gap-1 text-[11px] text-destructive">
          <AlertCircle className="h-3 w-3 shrink-0" />
          {error}
        </p>
      )}
    </div>
  )
}