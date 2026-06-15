// lib/scrapers/meta-ads.ts
// Domain-first Meta Ad Library scraper.
// Probe — search by domain, scroll to ~50 ads, verify at least one links to the domain
// If match: full scroll + extract all ads from search results (no advertiser profile navigation)
// Phase 3 — matchAdToCandidate: match destination URL to tracked candidate by product handle
// Phase 4 (in sync-ads.ts) — PATCH /stores/{id}/advertiser to persist discovered page info

import { chromium, type Browser, type Page } from 'playwright'
import { mirrorUrlToR2, adMediaKey, r2Configured } from '../storage/r2'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ScrapedAd {
  adSnapshotUrl: string
  thumbnailUrl: string | null
  videoUrl?: string | null
  status: 'active' | 'inactive'
  daysRunning: number
  firstSeen: string          // YYYY-MM-DD
  lastSeen: string           // YYYY-MM-DD
  productUrl: string         // CTA destination URL
  advertiserName: string | null
  advertiserUrl: string | null
  pageId?: string | null
  matchedCandidateId?: string | null
}

export interface AdvertiserInfo {
  pageName: string
  pageId?: string | null
}

export interface CandidateForMatch {
  candidateId: string
  productUrl?: string | null
}

export interface ScrapeResult {
  ads: ScrapedAd[]
  advertiser: AdvertiserInfo | null
  totalAdsOnMeta: number
}

// ── URL builders ──────────────────────────────────────────────────────────────

function buildSearchUrl(keyword: string, sort: 'impressions' | 'recent' = 'impressions'): string {
  const p = new URLSearchParams({
    active_status: 'active',
    ad_type: 'all',
    country: 'ALL',
    is_targeted_country: 'false',
    media_type: 'all',
    q: keyword,
    search_type: 'keyword_unordered',
    'sort_data[mode]': sort === 'recent' ? 'creation_time' : 'relevancy_monthly_grouped',
    'sort_data[direction]': 'desc',
  })
  return `https://www.facebook.com/ads/library/?${p.toString()}`
}

// ── Shared page helpers ───────────────────────────────────────────────────────

async function dismissCookies(page: Page): Promise<void> {
  const selectors = [
    'button[data-testid="cookie-policy-dialog-accept-button"]',
    '[aria-label="Allow all cookies"]',
    'button:has-text("Allow all cookies")',
    'button:has-text("Accept all")',
    'button:has-text("Decline optional cookies")',
  ]
  for (const sel of selectors) {
    try {
      const btn = page.locator(sel).first()
      if (await btn.isVisible({ timeout: 1500 })) {
        await btn.click()
        await page.waitForTimeout(1200)
        return
      }
    } catch { /* not present */ }
  }
}

// Meta ignores ad_type=ALL in the URL and restores the last session filter.
// Strategy: detect the filter button, open it, click the first element that contains
// "Todos los anuncios" — uses broad text matching to survive DOM changes.
async function fixAdTypeFilter(page: Page): Promise<void> {
  try {
    const filterBtn = page.locator([
      'button:has-text("Temas sociales")',
      'button:has-text("Issues")',
      'button:has-text("Todos los anuncios")',
      'button:has-text("All ads")',
    ].join(', ')).first()

    if (!await filterBtn.isVisible({ timeout: 5000 })) return

    await filterBtn.click()
    await page.waitForTimeout(1200)
    await page.screenshot({ path: '/tmp/scout-frontend/debug-filter-open.png', fullPage: false }).catch(() => null)

    const allOption = page.getByText('Todos los anuncios', { exact: true }).first()

    if (await allOption.isVisible({ timeout: 4000 })) {
      await allOption.click()
      console.log('  → Filtro forzado a "Todos los anuncios" ✓')
      await page.waitForTimeout(2500)
    } else {
      const clicked = await page.evaluate(() => {
        const els = [...document.querySelectorAll('*')]
        const target = els.find(el =>
          el.children.length === 0 &&
          (el.textContent || '').trim() === 'Todos los anuncios'
        )
        if (target) { (target as HTMLElement).click(); return true }
        return false
      })
      if (clicked) {
        console.log('  → Filtro forzado via evaluate ✓')
        await page.waitForTimeout(2500)
      } else {
        console.log('  ⚠ No se encontró opción "Todos los anuncios" — screenshot en debug-filter-open.png')
        await page.keyboard.press('Escape')
      }
    }
  } catch { /* filter not present or already correct */ }
}

