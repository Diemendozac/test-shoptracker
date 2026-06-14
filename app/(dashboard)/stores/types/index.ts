
export interface StoreResponse {
  storeId: string
  storeName: string
  baseUrl: string
  bestsellerPath: string
  isActive: boolean
  lastScrapedAt: string
  niche: string | null
  currency: string | null
  country: string | null
  pagoAnticipado: boolean | null
  inactivityScore: number | null
  inactivityTier: 'ACTIVA' | 'MODERADA' | 'INACTIVA' | 'ZOMBIE' | null
  productCount: number | null
  subscribedToExisting?: boolean
}

export interface CreateStoreRequest {
  storeName: string
  baseUrl: string
  bestsellerUrl: string
  niche?: string
  currency?: string
  pagoAnticipado?: boolean
}

export interface UpdateStoreRequest {
  storeName?: string
  baseUrl?: string
  pagoAnticipado?: boolean
}

