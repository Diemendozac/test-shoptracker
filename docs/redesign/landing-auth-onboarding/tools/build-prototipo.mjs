// Genera preview/prototipo-2b.html: el recorrido navegable de la dirección 1 (landing → registro
// → wizard → entrada al dashboard), autocontenido (se abre con doble clic, sin internet).
//
//   node docs/redesign/landing-auth-onboarding/tools/build-prototipo.mjs
//
// Para que no se desactualice:
//   · los colores salen de app/globals.css en cada build (:root, .dark y las etapas del wizard
//     de theme-stages.mjs, que falla si algún texto no llega a AA);
//   · los íconos salen de node_modules/lucide-react (los mismos que usa la app);
//   · el logo es el trazado de components/ui/dropspy-logo.tsx.
// Los componentes de datos del mock (ScoreRing, PhaseBadge, gráfico de rank) son réplicas: en la
// fase 3 el mock tiene que importar los componentes reales (ver 02-prototipo-y-spec.md).
import { readFileSync, writeFileSync } from 'node:fs'
import { DARK, LIGHT, buildStages } from './theme-stages.mjs'
import { makeViews } from './prototipo/views.mjs'

const here = new URL('.', import.meta.url).pathname
const REPO = new URL('../../../../', import.meta.url).pathname
const OUT = new URL('../preview/prototipo-2b.html', import.meta.url).pathname

// ─── Íconos de lucide-react ──────────────────────────────────────────────────
function lucide(name, cls = '') {
  const src = readFileSync(`${REPO}node_modules/lucide-react/dist/esm/icons/${name}.js`, 'utf8')
  const arr = src.match(/const __iconNode = (\[[\s\S]*?\]);\n/)[1]
  const nodes = new Function(`return ${arr}`)()
  const inner = nodes.map(([tag, attrs]) => `<${tag} ${Object.entries(attrs).filter(([k]) => k !== 'key').map(([k, v]) => `${k}="${v}"`).join(' ')}/>`).join('')
  return `<svg class="ico ${cls}" viewBox="0 0 24 24" aria-hidden="true">${inner}</svg>`
}

// ─── Logo (components/ui/dropspy-logo.tsx, con el degradado de marca) ────────
const logoSrc = readFileSync(`${REPO}components/ui/dropspy-logo.tsx`, 'utf8')
const LOGO_D = [...logoSrc.matchAll(/'(M[^']+Z)'/g)].map(m => m[1]).join(' ')
if (!LOGO_D) throw new Error('No encontré el trazado del logo en dropspy-logo.tsx')
let logoN = 0
const logo = (size = 26) => {
  const id = `lg${++logoN}`
  return `<svg width="${size}" height="${size}" viewBox="0 0 500 500" aria-hidden="true"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7C5CFF"/><stop offset=".5" stop-color="#4F7BFF"/><stop offset="1" stop-color="#22C3E6"/></linearGradient></defs><path fill-rule="evenodd" fill="url(#${id})" d="${LOGO_D}"/></svg>`
}

// ─── Tokens ──────────────────────────────────────────────────────────────────
const SKIP = /^(sidebar|chart-|rising|watching|declining|stable|radius)/
const decl = (vars) => Object.entries(vars).filter(([k]) => !SKIP.test(k)).map(([k, v]) => `--${k}:${v}`).join(';')
const stages = buildStages()
const tokensCss = [
  `/* Copiado de app/globals.css al generar. No editar a mano: correr tools/build-prototipo.mjs */`,
  `[data-stage="dark"]{${decl(DARK)};color-scheme:dark}`,
  ...stages.map(s => `[data-stage="${s.name}"]{${decl(s.vars)};color-scheme:${s.side}}`),
].join('\n')

// ─── Fuentes: las mismas de las direcciones de 2A (Inter y Outfit, SIL OFL 1.1) ─
const d1 = readFileSync(new URL('../preview/direccion-1.html', import.meta.url), 'utf8')
const fonts = d1.match(/<style>(@font-face[\s\S]*?)<\/style>/)[1]

// ─── Vistas ──────────────────────────────────────────────────────────────────
const views = makeViews({ icon: lucide, logo })
const phaseHtml = (p, ico, cls) => `<span class="phase ${cls}">${lucide(ico, 'ph-ico')}<span>${p}</span></span>`
const clientData = `window.__COUNTRIES__=${JSON.stringify(Object.fromEntries(views.COUNTRIES))};window.__PHASE__=${JSON.stringify({ Meseta: phaseHtml('Meseta', 'minus', 'ph-meseta'), Despegue: phaseHtml('Despegue', 'rocket', 'ph-despegue') })};`

const toolbar = `
<details class="pt">
  <summary>Prototipo</summary>
  <div class="pt-menu" role="group" aria-label="Controles del prototipo">
    <a href="#/" data-jump="/">1 · Landing</a>
    <a href="#/registro" data-jump="/registro">2 · Registro</a>
    <a href="#/bienvenida/1" data-jump="/bienvenida/1">3 · Wizard, paso 1</a>
    <a href="#/bienvenida/2" data-jump="/bienvenida/2">3 · Wizard, paso 2</a>
    <a href="#/bienvenida/3" data-jump="/bienvenida/3">3 · Wizard, paso 3</a>
    <a href="#/bienvenida/4" data-jump="/bienvenida/4">3 · Wizard, paso 4</a>
    <a href="#/listo" data-jump="/listo">4 · Entrada al dashboard</a>
    <hr>
    <button type="button" id="pt-motion">Movimiento: normal</button>
    <p class="pt-note">Estos controles no son parte del diseño. Saltar a un paso completa los anteriores con datos de ejemplo.</p>
  </div>
</details>`

const html = `<!doctype html>
<html lang="es" data-motion="full">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Prototipo 2B · Dropspy</title>
<!--
  Fase 2B · dirección 1 "Terminal de inteligencia", con el mock del producto vivo de la dirección 3.
  Recorrido: landing (oscuro) → registro (oscuro) → wizard de 4 pasos (se aclara en cada paso) → entrada al dashboard (claro).
  Generado por tools/build-prototipo.mjs: no editar a mano. Spec: 02-prototipo-y-spec.md.
  Todos los datos de productos y tiendas son de ejemplo y están rotulados.
-->
<style>${fonts}</style>
<style>
${tokensCss}
${readFileSync(here + 'prototipo/styles.css', 'utf8')}
</style>
</head>
<body data-stage="dark">
<a class="skip" href="#/" data-skip>Saltar al contenido</a>
${views.landing}
${views.auth}
${views.wizard}
${views.final}
${toolbar}
<div class="toast" id="toast" role="status" aria-live="polite"></div>
<script>${clientData}</script>
<script>
${readFileSync(here + 'prototipo/app.js', 'utf8')}
</script>
</body>
</html>
`
writeFileSync(OUT, html)
console.log(`ok ${(html.length / 1024).toFixed(0)} KB → ${OUT.replace(REPO, '')}`)
for (const s of stages) {
  const worst = s.report.reduce((m, r) => Math.min(m, r.fondo / r.min, r.tarjeta / r.min), Infinity)
  console.log(`  ${s.name.padEnd(7)} fondo ${s.vars.background} · tarjeta ${s.vars.card} · margen AA mínimo ×${worst.toFixed(2)}`)
}
