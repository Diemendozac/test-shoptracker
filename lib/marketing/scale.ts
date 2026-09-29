// Cifras del bloque de escala de la landing ("No empiezas de cero: la base ya existe").
//
// Las entrega Diego con las definiciones exactas de
// docs/redesign/landing-auth-onboarding/02-prototipo-y-spec.md ("Decisiones abiertas", punto 4):
// universo = tiendas que alimentan el pool global (nunca las privadas de Pro y Agency),
// deduplicadas por dominio, con una sola fecha de corte en hora de Colombia.
//
// Para publicar: completar SCALE con el conteo fechado y pasar SCALE_BLOCK_ENABLED a true en el
// mismo PR. Mientras el flag esté apagado, o falte la fecha de corte o alguna de las tres cifras,
// la landing no muestra el bloque ni el enlace "El mercado". No hay texto de relleno ni
// "DATO REAL PENDIENTE" en producción: sin conteo, no hay bloque.

export interface ScaleData {
  /** Fecha de corte de las tres cifras, 'AAAA-MM-DD' (hora de Colombia) */
  corte: string | null
  /** Fecha de la primera foto del ranking, 'AAAA-MM-DD' */
  desde: string | null
  /** Conteo 1: tiendas del universo con foto del ranking entre corte − 6 y corte */
  tiendas: number | null
  /** Conteo 2: pares (tienda, handle) detectados con first_seen_date ≤ corte */
  productos: number | null
  /** Conteo 3: días con al menos una foto del ranking, hasta el corte */
  dias: number | null
  /** Tiendas del conteo 1 por país, [código ISO de 2 letras, tiendas] */
  paises: [string, number][] | null
}

export const SCALE_BLOCK_ENABLED = false

export const SCALE: ScaleData = {
  corte: null,
  desde: null,
  tiendas: null,
  productos: null,
  dias: null,
  paises: null,
}

export interface PublishableScale {
  corte: string
  desde: string | null
  tiendas: number
  productos: number
  dias: number
  paises: [string, number][] | null
}

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/
const isCount = (n: number | null): n is number => typeof n === 'number' && Number.isFinite(n) && n > 0

/** Las cifras listas para publicar, o null si el bloque no debe mostrarse. */
export function publishableScale(
  data: ScaleData = SCALE,
  enabled: boolean = SCALE_BLOCK_ENABLED,
): PublishableScale | null {
  if (!enabled) return null
  const { corte, desde, tiendas, productos, dias, paises } = data
  if (!corte || !DATE_ONLY.test(corte)) return null
  if (!isCount(tiendas) || !isCount(productos) || !isCount(dias)) return null
  return {
    corte,
    desde: desde && DATE_ONLY.test(desde) ? desde : null,
    tiendas,
    productos,
    dias,
    paises: paises && paises.length > 0 ? paises : null,
  }
}

// Mercados de Latinoamérica: van primero en el desglose, de mayor a menor.
const LATAM = new Set([
  'AR', 'BO', 'BR', 'CL', 'CO', 'CR', 'CU', 'DO', 'EC', 'GT',
  'HN', 'MX', 'NI', 'PA', 'PE', 'PR', 'PY', 'SV', 'UY', 'VE',
])

export interface CountryRow {
  /** Código ISO, o null para la fila "Otros países" */
  code: string | null
  stores: number
}

/** LATAM de mayor a menor y el resto sumado en una sola fila al final. */
export function countryRows(paises: [string, number][]): CountryRow[] {
  const latam: CountryRow[] = []
  let others = 0
  for (const [code, stores] of paises) {
    if (!isCount(stores)) continue
    const cc = code.trim().toUpperCase()
    if (LATAM.has(cc)) latam.push({ code: cc, stores })
    else others += stores
  }
  latam.sort((a, b) => b.stores - a.stores)
  return others > 0 ? [...latam, { code: null, stores: others }] : latam
}
