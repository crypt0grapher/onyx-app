# History Page Shows 0.0000 XCN for All Goliath Staking Amounts

**Project:** onyx-new-frontend
**Type:** Code Bug
**Priority:** P1
**Risk level:** Low
**Requires deployment?:** Yes
**Requires network freeze?:** No
**Owner:** Goliath Engineering
**Date created:** 2026-03-26
**Related docs / prior issues:** `docs/issues/2026-03-26-staking-history-empty-hedera-relay-logs.md`, `docs/issues/2026-03-26-staking-history-not-displayed.md`

---

## 1) GOAL / SUCCESS CRITERIA

**What "fixed" means:**

Goliath staking history entries on the History page display correct XCN amounts (e.g., "1,000.0000 XCN") instead of "0.0000 XCN" for all operations.

**Must-have outcomes**

- [x] Staking amounts display correctly for Goliath stake/unstake events
- [x] Subgraph-sourced history (Ethereum) continues to display correctly
- [x] Bridge and swap amounts also display correctly (same bug class)
- [x] Build passes

**Non-goals**

- No changes to data fetching or API layer
- No changes to the adapter layer (amounts are correctly formatted there)

---

## 2) ENVIRONMENT

### Project Details

- **Repository path:** `~/goliath/onyx-new-frontend`
- **Language/stack:** TypeScript, Next.js 15, React 19
- **Build command:** `npm run build`

---

## 4) ISSUE ANALYSIS

### 4.1 Symptoms

- All Goliath staking operations on the History page show "0.0000 XCN"
- Transactions on block explorer show correct non-zero values
- Only affects `UnifiedHistoryItem` sources (Goliath staking, bridge, swaps) — not Ethereum subgraph items

### 4.2 Impact

- **User impact:** Users cannot see their staking amounts in history, making the feature appear broken
- **System impact:** Display-only bug, no data loss or incorrect transactions
- **Scope:** `components/history/HistoryTable.tsx`

### 4.3 Affected Code

| File | Function/Component | Issue |
|------|-------------------|-------|
| `components/history/HistoryTable.tsx:258` | `formatCellData` (desktop) | Calls `formatXcnAmountFromWei()` on already-formatted amount |
| `components/history/HistoryTable.tsx:461` | mobile render | Same double-formatting |

### 4.4 Evidence

**Data flow causing the bug:**

1. `blockscout.ts` fetches raw `xcnAmount` as `bigint` (e.g., `1000000000000000000n` for 1 XCN)
2. `yieldAdapter.ts:46` converts via `formatUnits(event.amount, 18)` → `"1.0"` (human-readable)
3. `UnifiedHistoryItem.amount` stores `"1.0"` (documented as "Human-readable formatted amount")
4. `HistoryTable.tsx:258` calls `formatXcnAmountFromWei("1.0")` → divides by 10^18 again → `0.000000000000000001` → displays as `"0.0000 XCN"`

### 4.6 Historical Context

**Regression from recent changes?**
- Yes. Commit `cf6d55e` ("Fix staking history: use Blockscout v2 transactions API") introduced the Blockscout-based staking history with pre-formatted amounts via `yieldAdapter.ts`. The `HistoryTable` was originally built for subgraph data (wei strings) and was not updated to handle the new pre-formatted unified items.

---

## 5) ROOT CAUSE ANALYSIS

### 5.1 Hypothesis

Double-formatting: `UnifiedHistoryItem.amount` is already human-readable (divided by 10^18 in the adapter), but `HistoryTable` applies `formatXcnAmountFromWei()` which divides by 10^18 again.

### 5.4 Root Cause

- **Root cause:** `HistoryTable.tsx` unconditionally applies `formatXcnAmountFromWei()` to all items, but unified items already have human-readable amounts while subgraph items have raw wei strings.
- **Contributing factors:** Two data source types (`HistoryItem` vs `UnifiedHistoryItem`) with different amount semantics flowing into the same display code without distinction.

---

## 6) SOLUTIONS

### Decision

**Chosen option:** Pre-compute `displayAmount` in `getItemFields()` based on item type.

- For `UnifiedHistoryItem`: format the already-human-readable `amount` with locale formatting and token symbol
- For subgraph `HistoryItem`: apply `formatXcnAmountFromWei()` as before (wei → human-readable)

This keeps the fix localized to `HistoryTable.tsx` without changing adapters or types.

---

## 11) IMPLEMENTATION LOG

### Actions Taken

| Time (UTC) | Action | Result | Notes |
|------------|--------|--------|-------|
| 2026-03-26 | Added `formatUnifiedAmount()` helper and `displayAmount` field to `getItemFields()` | Build passes | |
| 2026-03-26 | Replaced `formatXcnAmountFromWei(fields.amount)` with `fields.displayAmount` at lines 258 and 461 | Fix complete | |
| 2026-03-26 | Committed as `29a1f8a` and pushed to `develop` | Pushed | |

### Final State

- **Changes made:** `components/history/HistoryTable.tsx` — 15 insertions, 4 deletions
- **Build:** Passes
- **Commit:** `29a1f8a` on `develop`
