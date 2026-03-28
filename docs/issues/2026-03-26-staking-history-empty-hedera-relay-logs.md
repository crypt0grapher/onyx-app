# Staking History Empty — Hedera Relay Returns No Event Logs

**Project:** onyx-new-frontend
**Type:** Code Bug
**Priority:** P1
**Risk level:** Low
**Requires deployment?:** Yes
**Owner:** Goliath Engineering
**Date created:** 2026-03-26
**Related docs:** `docs/issues/2026-03-26-staking-history-not-displayed.md` (prior fix, insufficient)

---

## 1) GOAL / SUCCESS CRITERIA

**What "fixed" means:** Staking history table on the Goliath staking page shows all stake/unstake transactions for the connected wallet.

**Must-have outcomes**

- [x] Staking history populated with real transaction data
- [x] All 357 tests pass
- [x] Build succeeds

---

## 2) ROOT CAUSE

The prior fix (commit `55a3d77`) replaced direct `eth_getLogs` RPC calls with the Blockscout Etherscan-compatible API (`/api?module=logs&action=getLogs`). This worked on testnet where the relay returned logs normally.

On **Goliath Mainnet**, the Hedera JSON-RPC relay has a critical limitation: **transaction receipts contain `logs: []` for every transaction**, even successful `stake()` calls. This causes:

1. `eth_getLogs` → empty results (relay has no indexed logs)
2. Blockscout `has_logs: false` for the stXCN contract (no logs to index)
3. Blockscout Etherscan-compatible API → `{"status":"0","result":[]}`

**Evidence:**
- `eth_getTransactionReceipt` for a successful stake tx: `"logs": [], "status": "0x1"`
- Blockscout v2 contract info: `"has_logs": false, "is_contract": true, "name": "StakedXCNDirect"`
- Blockscout v2 transactions API: returns 9 transactions with decoded `stake()` calls and values

## 3) FIX APPLIED

Rewrote `lib/api/services/blockscout.ts` to use the Blockscout **v2 transactions API** (`/api/v2/addresses/{contract}/transactions`) instead of the Etherscan-compatible logs API:

- Parses `decoded_input.method_call` to identify `stake()` and `unstake()` calls
- Uses `value` field for stake amounts (native XCN in 18-dec relay format)
- Uses decoded parameters for unstake amounts (stXCN burned)
- Handles pagination via `next_page_params`
- Filters by user address (case-insensitive) and success status
- Same `StakingEventFromExplorer` interface — no consumer changes needed

**Files changed:**
- `lib/api/services/blockscout.ts` — complete rewrite to v2 transactions API
- `__tests__/lib/api/blockscout.test.ts` — 10 tests for new implementation

**Commit:** `cf6d55e` on branch `fix/staking-history-display`

## 4) VERIFICATION

- [x] 357/357 tests pass
- [x] Build succeeds
- [x] Blockscout v2 API confirmed working: returns stake() calls with decoded methods, values, timestamps
