import { type NextRequest, NextResponse } from 'next/server'

export async function GET(
  req: NextRequest,
  { params }: { params: { candidateId: string } },
) {
  const auth = req.headers.get('Authorization')
  if (!auth) return NextResponse.json({ ads: [], isPro: false }, { status: 401 })

  const backendUrl = `${process.env.NEXT_PUBLIC_API_URL}/dashboard/candidates/${params.candidateId}/ads`

  try {
    const res = await fetch(backendUrl, {
      headers: { Authorization: auth },
      cache: 'no-store',
    })

    const data = await res.json().catch(() => ({}))
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json({ ads: [], isPro: false, error: 'upstream_error' }, { status: 502 })
  }
}
