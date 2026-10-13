#!/usr/bin/env node
// Capturas y chequeos de Competidores (/stores) sin backend ni sesión real.
//
// Levanta la app con la API apuntando a un host falso y aquí se responde con datos de ejemplo:
//   NEXT_PUBLIC_API_URL=http://api.mock/api ./node_modules/.bin/next dev -p 3107
//   node docs/redesign/competidores/tools/capturas.mjs --out docs/redesign/competidores/capturas/despues
//
// Opciones: --base http://localhost:3107 · --out <carpeta> · --estados datos,vacio,error,cargando
//           --reduced (prefers-reduced-motion) · --dark · --ruta /home (otra pantalla con los mismos datos)
//           --teclado (recorre la primera tarjeta con Tab e informa el foco visible)
//
// Además de las capturas, mide lo que se rompía en producción (2026-10-13): contenido de una
// tarjeta que se sale de su borde y se mete en la vecina. Imprime un JSON por vista.

import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'

const argv = process.argv.slice(2)
const arg = (k, d) => { const i = argv.indexOf(`--${k}`); return i >= 0 ? argv[i + 1] : d }
const BASE = arg('base', 'http://localhost:3107')
const OUT = arg('out', 'capturas')
const ESTADOS = arg('estados', 'datos,vacio,error,cargando').split(',')
const REDUCED = argv.includes('--reduced')
const DARK = argv.includes('--dark')
const RUTA = arg('ruta', '/stores')
const TECLADO = argv.includes('--teclado')
const VIEWPORTS = [{ name: '390', width: 390, height: 844 }, { name: '1440', width: 1440, height: 900 }]

// ---------- Datos de ejemplo (nombres y títulos inventados) ----------

const DAY = 86400000
const iso = (daysAgo) => new Date(Date.now() - daysAgo * DAY).toISOString().slice(0, 10)

const STORES = [
  // [id, nombre, país, moneda, pago anticipado, tier, productos nuevos en 7 días, más viejos, anuncios, título largo]
  ['s1', 'moda-oriente', 'CN', 'GBP', true, 'ACTIVA', 21, 6, 7, '⏳LAST DAY SALE ONLY £13.99!!🔥✨ Timeless Comfort Wide Leg Trousers for Women – Breathable'],
  ['s2', 'casa-estilo', 'CO', 'COP', null, 'MODERADA', 2, 3, 0, '✨ Tablero LED + Kit de Dibujo Completo para Niños con 48 Accesorios'],
  ['s3', 'la-mejor-oferta', 'CO', 'COP', null, 'ACTIVA', 1, 4, 0, 'Billetera Antirrobo con Escudo RFID: Tu plata a salvo de los ladrones'],
  ['s4', 'nutri-plus', 'CO', 'COP', null, 'ACTIVA', 0, 5, 0, 'Colágeno Marino Hidrolizado + Biotina y Vitamina C – 60 cápsulas'],
  ['s5', 'gadget-norte', 'US', 'USD', true, 'INACTIVA', 29, 8, 2, '16 Pcs Interchangeable Welcome Sign for Front Door with Seasonal Icons'],
  ['s6', 'brit-deals', 'GB', 'GBP', true, 'INACTIVA', 28, 2, 13, '🎁💥LAST DAY SPECIAL PRICE!- £7.99!!✨Ice-Cooling Hat for Summer Walks'],
  ['s7', 'tienda-dormida', 'CO', 'COP', null, 'ZOMBIE', 0, 0, 0, null],
  ['s8', 'viral-shop', 'CO', 'COP', null, 'INACTIVA', 0, 2, 1, 'Faja Reductora Invisible'],
]

function svgThumb(n) {
  const hues = [262, 205, 160, 25, 330, 45, 190, 280]
  const h = hues[n % hues.length]
  return `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" fill="hsl(${h} 55% 86%)"/><circle cx="40" cy="34" r="16" fill="hsl(${h} 45% 62%)"/><rect x="18" y="56" width="44" height="10" rx="5" fill="hsl(${h} 45% 70%)"/></svg>`
}

