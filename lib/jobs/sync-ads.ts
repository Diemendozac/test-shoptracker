// lib/jobs/sync-ads.ts
// Scrapes Meta Ad Library for all Pro/Agency stores and pushes results to backend.
//
// Run manually or via cron on GitHub Actions / Easypanel:
//   npx tsx lib/jobs/sync-ads.ts
//
// Required env vars:
//   NEXT_PUBLIC_API_URL   — backend base URL (e.g. https://api.example.com/api)
//   WEBHOOK_SECRET        — shared secret for internal API endpoints

import fs from 'fs'
import { scrapeAdsForStore, type ScrapedAd } from '../scrapers/meta-ads'

const API_URL        = process.env.NEXT_PUBLIC_API_URL || 'http://shoptracker-api:8080/api'
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || ''

if (!WEBHOOK_SECRET) {
  console.error('❌ WEBHOOK_SECRET not set')
  process.exit(1)
}

interface Store {
  storeId: string
  baseUrl: string
  userPlan: string
  country?: string
  metaPageId?: string | null
  metaPageName?: string | null
}

// ── Domain health helpers ──────────────────────────────────────────────────────

/**
 * Fetches products.json following redirects.
 * Returns the live domain (which may differ from the stored one if a redirect occurred).
 * Returns null when the domain is unreachable and no redirect resolves to a live Shopify store.
 *
 * Handles the domain-change transition window: while Shopify/registrar still redirects
 * the old domain, we detect it here and update the DB proactively — before the redirect
 * expires and the store goes dark.
 */
async function checkAndResolveDomain(
  storeId: string,
  domain: string,
): Promise<string | null> {
  try {
    const res = await fetch(`https://${domain}/products.json?limit=1`, {
      redirect: 'follow',
      signal: AbortSignal.timeout(10000),
    })

    if (!res.ok) return null

    const finalDomain = new URL(res.url).hostname.replace(/^www\./, '')

    if (finalDomain !== domain) {
      // Redirect detected during normal check — update DB before the window closes
      try {
        await updateStoreDomain(storeId, finalDomain)
        console.log(`  🔄 ${domain} → ${finalDomain} (redirect detectado, DB actualizado)`)
      } catch (e) {
        console.warn(`  ⚠ Redirect detectado pero DB update falló: ${(e as Error).message}`)
      }
      return finalDomain
    }

    console.log(`  ✓ ${domain} — dominio OK`)
    return domain
  } catch {
    return null
  }
}

async function updateStoreDomain(storeId: string, newDomain: string): Promise<void> {
  const res = await fetch(`${API_URL}/internal/stores/${storeId}/domain`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'X-Webhook-Secret': WEBHOOK_SECRET,
    },
    body: JSON.stringify({ domain: newDomain }),
  })
  if (!res.ok) throw new Error(`domain update failed: ${res.status}`)
}

async function markDomainError(storeId: string): Promise<void> {
  try {
    await fetch(`${API_URL}/internal/stores/${storeId}/domain-error`, {
      method: 'PATCH',
      headers: { 'X-Webhook-Secret': WEBHOOK_SECRET },
    })
  } catch {
    // Non-fatal — best effort
  }
}

// ── Backend API helpers ────────────────────────────────────────────────────────

async function getProStores(): Promise<Store[]> {
  let res: Response
  try {
    res = await fetch(`${API_URL}/internal/stores/pro`, {
      headers: { 'X-Webhook-Secret': WEBHOOK_SECRET },
    })
  } catch (e) {
    const err = e as Error & { cause?: unknown }
    console.error('Fetch error detail:', err.message, err.cause)
    throw new Error(`Fatal: fetch failed — ${err.message}`)
  }
  if (!res.ok) throw new Error(`Failed to fetch stores: ${res.status}`)
  return res.json()
}

interface Candidate {
  candidateId: string
  storeDomain: string
  country: string
  productUrl?: string | null
  score: number
  label: string
  daysSinceLastImprovement: number
}

function shouldScrapeStore(candidates: Candidate[]): { scrape: boolean; reason: string } {
  const ACTIVE_LABELS = ['Rising', 'Rocket', 'Hot', 'Scaled']
  const hasActiveCandidate = candidates.some(
    c => c.score >= 20 || ACTIVE_LABELS.includes(c.label),
  )
  if (!hasActiveCandidate) {
    return { scrape: false, reason: 'sin candidatos activos (score < 20)' }
  }

  const allStagnant = candidates.every(c => c.daysSinceLastImprovement >= 5)
  if (allStagnant) {
    const maxDays = Math.max(...candidates.map(c => c.daysSinceLastImprovement))
    return { scrape: false, reason: `estancada ${maxDays}d` }
  }

  return { scrape: true, reason: 'activa' }
}

