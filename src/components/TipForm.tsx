import { useState, useCallback } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useSwitchChain, useReadContract } from 'wagmi'
import { erc20Abi } from 'viem'
import { Loader2, CheckCircle2, AlertCircle, ExternalLink, Coins } from 'lucide-react'
import { toast } from 'sonner'
import {
  ARC_TESTNET_CHAIN_ID,
  TIP_JAR_ABI,
  TIP_JAR_ADDRESS,
  TIP_AMOUNTS_USDC,
  USDC_ADDRESS,
} from '@/contracts/ArcTipJar'
import { parseAmount, Amount, usdcDecimalsFor } from '@/onchain-money'
import { buildTxExplorerUrl } from '@/onchain-facts'

function parseOnchainError(error: unknown): string {
  const msg = (error as { message?: string })?.message?.toLowerCase() ?? ''
  if (msg.includes('user rejected') || msg.includes('user denied')) return 'Transaction cancelled.'
  if (msg.includes('insufficient') || msg.includes('exceeds balance')) return 'Insufficient USDC balance.'
  if (msg.includes('allowance') || msg.includes('transfer amount exceeds')) return 'Please approve USDC first.'
  if (msg.includes('invalidamount')) return 'Tip amount must be greater than zero.'
  if (msg.includes('messagetoolong')) return 'Message is too long (max 280 characters).'
  if (msg.includes('reverted')) return 'Transaction failed. Please try again.'
  if (msg.includes('network') || msg.includes('timeout')) return 'Network error. Please retry.'
  return 'Something went wrong. Please try again.'
}

type Step = 'idle' | 'approving' | 'approve-confirming' | 'tipping' | 'tip-confirming' | 'success'

