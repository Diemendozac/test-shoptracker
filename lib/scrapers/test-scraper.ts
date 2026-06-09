// lib/scrapers/test-scraper.ts
// Prueba standalone del scraper contra gymshark.com
// Corre: npm run test:scraper

import * as fs from 'fs'
import * as path from 'path'
import { scrapeAdsForStore } from './meta-ads'

const DOMAIN  = 'gymshark.com'
const COUNTRY = 'US'
const OUTPUT  = path.join(process.cwd(), 'test-results.json')

const LINE = '─'.repeat(50)

async function main() {
  console.log(`\n✓ Scraping ${DOMAIN} (country: ${COUNTRY})...`)
  console.log(LINE)

  const t0  = Date.now()
  const ads = await scrapeAdsForStore(DOMAIN, COUNTRY, undefined, { headless: false })
  const ms  = Date.now() - t0

  console.log(`\nAnuncios encontrados: ${ads.length}  (${(ms / 1000).toFixed(1)}s)\n`)

  if (ads.length === 0) {
    console.log('  ❌ Sin resultados — posible cambio en DOM de Meta o bloqueo.')
  } else {
    ads.forEach((ad, i) => {
      console.log(`[${i + 1}] Anunciante  : ${ad.advertiserName ?? '(sin nombre)'}`)
      console.log(`     URL destino : ${ad.productUrl || '—'}`)
      console.log(`     Snapshot    : ${ad.adSnapshotUrl}`)
      console.log(`     Thumbnail   : ${ad.thumbnailUrl ? ad.thumbnailUrl.slice(0, 80) + '…' : '(ninguno)'}`)
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
