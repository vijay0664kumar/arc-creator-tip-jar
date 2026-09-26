import { useState } from 'react'
import { TipJarHeader } from '@/components/TipJarHeader'
import { CreatorCard } from '@/components/CreatorCard'
import { TipForm } from '@/components/TipForm'
import { TipFeed } from '@/components/TipFeed'
import { FaucetBanner } from '@/components/FaucetBanner'

export default function App() {
  const [refreshKey, setRefreshKey] = useState(0)

  const handleTipSuccess = () => {
    setRefreshKey((k) => k + 1)
  }

  return (
    <div className="min-h-dvh" style={{ background: 'var(--bg-gradient)' }}>
      <div className="mx-auto max-w-md w-full relative">
        <TipJarHeader />

        {/* Hero heading */}
        <div className="px-5 pb-5">
          <h1
            className="display text-3xl font-bold tracking-tight text-balance"
            style={{ color: 'var(--ink)', letterSpacing: '-0.03em' }}
          >
            Support the Builder
          </h1>
          <p className="text-sm mt-1.5 text-pretty" style={{ color: 'var(--muted)', maxWidth: '38ch' }}>
            Support this project with a testnet USDC tip and leave a message onchain.
          </p>
        </div>

        <CreatorCard key={refreshKey} />

        <FaucetBanner />

        <TipForm onSuccess={handleTipSuccess} />

        <TipFeed refreshKey={refreshKey} />
      </div>
    </div>
  )
}
