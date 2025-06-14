import { NextRequest, NextResponse } from 'next/server'
import { ethers } from 'ethers'
import { GIFT_CONTRACT_ABI } from '@/lib/abis'

const RPC_URL = process.env.CORE_RPC_URL || 'https://rpc.test2.btcs.network'

export async function POST(request: NextRequest) {
  try {
    const { contractAddress } = await request.json()

    if (!contractAddress || !ethers.isAddress(contractAddress)) {
      console.error('Invalid contract address:', contractAddress)
      return NextResponse.json(
        { success: false, error: 'Invalid contract address' },
        { status: 400 }
      )
    }

    const provider = new ethers.JsonRpcProvider(RPC_URL)
    const contract = new ethers.Contract(contractAddress, GIFT_CONTRACT_ABI, provider)

    const [isFulfilled, amount, buyer, owner] = await Promise.all([
      contract.isFulfilled(),
      contract.getAmount(),
      contract.getBuyer(),
      contract.getOwner()
    ])

    return NextResponse.json({
      success: true,
      isFulfilled,
      amount: amount.toString(),
      buyer,
      owner
    })

  } catch (error: any) {
    console.error('Contract status check failed:', {
      error: error.message,
      contractAddress: request.body
    })

    return NextResponse.json(
      { success: false, error: 'Failed to check contract status' },
      { status: 500 }
    )
  }
}