function candidatesFor([id, name, country, currency, pago, , fresh, older, , title]) {
  const out = []
  const total = fresh + older
  for (let i = 0; i < total; i++) {
    const days = i < fresh ? 1 + (i % 7) : 8 + ((i * 5) % 20)
    const start = 40 + i * 3
    const rankHistory = Array.from({ length: Math.min(days, 7) }, (_, k) => Math.max(1, start - k * (i === 0 ? 6 : 1)))
    out.push({
      candidateId: `${id}-c${i}`, storeId: id, storeName: name,
      productTitle: i === 0 && title ? title : `Producto de ejemplo ${i + 1}`,
      productImage: `https://img.mock/${id}-${i}.jpg`,
      productPrice: 89000, currentRank: rankHistory.at(-1) ?? null,
      estUnitsDayLow: null, estRevDayLow: null, storeCountry: country, niche: null,
      currency, pagoAnticipado: pago, daysElapsed: days, firstSeenDate: iso(days),
      performanceScore: i === 0 ? 62 : 20 + (i % 5), entryScore: null, entryRank: start,
      performanceLabel: 'Steady', growthPct: 10, daysInBestseller: days, storeProductCount: 120,
      signalConfidence: Math.min(1, days / 15), cyclePhase: null, rankHistory,
    })
  }
  return out
}

function fixtures(estado) {
  if (estado === 'vacio') return { stores: [], tracker: [], pending: [], ads: {} }
  const stores = STORES.map(([id, name, country, currency, pago, tier]) => ({
    storeId: id, storeName: name, baseUrl: `https://${name}.myshopify.com`, bestsellerPath: '/collections/all',
    isActive: true, lastScrapedAt: new Date().toISOString(), niche: null, currency, country,
    pagoAnticipado: pago, inactivityScore: null, inactivityTier: tier, productCount: 120,
  }))
  stores.push({ ...stores[3], storeId: 's9', storeName: 'pausada-ejemplo', isActive: false, inactivityTier: null })
  const tracker = STORES.flatMap(candidatesFor)
  const pending = [
    { candidateId: 'p1', storeId: 's3', storeName: 'la-mejor-oferta', productHandle: 'enterizo', productTitle: 'Enterizo Relax: Fresca, divina y lista en 1 minuto.', productImage: 'https://img.mock/p1.jpg', productUrl: null, productPrice: 120000, currency: 'COP', firstSeenDate: iso(1), firstSeenRank: 144 },
    { candidateId: 'p2', storeId: 's3', storeName: 'la-mejor-oferta', productHandle: 'panty', productTitle: 'Panty Moldeador Efecto Piel: Cuerpazo sin Asfixiarte', productImage: 'https://img.mock/p2.jpg', productUrl: null, productPrice: 88000, currency: 'COP', firstSeenDate: iso(1), firstSeenRank: 137 },
  ]
  const ads = Object.fromEntries(STORES.map((s) => [s[0], s[8]]))
  return { stores, tracker, pending, ads }
}

const ME = { userId: 'u-demo', email: 'demo@ejemplo.com', plan: 'starter', maxStores: 15, createdAt: iso(40), autoDetectCandidates: false, preferredCurrency: 'COP' }

// JWT de mentira: la app solo lo decodifica para leer el email; nunca se verifica aquí.
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url')
const FAKE_JWT = `${b64({ alg: 'none' })}.${b64({ sub: ME.email, userId: ME.userId, exp: 4102444800 })}.x`

// ---------- Chequeos ----------

const MEASURE = () => {
  const doc = document.scrollingElement
  const cards = [...document.querySelectorAll('main article')]
  const overflow = cards.map((card) => {
    const r = card.getBoundingClientRect()
    const worst = [...card.querySelectorAll('*')].reduce((m, el) => Math.max(m, el.getBoundingClientRect().right - r.right), 0)
    return Math.round(worst)
  })
  return {
    horizontalScroll: doc.scrollWidth > doc.clientWidth + 1,
    cards: cards.length,
    cardsOverflowing: overflow.filter((px) => px > 1).length,
    worstOverflowPx: Math.max(0, ...overflow),
    deadLinks: document.querySelectorAll('a[href="#"]').length,
  }
}

