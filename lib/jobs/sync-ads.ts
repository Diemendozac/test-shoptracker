// lib/jobs/sync-ads.ts
// Scrapes Meta Ad Library for all Pro/Agency stores and pushes results to backend.
//
// Run manually or via cron on Easypanel (Node.js service, NOT Vercel):
//   npx tsx lib/jobs/sync-ads.ts
//
// Required env vars:
//   NEXT_PUBLIC_API_URL   — backend base URL (e.g. http://shoptracker-api:8080/api)
//   WEBHOOK_SECRET        — shared secret for internal API endpoints
//   ANTHROPIC_API_KEY     — optional, used by scraper for keyword normalization

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

async function checkDomain(domain: string): Promise<boolean> {
  try {
    const res = await fetch(`https://${domain}/products.json?limit=1`, {
      signal: AbortSignal.timeout(8000),
    })
    return res.ok
  } catch {
    return false
  }
}

async function resolveNewDomain(domain: string): Promise<string | null> {
  try {
    // Many stores redirect the old domain to the new one — follow the chain.
    const res = await fetch(`https://${domain}`, {
      redirect: 'follow',
      signal: AbortSignal.timeout(8000),
    })
    const finalDomain = new URL(res.url).hostname.replace(/^www\./, '')
    if (finalDomain === domain) return null
    // Confirm the resolved domain is a live Shopify store.
    const alive = await checkDomain(finalDomain)
    return alive ? finalDomain : null
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

// ── Backend API helpers ────────────────────────────────────────────────────────

async function getProStores(): Promise<Store[]> {
  const res = await fetch(`${API_URL}/internal/stores/pro`, {
    headers: { 'X-Webhook-Secret': WEBHOOK_SECRET },
  })
  if (!res.ok) throw new Error(`Failed to fetch stores: ${res.status}`)
  return res.json()
}

interface Candidate {
  candidateId: string
  storeDomain: string
  country: string
  productUrl?: string | null
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

async function syncStore(store: Store): Promise<void> {
  let domain = new URL(store.baseUrl).hostname.replace(/^www\./, '')
  const country = store.country || 'ALL'

  // ── 1. Domain health check ────────────────────────────────────────────────
  const alive = await checkDomain(domain)
  if (!alive) {
    const newDomain = await resolveNewDomain(domain)
    if (newDomain) {
      try {
        await updateStoreDomain(store.storeId, newDomain)
        console.log(`  ✓ ${domain} → ${newDomain} (dominio actualizado en DB)`)
      } catch (e) {
        console.warn(`  ⚠ Resolved new domain but DB update failed: ${(e as Error).message}`)
      }
      domain = newDomain
    } else {
      console.log(`  ✗ ${domain} — no responde, no se pudo resolver → skipping`)
      return
    }
  } else {
    console.log(`  ✓ ${domain} — dominio OK`)
  }

  // ── 2. Get candidates (needed for Phase 3 matching) ──────────────────────
  const candidates = await getCandidatesForStore(store.storeId)
  if (candidates.length === 0) {
    console.log(`  → No candidates for ${domain} — skipping`)
    return
  }

  // ── 3. Scrape (F1 → F2 → F3 → R2) ───────────────────────────────────────
  console.log(`\n📦 Syncing ${domain}`)
  let scrapeResult: Awaited<ReturnType<typeof scrapeAdsForStore>>
  try {
    scrapeResult = await scrapeAdsForStore(domain, country, candidates, undefined, {
      knownPageId:   store.metaPageId   ?? undefined,
      knownPageName: store.metaPageName ?? undefined,
    })
  } catch (e) {
    console.error(`  ❌ Scrape failed: ${(e as Error).message}`)
    return
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
    return
  }

  // ── 5. Push to each active candidate — backend deduplicates by snapshot URL
  for (const candidate of candidates) {
    await pushAds(candidate.candidateId, domain, ads)
    console.log(`  ✅ Pushed ${ads.length} ads to candidate ${candidate.candidateId}`)
  }
}

async function main(): Promise<void> {
  console.log('🚀 sync-ads: starting\n')
  const stores = await getProStores()
  console.log(`Found ${stores.length} Pro/Agency stores\n`)

  for (const store of stores) {
    await syncStore(store)
    await new Promise(r => setTimeout(r, 3000)) // rate-limit between stores
  }

  console.log('\n✅ sync-ads: done')
}

main().catch(err => {
  console.error('\n❌ Fatal:', err.message)
  process.exit(1)
})
