"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { BackgroundGradient } from "@/components/ui/background-gradient"
import GiftCardSelector from "@/components/gift-card-selector"
import PriceDisplay from "@/components/price-display"
import { useTokenPrice } from "@/hooks/use-token-price"
import {useAccount, useBalance} from "wagmi"
import { cn } from "@/lib/utils"

export default function SwapInterface() {
  const [sellAmount, setSellAmount] = useState<string>("")
  const [email, setEmail] = useState<string>("")
  const [emailError, setEmailError] = useState<string>("")
  
  const { address } = useAccount()
  const {data, isError, isLoading, error}= useBalance({
    address : address,
    watch: true,
    enabled: !!address,
  })

  const [selectedGiftCard, setSelectedGiftCard] = useState({
    name: "AMAZON",
    displayName: "Amazon Gift Card",
    icon: "/images/amazon-logo.png",
  })

  const { price: corePrice, loading: priceLoading, error: priceError, refetch } = useTokenPrice("coredaoorg")

  const coreToken = {
    symbol: data?.symbol || "CORE",
    name: "Core DAO",
    icon: "/images/core-logo.png",
    balance: isLoading ? "Loading..." : isError ? "Error" : data?.formatted || "0.00",
    price: corePrice?.current_price || 0,
    change24h: corePrice?.price_change_percentage_24h || 0,
  }

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setEmail(value)
    
    if (value === "") {
      setEmailError("")
    } else if (!validateEmail(value)) {
      setEmailError("Please enter a valid email address")
    } else {
      setEmailError("")
    }
  }

  const calculateUSDValue = () => {
    if (!sellAmount || !corePrice?.current_price) return "0.00"
    const amount = Number.parseFloat(sellAmount)
    return (amount * corePrice.current_price).toFixed(2)
  }

  const calculateGiftCardValue = () => {
    if (!sellAmount || !corePrice?.current_price) return "0.00"
    const amount = Number.parseFloat(sellAmount)
    const usdValue = amount * corePrice.current_price
    const serviceFee = usdValue * 0.05 
    return (usdValue - serviceFee).toFixed(2)
  }

  const handleMaxClick = () => {
    setSellAmount(coreToken.balance)
  }

  const isFormValid = () => {
    return sellAmount && 
           email && 
           !emailError && 
           validateEmail(email) && 
           !priceLoading && 
           !priceError
  }

  return (
    <div className="relative w-[100rem]">
      <BackgroundGradient className="rounded-[32px] max-w-full bg-black/40 backdrop-blur-xl border border-white/10 text-white shadow-2xl">
        <div className="p-8 space-y-8">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-lg text-white/70">Pay with</span>
              <PriceDisplay
                price={coreToken.price}
                change24h={coreToken.change24h}
                loading={priceLoading}
                error={priceError}
                onRefresh={refetch}
                className="text-sm"
              />
            </div>

            <div className="flex items-center gap-4">
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl h-14 pl-4 pr-5 flex items-center gap-3">
                <img src={coreToken.icon} className="w-8 h-8 rounded-full" alt={coreToken.name} />
                <span className="text-xl font-semibold">{coreToken.symbol}</span>
              </div>

              <div className="flex-1">
                <input
                  type="text"
                  value={sellAmount}
                  onChange={(e) => {
                    const value = e.target.value
                    if (value === "" || /^\d*\.?\d*$/.test(value)) {
                      setSellAmount(value)
                    }
                  }}
                  placeholder="0"
                  className="w-full bg-transparent text-right text-5xl font-light focus:outline-none placeholder:text-white/30"
                />
                <div className="text-right text-lg text-white/60 mt-2 flex items-center justify-end gap-3">
                  <span>${calculateUSDValue()}</span>
                  <button
                    onClick={handleMaxClick}
                    className="text-[#00d4aa] font-semibold text-sm hover:text-[#00f4c4] transition-colors px-2 py-1 rounded-lg bg-[#00d4aa]/10"
                  >
                    MAX
                  </button>
                </div>
              </div>
            </div>

            <div className="text-lg text-white/60">
              Balance: {coreToken.balance} {coreToken.symbol}
            </div>
          </div>

          <div className="space-y-4 pt-4">
            <div className="flex justify-between">
              <span className="text-lg text-white/70">Receive</span>
            </div>

            <div className="flex items-center gap-4">
              <GiftCardSelector giftCard={selectedGiftCard} onSelect={setSelectedGiftCard} />

              <div className="flex-1">
                <div className="w-full text-right text-5xl font-light text-[#00d4aa]">${calculateGiftCardValue()}</div>
                <div className="text-right text-lg text-white/60 mt-2">Gift Card Value</div>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 space-y-5 border border-white/10">
            <div className="flex justify-between items-center">
              <span className="text-lg">Current CORE Price</span>
              <PriceDisplay
                price={coreToken.price}
                change24h={coreToken.change24h}
                loading={priceLoading}
                error={priceError}
                onRefresh={refetch}
              />
            </div>

            <div className="flex justify-between items-center">
              <span className="text-lg text-white/70">Service Fees</span>
              <span className="text-lg text-red-400">5%</span>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-white/20">
              <span className="text-lg font-semibold">You will receive</span>
              <span className="text-lg font-semibold text-[#00d4aa]">${calculateGiftCardValue()}</span>
            </div>
          </div>

          {/* Email Input Section */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-lg text-white/70">📧</span>
                <span className="text-lg font-medium">Email Address</span>
              </div>
              
              <div className="space-y-2">
                <input
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  placeholder="Enter your email address"
                  className={cn(
                    "w-full bg-white/10 backdrop-blur-sm border rounded-xl px-4 py-3 text-lg focus:outline-none focus:ring-2 transition-all duration-200",
                    emailError 
                      ? "border-red-400 focus:ring-red-400/50" 
                      : email && !emailError 
                        ? "border-[#00d4aa] focus:ring-[#00d4aa]/50" 
                        : "border-white/20 focus:ring-white/30"
                  )}
                />
                
                {emailError && (
                  <div className="flex items-center gap-2 text-red-400 text-sm">
                    <span>⚠️</span>
                    <span>{emailError}</span>
                  </div>
                )}
                
                {email && !emailError && validateEmail(email) && (
                  <div className="flex items-center gap-2 text-[#00d4aa] text-sm">
                    <span>✅</span>
                    <span>Valid email address</span>
                  </div>
                )}
              </div>
              
              <div className="text-sm text-white/50">
                Your gift card will be sent to this email address after payment confirmation.
              </div>
            </div>
          </div>

          <Button
            className={cn(
              "w-full py-8 text-xl font-semibold rounded-2xl transition-all duration-300",
              isFormValid()
                ? "bg-[#00d4aa] hover:bg-[#00f4c4] text-black shadow-lg shadow-[#00d4aa]/25"
                : "bg-white/10 text-white/50 cursor-not-allowed border border-white/20",
            )}
            disabled={!isFormValid()}
          >
            {priceLoading 
              ? "Loading Price..." 
              : priceError 
                ? "Price Error - Try Again" 
                : !sellAmount 
                  ? "Enter Amount" 
                  : !email 
                    ? "Enter Email Address"
                    : emailError
                      ? "Fix Email Address"
                      : "Buy Now"
            }
          </Button>

          {corePrice?.last_updated && (
            <div className="text-center text-sm text-white/50">
              Last updated: {new Date(corePrice.last_updated).toLocaleTimeString()}
            </div>
          )}
        </div>
      </BackgroundGradient>
    </div>
  )
}