async function getCandidatesForStore(storeId: string): Promise<Candidate[]> {
  const res = await fetch(`${API_URL}/internal/stores/${storeId}/candidates`, {
    headers: { 'X-Webhook-Secret': WEBHOOK_SECRET },
  })
  if (!res.ok) throw new Error(`Failed to fetch candidates: ${res.status}`)
  return res.json()
}

async function updateStoreAdvertiser(
  storeId: string,
  pageName: string,
  pageId: string | null | undefined,
  totalAds: number,
): Promise<void> {
  const res = await fetch(`${API_URL}/internal/stores/${storeId}/advertiser`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'X-Webhook-Secret': WEBHOOK_SECRET,
    },
    body: JSON.stringify({ metaPageName: pageName, metaPageId: pageId || null, metaTotalAds: totalAds }),
  })
  if (!res.ok) throw new Error(`advertiser update failed: ${res.status}`)
}

async function pushAds(candidateId: string, storeDomain: string, ads: ScrapedAd[]): Promise<void> {
  const res = await fetch(`${API_URL}/internal/webhook/ads`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Webhook-Secret': WEBHOOK_SECRET,
    },
    body: JSON.stringify({
      candidateId,
      storeDomain,
      ads: ads.map(ad => ({
        adSnapshotUrl: ad.adSnapshotUrl,
        thumbnailUrl: ad.thumbnailUrl,
        status: ad.status,
        daysRunning: ad.daysRunning,
        firstSeen: ad.firstSeen,
        lastSeen: ad.lastSeen,
        productUrl: ad.productUrl,
        videoUrlR2: ad.videoUrl ?? null,
        advertiserName: ad.advertiserName ?? null,
      })),
    }),
  })
  if (!res.ok) throw new Error(`Failed to push ads: ${res.status}`)
}

// ── Core sync logic ────────────────────────────────────────────────────────────

type StoreOutcome =
  | { status: 'skipped'; reason: string }
  | { status: 'error';   error: string }
  | { status: 'synced';  adsSaved: number; matches: number }