export function TipForm({ onSuccess }: { onSuccess: () => void }) {
  const { address, chainId, isConnected } = useAccount()
  const { switchChain, isPending: isSwitching } = useSwitchChain()

  const [selectedPreset, setSelectedPreset] = useState<number | null>(null)
  const [customAmount, setCustomAmount] = useState('')
  const [message, setMessage] = useState('')
  const [step, setStep] = useState<Step>('idle')
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const decimals = usdcDecimalsFor(ARC_TESTNET_CHAIN_ID)
  const wrongChain = isConnected && chainId !== ARC_TESTNET_CHAIN_ID

  // Resolve effective amount
  const effectiveAmount: string | null = (() => {
    if (selectedPreset !== null) return String(selectedPreset)
    if (customAmount && /^\d*\.?\d+$/.test(customAmount) && parseFloat(customAmount) > 0) return customAmount
    return null
  })()

  let parsedAmount: bigint | null = null
  try {
    if (effectiveAmount) parsedAmount = parseAmount(ARC_TESTNET_CHAIN_ID, effectiveAmount).raw
  } catch {
    parsedAmount = null
  }

  // Allowance check
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: USDC_ADDRESS,
    abi: erc20Abi,
    functionName: 'allowance',
    args: address ? [address, TIP_JAR_ADDRESS] : undefined,
    chainId: ARC_TESTNET_CHAIN_ID,
    query: { enabled: !!address },
  })

  // USDC balance
  const { data: usdcBalance } = useReadContract({
    address: USDC_ADDRESS,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: ARC_TESTNET_CHAIN_ID,
    query: { enabled: !!address },
  })

  const balanceFormatted =
    usdcBalance !== undefined
      ? Amount.fromRaw(usdcBalance, decimals).toFixed(2)
      : null

  // Approve hook
  const {
    writeContract: approve,
    data: approveHash,
    error: approveWriteError,
  } = useWriteContract()

  const { isLoading: isApproveConfirming, isSuccess: isApproveSuccess } =
    useWaitForTransactionReceipt({ hash: approveHash })

  // Tip hook
  const {
    writeContract: sendTip,
    data: tipHash,
    error: tipWriteError,
  } = useWriteContract()

  const { isLoading: isTipConfirming, isSuccess: isTipSuccess } =
    useWaitForTransactionReceipt({ hash: tipHash })

  // Handle approve success → auto-proceed to tip
  const handleApproveSuccess = useCallback(() => {
    void refetchAllowance().then(() => {
      setStep('tipping')
      if (!parsedAmount) return
      sendTip(
        {
          address: TIP_JAR_ADDRESS,
          abi: TIP_JAR_ABI,
          functionName: 'sendTip',
          args: [parsedAmount, message],
          chainId: ARC_TESTNET_CHAIN_ID,
        },
        {
          onError: (err) => {
            setErrorMsg(parseOnchainError(err))
            setStep('idle')
          },
        },
      )
    })
  }, [parsedAmount, message, sendTip, refetchAllowance])

  // Watch for approve confirmation
  if (isApproveSuccess && step === 'approve-confirming') {
    setStep('tipping')
    handleApproveSuccess()
  }

  // Watch for tip confirmation
  if (isTipSuccess && step === 'tip-confirming') {
    setStep('success')
    setTxHash(tipHash)
    onSuccess()
    toast.success('Tip sent onchain!')
  }

  // Sync confirming states
  if (isApproveConfirming && step === 'approving') setStep('approve-confirming')
  if (isTipConfirming && step === 'tipping') setStep('tip-confirming')

  const handleSubmit = () => {
    if (!isConnected || wrongChain || !parsedAmount) return
    setErrorMsg(null)

    const hasAllowance = allowance !== undefined && (allowance) >= parsedAmount

    if (!hasAllowance) {
      setStep('approving')
      approve(
        {
          address: USDC_ADDRESS,
          abi: erc20Abi,
          functionName: 'approve',
          args: [TIP_JAR_ADDRESS, parsedAmount],
          chainId: ARC_TESTNET_CHAIN_ID,
        },
        {
          onError: (err) => {
            if (!(err as { message?: string })?.message?.toLowerCase().includes('user rejected')) {
              setErrorMsg(parseOnchainError(err))
            }
            setStep('idle')
          },
        },
      )
      return
    }

    // Already approved
    setStep('tipping')
    sendTip(
      {
        address: TIP_JAR_ADDRESS,
        abi: TIP_JAR_ABI,
        functionName: 'sendTip',
        args: [parsedAmount, message],
        chainId: ARC_TESTNET_CHAIN_ID,
      },
      {
        onError: (err) => {
          if (!(err as { message?: string })?.message?.toLowerCase().includes('user rejected')) {
            setErrorMsg(parseOnchainError(err))
          }
          setStep('idle')
        },
      },
    )
  }

  const handleReset = () => {
    setStep('idle')
    setSelectedPreset(null)
    setCustomAmount('')
    setMessage('')
    setTxHash(undefined)
    setErrorMsg(null)
  }

  const isProcessing = step !== 'idle' && step !== 'success'
  const txUrl = txHash ? buildTxExplorerUrl(ARC_TESTNET_CHAIN_ID, txHash) : null

  if (step === 'success') {
    return (
      <div
        className="rounded-3xl p-6 mx-5 mb-4 flex flex-col items-center text-center gap-3"
        style={{
          background: 'var(--surface-strong)',
          border: '1px solid var(--border)',
        }}
      >
        <div
          className="flex size-12 items-center justify-center rounded-2xl"
          style={{ background: 'rgba(26,128,71,0.12)' }}
        >
          <CheckCircle2 className="size-6" style={{ color: 'var(--success)' }} />
        </div>
        <div>
          <p className="display text-lg font-semibold" style={{ color: 'var(--ink)' }}>
            Tip sent!
          </p>
          <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
            Your support is recorded onchain forever.
          </p>
        </div>
        {txUrl && (
          <a
            href={txUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-xs font-medium transition-opacity hover:opacity-70"
            style={{ color: 'var(--accent-hover)' }}
          >
            View transaction <ExternalLink className="size-3.5" />
          </a>
        )}
        <button
          onClick={handleReset}
          className="mt-1 w-full rounded-2xl py-3 text-sm font-semibold transition-all hover:scale-[1.01] active:scale-[0.99]"
          style={{
            background: 'var(--surface-muted)',
            color: 'var(--ink-2)',
          }}
        >
          Send another tip
        </button>
      </div>
    )
  }

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
      <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--muted)', letterSpacing: '0.08em' }}>
        Choose amount
      </p>

      {/* Preset chips */}
      <div className="flex gap-2 mb-3">
        {TIP_AMOUNTS_USDC.map((amt) => (
          <button
            key={amt}
            onClick={() => {
              setSelectedPreset(amt)
              setCustomAmount('')
            }}
            disabled={isProcessing}
            className="flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background:
                selectedPreset === amt
                  ? 'var(--accent)'
                  : 'var(--surface-muted)',
              color: selectedPreset === amt ? '#ffffff' : 'var(--ink-2)',
              border:
                selectedPreset === amt
                  ? '1px solid transparent'
                  : '1px solid var(--border)',
            }}
          >
            ${amt}
          </button>
        ))}
      </div>

      {/* Custom amount */}
      <div
        className="rounded-2xl px-4 py-3 mb-4"
        style={{
          background: 'var(--surface-muted)',
          border: selectedPreset === null && customAmount ? '1.5px solid var(--accent)' : '1.5px solid transparent',
        }}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold" style={{ color: 'var(--subtle)' }}>$</span>
          <input
            inputMode="decimal"
            value={customAmount}
            onChange={(e) => {
              const val = e.target.value.replace(/[^0-9.]/g, '')
              if (val === '' || /^\d*\.?\d*$/.test(val)) {
                setCustomAmount(val)
                setSelectedPreset(null)
              }
            }}
            disabled={isProcessing}
            placeholder="Custom amount"
            className="flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-slate-300 tabular-nums disabled:opacity-50"
            style={{ color: 'var(--ink)' }}
          />
          <span className="text-xs font-semibold" style={{ color: 'var(--subtle)' }}>USDC</span>
        </div>
        {balanceFormatted && (
          <p className="text-xs mt-1.5" style={{ color: 'var(--subtle)' }}>
            Your balance: {balanceFormatted} USDC
          </p>
        )}
      </div>

      {/* Message */}
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--muted)', letterSpacing: '0.08em' }}>
          Message (optional)
        </p>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value.slice(0, 280))}
          disabled={isProcessing}
          placeholder="Leave a message onchain..."
          rows={2}
          className="w-full rounded-2xl px-4 py-3 text-sm resize-none outline-none transition-all disabled:opacity-50"
          style={{
            background: 'var(--surface-muted)',
            border: '1.5px solid transparent',
            color: 'var(--ink)',
          }}
          onFocus={(e) => (e.target.style.border = '1.5px solid var(--accent)')}
          onBlur={(e) => (e.target.style.border = '1.5px solid transparent')}
        />
        <p className="text-right text-xs mt-1" style={{ color: 'var(--subtle)' }}>
          {message.length}/280
        </p>
      </div>

      {/* Error */}
      {errorMsg && (
        <div
          className="flex items-center gap-2 rounded-xl px-3 py-2.5 mb-4 text-sm"
          style={{ background: 'rgba(186,43,76,0.08)', color: 'var(--danger)' }}
        >
          <AlertCircle className="size-4 shrink-0" />
          {errorMsg}
        </div>
      )}

      {/* CTA */}
      {wrongChain ? (
        <button
          onClick={() => switchChain({ chainId: ARC_TESTNET_CHAIN_ID })}
          disabled={isSwitching}
          className="w-full rounded-2xl py-3.5 text-sm font-semibold text-white transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          style={{ background: 'var(--accent)' }}
        >
          {isSwitching ? <Loader2 className="size-4 animate-spin" /> : null}
          Switch to Arc Testnet
        </button>
      ) : (
        <button
          onClick={handleSubmit}
          disabled={!isConnected || isProcessing || !parsedAmount || parsedAmount <= 0n}
          className="w-full rounded-2xl py-3.5 text-sm font-semibold text-white transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          style={{ background: 'var(--accent)' }}
        >
          {!isConnected ? (
            'Connect wallet to tip'
          ) : step === 'approving' || step === 'approve-confirming' ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Approving USDC...
            </>
          ) : step === 'tipping' || step === 'tip-confirming' ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Confirming tip...
            </>
          ) : effectiveAmount ? (
            <>
              <Coins className="size-4" />
              Send ${effectiveAmount} USDC tip
            </>
          ) : (
            'Choose an amount'
          )}
        </button>
      )}

      {/* Error details for write errors */}
      {(approveWriteError || tipWriteError) && step === 'idle' && !errorMsg && (
        <p className="text-xs mt-2 text-center" style={{ color: 'var(--danger)' }}>
          {parseOnchainError(approveWriteError ?? tipWriteError)}
        </p>
      )}
    </section>
  )
}
