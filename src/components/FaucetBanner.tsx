import { Droplets, X } from 'lucide-react'
import { useState } from 'react'

export function FaucetBanner() {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null

  return (
    <div
      className="mx-5 mb-4 rounded-2xl px-4 py-3 flex items-center gap-3"
      style={{
        background: 'rgba(16,97,166,0.08)',
        border: '1px solid rgba(16,97,166,0.18)',
      }}
    >
      <div
        className="flex size-8 shrink-0 items-center justify-center rounded-xl"
        style={{ background: 'rgba(16,97,166,0.12)' }}
      >
        <Droplets className="size-4" style={{ color: 'var(--accent-hover)' }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold" style={{ color: 'var(--ink)' }}>
          Need test USDC?
        </p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
          Use the{' '}
          <span className="font-semibold" style={{ color: 'var(--accent-hover)' }}>
            "Get test USDC"
          </span>{' '}
          button in the Arc Studio sidebar to fund your wallet instantly.
        </p>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="shrink-0 transition-opacity hover:opacity-60"
        aria-label="Dismiss"
      >
        <X className="size-4" style={{ color: 'var(--subtle)' }} />
      </button>
    </div>
  )
}
