import { type NextRequest, NextResponse } from 'next/server'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

// Parse the first <link rel="icon"> or <link rel="shortcut icon"> href from HTML
function parseFaviconHref(html: string): string | null {
  const patterns = [
    /<link[^>]+rel=["'](?:shortcut icon|icon)["'][^>]+href=["']([^"'?]+[^"']*?)["']/i,
    /<link[^>]+href=["']([^"'?]+[^"']*?)["'][^>]+rel=["'](?:shortcut icon|icon)["']/i,
  ]
  for (const re of patterns) {
    const m = html.match(re)
    if (m?.[1]) return m[1]
  }
  return null
}

function resolveUrl(href: string, base: string): string {
  if (href.startsWith('http')) return href
  if (href.startsWith('//')) return `https:${href}`
  const origin = base.replace(/\/$/, '')
  return `${origin}${href.startsWith('/') ? '' : '/'}${href}`
}

async function fetchImage(url: string): Promise<NextResponse | null> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA },
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(5_000),
    })
    if (!res.ok) return null
    const body = await res.arrayBuffer()
    if (body.byteLength < 64) return null // reject empty/1x1 placeholder images
    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': res.headers.get('content-type') ?? 'image/x-icon',
        'Cache-Control': 'public, max-age=86400',
      },
    })
  } catch {
    return null
  }
}

export async function GET(req: NextRequest) {
  const domain = req.nextUrl.searchParams.get('domain')
  if (!domain) return new NextResponse(null, { status: 400 })

  const base = domain.startsWith('http') ? domain.replace(/\/$/, '') : `https://${domain}`

  // Step 1: Scrape the homepage for <link rel="icon"> (needed for Shopify CDN favicons)
  try {
    const html = await fetch(base, {
      headers: { 'User-Agent': UA, Accept: 'text/html' },
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(7_000),
    }).then(r => r.text())

    const href = parseFaviconHref(html)
    if (href) {
      const img = await fetchImage(resolveUrl(href, base))
      if (img) return img
    }
  } catch {}

  // Step 2: Fallback — try /favicon.ico directly
  const img = await fetchImage(`${base}/favicon.ico`)
  if (img) return img

  return new NextResponse(null, { status: 404 })
}
