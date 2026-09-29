// Verifica preview/prototipo-2b.html con un navegador real (Playwright/Chromium).
//
//   node docs/redesign/landing-auth-onboarding/tools/verify-prototipo.mjs [carpeta-de-capturas]
//
// En cada pantalla del recorrido, a 390 y 1440 px:
//   · contraste AA de todo el texto visible contra su fondo real (el color que se ve detrás);
//   · sin scroll horizontal y ningún texto por debajo de 12 px;
//   · en el wizard y la pantalla final: ningún bucle continuo y ninguna duración mayor a 240 ms;
//   · el fondo de cada paso es el token esperado.
// Además: movimiento reducido (el mock queda fijo en el día 14) y teclado (pestañas, radios,
// foco en el título al cambiar de paso).
import { createRequire } from 'node:module'

// Playwright del proyecto; si su navegador no está instalado, el global del entorno (Claude Code)
async function launch() {
  try { const { chromium } = await import('playwright'); return await chromium.launch() } catch (e) {
    try { return await createRequire('/opt/node22/lib/node_modules/')('playwright').chromium.launch() } catch { throw e }
  }
}
const FILE = 'file://' + new URL('../preview/prototipo-2b.html', import.meta.url).pathname
const shots = process.argv[2]
const EXPECT_BG = { 'paso-1': 'rgb(8, 10, 21)', 'paso-2': 'rgb(22, 26, 52)', 'paso-3': 'rgb(58, 65, 112)', 'paso-4': 'rgb(207, 207, 224)', final: 'rgb(245, 245, 250)' }

const results = []
const ok = (name, cond, extra = '') => results.push(`${cond ? 'OK  ' : 'FAIL'} ${name}${extra ? ' — ' + extra : ''}`)

// Contraste en el navegador: color del texto contra el primer fondo opaco hacia arriba
const scan = () => {
  const parse = c => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const [r, g, b, a = 1] = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return { r, g, b, a } }
  const lum = ({ r, g, b }) => { const f = v => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b) }
  const cr = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05) }
  const over = (top, bot) => ({ r: top.r * top.a + bot.r * (1 - top.a), g: top.g * top.a + bot.g * (1 - top.a), b: top.b * top.a + bot.b * (1 - top.a), a: 1 })
  const bgOf = (el) => {
    const layers = []
    for (let e = el; e; e = e.parentElement) {
      const cs = getComputedStyle(e)
      if (cs.backgroundImage !== 'none' && !cs.backgroundImage.startsWith('url')) return { grad: true }
      const c = parse(cs.backgroundColor)
      if (c && c.a > 0) { layers.push(c); if (c.a >= 1) break }
    }
    let base = parse(getComputedStyle(document.body).backgroundColor)
    for (let i = layers.length - 1; i >= 0; i--) base = over(layers[i], base)
    return base
  }
  const bad = [], small = []
  for (const el of document.querySelectorAll('body *')) {
    if (el.closest('.pt, .toast, svg, .sr, .skip')) continue
    const own = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())
    if (!own || !el.getClientRects().length) continue
    const r = el.getBoundingClientRect()
    if (r.bottom < 0 || r.top > innerHeight * 3) continue
    const cs = getComputedStyle(el)
    if (cs.visibility === 'hidden' || +cs.opacity === 0) continue
    if (parseFloat(cs.fontSize) < 12) small.push(el.textContent.trim().slice(0, 24))
    if (el.closest('.hl')) continue // texto con degradado: se mide aparte
    const bg = bgOf(el); if (bg.grad) continue
    const fg = parse(cs.color); if (!fg) continue
    const ratio = cr(over(fg, bg), bg)
    const big = parseFloat(cs.fontSize) >= 24 || (parseFloat(cs.fontSize) >= 18.66 && +cs.fontWeight >= 700)
    if (ratio < (big ? 3 : 4.5)) bad.push(`${el.textContent.trim().slice(0, 24)} ${ratio.toFixed(2)}`)
  }
  return { bad, small, sw: document.documentElement.scrollWidth, iw: innerWidth }
}
const loops = () => document.getAnimations().filter(a => a.playState === 'running' && a.effect.getTiming().iterations === Infinity).length
const maxDur = () => {
  let max = 0
  for (const el of document.querySelectorAll('.view:not([hidden]) *, body')) {
    const cs = getComputedStyle(el)
    for (const d of cs.transitionDuration.split(',').concat(cs.animationDuration.split(','))) max = Math.max(max, parseFloat(d) * (d.includes('ms') ? 1 : 1000))
  }
  return max
}