async function run() {
  mkdirSync(OUT, { recursive: true })
  const browser = await chromium.launch()
  const results = []
  for (const estado of ESTADOS) {
    const data = fixtures(estado)
    for (const vp of VIEWPORTS) {
      const ctx = await browser.newContext({
        viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 1,
        reducedMotion: REDUCED ? 'reduce' : 'no-preference', colorScheme: DARK ? 'dark' : 'light',
      })
      await ctx.addInitScript(([token, user]) => {
        localStorage.setItem('auth_token', token)
        localStorage.setItem('auth_user', JSON.stringify(user))
      }, [FAKE_JWT, { id: ME.userId, email: ME.email }])
      const page = await ctx.newPage()
      const errors = []
      page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)) })
      page.on('pageerror', (e) => errors.push(String(e).slice(0, 200)))

      await page.route('**/api/image-proxy**', (route) => {
        const n = [...route.request().url()].reduce((a, c) => a + c.charCodeAt(0), 0)
        return route.fulfill({ status: 200, contentType: 'image/svg+xml', body: svgThumb(n) })
      })
      await page.route('http://api.mock/**', async (route) => {
        const path = new URL(route.request().url()).pathname.replace(/^\/api/, '')
        const json = (body, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })
        if (estado === 'cargando' && (path === '/stores' || path === '/dashboard/tracker')) return // nunca responde
        if (estado === 'error' && path === '/stores') return json({ message: 'error' }, 500)
        if (path === '/users/me') return json(ME)
        if (path === '/users/notifications') return json({ pending: [], alerts: [] })
        if (path === '/stores') return json(data.stores)
        if (path === '/dashboard/tracker') return json(estado === 'error' ? [] : data.tracker)
        if (path === '/candidates/pending') return json(data.pending)
        if (path === '/dashboard/pool/countries') return json({ countries: ['CO'] })
        if (path.startsWith('/dashboard/pool')) return json({ winners: [], locked: false, totalElements: 0, totalPages: 0 })
        const ads = path.match(/^\/dashboard\/stores\/([^/]+)\/ads\/count$/)
        if (ads) return json({ storeId: ads[1], totalActiveAds: data.ads[ads[1]] ?? 0 })
        return json(path.includes('rates') ? {} : [])
      })

      await page.goto(`${BASE}${RUTA}`, { waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(estado === 'cargando' ? 1500 : 2500)
      const m = await page.evaluate(MEASURE)
      if (TECLADO && estado === 'datos') {
        await page.locator('main article').first().locator('a').first().focus()
        m.teclado = []
        for (let i = 0; i < 4; i++) {
          m.teclado.push(await page.evaluate(() => {
            const el = document.activeElement
            const cs = getComputedStyle(el)
            const inCard = !!el.closest('main article')
            return `${inCard ? 'tarjeta' : 'fuera'} · ${el.tagName.toLowerCase()} "${(el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 40)}" · foco ${cs.outlineStyle !== 'none' || cs.boxShadow !== 'none' ? 'visible' : 'INVISIBLE'}`
          }))
          await page.keyboard.press('Tab')
        }
      }
      const file = join(OUT, `${RUTA === '/stores' ? '' : RUTA.replace(/\W+/g, '') + '-'}${estado}-${vp.name}${DARK ? '-oscuro' : ''}.png`)
      // El scroll vive dentro de <main>: se agranda el viewport al alto del contenido para la captura completa.
      const h = await page.evaluate(() => Math.max(document.body.scrollHeight, ...[...document.querySelectorAll('main, main *')].filter((e) => e.scrollHeight > e.clientHeight + 20).map((e) => e.scrollHeight)))
      await page.setViewportSize({ width: vp.width, height: Math.min(Math.max(h + 120, vp.height), 6000) })
      await page.waitForTimeout(400)
      await page.screenshot({ path: file, fullPage: true })
      results.push({ estado, viewport: vp.name, ...m, consoleErrors: errors.length, errors: errors.slice(0, 3), file })
      await ctx.close()
    }
  }
  await browser.close()
  console.log(JSON.stringify(results, null, 2))
}

run().catch((e) => { console.error(e); process.exit(1) })
