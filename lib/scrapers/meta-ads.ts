// lib/scrapers/meta-ads.ts
// Playwright scraper for Meta Ad Library.
// Finds active ads that link to a given store domain.
//
// NOT a Vercel function — run locally or on Easypanel with Node.js:
//   npx tsx lib/scrapers/meta-ads.ts
//
// Requires: ANTHROPIC_API_KEY (optional, improves keyword normalization)

import { chromium, type Browser, type Page } from 'playwright'
import { mirrorUrlToR2, adMediaKey, r2Configured } from '../storage/r2'

export interface ScrapedAd {
  adSnapshotUrl: string
  thumbnailUrl: string | null
  videoUrl?: string | null
  status: 'active' | 'inactive'
  daysRunning: number
  firstSeen: string   // YYYY-MM-DD
  lastSeen: string    // YYYY-MM-DD
  productUrl: string
  advertiserName: string | null
  advertiserUrl: string | null
}

interface SearchResult {
  keyword: string
  ads: ScrapedAd[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildSearchUrl(keyword: string, country: string): string {
  const p = new URLSearchParams({
    active_status: 'active',
    ad_type: 'all',
    country,
    q: keyword,
    search_type: 'keyword_unordered',
  })
  return `https://www.facebook.com/ads/library/?${p.toString()}`
}

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

// Meta sometimes defaults the ad_type filter to "Issues/Politics" — correct it via UI.
async function fixAdTypeFilter(page: Page): Promise<void> {
  try {
    const wrongBtn = page.locator('button:has-text("Issues, elections or politics"), button:has-text("Issues")').first()
    if (await wrongBtn.isVisible({ timeout: 3000 })) {
      await wrongBtn.click()
      await page.waitForTimeout(800)
      const allOption = page.locator(
        '[role="option"]:has-text("All"), [role="menuitem"]:has-text("All"), li:has-text("All ads"), div:has-text("All ads")'
      ).first()
      if (await allOption.isVisible({ timeout: 2000 })) {
        await allOption.click()
        await page.waitForTimeout(2500)
      } else {
        await page.keyboard.press('Escape')
      }
    }
  } catch { /* filter already correct */ }
}

async function scrollAndWait(page: Page, rounds = 4): Promise<void> {
  for (let i = 0; i < rounds; i++) {
    await page.evaluate(() => window.scrollBy(0, 2500))
    await page.waitForTimeout(2000)
  }
}

// Extract all ads from the current page that link to the target domain.
async function extractMatchingAds(page: Page, targetDomain: string): Promise<ScrapedAd[]> {
  return page.evaluate((domain) => {
    const today = new Date().toISOString().split('T')[0]
    const results: Array<{
      adSnapshotUrl: string; thumbnailUrl: string | null; status: 'active' | 'inactive'
      daysRunning: number; firstSeen: string; lastSeen: string; productUrl: string
      advertiserName: string | null; advertiserUrl: string | null
    }> = []
    const seenSnapshots = new Set<string>()

    // Meta Ad Library has changed its DOM structure over time.
    // [role="article"] was the old selector (still used in some locales/views).
    // [class*="_7jyh"] is the current card creative container as of 2026-06.
    //   BUT: the ad metadata (library ID, date) lives in a sibling/parent container,
    //   not inside _7jyh itself. We use _7jyh to detect the ad, then walk up to a
    //   wider container that includes the metadata.
    const articleCards = [...document.querySelectorAll('[role="article"]')]
    const jyhCards     = [...document.querySelectorAll('[class*="_7jyh"]')]
      .filter(el =>
        [...el.querySelectorAll('a[href]')].some(a =>
          decodeURIComponent((a as HTMLAnchorElement).href).includes(domain)
        )
      )
      .map(jyh => {
        // Walk up to find a container that also has the ad metadata
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
      const anchors = card.querySelectorAll('a[href]')

      // Check if any link in this card leads to the target domain
      let productUrl = ''
      for (const a of anchors) {
        const raw = (a as HTMLAnchorElement).href || ''
        const decoded = decodeURIComponent(raw)
        if (raw.includes(domain) || decoded.includes(domain)) {
          // Extract the real URL from l.facebook.com tracking wrapper
          const match = decoded.match(/[?&]u=([^&]+)/)
          productUrl = match ? decodeURIComponent(match[1]) : raw
          break
        }
      }
      if (!productUrl) continue

      // Ad snapshot URL:
      // Old layout: direct <a href="facebook.com/ads/library/?id=..."> inside the card.
      // New layout (_7jyh): the ID appears as text "Identificador de la biblioteca: 979701074796507"
      //   (or "Library ID: ...") — we parse it and construct the URL.
      let adSnapshotUrl = ''
      for (const a of anchors) {
        const href = (a as HTMLAnchorElement).href || ''
        if (href.includes('facebook.com/ads/library') && href.includes('id=')) {
          adSnapshotUrl = href
          break
        }
      }
      if (!adSnapshotUrl) {
        // "Identificador de la biblioteca: 979701074796507" or "Library ID: ..."
        // Also try: any 15-digit number block (Meta ad IDs are typically 15 digits)
        const cardText2 = card.textContent || ''
        const idMatch = cardText2.match(/(?:Identificador de la biblioteca|Library ID|Ad ID)[^0-9]*(\d{10,})/i)
          ?? cardText2.match(/\b(\d{15,16})\b/)
        if (idMatch) adSnapshotUrl = `https://www.facebook.com/ads/library/?id=${idMatch[1]}`
      }
      // Fallback: use productUrl as dedup key (avoids losing the ad entirely)
      if (!adSnapshotUrl) adSnapshotUrl = `fb-ad://${productUrl}`
      if (seenSnapshots.has(adSnapshotUrl)) continue
      seenSnapshots.add(adSnapshotUrl)

      // Thumbnail: first img inside the card
      const img = card.querySelector('img')
      const thumbnailUrl = img ? img.src : null

      // Video: <video src> or <video><source src></video> — Meta uses both
      const videoEl = card.querySelector('video')
      const videoUrl = videoEl
        ? (videoEl.getAttribute('src') || videoEl.querySelector('source')?.getAttribute('src') || null)
        : null

      // Days running — Meta shows "En circulación desde el DD mmm YYYY" (es)
      // or "Started running on Month DD, YYYY" (en).
      // We parse the start date and compute the diff to today.
      const cardText = card.textContent || ''
      let daysRunning = 0
      const nowDate = new Date()
      // Spanish: "En circulación desde el 1 jun 2026"
      const esMatch = cardText.match(/En circulaci[oó]n desde el\s+(\d+)\s+(\w+)\s+(\d{4})/i)
      // English: "Started running on June 1, 2026" or "Active since June 1, 2026"
      const enMatch = cardText.match(/(?:Started running on|Active since)\s+(\w+\s+\d+,\s+\d{4})/i)
      if (esMatch) {
        const esMonths: Record<string, number> = {
          ene:0, feb:1, mar:2, abr:3, may:4, jun:5,
          jul:6, ago:7, sep:8, oct:9, nov:10, dic:11,
        }
        const m = esMonths[esMatch[2].toLowerCase().slice(0,3)]
        if (m !== undefined) {
          const start = new Date(parseInt(esMatch[3]), m, parseInt(esMatch[1]))
          daysRunning = Math.max(0, Math.floor((nowDate.getTime() - start.getTime()) / 86_400_000))
        }
      } else if (enMatch) {
        const start = new Date(enMatch[1])
        if (!isNaN(start.getTime()))
          daysRunning = Math.max(0, Math.floor((nowDate.getTime() - start.getTime()) / 86_400_000))
      }

      // Advertiser info
      let advertiserName: string | null = null
      let advertiserUrl: string | null = null
      const pagePattern = /facebook\.com\/((?!ads\/|share\/|photo\/|video\/|watch\/|groups\/|events\/|l\.php)[\w.%]+)/
      for (const a of anchors) {
        const href = (a as HTMLAnchorElement).href || ''
        const m = href.match(pagePattern)
        const t = (a as HTMLElement).textContent?.trim() || ''
        if (m && t.length > 1 && t.length < 90) {
          advertiserName = t
          advertiserUrl = `https://www.facebook.com/${m[1]}`
          break
        }
      }

      // first_seen approximation from daysRunning
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
        lastSeen: today,  // outer today — string YYYY-MM-DD
        productUrl,
        advertiserName,
        advertiserUrl,
      })
    }

    return results
  }, targetDomain)
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function scrapeAdsForStore(
  storeDomain: string,
  country: string,
  browser?: Browser,
  options: { headless?: boolean } = {},
): Promise<ScrapedAd[]> {
  // Keyword: strip TLD, use domain name as search term
  const keyword = storeDomain.replace(/\.[^.]+$/, '').replace(/-/g, ' ')

  // headless: false works better against Meta's bot detection.
  // On Linux servers without a display, set headless: true and accept
  // that Meta may return 0 results more often.
  const headless = options.headless ?? false

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
    const url = buildSearchUrl(keyword, country)
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 40_000 })
    await page.waitForTimeout(3000)
    await dismissCookies(page)
    await fixAdTypeFilter(page)

