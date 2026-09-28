#!/usr/bin/env node
// Verificador de contraste WCAG 2.1 AA para las direcciones de diseño del rediseño.
//
// Verifica dos fuentes:
//   1. docs/redesign/preview-a.html y preview-b.html (bloques html[data-theme=…]):
//      lo que el dueño ve en los previews.
//   2. app/globals.css (:root y .dark): los tokens reales de la app (fase 2).
//
// Uso (sin dependencias, Node 18+):
//   node docs/redesign/tools/contrast-check.mjs          → resumen, exit 1 si algo falla
//   node docs/redesign/tools/contrast-check.mjs --all    → todos los pares
//   node docs/redesign/tools/contrast-check.mjs --md     → tabla markdown
//   node docs/redesign/tools/contrast-check.mjs --oklch  → tokens en OKLCH para app/globals.css

import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const args = new Set(process.argv.slice(2))

// [texto/gráfico, fondo, mínimo, criterio]
// 4.5 = texto normal (1.4.3) · 3 = componentes de UI y gráficos (1.4.11)
const PAIRS = [
  ['text', 'bg', 4.5], ['text', 'surface', 4.5], ['text', 'surface-2', 4.5], ['text', 'surface-3', 4.5],
  ['text-2', 'bg', 4.5], ['text-2', 'surface', 4.5], ['text-2', 'surface-2', 4.5], ['text-2', 'surface-3', 4.5],
  ['text-3', 'bg', 4.5], ['text-3', 'surface', 4.5], ['text-3', 'surface-2', 4.5], ['text-3', 'surface-3', 4.5],
  ['text-2', 'neutral-subtle', 4.5],
  ['accent-fg', 'accent', 4.5], ['accent-fg', 'accent-hover', 4.5],
  ['accent-text', 'bg', 4.5], ['accent-text', 'surface', 4.5], ['accent-text', 'accent-subtle', 4.5],
  ['success-text', 'surface', 4.5], ['success-text', 'success-subtle', 4.5],
  ['warning-text', 'surface', 4.5], ['warning-text', 'warning-subtle', 4.5],
  ['danger-text', 'surface', 4.5], ['danger-text', 'danger-subtle', 4.5],
  ['info-text', 'surface', 4.5], ['info-text', 'info-subtle', 4.5],
  ['sidebar-text', 'sidebar', 4.5], ['sidebar-text-2', 'sidebar', 4.5], ['sidebar-text-2', 'sidebar-hover', 4.5],
  ['sidebar-active-text', 'sidebar-active', 4.5],
  // Gráficos: arcos del ScoreRing, sparklines, bordes de inputs, anillo de foco
  ['success', 'surface', 3], ['warning', 'surface', 3], ['danger', 'surface', 3], ['info', 'surface', 3],
  ['success', 'surface-3', 3], ['warning', 'surface-3', 3],
  ['accent', 'surface', 3], ['ring', 'surface', 3], ['ring', 'bg', 3],
  ['border-input', 'surface', 3], ['border-input', 'bg', 3],
]

// ---------- color ----------
const hexToRgb = h => { h = h.replace('#', ''); if (h.length === 3) h = h.replace(/./g, '$&$&'); return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16) / 255) }
const toLin = c => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
const lum = h => { const [r, g, b] = hexToRgb(h).map(toLin); return 0.2126 * r + 0.7152 * g + 0.0722 * b }
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05) }
const mix = (a, b, t) => '#' + hexToRgb(a).map((v, i) => Math.round((v + (hexToRgb(b)[i] - v) * t) * 255).toString(16).padStart(2, '0')).join('')
function oklch(h) {
  const [r, g, b] = hexToRgb(h).map(toLin)
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
  const C = Math.hypot(A, B)
  const H = C < 0.0005 ? 0 : ((Math.atan2(B, A) * 180) / Math.PI + 360) % 360
  return `oklch(${L.toFixed(3)} ${C.toFixed(3)} ${H.toFixed(1)})`
}

