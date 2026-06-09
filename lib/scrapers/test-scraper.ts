// lib/scrapers/test-scraper.ts
// Prueba standalone del scraper contra gymshark.com
// Corre: npm run test:scraper

import * as fs from 'fs'
import * as path from 'path'
import { scrapeAdsForStore } from './meta-ads'
import { r2Configured } from '../storage/r2'

const DOMAIN  = 'vxv11x-re.myshopify.com'
const COUNTRY = 'CO'
const OUTPUT  = path.join(process.cwd(), 'test-results.json')

const LINE = '─'.repeat(50)

async function main() {
  console.log(`\n✓ Scraping ${DOMAIN} (country: ${COUNTRY})...`)
  console.log(`  R2 storage: ${r2Configured ? '✓ configurado' : '✗ no configurado (usando URLs de Meta)'}`)
  console.log(LINE)

  const t0  = Date.now()
  const ads = await scrapeAdsForStore(DOMAIN, COUNTRY, undefined, { headless: false })
  const ms  = Date.now() - t0

  console.log(`\nAnuncios encontrados: ${ads.length}  (${(ms / 1000).toFixed(1)}s)\n`)

  if (ads.length === 0) {
    console.log('  ❌ Sin resultados — posible cambio en DOM de Meta o bloqueo.')
  } else {
    // R2 upload stats
    const r2Domain = process.env.R2_PUBLIC_URL || ''
    const thumbnailsInR2 = ads.filter(ad => ad.thumbnailUrl?.includes(r2Domain)).length
    const videosFound    = ads.filter(ad => ad.videoUrl).length
    const videosInR2     = ads.filter(ad => ad.videoUrl?.includes(r2Domain)).length

    if (r2Configured) {
      console.log(`  Thumbnails subidos a R2: ${thumbnailsInR2} / ${ads.filter(a => a.thumbnailUrl).length}`)
      console.log(`  Videos encontrados: ${videosFound}  |  subidos a R2: ${videosInR2}`)
      console.log()
    }

    ads.forEach((ad, i) => {
      const thumbLabel = ad.thumbnailUrl
        ? (r2Configured && ad.thumbnailUrl.includes(r2Domain) ? '[R2] ' : '[Meta] ') + ad.thumbnailUrl.slice(0, 75) + '…'
        : '(ninguno)'
      console.log(`[${i + 1}] Anunciante  : ${ad.advertiserName ?? '(sin nombre)'}`)
      console.log(`     URL destino : ${ad.productUrl || '—'}`)
      console.log(`     Snapshot    : ${ad.adSnapshotUrl}`)
      console.log(`     Thumbnail   : ${thumbLabel}`)
      if (ad.videoUrl) console.log(`     Video       : ${ad.videoUrl.slice(0, 80)}…`)
      console.log(`     Días corriendo: ${ad.daysRunning}`)
      console.log(`     Desde       : ${ad.firstSeen}`)
      console.log()
    })
  }

  console.log(LINE)

  const output = {
    domain: DOMAIN,
    country: COUNTRY,
    scrapedAt: new Date().toISOString(),
    totalFound: ads.length,
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
