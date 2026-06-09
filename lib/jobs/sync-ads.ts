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

import { scrapeAdsForStore } from '../scrapers/meta-ads'

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
}

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
}

async function getCandidatesForStore(storeId: string): Promise<Candidate[]> {
  const res = await fetch(`${API_URL}/internal/stores/${storeId}/candidates`, {
    headers: { 'X-Webhook-Secret': WEBHOOK_SECRET },
  })
  if (!res.ok) throw new Error(`Failed to fetch candidates: ${res.status}`)
  return res.json()
}

async function pushAds(candidateId: string, storeDomain: string, ads: ReturnType<typeof scrapeAdsForStore> extends Promise<infer T> ? T : never): Promise<void> {
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
      })),
    }),
  })
  if (!res.ok) throw new Error(`Failed to push ads: ${res.status}`)
}

async function syncStore(store: Store): Promise<void> {
  const domain = new URL(store.baseUrl).hostname.replace(/^www\./, '')
  const country = store.country || 'ALL'
  console.log(`\n📦 Syncing ${domain} (country: ${country})`)

  let ads: Awaited<ReturnType<typeof scrapeAdsForStore>> = []
  try {
    ads = await scrapeAdsForStore(domain, country)
    console.log(`  → ${ads.length} ads found`)
  } catch (e) {
    console.error(`  ❌ Scrape failed: ${(e as Error).message}`)
    return
  }

  if (ads.length === 0) {
    console.log('  → No ads — skipping ingest')
    return
  }

  const candidates = await getCandidatesForStore(store.storeId)
  if (candidates.length === 0) {
    console.log('  → No candidates — skipping ingest')
    return
  }

  // Push all ads to every active candidate of this store.
  // The backend deduplicates by ad_snapshot_url.
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
