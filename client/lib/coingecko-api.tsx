const COINGECKO_API_KEY = "CG-XjHcjQLo3c3gRUT6jtK2E5NU"
const BASE_URL = "https://api.coingecko.com/api/v3"

export interface TokenPrice {
  id: string
  symbol: string
  current_price: number
  price_change_percentage_24h: number
  last_updated: string
}

export interface ApiError {
  message: string
  status?: number
}

export class CoinGeckoService {
  private static instance: CoinGeckoService
  private cache: Map<string, { data: TokenPrice; timestamp: number }> = new Map()
  private readonly CACHE_DURATION = 30000 // 30 seconds

  static getInstance(): CoinGeckoService {
    if (!CoinGeckoService.instance) {
      CoinGeckoService.instance = new CoinGeckoService()
    }
    return CoinGeckoService.instance
  }

  private async makeRequest(endpoint: string): Promise<any> {
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        headers: {
          "x-cg-demo-api-key": COINGECKO_API_KEY,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error("CoinGecko API Error:", error)
      throw error
    }
  }

  async getTokenPrice(tokenId: string): Promise<TokenPrice | null> {
    try {
      // Check cache first
      const cached = this.cache.get(tokenId)
      if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
        return cached.data
      }

      const data = await this.makeRequest(
        `/coins/${tokenId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`,
      )

      if (!data || !data.market_data) {
        throw new Error("Invalid API response")
      }

      const tokenPrice: TokenPrice = {
        id: data.id,
        symbol: data.symbol.toUpperCase(),
        current_price: data.market_data.current_price.usd || 0,
        price_change_percentage_24h: data.market_data.price_change_percentage_24h || 0,
        last_updated: data.market_data.last_updated,
      }

      // Cache the result
      this.cache.set(tokenId, { data: tokenPrice, timestamp: Date.now() })

      return tokenPrice
    } catch (error) {
      console.error(`Error fetching price for ${tokenId}:`, error)
      return null
    }
  }

  async getMultipleTokenPrices(tokenIds: string[]): Promise<TokenPrice[]> {
    try {
      const promises = tokenIds.map((id) => this.getTokenPrice(id))
      const results = await Promise.allSettled(promises)

      return results
        .filter(
          (result): result is PromiseFulfilledResult<TokenPrice> =>
            result.status === "fulfilled" && result.value !== null,
        )
        .map((result) => result.value)
    } catch (error) {
      console.error("Error fetching multiple token prices:", error)
      return []
    }
  }
}
