import { ConnectKitButton } from 'connectkit'
import { TokenUSDC } from '@web3icons/react'

export function TipJarHeader() {
  return (
    <header className="flex items-center justify-between px-5 pt-6 pb-4">
      <div className="flex items-center gap-2">
        <div
          className="flex size-8 items-center justify-center rounded-xl"
          style={{ background: 'rgba(18,45,69,0.08)' }}
        >
          <TokenUSDC variant="branded" size={20} />
        </div>
        <span className="display text-sm font-semibold tracking-tight" style={{ color: 'var(--ink)' }}>
          Arc Tip Jar
        </span>
        <span
          className="rounded-full px-2 py-0.5 text-xs font-semibold uppercase tracking-widest"
          style={{
            background: 'rgba(18,45,69,0.07)',
            color: 'var(--muted)',
            letterSpacing: '0.08em',
          }}
        >
          Testnet
        </span>
      </div>
      <ConnectKitButton
        customTheme={{
          '--ck-font-family': "'DM Sans', sans-serif",
          '--ck-primary-button-background': '#122d45',
          '--ck-primary-button-hover-background': '#1061a6',
          '--ck-body-background': '#ffffff',
          '--ck-body-color': '#122d45',
          '--ck-border-radius': '12px',
        }}
      />
    </header>
  )
}