function oklchToHex(L, C, H) {
  const h = (H * Math.PI) / 180, a = C * Math.cos(h), b = C * Math.sin(h)
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3
  const rgb = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ]
  const enc = c => { c = Math.min(1, Math.max(0, c)); return c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055 }
  return '#' + rgb.map(c => Math.round(enc(c) * 255).toString(16).padStart(2, '0')).join('').toUpperCase()
}

// ---------- parseo de los previews ----------
function tokensOf(file, theme) {
  const html = readFileSync(join(here, '..', file), 'utf8')
  const block = html.match(new RegExp(`html\\[data-theme="${theme}"\\]\\s*\\{([\\s\\S]*?)\\n\\}`))
  if (!block) throw new Error(`No encontré el bloque ${theme} en ${file}`)
  const t = {}
  for (const [, k, v] of block[1].matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{3,6})\b/g)) t[k] = v.toUpperCase()
  const cta = block[1].match(/--grad-cta:\s*linear-gradient\(([^;]+)\);/)
  if (cta) t.__ctaStops = [...cta[1].matchAll(/#[0-9a-fA-F]{6}/g)].map(m => m[0].toUpperCase())
  return t
}

// ---------- parseo de app/globals.css ----------
function tokensOfGlobals(selector) {
  const css = readFileSync(join(here, '..', '..', '..', 'app', 'globals.css'), 'utf8')
  const block = css.match(new RegExp(`(?:^|\\n)${selector.replace('.', '\\.')}\\s*\\{([\\s\\S]*?)\\n\\}`))
  if (!block) throw new Error(`No encontré ${selector} en app/globals.css`)
  const t = {}
  for (const [, k, L, C, H] of block[1].matchAll(/--([\w-]+):\s*oklch\(([\d.]+)\s+([\d.]+)\s+([\d.]+)\)/g)) t[k] = oklchToHex(+L, +C, +H)
  const cta = block[1].match(/--grad-cta:\s*linear-gradient\(([^;]+)\);/)
  if (cta) t.__ctaStops = [...cta[1].matchAll(/#[0-9a-fA-F]{6}/g)].map(m => m[0].toUpperCase())
  return t
}

// Mismos criterios que PAIRS, con los nombres de shadcn/ui que usa la app.
const APP_PAIRS = [
  ['foreground', 'background', 4.5], ['foreground', 'card', 4.5], ['foreground', 'secondary', 4.5], ['foreground', 'accent', 4.5],
  ['muted-foreground', 'background', 4.5], ['muted-foreground', 'card', 4.5], ['muted-foreground', 'secondary', 4.5], ['muted-foreground', 'accent', 4.5],
  ['subtle-foreground', 'background', 4.5], ['subtle-foreground', 'card', 4.5], ['subtle-foreground', 'secondary', 4.5], ['subtle-foreground', 'accent', 4.5],
  ['muted-foreground', 'neutral-subtle', 4.5], ['popover-foreground', 'popover', 4.5],
  ['primary-foreground', 'primary', 4.5], ['primary-foreground', 'primary-hover', 4.5],
  ['primary-text', 'background', 4.5], ['primary-text', 'card', 4.5], ['primary-text', 'primary-subtle', 4.5],
  ['success-foreground', 'card', 4.5], ['success-foreground', 'success-subtle', 4.5],
  ['warning-foreground', 'card', 4.5], ['warning-foreground', 'warning-subtle', 4.5],
  ['danger-foreground', 'card', 4.5], ['danger-foreground', 'danger-subtle', 4.5],
  ['info-foreground', 'card', 4.5], ['info-foreground', 'info-subtle', 4.5],
  ['sidebar-foreground', 'sidebar', 4.5], ['sidebar-muted-foreground', 'sidebar', 4.5], ['sidebar-muted-foreground', 'sidebar-hover', 4.5],
  ['sidebar-accent-foreground', 'sidebar-accent', 4.5], ['sidebar-primary', 'sidebar-accent', 4.5], ['sidebar-primary', 'sidebar', 4.5],
  ['success', 'card', 3], ['warning', 'card', 3], ['danger', 'card', 3], ['info', 'card', 3],
  ['success', 'accent', 3], ['warning', 'accent', 3],
  ['primary', 'card', 3], ['ring', 'card', 3], ['ring', 'background', 3],
  ['input', 'card', 3], ['input', 'background', 3],
]

const THEMES = [
  ['A · Precisión', 'preview-a.html', 'light', 'claro'],
  ['A · Precisión', 'preview-a.html', 'dark', 'oscuro'],
  ['B · Radar', 'preview-b.html', 'dark', 'oscuro'],
  ['B · Radar', 'preview-b.html', 'light', 'claro'],
]

const RUNS = [
  ...THEMES.map(([dir, file, theme, label]) => ({ name: dir, label, tokens: () => tokensOf(file, theme), pairs: PAIRS, fgKey: 'accent-fg' })),
  { name: 'app/globals.css', label: ':root (claro, activo)', tokens: () => tokensOfGlobals(':root'), pairs: APP_PAIRS, fgKey: 'primary-foreground' },
  { name: 'app/globals.css', label: '.dark (oscuro, sin activar)', tokens: () => tokensOfGlobals('.dark'), pairs: APP_PAIRS, fgKey: 'primary-foreground' },
]

let totalFails = 0
const md = []
for (const { name: dir, label, tokens, pairs, fgKey } of RUNS) {
  const t = tokens()
  const rows = []
  for (const [fg, bg, min] of pairs) {
    if (!t[fg] || !t[bg]) { rows.push({ fg, bg, min, r: NaN, ok: false, missing: true }); continue }
    const r = ratio(t[fg], t[bg])
    rows.push({ fg, bg, min, r, ok: r >= min })
  }
  // Texto blanco sobre el degradado del CTA (B): se muestrea en 11 puntos del recorrido.
  if (t.__ctaStops) {
    const s = t.__ctaStops; let worst = Infinity
    for (let i = 0; i < s.length - 1; i++) for (let k = 0; k <= 10; k++) worst = Math.min(worst, ratio(t[fgKey], mix(s[i], s[i + 1], k / 10)))
    rows.push({ fg: fgKey, bg: `grad-cta (${s.join(' → ')}, peor punto)`, min: 4.5, r: worst, ok: worst >= 4.5 })
  }
  const fails = rows.filter(r => !r.ok)
  totalFails += fails.length
  const min = Math.min(...rows.filter(r => r.min === 4.5 && !isNaN(r.r)).map(r => r.r))
  console.log(`\n${dir} — ${label}: ${rows.length - fails.length}/${rows.length} pares OK · peor texto ${min.toFixed(2)}:1`)
  for (const r of (args.has('--all') ? rows : fails)) {
    console.log(`  ${r.ok ? 'ok  ' : 'FALLA'} --${r.fg.padEnd(20)} sobre --${r.bg.padEnd(22)} ${r.missing ? 'token faltante' : r.r.toFixed(2) + ':1'} (mín ${r.min})`)
  }
  if (args.has('--md')) {
    md.push(`\n#### ${dir} — ${label}\n\n| Par | Ratio | Mínimo | |\n|---|---:|---:|---|`)
    for (const r of rows) md.push(`| \`--${r.fg}\` sobre \`--${r.bg}\` | ${r.r.toFixed(2)}:1 | ${r.min}:1 | ${r.ok ? '✅' : '❌'} |`)
  }
  if (args.has('--oklch')) {
    console.log(`  /* ${dir} ${label} → app/globals.css */`)
    for (const [k, v] of Object.entries(t)) if (!k.startsWith('__')) console.log(`  --${k}: ${oklch(v)}; /* ${v} */`)
  }
}
if (md.length) console.log(md.join('\n'))
console.log(totalFails ? `\n${totalFails} pares NO cumplen AA.` : '\nTodos los pares cumplen WCAG 2.1 AA.')
process.exit(totalFails ? 1 : 0)