    // Wait for either the old or new card selector — whichever Meta renders
    await Promise.race([
      page.waitForSelector('[role="article"]', { timeout: 15_000 }),
      page.waitForSelector('[class*="_7jyh"]',  { timeout: 15_000 }),
    ]).catch(() => null)
    await page.waitForTimeout(2000)
    await scrollAndWait(page, 4)

    const ads = await extractMatchingAds(page, storeDomain)

    // Mirror media to R2 if configured. Falls back to original Meta URLs silently.
    if (r2Configured && ads.length > 0) {
      await Promise.all(ads.map(async ad => {
        const adId = extractAdId(ad.adSnapshotUrl)

        if (ad.thumbnailUrl) {
          const key = adMediaKey(storeDomain, adId, 'thumbnail')
          const r2Url = await mirrorUrlToR2(ad.thumbnailUrl, key, 'image/jpeg')
          if (r2Url) ad.thumbnailUrl = r2Url
        }

        if (ad.videoUrl) {
          const key = adMediaKey(storeDomain, adId, 'video')
          const r2Url = await mirrorUrlToR2(ad.videoUrl, key, 'video/mp4')
          if (r2Url) ad.videoUrl = r2Url
        }
      }))
    }

    return ads
  } finally {
    await context.close()
    if (ownBrowser) await browser.close()
  }
}

// Extracts the numeric Meta ad ID from the snapshot URL.
// Falls back to a url-safe base64 slice for non-standard URLs (fb-ad:// fallback).
function extractAdId(adSnapshotUrl: string): string {
  const match = adSnapshotUrl.match(/[?&]id=(\d+)/)
  if (match) return match[1]
  return Buffer.from(adSnapshotUrl).toString('base64url').slice(0, 20)
}
