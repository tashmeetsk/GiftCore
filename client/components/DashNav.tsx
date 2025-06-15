"use client";
import { useAppKit } from "@reown/appkit/react";
import { useAccount, useDisconnect } from "wagmi";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, LogOut } from "lucide-react";

export default function Header() {
  const { open } = useAppKit();
  const { address, isConnected, chain } = useAccount();
  const { disconnect } = useDisconnect();

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const getChainName = () => {
    if (!chain) return "Unknown";
    return chain.name;
  };

  const isCorrectNetwork = chain?.id === 1114;

  return (
    <div className=" z-20 w-full mb-4 backdrop-blur-md fixed top-0 left-0 right-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white">GiftCore</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!isConnected ? (
              <Button
                onClick={() => open()}
                variant="default"
                size="sm"
                className="bg-[#00d4aa] hover:bg-[#00f4c4] text-black font-medium px-5 py-2 h-10 rounded-full transition-all duration-200 shadow-lg shadow-[#00d4aa]/20"
              >
                Connect Wallet
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Badge
                  variant={isCorrectNetwork ? "default" : "destructive"}
                  className={`hidden sm:flex px-3 py-1 rounded-full text-xs font-medium ${
                    isCorrectNetwork
                      ? "bg-[#00d4aa]/20 text-[#00d4aa] border border-[#00d4aa]/30"
                      : "bg-red-500/20 text-red-400 border border-red-500/30"
                  }`}
                >
                  {getChainName()}
                </Badge>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-white/10 hover:bg-white/20 text-white border-white/20 rounded-full px-4 h-10 flex items-center gap-2 transition-all duration-200"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <span className="hidden sm:inline font-medium">
                          {formatAddress(address!)}
                        </span>
                      </div>
                      <ChevronDown className="h-3 w-3 text-white/70" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-48 bg-black/90 backdrop-blur-xl border-white/20 text-white rounded-xl p-1"
                  >
                    <DropdownMenuItem
                      onClick={() => disconnect()}
                      className="flex items-center gap-2 text-red-400 hover:text-red-300 hover:bg-white/10 rounded-lg py-2 px-3"
                    >
                      <LogOut className="h-4 w-4" />
                      Disconnect
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