// Meta ignores sort_data in the URL and restores the last session sort.
// Strategy: click "Ordenar por" → click the target option → page.reload() para arrancar limpio.
async function fixSortOrder(page: Page, sort: 'impressions' | 'recent'): Promise<void> {
  const targetText  = sort === 'recent' ? 'Más recientes' : null
  const targetRegex = sort === 'recent' ? /Más recientes/ : /Impresion/i
  const label       = sort === 'recent' ? 'Más recientes' : 'Impresiones'
  try {
    const sortBtn = page.getByText(/Ordenar por|Sort by/i).first()
    if (!await sortBtn.isVisible({ timeout: 5000 })) return

    await sortBtn.click()
    await page.waitForTimeout(1000)

    const option = targetText
      ? page.getByText(targetText, { exact: true }).first()
      : page.locator('[role="menuitem"], [role="option"], li').filter({ hasText: targetRegex }).first()

    if (await option.isVisible({ timeout: 3000 })) {
      await option.click()
      console.log(`  → Sort: "${label}" ✓`)
      await page.waitForTimeout(1000)
    } else {
      const clicked = await page.evaluate((rx: string) => {
        const re = new RegExp(rx, 'i')
        const target = [...document.querySelectorAll('*')].find(el =>
          el.children.length === 0 && re.test((el.textContent || '').trim())
        )
        if (target) { (target as HTMLElement).click(); return true }
        return false
      }, targetRegex.source)
      if (clicked) {
        console.log(`  → Sort "${label}" via evaluate ✓`)
        await page.waitForTimeout(1000)
      } else {
        console.log(`  ⚠ No se encontró opción "${label}"`)
        await page.keyboard.press('Escape')
      }
    }
  } catch { /* sort button not present */ }
}

function extractAdId(adSnapshotUrl: string): string {
  const match = adSnapshotUrl.match(/[?&]id=(\d+)/)
  if (match) return match[1]
  return Buffer.from(adSnapshotUrl).toString('base64url').slice(0, 20)
}

// ── Probe — scroll to ~50 ads, check if any link to the domain ───────────────

