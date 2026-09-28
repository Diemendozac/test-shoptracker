#!/usr/bin/env node
// Verificador de contraste (WCAG 2.1 AA) para los previews de detalle de producto.
//
// Complementa a docs/redesign/tools/contrast-check.mjs, que verifica los pares de tokens
// de app/globals.css pero no conoce estos previews. Este script:
//   1. Confirma que el bloque :root de cada preview trae los MISMOS valores que app/globals.css.
//   2. Verifica los pares que agregan los componentes nuevos, incluidos los compuestos:
//      chips sobre creativos (tinta al 80 % sobre blanco y sobre negro), overlay de bloqueo
//      (card al 85 % sobre el peor fondo), badges, fila seleccionada, barra de confianza.
//
// Uso (sin dependencias, Node 18+):
//   node docs/redesign/detalle-producto/tools/contrast-check-detalle.mjs        → resumen, exit 1 si algo falla
//   node docs/redesign/detalle-producto/tools/contrast-check-detalle.mjs --all  → todos los pares

import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const all = process.argv.includes('--all')

// ---------- color ----------
const hexToRgb = h => { h = h.replace('#', ''); return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16) / 255) }
const toLin = c => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
const lum = h => { const [r, g, b] = hexToRgb(h).map(toLin); return 0.2126 * r + 0.7152 * g + 0.0722 * b }
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05) }
// Color `fg` con opacidad `alpha` sobre `bg` (mezcla en sRGB, como el navegador)
const over = (fg, alpha, bg) => '#' + hexToRgb(fg).map((v, i) => Math.round((v * alpha + hexToRgb(bg)[i] * (1 - alpha)) * 255).toString(16).padStart(2, '0')).join('').toUpperCase()
function oklchToHex(L, C, H) {
  const h = (H * Math.PI) / 180, a = C * Math.cos(h), b = C * Math.sin(h)
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3, m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3, s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3
  const rgb = [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s]
  const enc = c => { c = Math.min(1, Math.max(0, c)); return c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055 }
  return '#' + rgb.map(c => Math.round(enc(c) * 255).toString(16).padStart(2, '0')).join('').toUpperCase()
}

