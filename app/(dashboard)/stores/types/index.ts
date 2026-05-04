
export interface StoreResponse {
  storeId: string
  storeName: string
  baseUrl: string
  bestsellerPath: string
  recentPath: string
  isActive: boolean
  lastScrapedAt: string
}

export interface CreateStoreRequest {
  storeName: string
  baseUrl: string
  bestsellerUrl: string
  recentUrl: string
}

