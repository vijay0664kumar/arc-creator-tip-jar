import { useReadContract } from 'wagmi'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { MessageSquare } from 'lucide-react'
import { ARC_TESTNET_CHAIN_ID, TIP_JAR_ABI, TIP_JAR_ADDRESS, type TipEntry } from '@/contracts/ArcTipJar'
import { Amount, usdcDecimalsFor } from '@/onchain-money'

function formatAddr(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

function timeAgo(ts: bigint): string {
  const seconds = Math.floor(Date.now() / 1000) - Number(ts)
  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

export function TipFeed({ refreshKey }: { refreshKey: number }) {
  const decimals = usdcDecimalsFor(ARC_TESTNET_CHAIN_ID)
  const queryClient = useQueryClient()

  const { data: recentTips, isLoading, queryKey } = useReadContract({
    address: TIP_JAR_ADDRESS,
    abi: TIP_JAR_ABI,
    functionName: 'getRecentTips',
    args: [20n],
    chainId: ARC_TESTNET_CHAIN_ID,
  })

  // Invalidate query on each new success to force fresh data
  useEffect(() => {
    if (refreshKey > 0) {
      void queryClient.invalidateQueries({ queryKey })
    }
  }, [refreshKey, queryClient, queryKey])

  const tips = (recentTips as TipEntry[] | undefined) ?? []

  return (
    <section className="px-5 pb-8">
      <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--muted)', letterSpacing: '0.08em' }}>
        Recent tips
      </p>

      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-2xl p-4 animate-pulse"
              style={{ background: 'var(--surface-muted)', height: 64 }}
            />
          ))}
        </div>
      )}

      {!isLoading && tips.length === 0 && (
        <div
          className="rounded-2xl p-6 flex flex-col items-center gap-2 text-center"
          style={{ background: 'var(--surface-muted)' }}
        >
          <MessageSquare className="size-5" style={{ color: 'var(--subtle)' }} />
          <p className="text-sm" style={{ color: 'var(--subtle)' }}>
            No tips yet. Be the first to support this builder!
          </p>
        </div>
      )}

      {!isLoading && tips.length > 0 && (
        <div className="space-y-2">
          {tips.map((tip, i) => {
            const amtFormatted = Amount.fromRaw(tip.amount, decimals).toFixed(2)
            return (
              <div
                key={i}
                className="rounded-2xl px-4 py-3"
                style={{
                  background: 'var(--surface-strong)',
                  border: '1px solid var(--border)',
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="flex size-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold"
                      style={{
                        background: 'rgba(18,45,69,0.08)',
                        color: 'var(--ink)',
                      }}
                    >
                      {tip.sender.slice(2, 4).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="mono text-xs font-medium truncate" style={{ color: 'var(--ink-2)' }}>
                        {formatAddr(tip.sender)}
                      </p>
                      {tip.message && (
                        <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--muted)' }}>
                          {tip.message}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p
                      className="display text-sm font-bold tabular-nums"
                      style={{ color: 'var(--success)' }}
                    >
                      +${amtFormatted}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--subtle)' }}>
                      {timeAgo(tip.timestamp)}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
