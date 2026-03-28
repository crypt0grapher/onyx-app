# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- **Dev server:** `npm run dev` (uses Turbopack)
- **Build:** `npm run build`
- **Lint:** `npm run lint`
- **Start prod:** `npm start`

No test framework is configured.

## Environment Variables

Required in `.env.local`:
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` — WalletConnect Cloud project ID
- `NEXT_PUBLIC_INFURA_API_KEY` — Infura API key for Ethereum mainnet RPC

Optional:
- `NEXT_PUBLIC_POINTS_API_URL` (defaults to `https://pnt.onyx.org/api/v1`)
- `NEXT_PUBLIC_POINTS_SQUID_URL` (defaults to `https://pnt-squid.onyx.org/graphql`)
- `NEXT_PUBLIC_SUBGRAPH_URL`, `NEXT_PUBLIC_SUBGRAPH_AUTH` — TheGraph subgraph overrides

## Architecture

This is the **Onyx Protocol** DeFi frontend — a Next.js 15 App Router application for staking XCN tokens, yield farming, governance, token swapping, and a points/rewards system.

### Tech Stack

- **Next.js 15** with App Router, **React 19**, **TypeScript** (strict)
- **Tailwind CSS v4** (uses `@import "tailwindcss"` and `@theme` in `globals.css` — not v3 config files)
- **wagmi v2 + viem** for Ethereum wallet connection and contract reads/writes
- **TanStack React Query** for async server state; **SWR** also used in some hooks
- **next-intl** for i18n (locales: `en`, `tr`, `kr`, `cn`)
- **bignumber.js** for token amount precision
- **recharts** for charts, **Framer Motion** for animations, **Tiptap** for rich text editing

### Routing & i18n

All pages live under `app/[locale]/`. The `[locale]` segment is handled by next-intl with `localePrefix: "always"` (see `i18n/routing.ts`). Translation JSON files are in `messages/`. Use `useTranslations()` from next-intl in components, `getTranslations()` in server components.

Pages: `/` (dashboard/staking), `/farm`, `/governance`, `/governance/[id]`, `/history`, `/points`, `/swap`

### Provider Hierarchy

In `app/[locale]/layout.tsx`, providers wrap the app in this order:
`NextIntlClientProvider` → `Web3Providers` (QueryClient + WagmiProvider) → `WalletProvider`

- **WalletProvider** (`context/WalletProvider.tsx`): manages wallet connection state, modal state, and exposes `useWallet()` / `useWalletModal()` hooks
- **Web3Providers** (`context/Web3Providers.tsx`): sets up wagmi config and React Query client

### Smart Contracts

- `contracts/config.ts` — central contract registry (`CONTRACTS`, `UNISWAP`, `STAKING_CONSTANTS`, `SUPPORTED_CHAINS`)
- `contracts/abis/` — TypeScript ABI definitions and JSON ABIs
- `contracts/addresses/` — JSON files mapping chain IDs to deployed addresses
- Currently targets **Ethereum mainnet** (chain ID 1) and **Onyx Network** (chain ID 80888)

### Hooks Organization

Hooks in `hooks/` are organized by domain and are the primary way components interact with on-chain data and APIs:
- `staking/` — XCN staking operations and data
- `farm/` — liquidity farming
- `governance/` — proposal CRUD, voting, vote power
- `swap/` — token swap flow (quotes, allowances, execution)
- `points/` — enrollment, leaderboard, user points
- `wallet/` — chain detection, transaction execution
- `common/` — shared utilities (debounce, pagination, clipboard, device type)

### API Layer

`lib/api/` contains a `BaseApiService` class with timeout, retry, and error handling. Service implementations:
- `coingecko.ts` — token price data
- `onyx.ts` — Onyx protocol API
- `points.ts` — points/rewards API
- `subgraph.ts` — TheGraph subgraph queries

### Components

- `components/ui/` — shared reusable UI primitives (buttons, modals, tables, charts, pills, text editor)
- `components/{feature}/` — feature-specific components (stake, farm, governance, swap, points, history, sidebar)
- Each feature directory has an `index.ts` barrel export

### Config

`config/` holds feature-specific constants and configuration: wagmi setup, network definitions, swap token lists, farm pool configs, navigation items, governance parameters.

### Path Alias

`@/*` maps to the project root (configured in `tsconfig.json`).

### Styling

Dark theme throughout. Custom design tokens defined as CSS variables in `globals.css` under `@theme` (e.g., `--color-bg-primary: #0a0a0a`, `--color-primary: #e6e6e6`). Use these tokens via Tailwind classes like `bg-bg-primary`, `text-primary`.
