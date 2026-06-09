// lib/scrapers/test-scraper.ts
// Standalone test for the two-phase Meta Ad Library scraper.
// Run: npm run test:scraper

import * as fs from 'fs'
import * as path from 'path'
import { scrapeAdsForStore } from './meta-ads'
import { r2Configured } from '../storage/r2'

const DOMAIN  = 'vxv11x-re.myshopify.com'
const COUNTRY = 'CO'
const OUTPUT  = path.join(process.cwd(), 'test-results.json')
const LINE    = '─'.repeat(60)

async function main() {
  console.log(`\n${LINE}`)
  console.log(`  Meta Ad Library — test scraper`)
  console.log(`  Dominio  : ${DOMAIN}`)
  console.log(`  R2       : ${r2Configured ? '✓ configurado' : '✗ no configurado (URLs de Meta)'}`)
  console.log(`${LINE}\n`)

  const t0 = Date.now()

  const { ads, advertiser, totalAdsOnMeta } = await scrapeAdsForStore(
    DOMAIN,
    COUNTRY,
    [],          // no candidates for standalone test
    undefined,
    { headless: false },
  )

  const ms = Date.now() - t0
  console.log(`\n${LINE}`)
  console.log(`  Tiempo   : ${(ms / 1000).toFixed(1)}s`)

  if (!advertiser) {
    console.log('  ✗ No se detectó anunciante')
  } else {
    console.log(`  Anunciante : ${advertiser.pageName}`)
    console.log(`  Page ID    : ${advertiser.pageId || '(no encontrado)'}`)
    console.log(`  Total Meta : ~${totalAdsOnMeta} anuncios activos`)
  }

  console.log(`  Extraídos  : ${ads.length}`)
  console.log(`${LINE}\n`)

  if (ads.length === 0) {
    console.log('  ❌ Sin resultados — posible cambio en DOM de Meta o bloqueo.')
  } else {
    const r2Domain    = process.env.R2_PUBLIC_URL || ''
    const thumbsInR2  = ads.filter(a => a.thumbnailUrl?.includes(r2Domain)).length
    const videosFound = ads.filter(a => a.videoUrl).length
    const videosInR2  = ads.filter(a => a.videoUrl?.includes(r2Domain)).length

    if (r2Configured) {
      console.log(`  Thumbnails en R2 : ${thumbsInR2} / ${ads.filter(a => a.thumbnailUrl).length}`)
      console.log(`  Videos encontr.  : ${videosFound}  |  en R2: ${videosInR2}\n`)
    }

    ads.forEach((ad, i) => {
      const thumbLabel = ad.thumbnailUrl
        ? (r2Configured && ad.thumbnailUrl.includes(r2Domain) ? '[R2]  ' : '[Meta] ') + ad.thumbnailUrl.slice(0, 70) + '…'
        : '(ninguno)'

      console.log(`[${String(i + 1).padStart(2)}] ${ad.advertiserName ?? '(sin nombre)'}  —  ${ad.daysRunning}d activo`)
      console.log(`      URL destino : ${ad.productUrl || '—'}`)
      console.log(`      Snapshot    : ${ad.adSnapshotUrl}`)
      console.log(`      Thumbnail   : ${thumbLabel}`)
      if (ad.videoUrl) console.log(`      Video       : ${ad.videoUrl.slice(0, 75)}…`)
      if (ad.matchedCandidateId) console.log(`      Candidato   : ${ad.matchedCandidateId}`)
      console.log()
    })
  }

  const output = {
    domain: DOMAIN,
    country: COUNTRY,
    scrapedAt: new Date().toISOString(),
    advertiser,
    totalAdsOnMeta,
    totalExtracted: ads.length,
    r2Configured,
    ads,
  }

  fs.writeFileSync(OUTPUT, JSON.stringify(output, null, 2), 'utf8')
  console.log(`✓ Guardado en: ${OUTPUT}\n`)
}

main().catch(err => {
  console.error('\n❌ Error:', err.message)
  if (err.stack) console.error(err.stack.split('\n').slice(1, 4).join('\n'))
  process.exit(1)
})
