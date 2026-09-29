// Tokens reales de app/globals.css (:root y .dark) y las etapas intermedias del wizard.
//
// El wizard arranca en el tema oscuro y termina en el claro, aclarándose un poco en cada paso
// (decisión de Daniel, fase 2B). Los fondos y superficies intermedios son mezclas en OKLab de
// los dos tokens reales; los textos se ajustan (hacia el foreground de su lado) lo mínimo para
// que cada par cumpla WCAG AA. Si algún par no llega, este módulo lanza un error: nunca se
// genera una etapa que no se pueda leer.
import { readFileSync } from 'node:fs'

const here = new URL('.', import.meta.url).pathname
const REPO = new URL('../../../../', import.meta.url).pathname

// ─── Color ───────────────────────────────────────────────────────────────────
const toLin = c => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
const toSrgb = c => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055)
export function hexToRgb(h) { return [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255) }
export function rgbToHex(rgb) { return '#' + rgb.map(c => Math.round(Math.min(1, Math.max(0, c)) * 255).toString(16).padStart(2, '0')).join('').toUpperCase() }
export function luminance(hex) { const [r, g, b] = hexToRgb(hex).map(toLin); return 0.2126 * r + 0.7152 * g + 0.0722 * b }
export function contrast(a, b) { const x = luminance(a), y = luminance(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05) }
function rgbToOklab(hex) {
  const [r, g, b] = hexToRgb(hex).map(toLin)
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s]
}
function oklabToHex([L, a, b]) {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3, m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3, s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3
  return rgbToHex([4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s].map(toSrgb))
}
export function mix(a, b, t) { const A = rgbToOklab(a), B = rgbToOklab(b); return oklabToHex(A.map((v, i) => v + (B[i] - v) * t)) }
function oklchToHex(L, C, H) { const h = (H * Math.PI) / 180; return oklabToHex([L, C * Math.cos(h), C * Math.sin(h)]) }

// ─── Tokens de globals.css ───────────────────────────────────────────────────
function block(css, selector) {
  const m = css.match(new RegExp('\\n' + selector.replace('.', '\\.') + '\\s*\\{([\\s\\S]*?)\\n\\}'))
  if (!m) throw new Error('No encontré ' + selector + ' en globals.css')
  const out = {}
  for (const d of m[1].replace(/\/\*[\s\S]*?\*\//g, '').split(';')) {
    const mm = d.trim().match(/^--([\w-]+):\s*(.+)$/s)
    if (!mm) continue
    const v = mm[2].trim().replace(/oklch\(([\d.]+)\s+([\d.]+)\s+([\d.]+)\)/g, (_, L, C, H) => oklchToHex(+L, +C, +H))
    out[mm[1]] = v.replace(/\s+/g, ' ')
  }
  return out
}
const css = readFileSync(REPO + 'app/globals.css', 'utf8')
export const LIGHT = block(css, ':root')
export const DARK = { ...LIGHT, ...block(css, '.dark') }

// ─── Etapas del wizard ───────────────────────────────────────────────────────
// El fondo de cada paso es un token REAL de la escala de tinta de la app (no una mezcla):
// oscuro → tinta → índigo → lavanda → claro. Las mezclas en OKLab pasaban por grises apagados
// (#5F616B en el paso 3) y obligaban a llevar los textos secundarios casi a blanco.
// Entre el paso 3 y el 4 el texto cambia de claro a oscuro: ahí el fondo salta la franja de
// grises (luminancia relativa ~0,18–0,22) en la que ni el texto claro ni el oscuro llegan a AA.
export const STAGES = [
  { name: 'paso-1', side: 'dark', bg: ['dark', 'background'], card: ['dark', 'card'] },          // #080A15 / #10132A
  { name: 'paso-2', side: 'dark', bg: ['dark', 'popover'], card: ['dark', 'accent'] },            // #161A34 / #1E2342
  { name: 'paso-3', side: 'dark', bg: ['dark', 'border-hover'], card: ['light', 'sidebar-accent'] }, // #3A4170 / #232850
  { name: 'paso-4', side: 'light', bg: ['light', 'border-hover'], card: ['light', 'card'] },      // #CFCFE0 / #FFFFFF
  { name: 'final', side: 'light', bg: ['light', 'background'], card: ['light', 'card'] },         // #F5F5FA / #FFFFFF
]

// Textos y bordes de controles: se ajustan (hacia el foreground de su lado) hasta cumplir el
// mínimo contra el fondo y la tarjeta del paso
const TEXT = { foreground: 4.5, 'muted-foreground': 4.5, 'subtle-foreground': 4.5, 'primary-text': 4.5, 'danger-foreground': 4.5, 'success-foreground': 4.5, 'warning-foreground': 4.5, input: 3 }

function fit(color, towards, surfaces, min) {
  // Busca el menor s ∈ [0,1] tal que mix(color, towards, s) cumple `min` contra todas las superficies
  const ok = c => surfaces.every(s => contrast(c, s) >= min)
  if (ok(color)) return { color, s: 0 }
  if (!ok(mix(color, towards, 1))) return { color: mix(color, towards, 1), s: 1, fail: true }
  let lo = 0, hi = 1
  for (let i = 0; i < 30; i++) { const m = (lo + hi) / 2; ok(mix(color, towards, m)) ? (hi = m) : (lo = m) }
  return { color: mix(color, towards, hi), s: hi }
}

const SET = { dark: DARK, light: LIGHT }
export function buildStages() {
  const out = []
  for (const st of STAGES) {
    const set = SET[st.side]
    const v = { ...set }
    v.background = SET[st.bg[0]][st.bg[1]]
    v.card = v.popover = SET[st.card[0]][st.card[1]]
    const report = []
    for (const [k, min] of Object.entries(TEXT)) {
      const r = fit(set[k], set.foreground, [v.background, v.card], min)
      if (r.fail) throw new Error(`Etapa ${st.name}: ${k} no llega a ${min}:1`)
      v[k] = r.color
      report.push({ token: k, color: r.color, ajuste: r.s, min, fondo: contrast(r.color, v.background), tarjeta: contrast(r.color, v.card) })
    }
    out.push({ ...st, vars: v, report })
  }
  return out
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  for (const st of buildStages()) {
    console.log(`\n${st.name}  fondo ${st.vars.background}  tarjeta ${st.vars.card}  (${st.side})`)
    for (const r of st.report) console.log(`  ${r.token.padEnd(20)} ${r.color}  ajuste ${(r.ajuste * 100).toFixed(0).padStart(3)}%  fondo ${r.fondo.toFixed(2)}  tarjeta ${r.tarjeta.toFixed(2)}  (mín ${r.min})`)
  }
}