async function syncStore(store: Store): Promise<StoreOutcome> {
  let domain = new URL(store.baseUrl).hostname.replace(/^www\./, '')
  const country = store.country || 'ALL'

  // ── 1. Domain health check (follows redirects proactively) ──────────────
  const resolvedDomain = await checkAndResolveDomain(store.storeId, domain)
  if (resolvedDomain === null) {
    await markDomainError(store.storeId)
    console.log(`  ✗ ${domain} — no responde y no se pudo resolver → dominio no verificado`)
    return { status: 'skipped', reason: 'domain_error' }
  }
  domain = resolvedDomain

  // ── 2. Get candidates (needed for Phase 3 matching) ──────────────────────
  const candidates = await getCandidatesForStore(store.storeId)
  if (candidates.length === 0) {
    console.log(`  → No candidates for ${domain} — skipping`)
    return { status: 'skipped', reason: 'no_candidates' }
  }

  // ── 2b. Smart scraping gate ───────────────────────────────────────────────
  const { scrape, reason } = shouldScrapeStore(candidates)
  if (!scrape) {
    console.log(`  ⏸ ${domain} — ${reason} → skip`)
    return { status: 'skipped', reason }
  }
  console.log(`  ✓ ${domain} — ${reason} → scrapeando`)

  // ── 3. Scrape (F1 → F2 → F3 → R2) ───────────────────────────────────────
  let scrapeResult: Awaited<ReturnType<typeof scrapeAdsForStore>>
  try {
    scrapeResult = await scrapeAdsForStore(domain, country, candidates, undefined, {
      knownPageId:   store.metaPageId   ?? undefined,
      knownPageName: store.metaPageName ?? undefined,
    })
  } catch (e) {
    const msg = (e as Error).message
    console.error(`  ❌ Scrape failed: ${msg}`)
    return { status: 'error', error: `${domain}: ${msg}` }
  }

  const { ads, advertiser, totalAdsOnMeta } = scrapeResult

  // ── 4. Persist advertiser if newly discovered ─────────────────────────────
  if (advertiser && !store.metaPageId) {
    try {
      await updateStoreAdvertiser(store.storeId, advertiser.pageName, advertiser.pageId, totalAdsOnMeta)
      console.log(`  [F4] ✓ Guardado: "${advertiser.pageName}" (pageId: ${advertiser.pageId || 'n/a'}, total: ${totalAdsOnMeta})`)
    } catch (e) {
      console.warn(`  [F4] ⚠ No se pudo guardar advertiser: ${(e as Error).message}`)
    }
  }

  if (ads.length === 0) {
    console.log('  → 0 ads — skipping ingest')
    return { status: 'synced', adsSaved: 0, matches: 0 }
  }

  // ── F3 verbose report ─────────────────────────────────────────────────────
  const totalMatched = ads.filter(a => a.matchedCandidateId).length
  if (candidates.length > 0) {
    console.log(`  [F3] Detalle por candidato (${totalMatched}/${ads.length} ads con match):`)
    for (const c of candidates) {
      const handle = c.productUrl?.match(/\/products\/([^/?#]+)/)?.[1] ?? '(sin handle)'
      const matched = ads.filter(a => a.matchedCandidateId === c.candidateId)
      console.log(`    ${handle} → ${matched.length} ads matched`)
    }
    if (totalMatched === 0) {
      console.log(`  [F3] 0 matches — estos ads se descartarán (no hay fallback):`)
      for (const ad of ads.slice(0, 3)) {
        console.log(`    ${ad.productUrl || '(sin URL)'}`)
      }
    }
  }

  // ── 5. Push only ads with a real F3 match — no fallback ──────────────────
  let pushed = 0
  let skipped = 0
  let totalAdsSaved = 0
  for (const candidate of candidates) {
    const matched = ads.filter(a => a.matchedCandidateId === candidate.candidateId)
    const handle  = candidate.productUrl?.match(/\/products\/([^/?#]+)/)?.[1] ?? candidate.candidateId.slice(0, 8)
    if (matched.length === 0) {
      console.log(`  - ${handle} → sin ads con match`)
      skipped++
      continue
    }
    await pushAds(candidate.candidateId, domain, matched)
    console.log(`  ✅ ${handle} → ${matched.length} ads`)
    pushed++
    totalAdsSaved += matched.length
  }
  console.log(`  [F3] Resultado: ${pushed} candidatos con ads / ${skipped} sin match / ${ads.length - totalMatched} ads descartados`)

  return { status: 'synced', adsSaved: totalAdsSaved, matches: pushed }
}

async function main(): Promise<void> {
  const startedAt = new Date()
  console.log('🚀 sync-ads: starting\n')

  const stores = await getProStores()
  console.log(`Found ${stores.length} Pro/Agency stores\n`)

  let storesProcessed = 0
  let storesSkipped   = 0
  let totalAdsSaved   = 0
  let totalMatches    = 0
  const errors: string[] = []

  for (const store of stores) {
    const domain = new URL(store.baseUrl).hostname.replace(/^www\./, '')
    console.log(`\n📦 ${domain}`)
    const result = await syncStore(store)

    if (result.status === 'skipped') {
      storesSkipped++
    } else if (result.status === 'error') {
      storesProcessed++
      errors.push(result.error)
    } else {
      storesProcessed++
      totalAdsSaved += result.adsSaved
      totalMatches  += result.matches
    }

    await new Promise(r => setTimeout(r, 3000)) // rate-limit between stores
  }

  const durationSeconds = Math.round((Date.now() - startedAt.getTime()) / 1000)

  const summary = {
    timestamp:        startedAt.toISOString(),
    duration_seconds: durationSeconds,
    stores_processed: storesProcessed,
    stores_skipped:   storesSkipped,
    total_ads_saved:  totalAdsSaved,
    matches:          totalMatches,
    errors,
  }

  fs.writeFileSync('sync-results.json', JSON.stringify(summary, null, 2))

  console.log('\n✅ sync-ads: done')
  console.log(`   ${storesProcessed} procesadas / ${storesSkipped} skipped / ${totalAdsSaved} ads / ${durationSeconds}s`)
  if (errors.length > 0) console.log(`   ⚠ ${errors.length} errores: ${errors.join(', ')}`)
}

main().catch(err => {
  console.error('\n❌ Fatal:', err.message)
  process.exit(1)
})