async function probeSearchResults(page: Page, domain: string): Promise<{
  hasMatch: boolean
  count: number
  totalAdsOnMeta: number
  advertiser: AdvertiserInfo | null
}> {
  // Scroll incremental desde Node hasta tener ~50 cards o estancamiento.
  // scrollTo(0, scrollHeight) no dispara los intersection observers de Meta.
  let lastCount = 0
  let stagnantRounds = 0
  for (let i = 0; i < 12; i++) {
    const articleCards = await page.$$('[role="article"]')
    const count = articleCards.length > 0
      ? articleCards.length
      : (await page.$$('[class*="_7jyh"]')).length
    if (count >= 50) break
    if (count === lastCount) {
      stagnantRounds++
      if (stagnantRounds >= 3) break
    } else {
      stagnantRounds = 0
    }
    lastCount = count
    // mouse.wheel genera eventos de scroll reales que disparan los intersection observers de Meta.
    // window.scrollTo dentro de page.evaluate cambia scrollY pero no dispara el lazy load.
    for (let step = 0; step < 8; step++) {
      await page.mouse.wheel(0, 600)
      await page.waitForTimeout(120)
    }
    await page.waitForTimeout(1400 + Math.random() * 600)
  }

  return page.evaluate((domainRaw: string) => {
    const domain = domainRaw.replace(/^www\./, '')

    const bodyText = document.body.textContent || ''
    const totalMatch = bodyText.match(/~?\s*(\d[\d.,]*)\s*(?:resultados|results)/i)
    const totalAdsOnMeta = totalMatch ? parseInt(totalMatch[1].replace(/[.,]/g, '')) : 0

    const pagePattern = /facebook\.com\/((?!ads\/|share\/|photo\/|video\/|watch\/|groups\/|events\/|l\.php)[\w.%]+)/
    const pageIdMatch = document.documentElement.innerHTML.match(/view_all_page_id[=\\"']+(\d+)/i)
    const pageId: string | null = pageIdMatch ? pageIdMatch[1] : null

    const articleCards = [...document.querySelectorAll('[role="article"]')]
    const jyhCards = [...document.querySelectorAll('[class*="_7jyh"]')]
      .map(jyh => {
        let container: Element = jyh
        for (let i = 0; i < 6; i++) {
          if (!container.parentElement) break
          container = container.parentElement
          if (/Identificador|Library ID|\d{15}/.test(container.textContent || '')) break
        }
        return container
      })
    const cards = articleCards.length > 0 ? articleCards : jyhCards

    let hasMatch = false
    let advertiserName: string | null = null

    for (const card of cards) {
      const anchors = [...card.querySelectorAll('a[href]')]

      // Check if any destination URL points to the domain
      for (const a of anchors) {
        const raw = (a as HTMLAnchorElement).href || ''
        const decoded = decodeURIComponent(raw)
        const redirect = decoded.match(/[?&]u=([^&]+)/)
        const dest = redirect ? decodeURIComponent(redirect[1]) : raw
        if (dest.includes(domain)) { hasMatch = true; break }
      }

      // Fallback: domain displayed as text in card (e.g. "CHIC-LUCKY.COM" in <div role="button">)
      // Meta renders the CTA destination as a styled div, not an <a href>, so querySelectorAll('a[href]') misses it.
      if (!hasMatch && (card.textContent || '').toLowerCase().includes(domain.toLowerCase())) {
        hasMatch = true
      }

      // Extract advertiser name from first card that has one
      if (!advertiserName) {
        for (const a of anchors) {
          const href = (a as HTMLAnchorElement).href || ''
          const m = href.match(pagePattern)
          const text = (a as HTMLElement).textContent?.trim() || ''
          if (m && text.length > 1 && text.length < 90) {
            advertiserName = text
            break
          }
        }
      }
    }

    return {
      hasMatch,
      count: cards.length,
      totalAdsOnMeta,
      advertiser: advertiserName ? { pageName: advertiserName, pageId } : null,
    }
  }, domain)
}

// ── Full scroll — load all ads ────────────────────────────────────────────────

async function scrollToLoadAll(page: Page, totalExpected: number, maxAds = 200): Promise<void> {
  const limit = Math.min(totalExpected || maxAds, maxAds)
  let lastCount = 0
  let stagnantAtBottom = 0
  let attempts = 0

  while (attempts < 60) {
    const { count, atBottom } = await page.evaluate(() => {
      const articles = document.querySelectorAll('[role="article"]')
      const jyh     = document.querySelectorAll('[class*="_7jyh"]')
      const n = articles.length > 0 ? articles.length : jyh.length
      return {
        count:    n,
        atBottom: window.scrollY + window.innerHeight >= document.body.scrollHeight - 300,
      }
    })

    if (count >= limit) break

    // Solo corta por estancamiento cuando YA estamos en el fondo de la página.
    // Si no estamos en el fondo, seguimos scrolleando aunque el conteo no crezca
    // (Meta carga por lotes — entre lotes el DOM queda igual por 2-3 s).
    if (atBottom && count === lastCount) {
      stagnantAtBottom++
      if (stagnantAtBottom >= 4) break
    } else {
      stagnantAtBottom = 0
    }
    lastCount = count

    if (attempts % 3 === 0) process.stdout.write(`  Cargando: ${lastCount}/${limit}...`)

    for (let step = 0; step < 8; step++) {
      await page.mouse.wheel(0, 600)
      await page.waitForTimeout(150)
    }
    // 3 s de espera para dar tiempo al request de red + render del siguiente lote
    await page.waitForTimeout(3000 + Math.random() * 1000)
    attempts++
  }

  const { count: finalCount } = await page.evaluate(() => {
    const articles = document.querySelectorAll('[role="article"]')
    const jyh     = document.querySelectorAll('[class*="_7jyh"]')
    return { count: articles.length > 0 ? articles.length : jyh.length }
  })
  process.stdout.write(` ${finalCount} ✓\n`)
}

// ── Extract all ads — advertiser name extracted per card ──────────────────────

async function extractAllAds(page: Page): Promise<ScrapedAd[]> {
  const raw = await page.evaluate(() => {
    const today = new Date().toISOString().split('T')[0]
    const pagePattern = /facebook\.com\/((?!ads\/|share\/|photo\/|video\/|watch\/|groups\/|events\/|l\.php)[\w.%]+)/
    const results: Array<{
      adSnapshotUrl: string; thumbnailUrl: string | null; videoUrl: string | null
      status: 'active' | 'inactive'; daysRunning: number; firstSeen: string
      lastSeen: string; productUrl: string; advertiserName: string | null
      advertiserUrl: string | null; pageId: string | null
    }> = []
    const seen = new Set<string>()

    const articleCards = [...document.querySelectorAll('[role="article"]')]
    const jyhCards = [...document.querySelectorAll('[class*="_7jyh"]')]
      .map(jyh => {
        let container: Element = jyh
        for (let i = 0; i < 6; i++) {
          if (!container.parentElement) break
          container = container.parentElement
          if (/Identificador|Library ID|\d{15}/.test(container.textContent || '')) break
        }
        return container
      })
    const cards = articleCards.length > 0 ? articleCards : jyhCards

    for (const card of cards) {
      const anchors = [...card.querySelectorAll('a[href]')]

      // Ad snapshot URL
      let adSnapshotUrl = ''
      for (const a of anchors) {
        const href = (a as HTMLAnchorElement).href || ''
        if (href.includes('facebook.com/ads/library') && href.includes('id=')) {
          adSnapshotUrl = href; break
        }
      }
      if (!adSnapshotUrl) {
        const cardText = card.textContent || ''
        const idMatch = cardText.match(/(?:Identificador de la biblioteca|Library ID|Ad ID)[^0-9]*(\d{10,})/i)
          ?? cardText.match(/\b(\d{15,16})\b/)
        if (idMatch) adSnapshotUrl = `https://www.facebook.com/ads/library/?id=${idMatch[1]}`
      }
      if (!adSnapshotUrl || seen.has(adSnapshotUrl)) continue
      seen.add(adSnapshotUrl)

      // Advertiser name per card (not global — one store may have multiple advertisers)
      let advertiserName: string | null = null
      let advertiserPageId: string | null = null
      let advertiserUrl: string | null = null
      for (const a of anchors) {
        const href = (a as HTMLAnchorElement).href || ''
        const m = href.match(pagePattern)
        const text = (a as HTMLElement).textContent?.trim() || ''
        if (m && text.length > 1 && text.length < 90) {
          advertiserName = text
          const idM = href.match(/view_all_page_id[=\\"']+(\d+)/)
          if (idM) {
            advertiserPageId = idM[1]
            advertiserUrl = `https://www.facebook.com/profile.php?id=${idM[1]}`
          } else {
            advertiserUrl = href
          }
          break
        }
      }

      // CTA destination URL — unwrap l.facebook.com redirects first, then take any direct non-FB link
      let productUrl = ''
      for (const a of anchors) {
        const raw = (a as HTMLAnchorElement).href || ''
        const decoded = decodeURIComponent(raw)
        const redirect = decoded.match(/[?&]u=([^&]+)/)
        if (redirect) { productUrl = decodeURIComponent(redirect[1]); break }
        if (raw.startsWith('http')
          && !raw.includes('facebook.com')
          && !raw.includes('fb.com')
          && !raw.includes('instagram.com')) {
          productUrl = raw; break
        }
      }

      const videoEl = card.querySelector('video')
      const videoUrl = videoEl
        ? (videoEl.getAttribute('src') || videoEl.querySelector('source')?.getAttribute('src') || null)
        : null

      // Find ad creative — skip small/circular avatars (profile pics ~32-48px).
      // clientWidth reflects CSS-rendered size, available even when lazy-loaded.
      let thumbnailUrl: string | null = null
      let bestArea = 0
      for (const imgEl of card.querySelectorAll('img')) {
        const imgNode = imgEl as HTMLImageElement
        const w = imgNode.clientWidth  || parseInt(imgEl.getAttribute('width')  || '0', 10)
        const h = imgNode.clientHeight || parseInt(imgEl.getAttribute('height') || '0', 10)
        if (w > 0 && w < 80) continue
        if (h > 0 && h < 80) continue
        const cs = window.getComputedStyle(imgEl)
        const br = parseFloat(cs.borderRadius || '0')
        if (br > 0 && w > 0 && br >= w * 0.4) continue
        if (imgEl.parentElement) {
          const pcs = window.getComputedStyle(imgEl.parentElement)
          if (pcs.borderRadius === '50%') continue
        }
        const area = (w || 1) * (h || 1)
        if (area > bestArea) { bestArea = area; thumbnailUrl = imgNode.src || null }
      }
      if (!thumbnailUrl && videoEl) {
        thumbnailUrl = videoEl.getAttribute('poster') || videoEl.getAttribute('src') || null
      }

      const cardText = card.textContent || ''
      let daysRunning = 0
      const nowDate = new Date()
      const esMatch = cardText.match(/En circulaci[oó]n desde el\s+(\d+)\s+(\w+)\s+(\d{4})/i)
      const enMatch = cardText.match(/(?:Started running on|Active since)\s+(\w+\s+\d+,\s+\d{4})/i)
      if (esMatch) {
        const esMonths: Record<string, number> = {
          ene:0, feb:1, mar:2, abr:3, may:4, jun:5, jul:6, ago:7, sep:8, oct:9, nov:10, dic:11
        }
        const m = esMonths[esMatch[2].toLowerCase().slice(0, 3)]
        if (m !== undefined) {
          const start = new Date(parseInt(esMatch[3]), m, parseInt(esMatch[1]))
          daysRunning = Math.max(0, Math.floor((nowDate.getTime() - start.getTime()) / 86_400_000))
        }
      } else if (enMatch) {
        const start = new Date(enMatch[1])
        if (!isNaN(start.getTime()))
          daysRunning = Math.max(0, Math.floor((nowDate.getTime() - start.getTime()) / 86_400_000))
      }

      const firstSeenDate = new Date()
      firstSeenDate.setDate(firstSeenDate.getDate() - daysRunning)
      const firstSeen = firstSeenDate.toISOString().split('T')[0]

      results.push({
        adSnapshotUrl,
        thumbnailUrl,
        videoUrl,
        status: 'active',
        daysRunning,
        firstSeen,
        lastSeen: today,
        productUrl,
        advertiserName,
        advertiserUrl,
        pageId: advertiserPageId,
      })
    }

    return results
  })
  return raw as ScrapedAd[]
}

// ── Phase 3 — Match ad destination to candidate ───────────────────────────────

export function matchAdToCandidate(
  destinationUrl: string,
  candidates: CandidateForMatch[],
): string | null {
  if (!destinationUrl) return null
  for (const c of candidates) {
    const handleMatch = c.productUrl?.match(/\/products\/([^/?#]+)/)
    if (!handleMatch) continue
    if (destinationUrl.includes(handleMatch[1])) return c.candidateId
  }
  return null
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function scrapeAdsForStore(
  storeDomain: string,
  country: string,
  candidates: CandidateForMatch[] = [],
  browser?: Browser,
  options: { headless?: boolean; sort?: 'impressions' | 'recent' } = {},
): Promise<ScrapeResult> {
  const headless = options.headless ?? (process.env.CI === 'true')
  const ownBrowser = !browser
  if (!browser) {
    browser = await chromium.launch({
      headless,
      slowMo: headless ? 0 : 30,
      args: ['--disable-blink-features=AutomationControlled', '--no-sandbox'],
    })
  }

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    locale: 'es-CO',
    viewport: { width: 1280, height: 900 },
  })
  const page = await context.newPage()

  try {
    const domain = storeDomain.replace(/^www\./, '')

    // ── Navigate to domain search ─────────────────────────────────────────────
    await page.goto(buildSearchUrl(domain, options.sort), { waitUntil: 'domcontentloaded', timeout: 40_000 })
    await page.waitForTimeout(3000)
    await dismissCookies(page)
    await fixAdTypeFilter(page)

    await Promise.race([
      page.waitForSelector('[role="article"]', { timeout: 15_000 }).then(() => true),
      page.waitForSelector('[class*="_7jyh"]',  { timeout: 15_000 }).then(() => true),
    ]).catch(() => false)
    await page.waitForTimeout(1500)

    // ── Pasada 1: probe ───────────────────────────────────────────────────────
    const probe = await probeSearchResults(page, domain)

    // Fallback: si el check de DOM falló pero Meta reporta resultados para este dominio,
    // proceder igual — los resultados de keyword search por dominio exacto son señal suficiente.
    const effectiveMatch = probe.hasMatch || probe.totalAdsOnMeta > 0

    if (!effectiveMatch) {
      console.log(`  ⏭ ${domain} — ${probe.count} ads revisados, 0 resultados en Meta → skip`)
      return { ads: [], advertiser: null, totalAdsOnMeta: 0 }
    }
    if (!probe.hasMatch && probe.totalAdsOnMeta > 0) {
      console.log(`  ≈ ${domain} — ${probe.totalAdsOnMeta} resultados en Meta, dominio no visible en DOM → scrapeando`)
    } else {
      console.log(`  ✓ ${domain} — match detectado (${probe.count} ads cargados) → cargando todos...`)
    }

    // ── Pasada 2a: impresiones ────────────────────────────────────────────────
    // Click sort → reload → fix filtro → scroll.
    // El reload garantiza página limpia con el sort ya guardado por Meta.
    const maxPerPass = 50
    await fixSortOrder(page, 'impressions')
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 40_000 })
    await page.waitForTimeout(2000)
    await fixAdTypeFilter(page)
    await Promise.race([
      page.waitForSelector('[role="article"]', { timeout: 15_000 }).then(() => true),
      page.waitForSelector('[class*="_7jyh"]',  { timeout: 15_000 }).then(() => true),
    ]).catch(() => false)
    await page.waitForTimeout(1500)
    await scrollToLoadAll(page, probe.totalAdsOnMeta || maxPerPass, maxPerPass)
    const adsByImpressions = await extractAllAds(page)
    console.log(`  → ${adsByImpressions.length} ads (impresiones)`)

    // ── Pasada 2b: recientes — solo si hay >200 ads ───────────────────────────
    // Los productos en crecimiento tienen ads recientes, no de mayor impresión.
    // 100 ads recientes son suficientes — son los últimos creados.
    let ads = adsByImpressions
    if (probe.totalAdsOnMeta > 200) {
      await page.goto(buildSearchUrl(domain), { waitUntil: 'domcontentloaded', timeout: 40_000 })
      await page.waitForTimeout(3000)
      await fixAdTypeFilter(page)
      await Promise.race([
        page.waitForSelector('[role="article"]', { timeout: 15_000 }).then(() => true),
        page.waitForSelector('[class*="_7jyh"]',  { timeout: 15_000 }).then(() => true),
      ]).catch(() => false)
      await page.waitForTimeout(1500)
      await fixSortOrder(page, 'recent')
      await page.reload({ waitUntil: 'domcontentloaded', timeout: 40_000 })
      await page.waitForTimeout(2000)
      await fixAdTypeFilter(page)
      await Promise.race([
        page.waitForSelector('[role="article"]', { timeout: 20_000 }).then(() => true),
        page.waitForSelector('[class*="_7jyh"]',  { timeout: 20_000 }).then(() => true),
      ]).catch(() => false)
      await page.waitForTimeout(2000)
      await scrollToLoadAll(page, 50, 50)
      const adsByRecent = await extractAllAds(page)
      const seenUrls = new Set(adsByImpressions.map(a => a.adSnapshotUrl))
      const freshAds  = adsByRecent.filter(a => !seenUrls.has(a.adSnapshotUrl))
      ads = [...adsByImpressions, ...freshAds]
      console.log(`  → ${adsByRecent.length} ads (recientes) | ${freshAds.length} nuevos | total ${ads.length}`)

      // Log de matches por pasada — solo si hay candidatos para comparar
      if (candidates.length > 0) {
        const impMatches  = adsByImpressions.filter(a => matchAdToCandidate(a.productUrl, candidates)).length
        const recMatches  = freshAds.filter(a => matchAdToCandidate(a.productUrl, candidates)).length
        console.log(`  [F3-dual] impresiones: ${impMatches} matches | recientes únicos: ${recMatches} matches`)
      }
    }

    if (ads.length === 0) {
      return { ads: [], advertiser: probe.advertiser, totalAdsOnMeta: probe.totalAdsOnMeta }
    }

    // ── F3 ────────────────────────────────────────────────────────────────────
    if (candidates.length > 0) {
      let matched = 0
      for (const ad of ads) {
        const id = matchAdToCandidate(ad.productUrl, candidates)
        if (id) { ad.matchedCandidateId = id; matched++ }
      }
      console.log(`  [F3] ${matched} / ${ads.length} ads con candidato`)
    }

    // ── R2 mirror ─────────────────────────────────────────────────────────────
    // sourceUrlCache: same source URL → same R2 key so identical creatives share one object.
    if (r2Configured && ads.length > 0) {
      const sourceUrlCache = new Map<string, string>()
      await Promise.all(ads.map(async ad => {
        const adId = extractAdId(ad.adSnapshotUrl)
        if (ad.thumbnailUrl) {
          const srcUrl = ad.thumbnailUrl
          const cached = sourceUrlCache.get(srcUrl)
          if (cached) {
            ad.thumbnailUrl = cached
          } else {
            const key = adMediaKey(storeDomain, adId, 'thumbnail')
            const r2Url = await mirrorUrlToR2(srcUrl, key, 'image/jpeg')
            if (r2Url) { ad.thumbnailUrl = r2Url; sourceUrlCache.set(srcUrl, r2Url) }
          }
        }
        if (ad.videoUrl) {
          const key = adMediaKey(storeDomain, adId, 'video')
          const r2Url = await mirrorUrlToR2(ad.videoUrl, key, 'video/mp4')
          if (r2Url) ad.videoUrl = r2Url
        }
      }))
    }

    // Return advertiser from probe (first detected from search results)
    // or fall back to first ad's advertiser info
    const advertiser = probe.advertiser
      ?? (ads[0]?.advertiserName ? { pageName: ads[0].advertiserName, pageId: ads[0].pageId } : null)

    return { ads, advertiser, totalAdsOnMeta: probe.totalAdsOnMeta }

  } finally {
    await context.close()
    if (ownBrowser) await browser.close()
  }
}
