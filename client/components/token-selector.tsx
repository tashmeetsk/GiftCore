"use client"

import { useState } from "react"
import { ChevronRight } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type Token = {
  symbol: string
  name: string
  icon: string
  balance?: string
}

const tokenList: Token[] = [
  { symbol: "CORE", name: "Core Token", icon: "⚡", balance: "1,250.50" },
  { symbol: "ETH", name: "Ethereum", icon: "🔷", balance: "0.001144" },
  { symbol: "SOLANA", name: "Solana", icon: "🟣", balance: "15.75" },
]

interface TokenSelectorProps {
  token: Token
  onSelect: (token: Token) => void
}

export default function TokenSelector({ token, onSelect }: TokenSelectorProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")

  const filteredTokens = tokenList.filter(
    (t) => t.name.toLowerCase().includes(search.toLowerCase()) || t.symbol.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="bg-[#1a1f30]/60 border-[#2a304a] hover:bg-[#2a304a]/80 text-white rounded-2xl h-12 pl-3 pr-4 flex items-center gap-2 backdrop-blur-sm transition-all duration-200"
        >
          <span className="text-2xl mr-1">{token.icon}</span>
          <span className="text-lg font-medium">{token.symbol}</span>
          <ChevronRight size={18} className="ml-1 text-gray-400" />
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#0f1320]/95 border-[#1a1f30] text-white rounded-2xl backdrop-blur-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Select a token</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            placeholder="Search by name or symbol"
            value={search}
            onChange={(e:any) => setSearch(e.target.value)}
            className="bg-[#1a1f30]/60 border-[#2a304a] rounded-xl h-12 text-base backdrop-blur-sm"
          />
          <div className="max-h-[300px] overflow-y-auto space-y-2">
            {filteredTokens.map((t) => (
              <Button
                key={t.symbol}
                variant="ghost"
                className="w-full justify-start text-white hover:bg-[#1a1f30]/60 rounded-xl h-14 p-4 backdrop-blur-sm"
                onClick={() => {
                  onSelect(t)
                  setOpen(false)
                }}
              >
                <span className="text-2xl mr-3">{t.icon}</span>
                <div className="flex flex-col items-start">
                  <span className="text-lg font-medium">{t.symbol}</span>
                  <span className="text-sm text-gray-400">{t.name}</span>
                </div>
              </Button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
