import { type NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const baseUrl = req.nextUrl.searchParams.get('baseUrl')
  const handle  = req.nextUrl.searchParams.get('handle')

  if (!baseUrl || !handle) return NextResponse.json({ images: [] })

  const url = `${baseUrl.replace(/\/$/, '')}/products/${handle}.json`

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      next: { revalidate: 3600 },
    })

    if (!res.ok) return NextResponse.json({ images: [] })

    const data = await res.json()
    const images: string[] = (data.product?.images ?? [])
      .slice(0, 5)
      .map((img: { src: string }) => img.src)

    return NextResponse.json({ images })
  } catch {
    return NextResponse.json({ images: [] })
  }
}