// ---------- tokens ----------
function globalsRoot() {
  const css = readFileSync(join(here, '..', '..', '..', '..', 'app', 'globals.css'), 'utf8')
  const block = css.match(/\n:root\s*\{([\s\S]*?)\n\}/)[1]
  const t = {}
  for (const [, k, L, C, H] of block.matchAll(/--([\w-]+):\s*oklch\(([\d.]+)\s+([\d.]+)\s+([\d.]+)\)/g)) t[k] = oklchToHex(+L, +C, +H)
  const cta = block.match(/--grad-cta:\s*linear-gradient\(([^;]+)\);/)
  if (cta) t.__cta = [...cta[1].matchAll(/#[0-9a-fA-F]{6}/g)].map(m => m[0].toUpperCase())
  return t
}
function previewRoot(file) {
  const html = readFileSync(join(here, '..', file), 'utf8')
  const block = html.match(/:root\{([\s\S]*?)\n\}/)[1]
  const t = {}
  for (const [, k, v] of block.matchAll(/--([\w-]+):\s*(#[0-9A-Fa-f]{6})\b/g)) t[k] = v.toUpperCase()
  return t
}

const G = globalsRoot()
let fails = 0
const out = []

// 1 · Los previews usan los tokens reales
for (const file of ['preview-panel.html', 'preview-pagina.html']) {
  const P = previewRoot(file)
  const keys = Object.keys(G).filter(k => !k.startsWith('__'))
  const diff = keys.filter(k => P[k] !== G[k])
  if (diff.length) { fails += diff.length; out.push(`✗ ${file}: ${diff.length} tokens distintos de app/globals.css → ${diff.map(k => `${k} ${P[k]} ≠ ${G[k]}`).join(', ')}`) }
  else out.push(`✓ ${file}: ${keys.length} tokens idénticos a app/globals.css (:root)`)
}

// 2 · Pares de los componentes nuevos
const t = G, WHITE = '#FFFFFF', BLACK = '#000000'
const scrim = bg => over(t.sidebar, 0.8, bg) // bg-sidebar/80
const lockBg = bg => over(t.card, 0.85, bg)  // overlay de bloqueo: bg-card/85 sobre la grilla borrosa
const PAIRS = [
  // [descripción, texto/gráfico, fondo, mínimo]
  ['Texto principal sobre tarjeta', t.foreground, t.card, 4.5],
  ['Etiquetas (overline) sobre tarjeta', t['muted-foreground'], t.card, 4.5],
  ['Fechas, subtítulos, "Meta · Pro" bloqueado', t['subtle-foreground'], t.card, 4.5],
  ['Links (Ver en Meta, Ver completa)', t['primary-text'], t.card, 4.5],
  ['"Activo", crecimiento > 0, ↑ rank', t['success-foreground'], t.card, 4.5],
  ['↓ rank (columna Cambio)', t['danger-foreground'], t.card, 4.5],
  ['Confianza < 50 % (texto) en el panel', t['warning-foreground'], t.card, 4.5],
  ['Veredicto: texto sobre superficie --background', t.foreground, t.background, 4.5],
  ['Veredicto: "Confianza" sobre --background', t['muted-foreground'], t.background, 4.5],
  ['Veredicto: confianza < 50 % sobre --background', t['warning-foreground'], t.background, 4.5],
  ['Veredicto: confianza ≥ 50 % sobre --background', t['success-foreground'], t.background, 4.5],
  ['Chips de anunciante (texto) sobre --secondary', t.foreground, t.secondary, 4.5],
  ['Segmented / cabecera de tabla sobre --secondary', t['muted-foreground'], t.secondary, 4.5],
  ['Fila seleccionada: título', t.foreground, t['primary-subtle'], 4.5],
  ['Fila seleccionada: "Rank #12"', t['subtle-foreground'], t['primary-subtle'], 4.5],
  ['Tarjeta G-2: texto secundario', t['muted-foreground'], t['primary-subtle'], 4.5],
  ['Badge "En alza"', t['success-foreground'], t['success-subtle'], 4.5],
  ['Badge "Estable"', t['info-foreground'], t['info-subtle'], 4.5],
  ['Badge "Nuevo"', t['primary-text'], t['primary-subtle'], 4.5],
  ['Chip ↑ rank', t['success-foreground'], t['success-subtle'], 4.5],
  ['Chip ↓ rank', t['danger-foreground'], t['danger-subtle'], 4.5],
  ['Pastilla del topbar', t['warning-foreground'], t['warning-subtle'], 4.5],
  ['Chips ×N / días sobre creativo BLANCO (tinta 80 %)', t['sidebar-foreground'], scrim(WHITE), 4.5],
  ['Chips ×N / días sobre creativo NEGRO (tinta 80 %)', t['sidebar-foreground'], scrim(BLACK), 4.5],
  ['Chip "≥ 30 d": blanco sobre success-foreground', WHITE, t['success-foreground'], 4.5],
  ['Bloqueo: título sobre card 85 % con creativo negro', t.foreground, lockBg(BLACK), 4.5],
  ['Bloqueo: texto secundario, peor caso (creativo negro)', t['muted-foreground'], lockBg(BLACK), 4.5],
  ['Marca "R-1"', t['warning-foreground'], t.card, 4.5],
  // Gráficos y componentes de UI (1.4.11: 3:1)
  ['Línea del rank / barras del score (--primary)', t.primary, t.card, 3],
  ['Arco verde del anillo sobre la pista', t.success, t['score-track'], 3],
  ['Arco ámbar del anillo sobre la pista', t.warning, t['score-track'], 3],
  ['Barra de confianza ámbar sobre la pista', t.warning, t['score-track'], 3],
  ['Barra de confianza verde sobre la pista', t.success, t['score-track'], 3],
  ['Borde de botón outline y select (--input)', t.input, t.card, 3],
  ['Punto "Activo" (--success)', t.success, t.card, 3],
  ['Fila seleccionada: barra lateral --primary', t.primary, t['primary-subtle'], 3],
]
for (const [name, fg, bg, min] of PAIRS) {
  const r = ratio(fg, bg), ok = r >= min
  if (!ok) fails++
  if (all || !ok) out.push(`${ok ? '✓' : '✗'} ${r.toFixed(2).padStart(5)}:1 (mín. ${min})  ${name}  [${fg} sobre ${bg}]`)
}
// Texto blanco sobre el degradado del CTA "Spikear" (peor punto de 11 muestras)
const [a, b] = t.__cta
let worst = Infinity
for (let k = 0; k <= 10; k++) worst = Math.min(worst, ratio(t['primary-foreground'], over(b, k / 10, a)))
if (worst < 4.5) fails++
if (all || worst < 4.5) out.push(`${worst >= 4.5 ? '✓' : '✗'} ${worst.toFixed(2).padStart(5)}:1 (mín. 4.5)  "Spikear": blanco sobre grad-cta, peor punto  [${a} → ${b}]`)

const total = PAIRS.length + 1
console.log(out.join('\n'))
console.log(`\n${total - Math.min(fails, total)}/${total} pares de componentes cumplen AA${fails ? ` · ${fails} fallas` : ''}.`)
process.exit(fails ? 1 : 0)
