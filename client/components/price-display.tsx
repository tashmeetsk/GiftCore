"use client"

import { TrendingUp, TrendingDown, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface PriceDisplayProps {
  price: number
  change24h: number
  loading?: boolean
  error?: string | null
  onRefresh?: () => void
  className?: string
}

export default function PriceDisplay({
  price,
  change24h,
  loading = false,
  error = null,
  onRefresh,
  className,
}: PriceDisplayProps) {
  const formatPrice = (price: number) => {
    if (price >= 1) {
      return `$${price.toFixed(2)}`
    } else if (price >= 0.01) {
      return `$${price.toFixed(4)}`
    } else {
      return `$${price.toFixed(6)}`
    }
  }

  const formatChange = (change: number) => {
    const sign = change >= 0 ? "+" : ""
    return `${sign}${change.toFixed(2)}%`
  }

  if (error) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <span className="text-red-400 text-sm">Price unavailable</span>
        {onRefresh && (
          <Button variant="ghost" size="sm" onClick={onRefresh} className="h-6 w-6 p-0 text-gray-400 hover:text-white">
            <RefreshCw size={12} />
          </Button>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className="animate-pulse bg-gray-600 h-4 w-16 rounded"></div>
        <div className="animate-pulse bg-gray-600 h-3 w-12 rounded"></div>
      </div>
    )
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="font-medium">{formatPrice(price)}</span>
      <div className={cn("flex items-center gap-1 text-xs", change24h >= 0 ? "text-green-400" : "text-red-400")}>
        {change24h >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
        <span>{formatChange(change24h)}</span>
      </div>
      {onRefresh && (
        <Button variant="ghost" size="sm" onClick={onRefresh} className="h-6 w-6 p-0 text-gray-400 hover:text-white">
          <RefreshCw size={12} />
        </Button>
      )}
    </div>
  )
}
