# Goliath Staking History Not Displayed

**Project:** onyx-new-frontend
**Type:** Code Bug
**Priority:** P1
**Risk level:** Low
**Requires deployment?:** Yes (frontend only)
**Requires network freeze?:** No
**Owner:** Goliath Engineering
**Date created:** 2026-03-26
**Related docs / prior issues:** `docs/tasks/2026-03-25-bridge-staking-ui-fixes.md`

---

## 1) GOAL / SUCCESS CRITERIA

**What "fixed" means:**

Staking history (Staked/Unstaked events) is visible on both the Goliath staking page (/) and the History page (/history) when the user has staking transactions on the Goliath chain.

**Must-have outcomes**

- [x] Goliath staking page shows staking/unstaking history for connected wallet
- [x] History page with "Goliath" filter shows staking events
- [x] Tests pass for Blockscout API service and yield adapter

**Acceptance criteria (TDD)**

- [x] Test: Blockscout API service parses Staked events correctly
- [x] Test: Blockscout API service parses Unstaked events correctly
- [x] Test: Service returns empty array on network errors
- [x] Test: Yield adapter converts events to UnifiedHistoryItem with correct fields
- [x] Test: Yield adapter preserves timestamps

---

## 2) ENVIRONMENT

### Project Details

- **Repository path:** `~/goliath/onyx-new-frontend`
- **Language/stack:** TypeScript, Next.js 15, React 19, wagmi/viem
- **Entry point:** `app/[locale]/page.tsx`
- **Build command:** `npm run build`
- **Test command:** `npx vitest run`

### Network Context

- Chain ID: 327
- Goliath Mainnet
- Staking contract (StakedXCNDirect): `0xA553a603e2f84fEa6c1fc225E0945FE176C72F74`
- RPC: `https://rpc.goliath.net`
- Explorer: `https://explorer.goliath.net` (Blockscout v2.5.3)

---

## 3) ISSUE ANALYSIS

### 3.1 Symptoms

- Staking history table on the Goliath staking page (/) shows "Empty History"
- Confirmed on-chain transactions exist:
  - Stake 500 XCN: `0x16a748770d76c0f0fbf95d6127255788ae8763b5c1aea001f38f41b949627403` (block 723027)
  - Stake 150 XCN: `0x2a71755fa69282b43fb318d127ae04ee8d6d2cb335eb6f5d63f5953b5835f799` (block 720051)
- Wallet: `0xaa91057C8F98Af30C44BB8708399bF4daA188A81`
- Console shows many `rpc.goliath.net` HTTP 400 errors

### 3.2 Impact

- **User impact:** Users cannot see their staking history after staking XCN
- **System impact:** No data loss; display-only issue
- **Scope:** `useGoliathStakingHistory` hook, `useUnifiedHistory` hook

### 3.3 Affected Code

| File | Function/Component | Issue |
|------|-------------------|-------|
| `hooks/goliath-yield/useGoliathStakingHistory.ts` | `useGoliathStakingHistory` | `eth_getLogs` RPC calls fail with 400 |
| `hooks/history/useUnifiedHistory.ts` | `useUnifiedHistory` | Same `eth_getLogs` failure, error silently swallowed |

---

## 4) ROOT CAUSE ANALYSIS

### Root cause

The Goliath chain uses a Hedera-based JSON-RPC relay at `rpc.goliath.net`. This relay has a block range limit for `eth_getLogs` queries (typically 1000-5000 blocks). The hooks were querying `fromBlock: 0` to `toBlock: latest` (a range of ~723,000 blocks), causing the relay to return HTTP 400 errors.

The previous fix attempted to bound the range with `latestBlock > 1_000_000n ? latestBlock - 1_000_000n : 0n`, but since the latest block (~723,000) is below 1 million, the bound was ineffective and `fromBlock` remained `0n`.

Both hooks silently swallowed these errors (via try/catch returning `[]` or React Query retry exhaustion), resulting in empty history tables.

### Contributing factors

- Silent error handling masked the RPC failures
- The block range bound logic was based on an incorrect threshold
- No fallback data source was implemented

---

## 5) SOLUTION

### Chosen approach: Blockscout Explorer API

Replace direct `eth_getLogs` RPC calls with the Blockscout Etherscan-compatible API (`/api?module=logs&action=getLogs`). This is more reliable because:

1. Blockscout indexes data independently and handles large ranges
2. The explorer already successfully displays the transactions
3. Provides timestamps directly (eth_getLogs does not)
4. Single API call vs. potential need for hundreds of batched RPC calls

### Changes

1. **Created `lib/api/services/blockscout.ts`**: New service that queries the Blockscout API for Staked/Unstaked event logs, decodes them using viem's `decodeAbiParameters`, and returns parsed events with timestamps.

2. **Modified `hooks/goliath-yield/useGoliathStakingHistory.ts`**: Replaced `goliathPublicClient.getContractEvents()` calls with `fetchStakingEventsFromExplorer()`.

3. **Modified `hooks/history/useUnifiedHistory.ts`**: Same replacement for the unified history data source.

### Tests added

- `__tests__/lib/api/blockscout.test.ts` (7 tests): Blockscout API response parsing, error handling, hex/decimal format support
- `__tests__/hooks/goliath-yield/stakingHistory.test.ts` (7 tests): Yield adapter event conversion, timestamp preservation, unique IDs

---

## 6) VERIFICATION

- [x] All 354 tests pass (including 14 new tests)
- [x] No ESLint warnings or errors
- [x] No new TypeScript errors introduced
- [x] Build succeeds
