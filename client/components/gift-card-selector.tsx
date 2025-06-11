"use client"

import { useState } from "react"
import { ChevronRight } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import Image from "next/image"

type GiftCard = {
  name: string
  displayName: string
  icon: string
}

const giftCardList: GiftCard[] = [
  { name: "AMAZON", displayName: "Amazon Gift Card", icon: "/images/amazon-logo.png" },
  { name: "FLIPKART", displayName: "Flipkart Gift Card", icon: "/images/flipkart-logo.png" },
]

interface GiftCardSelectorProps {
  giftCard: GiftCard
  onSelect: (giftCard: GiftCard) => void
}

export default function GiftCardSelector({ giftCard, onSelect }: GiftCardSelectorProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 text-white rounded-2xl h-14 pl-4 pr-5 flex items-center gap-3 transition-all duration-200"
        >
          <div className="w-10 h-10 rounded-xl overflow-hidden bg-white flex items-center justify-center">
            <Image
              src={giftCard.icon || "/placeholder.svg"}
              alt={giftCard.name}
              width={40}
              height={40}
              className="w-full h-full object-cover"
            />
          </div>
          <span className="text-xl font-semibold">{giftCard.name}</span>
          <ChevronRight size={20} className="ml-1 text-white/60" />
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-black/90 backdrop-blur-xl border-white/20 text-white rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">Select a gift card</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-3">
            {giftCardList.map((card) => (
              <Button
                key={card.name}
                variant="ghost"
                className="w-full justify-start text-white hover:bg-white/10 rounded-2xl h-16 p-5"
                onClick={() => {
                  onSelect(card)
                  setOpen(false)
                }}
              >
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-white flex items-center justify-center mr-4">
                  <Image
                    src={card.icon}
                    alt={card.name}
                    width={48}
                    height={48}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-xl font-semibold">{card.name}</span>
                  <span className="text-sm text-white/60">{card.displayName}</span>
                </div>
              </Button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
