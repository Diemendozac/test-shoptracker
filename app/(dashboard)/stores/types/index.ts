
export interface StoreResponse {
  storeId: string
  storeName: string
  baseUrl: string
  bestsellerPath: string
  isActive: boolean
  lastScrapedAt: string
  niche: string | null
  currency: string | null
  pagoAnticipado: boolean | null
}

export interface CreateStoreRequest {
  storeName: string
  baseUrl: string
  bestsellerUrl: string
  niche?: string
  currency?: string
  pagoAnticipado?: boolean
}

