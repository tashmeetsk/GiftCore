"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { BackgroundGradient } from "@/components/ui/background-gradient"
import GiftCardSelector from "@/components/gift-card-selector"
import PriceDisplay from "@/components/price-display"
import { useTokenPrice } from "@/hooks/use-token-price"
import { useAccount, useBalance, useWatchContractEvent, useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { cn } from "@/lib/utils"
import { ethers } from "ethers"
import { GIFT_CONTRACT_ABI } from "@/lib/abis"
import emailjs from '@emailjs/browser'

// Initialize EmailJS with your public key
emailjs.init(process.env.NEXT_PUBLIC_EMAIL_JS!)

type Step = 'form' | 'creating' | 'payment' | 'processing' | 'success' | 'error'

interface ContractData {
  address: string
  amount: string
  email: string
  buyerAddress: string
}

export default function SwapInterface() {
  const [sellAmount, setSellAmount] = useState<string>("")
  const [email, setEmail] = useState<string>("")
  const [emailError, setEmailError] = useState<string>("")
  const [amountError, setAmountError] = useState<string>("")
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false)
  const [step, setStep] = useState<Step>('form')
  const [error, setError] = useState<string>("")
  const [contractData, setContractData] = useState<ContractData | null>(null)
  const [timeLeft, setTimeLeft] = useState<number>(300) // 5 minutes
  const [retryCount, setRetryCount] = useState<number>(0)
  const [eventReceived, setEventReceived] = useState<boolean>(false)
  const [pollInterval, setPollInterval] = useState<NodeJS.Timeout | null>(null)
  const [emailSending, setEmailSending] = useState<boolean>(false)
  
  const { address } = useAccount()
  const { data, isError, isLoading } = useBalance({address: address})

  const [selectedGiftCard, setSelectedGiftCard] = useState({
    name: "AMAZON",
    displayName: "Amazon Gift Card",
    icon: "/images/amazon-logo.png",
  })

  const { price: corePrice, loading: priceLoading, error: priceError, refetch } = useTokenPrice("coredaoorg")

  // Contract write hook
  const { writeContract, data: hash, error: writeError, isPending: isWritePending } = useWriteContract()
  
  // Transaction receipt hook
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  })

  const coreToken = {
    symbol: data?.symbol || "CORE",
    name: "Core DAO",
    icon: "/images/core-logo.png",
    balance: isLoading ? "Loading..." : isError ? "Error" : data?.formatted || "0.00",
    price: corePrice?.current_price || 0,
    change24h: corePrice?.price_change_percentage_24h || 0,
  }

  // Generate voucher code in XXXX-XXXX-XXXX format
  const generateVoucherCode = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = ''
    
    for (let i = 0; i < 12; i++) {
      if (i > 0 && i % 4 === 0) {
        result += '-'
      }
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    
    return result
  }

  // Send gift card email
  const sendGiftCardEmail = async (): Promise<boolean> => {
    if (!contractData?.email) return false

    setEmailSending(true)
    
    try {
      const voucherCode = generateVoucherCode()
      const brandName = selectedGiftCard.name.toUpperCase()

      console.log('Sending gift card email...', {
        brand: brandName,
        voucher_code: voucherCode,
        to_email: contractData.email
      })

      const result = await emailjs.send(
        "service_yooo4fi", // Your service ID
        "template_msl2nhh", // Your template ID
        {
          brand: brandName,
          voucher_code: voucherCode,
          to_email: contractData.email,
        },
        process.env.NEXT_PUBLIC_EMAIL_JS // Your public key from env
      )

      console.log('Email sent successfully:', result)
      return true

    } catch (error) {
      console.error('Failed to send email:', error)
      // Don't fail the transaction if email fails
      return false
    } finally {
      setEmailSending(false)
    }
  }

  // Enhanced contract status polling
  const checkContractStatus = useCallback(async () => {
    if (!contractData?.address) return

    try {
      const response = await fetch('/api/contract-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contractAddress: contractData.address,
        }),
      })

      const data = await response.json()
      
      if (data.success && data.isFulfilled && !eventReceived) {
        console.log('Contract fulfilled detected via polling!')
        setEventReceived(true)
        
        // Send email immediately
        await sendGiftCardEmail()
        
        // Show success page
        setStep('success')
        
        if (pollInterval) {
          clearInterval(pollInterval)
          setPollInterval(null)
        }
      }
    } catch (error) {
      console.error('Error checking contract status:', error)
    }
  }, [contractData?.address, eventReceived, pollInterval, selectedGiftCard.name])

  // Watch for FundsReceived event
  useWatchContractEvent({
    address: contractData?.address as `0x${string}`,
    abi: GIFT_CONTRACT_ABI,
    eventName: 'FundsReceived',
    enabled: !!contractData?.address && step === 'processing' && !eventReceived,
    onLogs: async (logs) => {
      console.log('FundsReceived event detected:', logs)
      if (!eventReceived) {
        setEventReceived(true)
        
        // Send email immediately
        await sendGiftCardEmail()
        
        // Show success page
        setStep('success')
        
        if (pollInterval) {
          clearInterval(pollInterval)
          setPollInterval(null)
        }
      }
    },
    onError(error) {
      console.error('Event listener error:', error)
    }
  })

  // Start polling when processing begins
  useEffect(() => {
    if (step === 'processing' && contractData?.address && !pollInterval && !eventReceived) {
      console.log('Starting contract status polling...')
      const interval = setInterval(checkContractStatus, 3000) // Poll every 3 seconds
      setPollInterval(interval)
    }

    return () => {
      if (pollInterval) {
        clearInterval(pollInterval)
        setPollInterval(null)
      }
    }
  }, [step, contractData?.address, checkContractStatus, pollInterval, eventReceived])

  // Timer for payment timeout
  useEffect(() => {
    let interval: NodeJS.Timeout | undefined

    if (step === 'payment' && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setError("Payment timeout. Please try again.")
            setStep('error')
            setContractData(null)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [step, timeLeft])

  // Reset timer when entering payment step
  useEffect(() => {
    if (step === 'payment') {
      setTimeLeft(300) // Reset to 5 minutes
      setEventReceived(false) // Reset event tracking
    }
  }, [step])

  // Handle transaction confirmation
  useEffect(() => {
    if (isConfirmed && step === 'processing' && !eventReceived) {
      console.log('Transaction confirmed, checking contract status...')
      setTimeout(checkContractStatus, 2000)
    }
  }, [isConfirmed, step, eventReceived, checkContractStatus])

  // Auto-advance to success if transaction confirmed
  useEffect(() => {
    if (step === 'processing' && isConfirmed && !eventReceived) {
      const timeout = setTimeout(() => {
        console.log('Forcing status check after transaction confirmation...')
        checkContractStatus()
      }, 10000)

      return () => clearTimeout(timeout)
    }
  }, [step, isConfirmed, eventReceived, checkContractStatus])

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validateAmount = (amount: string) => {
    if (!amount || !corePrice?.current_price) return false
    const numAmount = Number.parseFloat(amount)
    const usdValue = numAmount * corePrice.current_price
    return usdValue >= 0.50
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

  const handleAmountChange = (value: string) => {
    setSellAmount(value)
    
    if (value === "") {
      setAmountError("")
    } else if (corePrice?.current_price) {
      const numAmount = Number.parseFloat(value)
      const usdValue = numAmount * corePrice.current_price
      
      if (usdValue < 0.50) {
        setAmountError("Minimum value is $0.50")
      } else {
        setAmountError("")
      }
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
    if (corePrice?.current_price) {
      const numAmount = Number.parseFloat(coreToken.balance)
      const usdValue = numAmount * corePrice.current_price
      
      if (usdValue < 0.50) {
        setAmountError("Minimum value is $0.50")
      } else {
        setAmountError("")
      }
    }
  }

  const isFormValid = () => {
    return sellAmount && 
           email && 
           !emailError && 
           !amountError &&
           validateEmail(email) && 
           validateAmount(sellAmount) &&
           !priceLoading && 
           !priceError
  }

  const createContract = async () => {
    if (!address) return

    setStep('creating')
    setError("")

    try {
      const response = await fetch('/api/create-contract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          buyerAddress: address,
          amount: sellAmount,
          email: email,
        }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to create contract')
      }

      const newContractData: ContractData = {
        address: data.contractAddress,
        amount: sellAmount,
        email: email,
        buyerAddress: address,
      }

      setContractData(newContractData)
      setStep('payment')
      setRetryCount(0)

    } catch (error: any) {
      console.error('Contract creation failed:', error)
      
      if (retryCount < 2) {
        setRetryCount(prev => prev + 1)
        setTimeout(() => createContract(), 2000)
      } else {
        setError(error.message || 'Failed to create contract. Please try again.')
        setStep('error')
        setRetryCount(0)
      }
    }
  }

  const handleBuyNowClick = () => {
    if (isFormValid()) {
      setShowConfirmation(true)
    }
  }

  const handleConfirmPurchase = () => {
    setShowConfirmation(false)
    createContract()
  }

  const handleCancelPurchase = () => {
    setShowConfirmation(false)
  }

  const handlePayment = () => {
    if (!contractData) return

    setStep('processing')
    setEventReceived(false)
    
    writeContract({
      address: contractData.address as `0x${string}`,
      abi: GIFT_CONTRACT_ABI,
      functionName: 'fulfill',
      value: ethers.parseEther(contractData.amount),
    })
  }

  const resetToForm = () => {
    setStep('form')
    setError("")
    setSellAmount("")
    setEmail("")
    setEmailError("")
    setAmountError("")
    setContractData(null)
    setRetryCount(0)
    setEventReceived(false)
    setEmailSending(false)
    if (pollInterval) {
      clearInterval(pollInterval)
      setPollInterval(null)
    }
  }

  const handleManualCheck = async () => {
    console.log('Manual status check triggered')
    await checkContractStatus()
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Render different steps
  if (step === 'creating') {
    return (
      <div className="relative w-[100rem]">
        <BackgroundGradient className="rounded-[32px] max-w-full bg-black/40 backdrop-blur-xl border border-white/10 text-white shadow-2xl">
          <div className="p-8 flex flex-col items-center justify-center min-h-[400px] space-y-6">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#00d4aa]"></div>
            <h2 className="text-2xl font-bold">Creating Your Gift Contract</h2>
            <p className="text-white/70 text-center">
              Please wait while we create your personalized gift contract...
              {retryCount > 0 && <span className="block mt-2">Retrying... ({retryCount}/3)</span>}
            </p>
          </div>
        </BackgroundGradient>
      </div>
    )
  }

  if (step === 'payment' && contractData) {
    return (
      <div className="relative w-[100rem]">
        <BackgroundGradient className="rounded-[32px] max-w-full bg-black/40 backdrop-blur-xl border border-white/10 text-white shadow-2xl">
          <div className="p-8 space-y-8">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold text-[#00d4aa]">Contract Created Successfully!</h2>
              <p className="text-white/70">Your gift contract is ready. Complete the payment to activate your gift card.</p>
              
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                <div className="flex items-center justify-center gap-2 text-red-400">
                  <span>⏰</span>
                  <span className="font-semibold">Time remaining: {formatTime(timeLeft)}</span>
                </div>
              </div>
            </div>

            <div className="bg-white/5 rounded-2xl p-6 space-y-4">
              <h3 className="text-xl font-semibold mb-4">Contract Details</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-white/70">Contract Address:</span>
                  <span className="font-mono text-sm bg-white/10 px-3 py-1 rounded">
                    {contractData.address.slice(0, 6)}...{contractData.address.slice(-4)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-white/70">Amount to Pay:</span>
                  <span className="font-semibold text-[#00d4aa]">{contractData.amount} CORE</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-white/70">Gift Card Value:</span>
                  <span className="font-semibold">${calculateGiftCardValue()}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-white/70">Email:</span>
                  <span className="text-sm">{contractData.email}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                onClick={resetToForm}
                className="flex-1 py-6 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl"
              >
                Cancel
              </Button>
              
              <Button
                onClick={handlePayment}
                className="flex-1 py-6 bg-[#00d4aa] hover:bg-[#00f4c4] text-black font-semibold rounded-xl text-xl"
              >
                Pay {contractData.amount} CORE
              </Button>
            </div>
          </div>
        </BackgroundGradient>
      </div>
    )
  }

  if (step === 'processing') {
    return (
      <div className="relative w-[100rem]">
        <BackgroundGradient className="rounded-[32px] max-w-full bg-black/40 backdrop-blur-xl border border-white/10 text-white shadow-2xl">
          <div className="p-8 flex flex-col items-center justify-center min-h-[400px] space-y-6">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#00d4aa]"></div>
            <h2 className="text-2xl font-bold">Processing Payment</h2>
            <div className="text-center space-y-2">
              <p className="text-white/70">
                {isWritePending && "Waiting for transaction confirmation..."}
                {isConfirming && "Transaction confirmed! Waiting for contract event..."}
                {isConfirmed && !eventReceived && emailSending && "Generating your gift card..."}
                {isConfirmed && !eventReceived && !emailSending && "Checking contract status..."}
                {!isWritePending && !isConfirming && !isConfirmed && "Processing your payment..."}
              </p>
              {hash && (
                <p className="text-sm text-white/50 font-mono">
                  TX: {hash.slice(0, 10)}...{hash.slice(-8)}
                </p>
              )}
              {emailSending && (
                <p className="text-sm text-[#00d4aa]">
                  📧 Sending your gift card email...
                </p>
              )}
            </div>
            
            {isConfirmed && (
              <Button
                onClick={handleManualCheck}
                className="mt-4 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black text-sm rounded"
              >
                Check Status Manually
              </Button>
            )}
          </div>
        </BackgroundGradient>
      </div>
    )
  }

  if (step === 'success') {
    return (
      <div className="relative w-[100rem]">
        <BackgroundGradient className="rounded-[32px] max-w-full bg-black/40 backdrop-blur-xl border border-white/10 text-white shadow-2xl">
          <div className="p-8 flex flex-col items-center justify-center min-h-[400px] space-y-6">
            <div className="text-6xl">🎉</div>
            <h2 className="text-3xl font-bold text-[#00d4aa]">THANK YOU!</h2>
            <div className="text-center space-y-2">
              <p className="text-xl">Your gift card purchase was successful!</p>
              <p className="text-white/70">Your {selectedGiftCard.displayName} has been sent to your email.</p>
              <p className="text-sm text-white/50">Please check your inbox (and spam folder) for your voucher code.</p>
            </div>
            
            <div className="bg-white/5 rounded-2xl p-6 text-center">
              <h3 className="text-lg font-semibold mb-2">📧 Email Sent To:</h3>
              <p className="text-[#00d4aa] font-mono">{contractData?.email}</p>
            </div>
            
            <Button
              onClick={resetToForm}
              className="mt-8 px-8 py-3 bg-[#00d4aa] hover:bg-[#00f4c4] text-black font-semibold rounded-xl"
            >
              Buy Another Gift Card
            </Button>
          </div>
        </BackgroundGradient>
      </div>
    )
  }

  if (step === 'error') {
    return (
      <div className="relative w-[100rem]">
        <BackgroundGradient className="rounded-[32px] max-w-full bg-black/40 backdrop-blur-xl border border-white/10 text-white shadow-2xl">
          <div className="p-8 flex flex-col items-center justify-center min-h-[400px] space-y-6">
            <div className="text-6xl">❌</div>
            <h2 className="text-2xl font-bold text-red-400">Transaction Failed</h2>
            <p className="text-white/70 text-center max-w-md">{error}</p>
            
            <Button
              onClick={resetToForm}
              className="mt-4 px-8 py-3 bg-[#00d4aa] hover:bg-[#00f4c4] text-black font-semibold rounded-xl"
            >
              Try Again
            </Button>
          </div>
        </BackgroundGradient>
      </div>
    )
  }

  // Default form step
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
                      handleAmountChange(value)
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

            <div className="space-y-2">
              <div className="text-lg text-white/60">
                Balance: {coreToken.balance} {coreToken.symbol}
              </div>
              
              {amountError && (
                <div className="flex items-center gap-2 text-red-400 text-sm">
                  <span>⚠️</span>
                  <span>{amountError}</span>
                </div>
              )}
              
              {sellAmount && !amountError && validateAmount(sellAmount) && (
                <div className="flex items-center gap-2 text-[#00d4aa] text-sm">
                  <span>✅</span>
                  <span>Amount meets minimum requirement</span>
                </div>
              )}
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

            <div className="flex justify-between items-center">
              <span className="text-lg text-white/70">Minimum Value</span>
              <span className="text-lg text-yellow-400">$0.50</span>
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
            onClick={handleBuyNowClick}
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
                  : amountError
                    ? "Minimum $0.50 Required"
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

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-black/90 backdrop-blur-xl border border-white/20 rounded-3xl p-8 max-w-md w-full mx-4 text-white">
            <div className="space-y-6">
              <div className="text-center">
                <div className="text-3xl mb-4">⚠️</div>
                <h2 className="text-2xl font-bold mb-2">Confirm Purchase</h2>
                <p className="text-white/70">Are you sure you want to proceed with this transaction?</p>
              </div>

              <div className="bg-white/5 rounded-2xl p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-white/70">Amount:</span>
                  <span className="font-semibold">{sellAmount} {coreToken.symbol}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-white/70">USD Value:</span>
                  <span className="font-semibold">${calculateUSDValue()}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-white/70">Gift Card:</span>
                  <span className="font-semibold">{selectedGiftCard.displayName}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-white/70">Service Fee (5%):</span>
                  <span className="font-semibold text-red-400">-${(Number(calculateUSDValue()) * 0.05).toFixed(2)}</span>
                </div>
                
                <div className="border-t border-white/20 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">You will receive:</span>
                    <span className="text-lg font-semibold text-[#00d4aa]">${calculateGiftCardValue()}</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-white/70">Email:</span>
                  <span className="font-semibold text-sm">{email}</span>
                </div>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <span className="text-yellow-500 text-xl">⚠️</span>
                  <div className="text-sm text-yellow-200">
                    <p className="font-semibold mb-1">Important Notice:</p>
                    <p>This transaction is irreversible. Please ensure all details are correct before proceeding.</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={handleCancelPurchase}
                  className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl transition-all duration-200"
                >
                  Cancel
                </Button>
                
                <Button
                  onClick={handleConfirmPurchase}
                  className="flex-1 py-3 bg-[#00d4aa] hover:bg-[#00f4c4] text-black font-semibold rounded-xl transition-all duration-200"
                >
                  Confirm Purchase
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
