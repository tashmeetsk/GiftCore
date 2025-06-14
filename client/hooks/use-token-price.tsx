"use client"

import { useState, useEffect, useCallback } from "react"
import { CoinGeckoService, type TokenPrice } from "@/lib/coingecko-api"

interface UsePriceDataReturn {
  price: TokenPrice | null
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useTokenPrice(tokenId: string, autoRefresh = true): UsePriceDataReturn {
  const [price, setPrice] = useState<TokenPrice | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const coinGeckoService = CoinGeckoService.getInstance()

  const fetchPrice = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const priceData = await coinGeckoService.getTokenPrice(tokenId)

      if (priceData) {
        setPrice(priceData)
      } else {
        setError("Failed to fetch price data")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred")
    } finally {
      setLoading(false)
    }
  }, [tokenId, coinGeckoService])

  const refetch = useCallback(() => {
    fetchPrice()
  }, [fetchPrice])

  useEffect(() => {
    fetchPrice()

    if (autoRefresh) {
      const interval = setInterval(fetchPrice, 30000) 
      return () => clearInterval(interval)
    }
  }, [fetchPrice, autoRefresh])

  return { price, loading, error, refetch }
}
