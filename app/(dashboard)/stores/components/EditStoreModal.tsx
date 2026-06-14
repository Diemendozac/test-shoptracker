'use client'

import { useState, useEffect } from 'react'
import { X, Store, Link, Save, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useUpdateStoreMutation } from '../services/storeApi'
import { cn } from '@/lib/utils'
import type { StoreResponse } from '../types'

const DEFAULT_BESTSELLER_PATH = '/collections/all?sort_by=best-selling'

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
  if (!v.trim()) return 'El nombre es requerido'
  if (v.trim().length < 2) return 'Mínimo 2 caracteres'
  return ''
}

function validateUrl(v: string): string {
  if (!v.trim()) return 'La URL es requerida'
  if (!isValidUrl(v.trim())) return 'Debe ser una URL válida (https://…)'
  return ''
}

function extractApiError(err: unknown): string {
  if (err && typeof err === 'object') {
    const e = err as Record<string, unknown>
    if (e.data && typeof e.data === 'object') {
      const d = e.data as Record<string, unknown>
      if (typeof d.message === 'string' && d.message.trim()) return d.message.trim()
      if (typeof d.detail === 'string' && d.detail.trim()) return d.detail.trim()
    }
    if (e.status === 409) return 'Ya existe una tienda con ese dominio.'
    if (e.status === 400) return 'URL inválida. Verifica e intenta de nuevo.'
  }
  return 'Algo salió mal. Por favor intenta de nuevo.'
}

interface EditStoreModalProps {
  store: StoreResponse | null
  onClose: () => void
}

export function EditStoreModal({ store, onClose }: EditStoreModalProps) {
  const [updateStore, { isLoading: isSaving }] = useUpdateStoreMutation()

  const [storeName, setStoreName]           = useState<FieldState>(makeField())
  const [baseUrl, setBaseUrl]               = useState<FieldState>(makeField())
  const [pagoAnticipado, setPagoAnticipado] = useState(false)
  const [country, setCountry]               = useState<string>('')
  const [submitError, setSubmitError]       = useState<string | null>(null)

  useEffect(() => {
    if (store) {
      setStoreName(makeField(store.storeName))
      setBaseUrl(makeField(store.baseUrl))
      setPagoAnticipado(store.pagoAnticipado ?? false)
      setCountry(store.country ?? '')
      setSubmitError(null)
    }
  }, [store])

  if (!store) return null

  const handleSubmit = async () => {
    setSubmitError(null)
    const snErr = validateStoreName(storeName.value)
    const buErr = validateUrl(baseUrl.value)
    setStoreName((f) => ({ ...f, touched: true, error: snErr }))
    setBaseUrl((f)   => ({ ...f, touched: true, error: buErr }))
    if (snErr || buErr) return

    try {
      const parsed = new URL(baseUrl.value.trim())
      await updateStore({
        storeId: store.storeId,
        body: {
          storeName:      storeName.value.trim(),
          baseUrl:        parsed.origin,
          pagoAnticipado,
          ...(country.trim() ? { country: country.trim().toUpperCase() } : {}),
        },
      }).unwrap()
      onClose()
    } catch (err) {
      setSubmitError(extractApiError(err))
    }
  }

  const previewBase = baseUrl.value.trim().replace(/\/$/, '')

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget && !isSaving) onClose() }}
    >
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />

      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-black/20">

        <div className="h-px w-full bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

        {/* header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Store className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">Editar tienda</h2>
              <p className="text-xs text-muted-foreground">{store.storeName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-40"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mx-6 h-px bg-border" />

        {/* body */}
        <div className="space-y-4 px-6 py-5">

          <Field
            label="Nombre"
            hint="Nombre en el panel"
            icon={<Store className="h-3.5 w-3.5" />}
            value={storeName.value}
            error={storeName.touched ? storeName.error : ''}
            disabled={isSaving}
            placeholder="e.g. Netviral"
            onChange={(v) => setStoreName((f) => ({ ...f, value: v, error: '' }))}
            onBlur={() => setStoreName((f) => ({ ...f, touched: true, error: validateStoreName(f.value) }))}
          />

          <Field
            label="Dominio"
            hint="URL raíz de la tienda"
            icon={<Link className="h-3.5 w-3.5" />}
            value={baseUrl.value}
            error={baseUrl.touched ? baseUrl.error : ''}
            disabled={isSaving}
            placeholder="https://netviral.shop"
            onChange={(v) => setBaseUrl((f) => ({ ...f, value: v, error: '' }))}
            onBlur={() => setBaseUrl((f) => ({ ...f, touched: true, error: validateUrl(f.value) }))}
          />

          {/* auto-generated preview */}
          <div className="rounded-lg border border-border/60 bg-secondary/30 px-3 py-3 space-y-2">
            <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
              Ruta generada
            </p>
            <PreviewRow label="Bestseller" value={previewBase + DEFAULT_BESTSELLER_PATH} />
          </div>

          {/* país — solo mostrar si el auto-detect no lo pudo resolver (USD/null) */}
          {(store.country === null || store.country === undefined) && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-foreground">País</label>
                <span className="text-[10px] text-muted-foreground">No detectado auto (moneda USD)</span>
              </div>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                disabled={isSaving}
                className="w-full rounded-lg border border-border bg-secondary/50 px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary/60 focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
              >
                <option value="">— Sin especificar —</option>
                <option value="US">🇺🇸 Estados Unidos (US)</option>
                <option value="EC">🇪🇨 Ecuador (EC)</option>
                <option value="CO">🇨🇴 Colombia (CO)</option>
                <option value="MX">🇲🇽 México (MX)</option>
                <option value="BR">🇧🇷 Brasil (BR)</option>
                <option value="AR">🇦🇷 Argentina (AR)</option>
                <option value="CL">🇨🇱 Chile (CL)</option>
                <option value="PE">🇵🇪 Perú (PE)</option>
                <option value="GT">🇬🇹 Guatemala (GT)</option>
              </select>
            </div>
          )}

          {/* pago anticipado */}
          <label className="flex cursor-pointer items-center justify-between rounded-lg border border-border bg-secondary/30 px-3 py-2.5">
            <div>
              <p className="text-xs font-medium text-foreground">Pago anticipado</p>
              <p className="text-[10px] text-muted-foreground">La tienda usa modelo de pago antes del envío</p>
            </div>
            <button
              type="button"
              disabled={isSaving}
              onClick={() => setPagoAnticipado((v) => !v)}
              className={cn(
                'relative h-5 w-9 rounded-full transition-colors focus:outline-none disabled:opacity-50',
                pagoAnticipado ? 'bg-primary' : 'bg-secondary'
              )}
            >
              <span
                className={cn(
                  'absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform',
                  pagoAnticipado && 'translate-x-4'
                )}
              />
            </button>
          </label>

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
            onClick={onClose} disabled={isSaving}
            className="text-muted-foreground"
          >
            Cancelar
          </Button>
          <Button size="sm" className="gap-2" onClick={handleSubmit} disabled={isSaving}>
            {isSaving
              ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Guardando…</>
              : <><Save className="h-3.5 w-3.5" />Guardar cambios</>
            }
          </Button>
        </div>
      </div>
    </div>
  )
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 w-16 shrink-0 text-[10px] text-muted-foreground">{label}</span>
      <span className="break-all font-mono text-[10px] text-foreground/70">{value}</span>
    </div>
  )
}

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