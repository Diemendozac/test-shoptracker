// lib/scrapers/meta-ads.ts
// Playwright scraper for Meta Ad Library.
// Finds active ads that link to a given store domain.
//
// NOT a Vercel function — run locally or on Easypanel with Node.js:
//   npx tsx lib/scrapers/meta-ads.ts
//
// Requires: ANTHROPIC_API_KEY (optional, improves keyword normalization)

import { chromium, type Browser, type Page } from 'playwright'

export interface ScrapedAd {
  adSnapshotUrl: string
  thumbnailUrl: string | null
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

    const cards = document.querySelectorAll('[role="article"]')

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

      // Ad snapshot URL (the direct Meta Ad Library link for this ad)
      let adSnapshotUrl = ''
      for (const a of anchors) {
        const href = (a as HTMLAnchorElement).href || ''
        if (href.includes('facebook.com/ads/library') && href.includes('id=')) {
          adSnapshotUrl = href
          break
        }
      }
      if (!adSnapshotUrl || seenSnapshots.has(adSnapshotUrl)) continue
      seenSnapshots.add(adSnapshotUrl)

      // Thumbnail: first img inside the card
      const img = card.querySelector('img')
      const thumbnailUrl = img ? img.src : null

      // Days running from the ad text (e.g., "Started running 14 days ago")
      const cardText = card.textContent || ''
      let daysRunning = 0
      const daysMatch = cardText.match(/(\d+)\s+days?\s+ago/i)
      if (daysMatch) daysRunning = parseInt(daysMatch[1], 10)

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
        status: 'active',
        daysRunning,
        firstSeen,
        lastSeen: today,
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
): Promise<ScrapedAd[]> {
  // Keyword: strip TLD, use domain name as search term
  const keyword = storeDomain.replace(/\.[^.]+$/, '').replace(/-/g, ' ')

  const ownBrowser = !browser
  if (!browser) {
    browser = await chromium.launch({
      headless: true,
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

    await page.waitForSelector('[role="article"]', { timeout: 15_000 }).catch(() => null)
    await page.waitForTimeout(2000)
    await scrollAndWait(page, 4)

    const ads = await extractMatchingAds(page, storeDomain)
    return ads
  } finally {
    await context.close()
    if (ownBrowser) await browser.close()
  }
}