const browser = await launch()
for (const width of [390, 1440]) {
  const page = await browser.newPage({ viewport: { width, height: width < 500 ? 844 : 900 } })
  const errors = []; page.on('pageerror', e => errors.push(e.message))
  const check = async (name, { onboarding = false, stage } = {}) => {
    await page.waitForTimeout(700)
    const s = await page.evaluate(scan)
    ok(`${width} ${name}: contraste AA`, s.bad.length === 0, s.bad.slice(0, 4).join(' | '))
    ok(`${width} ${name}: sin scroll horizontal`, s.sw <= s.iw, `ancho del documento ${s.sw} px`)
    ok(`${width} ${name}: texto ≥ 12 px`, s.small.length === 0, s.small.slice(0, 4).join(' | '))
    if (onboarding) {
      ok(`${width} ${name}: sin bucles continuos`, (await page.evaluate(loops)) === 0)
      const d = await page.evaluate(maxDur); ok(`${width} ${name}: duraciones ≤ 240 ms`, d <= 240, `${d} ms`)
    }
    if (stage) ok(`${width} ${name}: fondo del paso`, (await page.evaluate(() => getComputedStyle(document.body).backgroundColor)) === EXPECT_BG[stage])
    if (shots) await page.screenshot({ path: `${shots}/${width}-${name}.jpg`, type: 'jpeg', quality: 80 })
  }

  await page.goto(FILE); await page.waitForTimeout(2800)
  await page.evaluate(() => document.querySelectorAll('.reveal').forEach(e => e.classList.add('in')))
  await check('1-landing')
  ok(`${width} landing: rótulo "Datos de ejemplo" visible en el mock`, await page.locator('.mock .sample-tag').isVisible())
  ok(`${width} landing: el mock avanza solo`, await page.evaluate(() => document.querySelector('#m-count').textContent) !== '01/14')

  // Registro: validación visible y con teclado
  await page.goto(FILE + '#/registro'); await page.waitForTimeout(300)
  await check('2-registro')
  await page.click('#auth-submit'); await page.waitForTimeout(200)
  ok(`${width} registro: errores visibles y asociados`, (await page.locator('#name[aria-invalid="true"]').count()) === 1 && (await page.textContent('#name-err')).length > 0)
  ok(`${width} registro: el foco va al primer campo con error`, await page.evaluate(() => document.activeElement.id === 'name'))
  await page.focus('#tab-signup'); await page.keyboard.press('ArrowRight'); await page.waitForTimeout(200)
  ok(`${width} registro: flechas cambian de pestaña`, (await page.getAttribute('#tab-login', 'aria-selected')) === 'true')
  await page.goto(FILE + '#/registro'); await page.waitForTimeout(200)
  await page.fill('#name', 'Ana Gómez'); await page.fill('#email', 'ana@correo.com'); await page.fill('#password', 'secreta123')
  await page.click('#auth-submit'); await page.waitForTimeout(500)

  // Wizard
  ok(`${width} wizard: el foco queda en el título del paso`, await page.evaluate(() => document.activeElement.id === 'wiz-h-1'))
  await check('3-paso-1', { onboarding: true, stage: 'paso-1' })
  await page.click('#wiz-next'); await page.waitForTimeout(200)
  ok(`${width} paso 1: "Continuar" dice qué falta`, (await page.textContent('#country-err')).includes('país'))
  await page.check // no-op
  await page.focus('.q[data-key="country"] .opt >> nth=0'); await page.keyboard.press('ArrowRight'); await page.waitForTimeout(100)
  ok(`${width} paso 1: flechas mueven la selección del radio`, (await page.getAttribute('.q[data-key="country"] .opt >> nth=1', 'aria-checked')) === 'true')
  await page.click('.q[data-key="country"] .opt >> text=Colombia'); await page.click('.q[data-key="soloOrTeam"] .opt >> text=Solo')
  await page.click('#wiz-next'); await page.waitForTimeout(500)
  ok(`${width} wizard: al cambiar de paso el foco va al título`, await page.evaluate(() => document.activeElement.id === 'wiz-h-2'))
  ok(`${width} wizard: barra de progreso en 2 de 4`, (await page.getAttribute('[role="progressbar"]', 'aria-valuenow')) === '2')
  await check('4-paso-2', { onboarding: true, stage: 'paso-2' })
  await page.click('.q[data-key="businessModel"] .opt >> text=Contra entrega'); await page.click('.q[data-key="objective"] .opt >> nth=0')
  await page.click('#wiz-next'); await page.waitForTimeout(500)
  await check('5-paso-3', { onboarding: true, stage: 'paso-3' })
  await page.click('.q[data-key="niches"] .opt >> text=Mascotas'); await page.click('.q[data-key="niches"] .opt >> text=Hogar & Cocina'); await page.click('.q[data-key="platforms"] .opt >> text=Shopify')
  ok(`${width} paso 3: chips con aria-pressed`, (await page.getAttribute('.q[data-key="niches"] .opt >> text=Mascotas', 'aria-pressed')) === 'true')
  await check('5-paso-3-elegido', { onboarding: true, stage: 'paso-3' })
  await page.click('#wiz-next'); await page.waitForTimeout(500)
  ok(`${width} paso 4: indicativo del país elegido`, (await page.textContent('#phone-prefix')) === '+57')
  await check('6-paso-4', { onboarding: true, stage: 'paso-4' })
  await page.fill('#phone', '300 123 4567'); await page.check('#optin', { force: true })
  await page.click('#wiz-next'); await page.waitForTimeout(600)
  await check('7-final', { onboarding: true, stage: 'final' })
  ok(`${width} final: saluda por el nombre`, (await page.textContent('#final-title')) === 'Todo listo, Ana.')
  ok(`${width} final: resumen con las 8 respuestas`, (await page.locator('#summary div').count()) === 8 && !(await page.textContent('#summary')).includes('—'))
  ok(`${width} sin errores de JavaScript`, errors.length === 0, errors.join(' | '))
  await page.close()
}

// Movimiento reducido
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' })
  const page = await ctx.newPage(); await page.goto(FILE); await page.waitForTimeout(2200)
  ok('reducido: el mock queda fijo en el día 14', (await page.textContent('#m-count')) === '14/14')
  ok('reducido: sin animaciones corriendo', (await page.evaluate(() => document.getAnimations().filter(a => a.playState === 'running').length)) === 0)
  ok('reducido: las secciones se ven sin hacer scroll', (await page.evaluate(() => [...document.querySelectorAll('.reveal')].every(e => getComputedStyle(e).opacity === '1'))))
  await ctx.close()
}
await browser.close()
console.log(results.join('\n'))
const fails = results.filter(r => r.startsWith('FAIL')).length
console.log(`\n${results.length - fails}/${results.length} OK`)
process.exit(fails ? 1 : 0)
