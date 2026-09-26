# Arc Tip Jar — Support the Builder

> Built with Arc Studio - money-powered apps in minutes

This is the **project memory** - what Arc Studio remembers about building this app. It helps future agents (or humans) understand and extend the project.

---

## What This App Does

A creator tip jar dApp on Arc Testnet. Users connect their wallet, choose a USDC tip amount (1/5/10 or custom), add an optional onchain message, approve USDC, and send the tip through ArcTipJar.sol. Tips go directly from tipper to creator (no custody). Tip history, totals, and messages are all stored onchain.

## Deployed Contracts

| Contract | Address | Network | Explorer |
|---|---|---|---|
| ArcTipJar | 0xdb8aead8b746aa111e0dd759c6dcbbd017922ccb | Arc Testnet | https://explorer.testnet.arc.io/address/0xdb8aead8b746aa111e0dd759c6dcbbd017922ccb |

## Configuration

Set `VITE_CREATOR_ADDRESS` in `.env` to configure which wallet receives tips (without redeploying):

```
VITE_CREATOR_ADDRESS=0xYourWalletHere
VITE_TIP_JAR_ADDRESS=0xdb8aead8b746aa111e0dd759c6dcbbd017922ccb
```

The contract's `updateCreator()` function (owner-only) also allows changing the creator onchain.

## Tech Stack

- Frontend: React 18, Vite, TypeScript, Tailwind CSS
- Web3: wagmi v2, viem v2, ConnectKit
- Contracts: Solidity 0.8.28 + Foundry. Sources in `contracts/`, unit tests in `contracts/test/*.t.sol`. Build with `bun run contracts:build` (`forge build`), test with `bun run contracts:test` (`forge test`).
- Wallet: injected (MetaMask, etc.)
- Chain: Arc Testnet (Chain ID: 5042002, imported from `viem/chains`)
- Token: USDC (6 decimals) (Address: 0x3600000000000000000000000000000000000000, Chain: Arc Testnet)
- Toasts: Sonner

## Key Files

- `src/App.tsx` - Main application logic
- `src/components/` - UI components
- `src/config.ts` - wagmi config (chains, connectors, transports)

## To Run

```bash
bun install
bun run dev
```
