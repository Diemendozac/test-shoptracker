// Página pública para compartir un producto (/share/[candidateId]) — CHANGE-133.
// La página y su imagen de vista previa leen el mismo endpoint público del backend
// (GET /api/public/candidates/{id}) desde el servidor. Así los datos que no se muestran
// (tienda, link al producto, videos detrás del adelanto) no llegan al navegador.

export interface ShareAd {
  id: string
  thumbnail_url: string | null
  video_url_r2: string | null
  ad_snapshot_url: string
  status: string
  days_running: number | null
}

export interface ShareProduct {
  candidateId: string
  productTitle: string
  productImage: string | null
  productPrice: number | null
  currency: string | null
  storeCountry: string | null
  pagoAnticipado: boolean | null
  daysElapsed: number | null
  currentRank: number | null
  bestRank: number | null
  daysInBestseller: number | null
  ads: ShareAd[]
}

/** Una hora de caché: el dato del backend cambia una vez al día (el corte diario). */
const REVALIDATE_SECONDS = 3600

export async function getShareProduct(candidateId: string): Promise<ShareProduct | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL
  if (!apiUrl || !/^[0-9a-f-]{36}$/i.test(candidateId)) return null
  try {
    const res = await fetch(`${apiUrl}/public/candidates/${candidateId}`, {
      next: { revalidate: REVALIDATE_SECONDS },
    })
    if (!res.ok) return null
    const raw = await res.json() as ShareProduct
    return { ...raw, ads: Array.isArray(raw.ads) ? raw.ads : [] }
  } catch {
    return null
  }
}

/** Anuncios activos, del que más días lleva al aire al que menos (el endpoint ya los ordena así). */
export function activeAds(p: ShareProduct): ShareAd[] {
  return p.ads.filter((a) => a.status === 'active')
}

const COUNTRY_NAMES: Record<string, string> = {
  CO: 'Colombia', MX: 'México', CL: 'Chile', PE: 'Perú', EC: 'Ecuador', AR: 'Argentina',
  GT: 'Guatemala', CR: 'Costa Rica', PA: 'Panamá', US: 'Estados Unidos', ES: 'España',
}

export function countryName(code: string | null): string | null {
  if (!code) return null
  return COUNTRY_NAMES[code.toUpperCase()] ?? code.toUpperCase()
}

/**
 * La frase del veredicto, solo con datos que el endpoint público trae. No dice "despegando" ni
 * "cayendo": para eso hace falta el historial de rank, que el endpoint público no manda.
 */
export function shareVerdict(p: ShareProduct): string {
  const parts: string[] = []
  if (p.currentRank != null) {
    const best = p.bestRank != null && p.bestRank < p.currentRank ? ` (su mejor puesto fue el #${p.bestRank})` : ''
    parts.push(`Hoy está en el puesto #${p.currentRank} de los más vendidos de su tienda${best}.`)
  }
  if (p.daysInBestseller && p.daysInBestseller > 0) {
    parts.push(p.daysInBestseller === 1
      ? 'Lleva 1 día en ese ranking.'
      : `Lleva ${p.daysInBestseller} días en ese ranking.`)
  }
  const ads = activeAds(p)
  if (ads.length > 0) {
    const oldest = ads[0]?.days_running
    const count = ads.length === 1 ? '1 anuncio activo' : `${ads.length} anuncios activos`
    parts.push(oldest != null && oldest > 0
      ? `Tiene ${count}; el más antiguo, ${oldest} ${oldest === 1 ? 'día' : 'días'} al aire.`
      : `Tiene ${count}.`)
  }
  return parts.length > 0 ? parts.join(' ') : 'Dropspy lo está siguiendo en el ranking de más vendidos de su tienda.'
}

/** Registro con el origen, para medir cuántas cuentas nacen de un link compartido. */
export function shareSignupHref(candidateId: string): string {
  return `/login?tab=signup&ref=share&product=${encodeURIComponent(candidateId)}`
}
