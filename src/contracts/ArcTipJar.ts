/**
 * ArcTipJar contract config — deployed on Arc Testnet
 *
 * Creator address is configurable: update VITE_CREATOR_ADDRESS in .env
 * to change the tip recipient without redeploying.
 */
import artifact from '../../contracts/out/ArcTipJar.sol/ArcTipJar.json'
import { getUsdc, requireChain } from '@/onchain-facts'

export const ARC_TESTNET_CHAIN_ID = 5042002

export const ARC_CHAIN = requireChain(ARC_TESTNET_CHAIN_ID)

const usdcFact = getUsdc(ARC_TESTNET_CHAIN_ID)
if (!usdcFact) {
  throw new Error('USDC not found for Arc Testnet')
}
export const USDC_ADDRESS = usdcFact.address as `0x${string}`
export const USDC_DECIMALS_ARC = usdcFact.decimals

export const TIP_JAR_ADDRESS =
  (import.meta.env.VITE_TIP_JAR_ADDRESS as `0x${string}`) ??
  '0xdb8aead8b746aa111e0dd759c6dcbbd017922ccb'

/**
 * Creator address — configure via VITE_CREATOR_ADDRESS in .env
 * Defaults to the platform deployer wallet used at deploy time.
 * Replace with your own wallet address to receive tips.
 */
export const CREATOR_ADDRESS =
  (import.meta.env.VITE_CREATOR_ADDRESS as `0x${string}`) ??
  '0x5B12Ce46C7194aD57d143bC22847224047b1Ef42'

export const TIP_JAR_ABI = artifact.abi

export const TIP_AMOUNTS_USDC = [1, 5, 10] as const

export interface TipEntry {
  sender: `0x${string}`
  amount: bigint
  message: string
  timestamp: bigint
}
