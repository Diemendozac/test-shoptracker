'use client'

import { useState, useEffect } from 'react'
import { X, Store, Link, ArrowRight, Loader2, AlertCircle, Wand2, Settings2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useStores } from '../hooks/useStores'
import { cn } from '@/lib/utils'

// ─── constants ───────────────────────────────────────────────────────────────

const DEFAULT_BESTSELLER_PATH = '/collections/all?sort_by=best-selling'
const DEFAULT_RECENT_PATH     = '/collections/all?sort_by=created-descending'

type Mode = 'generic' | 'custom'

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
  if (!v.trim()) return 'Store name is required'
  if (v.trim().length < 2) return 'Must be at least 2 characters'
  return ''
}

function validateUrl(v: string, label: string): string {
  if (!v.trim()) return `${label} is required`
  if (!isValidUrl(v.trim())) return 'Must be a valid URL (https://…)'
  return ''
}

// ─── component ───────────────────────────────────────────────────────────────

export function AddStoreModal() {
  const { isAddModalOpen, closeAddModal, addStore, isCreating } = useStores()

  const [mode, setMode]                   = useState<Mode>('generic')
  const [storeName, setStoreName]         = useState<FieldState>(makeField())
  const [baseUrl, setBaseUrl]             = useState<FieldState>(makeField())
  const [bestsellerUrl, setBestsellerUrl] = useState<FieldState>(makeField())
  const [recentUrl, setRecentUrl]         = useState<FieldState>(makeField())
  const [submitError, setSubmitError]     = useState<string | null>(null)

  // reset everything when modal closes
  useEffect(() => {
    if (!isAddModalOpen) {
      setMode('generic')
      setStoreName(makeField())
      setBaseUrl(makeField())
      setBestsellerUrl(makeField())
      setRecentUrl(makeField())
      setSubmitError(null)
    }
  }, [isAddModalOpen])

  // reset url fields when switching modes — keep store name
  const switchMode = (next: Mode) => {
    if (next === mode) return
    setMode(next)
    setBaseUrl(makeField())
    setBestsellerUrl(makeField())
    setRecentUrl(makeField())
    setSubmitError(null)
  }

  if (!isAddModalOpen) return null

  // ── derived preview (generic mode) ───────────────────────────────────────
  const previewBase       = baseUrl.value.trim().replace(/\/$/, '')
  const previewBestseller = previewBase ? previewBase + DEFAULT_BESTSELLER_PATH : DEFAULT_BESTSELLER_PATH
  const previewRecent     = previewBase ? previewBase + DEFAULT_RECENT_PATH     : DEFAULT_RECENT_PATH

  // ── submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setSubmitError(null)

    if (mode === 'generic') {
      const snErr = validateStoreName(storeName.value)
      const buErr = validateUrl(baseUrl.value, 'Base URL')
      setStoreName((f) => ({ ...f, touched: true, error: snErr }))
      setBaseUrl((f)   => ({ ...f, touched: true, error: buErr }))
      if (snErr || buErr) return

      try {
        const parsed = new URL(baseUrl.value.trim())
        await addStore({
          storeName:      storeName.value.trim(),
          baseUrl:        parsed.origin,
          bestsellerUrl: parsed.origin + DEFAULT_BESTSELLER_PATH,
          recentUrl:     parsed.origin + DEFAULT_RECENT_PATH,
        })
      } catch (err) {
        const isApiError = err && typeof err === 'object' && 'status' in err
        setSubmitError(isApiError ? 'Server error. Please try again.' : 'Something went wrong.')
      }

    } else {
      const snErr = validateStoreName(storeName.value)
      const buErr = validateUrl(bestsellerUrl.value, 'Bestseller URL')
      const ruErr = validateUrl(recentUrl.value, 'Recent URL')
      setStoreName((f)       => ({ ...f, touched: true, error: snErr }))
      setBestsellerUrl((f)   => ({ ...f, touched: true, error: buErr }))
      setRecentUrl((f)       => ({ ...f, touched: true, error: ruErr }))
      if (snErr || buErr || ruErr) return

      try {
        const bsUrl = new URL(bestsellerUrl.value.trim())
        await addStore({
          storeName:      storeName.value.trim(),
          baseUrl:        bsUrl.origin,
          bestsellerUrl: bestsellerUrl.value.trim(),
          recentUrl:     recentUrl.value.trim(),
        })
      } catch (err) {
        const isApiError = err && typeof err === 'object' && 'status' in err
        setSubmitError(isApiError ? 'Server error. Please try again.' : 'Something went wrong.')
      }
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
              <h2 className="text-sm font-semibold text-foreground">Add New Store</h2>
              <p className="text-xs text-muted-foreground">Track a Shopify competitor</p>
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

          {/* mode toggle */}
          <div className="flex gap-1 rounded-lg bg-secondary/60 p-1">
            <ModeTab
              active={mode === 'generic'}
              icon={<Wand2 className="h-3.5 w-3.5" />}
              label="Generic"
              description="Auto-generate paths"
              onClick={() => switchMode('generic')}
            />
            <ModeTab
              active={mode === 'custom'}
              icon={<Settings2 className="h-3.5 w-3.5" />}
              label="Custom"
              description="Define URLs manually"
              onClick={() => switchMode('custom')}
            />
          </div>

          {/* store name — always visible */}
          <Field
            label="Store Name"
            hint="Display name"
            icon={<Store className="h-3.5 w-3.5" />}
            value={storeName.value}
            error={storeName.touched ? storeName.error : ''}
            disabled={isCreating}
            placeholder="e.g. Netviral"
            onChange={(v) => setStoreName((f) => ({ ...f, value: v, error: '' }))}
            onBlur={() => setStoreName((f) => ({ ...f, touched: true, error: validateStoreName(f.value) }))}
          />

          {/* ── generic ── */}
          {mode === 'generic' && (
            <>
              <Field
                label="Store Base URL"
                hint="Root domain only"
                icon={<Link className="h-3.5 w-3.5" />}
                value={baseUrl.value}
                error={baseUrl.touched ? baseUrl.error : ''}
                disabled={isCreating}
                placeholder="https://netviral.shop"
                onChange={(v) => setBaseUrl((f) => ({ ...f, value: v, error: '' }))}
                onBlur={() => setBaseUrl((f) => ({ ...f, touched: true, error: validateUrl(f.value, 'Base URL') }))}
              />

              {/* auto-generated preview */}
              <div className="rounded-lg border border-border/60 bg-secondary/30 px-3 py-3 space-y-2">
                <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                  Auto-generated paths
                </p>
                <PreviewRow label="Bestseller" value={previewBestseller} />
                <PreviewRow label="Recent"     value={previewRecent} />
              </div>
            </>
          )}

          {/* ── custom ── */}
          {mode === 'custom' && (
            <>
              <Field
                label="Bestseller URL"
                hint="Sorted by best-selling"
                icon={<Link className="h-3.5 w-3.5" />}
                value={bestsellerUrl.value}
                error={bestsellerUrl.touched ? bestsellerUrl.error : ''}
                disabled={isCreating}
                placeholder="https://store.com/collections/all?sort_by=best-selling"
                onChange={(v) => setBestsellerUrl((f) => ({ ...f, value: v, error: '' }))}
                onBlur={() => setBestsellerUrl((f) => ({ ...f, touched: true, error: validateUrl(f.value, 'Bestseller URL') }))}
              />
              <Field
                label="Recent Products URL"
                hint="Sorted by newest first"
                icon={<Link className="h-3.5 w-3.5" />}
                value={recentUrl.value}
                error={recentUrl.touched ? recentUrl.error : ''}
                disabled={isCreating}
                placeholder="https://store.com/collections/all?sort_by=created-descending"
                onChange={(v) => setRecentUrl((f) => ({ ...f, value: v, error: '' }))}
                onBlur={() => setRecentUrl((f) => ({ ...f, touched: true, error: validateUrl(f.value, 'Recent URL') }))}
              />
            </>
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
            Cancel
          </Button>
          <Button size="sm" className="gap-2" onClick={handleSubmit} disabled={isCreating}>
            {isCreating
              ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Adding store…</>
              : <>Add Store<ArrowRight className="h-3.5 w-3.5" /></>
            }
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── sub-components ───────────────────────────────────────────────────────────

function ModeTab({ active, icon, label, description, onClick }: {
  active: boolean
  icon: React.ReactNode
  label: string
  description: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-1 items-center gap-2 rounded-md px-3 py-2 text-left transition-all',
        active ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
      )}
    >
      <span className={cn('shrink-0 transition-colors', active ? 'text-primary' : '')}>
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium leading-none">{label}</p>
        <p className="mt-0.5 truncate text-[10px] text-muted-foreground">{description}</p>
      </div>
    </button>
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