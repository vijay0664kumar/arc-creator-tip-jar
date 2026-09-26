import { ExternalLink } from 'lucide-react'
import { useReadContract } from 'wagmi'
import { erc20Abi } from 'viem'
import {
  ARC_TESTNET_CHAIN_ID,
  CREATOR_ADDRESS,
  TIP_JAR_ABI,
  TIP_JAR_ADDRESS,
  USDC_ADDRESS,
} from '@/contracts/ArcTipJar'
import { Amount, usdcDecimalsFor } from '@/onchain-money'
import { buildAddressExplorerUrl } from '@/onchain-facts'

function formatAddr(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

export function CreatorCard() {
  const { data: totalAmount } = useReadContract({
    address: TIP_JAR_ADDRESS,
    abi: TIP_JAR_ABI,
    functionName: 'totalTipsAmount',
    chainId: ARC_TESTNET_CHAIN_ID,
  })

  const { data: totalCount } = useReadContract({
    address: TIP_JAR_ADDRESS,
    abi: TIP_JAR_ABI,
    functionName: 'totalTipCount',
    chainId: ARC_TESTNET_CHAIN_ID,
  })

  const { data: creatorBalance } = useReadContract({
    address: USDC_ADDRESS,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [CREATOR_ADDRESS],
    chainId: ARC_TESTNET_CHAIN_ID,
  })

  const decimals = usdcDecimalsFor(ARC_TESTNET_CHAIN_ID)

  const totalFormatted =
    totalAmount !== undefined
      ? Amount.fromRaw(totalAmount as bigint, decimals).toFixed(2)
      : '—'

  const balanceFormatted =
    creatorBalance !== undefined
      ? Amount.fromRaw(creatorBalance, decimals).toFixed(2)
      : '—'

  const count = totalCount !== undefined ? (totalCount as bigint).toString() : '—'

  const explorerUrl = buildAddressExplorerUrl(ARC_TESTNET_CHAIN_ID, CREATOR_ADDRESS)

  return (
    <section
      className="rounded-3xl p-5 mx-5 mb-4"
      style={{
        background: 'var(--surface-strong)',
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        border: '1px solid var(--border)',
      }}
    >
      {/* spectral strip */}
      <div
        className="absolute top-0 left-5 right-5 h-0.5 rounded-full"
        style={{
          background:
            'linear-gradient(90deg,#6366f1 0%,#8b5cf6 25%,#ec4899 50%,#f59e0b 75%,#10b981 100%)',
          opacity: 0.5,
        }}
      />

      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--muted)', letterSpacing: '0.08em' }}>
          Creator
        </p>
        <a
          href={explorerUrl}
          target="_blank"
          rel="noreferrer"
          className="mono flex items-center gap-1.5 text-sm font-medium transition-opacity hover:opacity-70"
          style={{ color: 'var(--ink-2)' }}
        >
          {formatAddr(CREATOR_ADDRESS)}
          <ExternalLink className="size-3.5" style={{ color: 'var(--subtle)' }} />
        </a>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatCell label="Total Received" value={`$${totalFormatted}`} unit="USDC" />
        <StatCell label="Total Tips" value={count} unit="tips" />
        <StatCell label="Creator Balance" value={`$${balanceFormatted}`} unit="USDC" />
      </div>
    </section>
  )
}

function StatCell({
  label,
  value,
  unit,
}: {
  label: string
  value: string
  unit: string
}) {
  return (
    <div
      className="rounded-2xl p-3"
      style={{ background: 'var(--surface-muted)' }}
    >
      <p className="text-xs mb-1 leading-tight" style={{ color: 'var(--subtle)' }}>
        {label}
      </p>
      <p className="display text-base font-bold tabular-nums leading-tight" style={{ color: 'var(--ink)' }}>
        {value}
      </p>
      <p className="text-xs mt-0.5" style={{ color: 'var(--subtle)' }}>
        {unit}
      </p>
    </div>
  )
}
