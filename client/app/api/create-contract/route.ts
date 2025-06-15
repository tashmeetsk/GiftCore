import { NextRequest, NextResponse } from 'next/server'
import { ethers } from 'ethers'
import { FACTORY_ABI } from '@/lib/abis'

const FACTORY_ADDRESS = process.env.FACTORY_ADDRESS || '0x7D7C793AdfbEB5CAd88422f32c57Fc9eB0C2A35f'
const OWNER_PRIVATE_KEY = process.env.OWNER!
const RPC_URL = process.env.CORE_RPC_URL || 'https://rpc.test2.btcs.network'

export async function POST(request: NextRequest) {
  try {
    const { buyerAddress, amount, email } = await request.json()

    // Validation
    if (!buyerAddress || !amount || !email) {
      console.error('Missing required fields:', { buyerAddress, amount, email })
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (!ethers.isAddress(buyerAddress)) {
      console.error('Invalid buyer address:', buyerAddress)
      return NextResponse.json(
        { success: false, error: 'Invalid buyer address' },
        { status: 400 }
      )
    }

    // Setup provider and signer
    const provider = new ethers.JsonRpcProvider(RPC_URL)
    const signer = new ethers.Wallet(OWNER_PRIVATE_KEY, provider)
    
    // Create contract instance
    const factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, signer)

    console.log('Creating contract for:', { buyerAddress, amount, email })

    // Convert amount to wei
    const amountInWei = ethers.parseEther(amount.toString())

    // Call createGiftContract
    const tx = await factory.createGiftContract(buyerAddress, amountInWei)
    const receipt = await tx.wait()

    // Find the contract creation event
    const event = receipt.logs.find((log: any) => {
      try {
        const parsed = factory.interface.parseLog(log)
        return parsed?.name === 'GiftContractCreated'
      } catch {
        return false
      }
    })

    if (!event) {
      console.error('Contract creation event not found in transaction:', receipt.hash)
      throw new Error('Contract creation failed - no event found')
    }

    const parsedEvent = factory.interface.parseLog(event)
    const contractAddress = parsedEvent?.args[0]

    console.log('Contract created successfully:', {
      contractAddress,
      txHash: receipt.hash,
      buyerAddress,
      amount
    })

    return NextResponse.json({
      success: true,
      contractAddress,
      txHash: receipt.hash
    })

  } catch (error: any) {
    console.error('Contract creation failed:', {
      error: error.message,
      stack: error.stack,
      code: error.code
    })

    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to create contract',
        code: error.code
      },
      { status: 500 }
    )
  }
}
