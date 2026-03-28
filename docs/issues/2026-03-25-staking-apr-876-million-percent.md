# Goliath Liquid Staking APR Displayed as 876,700,800% Instead of 27.80%

**Project:** onyx-new-frontend
**Type:** Code Bug
**Priority:** P1
**Risk level:** Low
**Requires deployment?:** Yes
**Requires network freeze?:** No
**Owner:** Goliath Engineering
**Date created:** 2026-03-25
**Related docs / prior issues:** None

---

## 1) GOAL / SUCCESS CRITERIA

**What "fixed" means:**

The Goliath Liquid Staking APR displays the correct annualized rate (~27.80% gross, ~25.02% net of fees) instead of 876,700,800.00%.

**Must-have outcomes**

- [ ] APR displays correctly as ~27.80% (or ~25.02% net) on the Goliath staking page
- [ ] Estimated daily earnings calculate correctly based on the corrected APR
- [ ] All display locations (DataBoxes, YieldPanel, UserStats, ProtocolStats) show consistent values

**Acceptance criteria (TDD)**

- [ ] Test A: Given `rewardRateRay = 278000000000000000000000000n` (27.8% annual), computed APR equals `27.80`
- [ ] Test B: Given `rewardRateRay = 0n`, computed APR equals `0`
- [ ] Test C: Daily earnings for 1000 XCN at 27.8% APR ≈ 0.76 XCN/day (not 24,019,200 XCN/day)

**Non-goals**

- Changing the staking contract itself
- Modifying fee deduction logic (gross vs net APR display is a separate decision)

---

## 2) ENVIRONMENT

### Project Details

- **Repository path:** `~/goliath/onyx-new-frontend`
- **Language/stack:** TypeScript, Next.js 15, React 19, wagmi v2, viem
- **Entry point:** `app/[locale]/page.tsx`
- **Build command:** `npm run build`
- **Test command:** No test framework configured

### Network Context

- Chain ID: 327 (Goliath Mainnet)
- stXCN Contract: `0xA553a603e2f84fEa6c1fc225E0945FE176C72F74` (Direct, non-proxy)
- Reward Rate: `278000000000000000000000000` (27.8% annual, in Ray)
- Fee: 1000 bps (10%)

---

## 3) CONSTRAINTS

### Hard Safety Constraints

- [ ] Do NOT modify smart contracts
- [ ] Do NOT expose private keys or secrets

### Code Change Constraints

- [ ] All changes must pass `npm run build` and `npm run lint`
- [ ] Fix must be backwards-compatible with all deployed contract versions

---

## 4) ISSUE ANALYSIS

### 4.1 Symptoms

- Goliath Liquid Staking APR displays as **876,700,800.00%** across all UI locations
- Estimated daily earnings are wildly inflated
- The value 876,700,800 = 0.278 × 31,536,000 × 100 (the exact result of the incorrect formula)

### 4.2 Impact

- **User impact:** Users see a nonsensical APR, undermining trust in the protocol
- **System impact:** No data corruption — display-only bug
- **Scope:** All components consuming `apr` from `useGoliathYieldData()`

### 4.3 Affected Code

| File | Function/Component | Issue |
|------|-------------------|-------|
| `hooks/goliath-yield/useGoliathYieldData.ts:141-150` | `apr` useMemo | Multiplies annual rate by SECONDS_PER_YEAR (treats it as per-second rate) |
| `components/goliath-yield/GoliathDataBoxes.tsx:30` | `stakingAPR` | Displays the inflated value |
| `components/goliath-yield/GoliathYieldPanel.tsx:56-68` | `calculateEstimatedEarnings` | Daily earnings derived from inflated APR |
| `components/goliath-yield/GoliathYieldPanel.tsx:202` | APR info row | Displays the inflated value |

### 4.4 Evidence

**The bug — `hooks/goliath-yield/useGoliathYieldData.ts:139-150`:**
```typescript
// APR: (rewardRateRay * SECONDS_PER_YEAR) / RAY * 100  ← WRONG COMMENT/FORMULA
const apr = useMemo(() => {
    if (!protocolData) return 0;
    const scaled =
      (protocolData.rewardRateRay *
        SECONDS_PER_YEAR *        // ← BUG: this should NOT be here
        APR_PERCENT *
        APR_PRECISION) /
      RAY;
    return Number(scaled) / Number(APR_PRECISION);
}, [protocolData]);
```

**The contract proves `rewardRateRay` is already annual — `MathUtils.sol:20-36`:**
```solidity
/// @notice Calculates linear interest accumulated over a time period
/// @dev Formula: RAY + (rate * deltaTime / SECONDS_PER_YEAR)
/// @param rate Annual interest rate in Ray (1e27 = 100%)
function calculateLinearInterest(
    uint256 rate,
    uint40 lastUpdateTimestamp
) internal view returns (uint256) {
    uint256 timeDelta = block.timestamp - uint256(lastUpdateTimestamp);
    if (timeDelta == 0) return WadRayMath.RAY;
    uint256 result = rate * timeDelta;
    unchecked { result = result / SECONDS_PER_YEAR; }
    return WadRayMath.RAY + result;
}
```

The contract **divides** rate by `SECONDS_PER_YEAR` to get the per-second fraction. This proves `rate` (= `_rewardRateRay` = `getRewardRate()`) is the **annual** rate, not per-second.

**Math proof:**
- `rewardRateRay` = `278000000000000000000000000` = `0.278 × 1e27` = 27.8% annual in Ray
- Frontend computes: `0.278 × 31,536,000 × 100 = 876,700,800%` ← matches bug
- Correct: `0.278 × 100 = 27.8%`

### 4.5 Tasks

- `task-001-fix-apr-formula.md` — Remove SECONDS_PER_YEAR from APR calculation

### 4.6 Historical Context

**Prior issues searched:** No `docs/issues/` or `docs/tasks/` directories existed previously.

**Regression from recent changes?**
- No — the formula has been incorrect since the feature was introduced in commit `34d26f8` ("Add Goliath components and hooks for migration and staking features").

**Similar prior issues found?**
- No

---

## 5) ROOT CAUSE ANALYSIS

### 5.1 Hypothesis

The frontend APR calculation treats the contract's **annual** reward rate as a **per-second** rate, multiplying by `SECONDS_PER_YEAR` (31,536,000) to "annualize" a value that is already annual, inflating the result by 31.5 million times.

### 5.2 Supporting Evidence

- Contract NatSpec: `@param rate Annual interest rate in Ray (1e27 = 100%)`
- Contract divides rate by `SECONDS_PER_YEAR` to derive per-period interest, proving the input is annual
- The displayed value (876,700,800) = 27.8 × 31,536,000, exactly the inflation factor
- Deployed `_rewardRateRay` = `278000000000000000000000000` confirmed in `~/goliath/staking/test-contract-sepolia/deployments/goliath-mainnet.json`

### 5.3 Gaps / Items to Verify

- None — root cause is confirmed

### 5.4 Root Cause (final)

- **Root cause:** `useGoliathYieldData.ts:144` multiplies the annual reward rate by `SECONDS_PER_YEAR`, erroneously treating it as a per-second rate
- **Contributing factors:** Misleading comment on line 139 (`// APR: (rewardRateRay * SECONDS_PER_YEAR) / RAY * 100`) encoded the wrong formula, and no test coverage exists for APR calculation

---

## 6) SOLUTIONS (compare options)

### Option A — Remove SECONDS_PER_YEAR from calculation

**Changes required**
- `hooks/goliath-yield/useGoliathYieldData.ts:139-150` — Remove `SECONDS_PER_YEAR` from the multiplication, update the comment

**Before:**
```typescript
// APR: (rewardRateRay * SECONDS_PER_YEAR) / RAY * 100
const apr = useMemo(() => {
    if (!protocolData) return 0;
    const scaled =
      (protocolData.rewardRateRay *
        SECONDS_PER_YEAR *
        APR_PERCENT *
        APR_PRECISION) /
      RAY;
    return Number(scaled) / Number(APR_PRECISION);
}, [protocolData]);
```

**After:**
```typescript
// APR: (rewardRateRay / RAY) * 100
// rewardRateRay is already an annual rate (the contract divides by SECONDS_PER_YEAR internally)
const apr = useMemo(() => {
    if (!protocolData) return 0;
    const scaled =
      (protocolData.rewardRateRay *
        APR_PERCENT *
        APR_PRECISION) /
      RAY;
    return Number(scaled) / Number(APR_PRECISION);
}, [protocolData]);
```

**Pros**
- Minimal change (remove one operand)
- Displays gross APR (27.8%), matching what the contract returns
- No risk of breaking other calculations

**Cons / risks**
- Displays gross APR, not net-of-fee APR (users earn 25.02% after the 10% protocol fee)

**Complexity:** Low
**Rollback:** Easy — `git checkout -- hooks/goliath-yield/useGoliathYieldData.ts`

---

### Option B — Remove SECONDS_PER_YEAR AND deduct protocol fee (show net APR)

**Changes required**
- Same as Option A, plus factor in `feePercentBps` to show net APR

**After:**
```typescript
// APR: (rewardRateRay / RAY) * 100 * (1 - fee/10000)
// Shows net APR after protocol fee deduction
const apr = useMemo(() => {
    if (!protocolData) return 0;
    const feeFactor = BigInt(10000 - protocolData.feePercentBps);
    const scaled =
      (protocolData.rewardRateRay *
        APR_PERCENT *
        APR_PRECISION *
        feeFactor) /
      (RAY * BPS_BASE);
    return Number(scaled) / Number(APR_PRECISION);
}, [protocolData]);
```

**Pros**
- Shows what users actually earn (25.02% net)
- More accurate representation of staker returns

**Cons / risks**
- Slightly more complex
- UI already displays fee separately — showing net APR alongside a separate fee display could confuse users

**Complexity:** Low
**Rollback:** Easy

---

### Decision

**Chosen option:** Option A — Remove SECONDS_PER_YEAR (show gross APR)
**Justification:** The UI already displays the protocol fee (10%) in a separate info row. Showing gross APR alongside the fee is standard DeFi practice and avoids double-counting the fee deduction in the user's mental model. The fix is minimal and directly addresses the root cause.
**Accepted tradeoffs:** Users see 27.80% gross rather than 25.02% net. The separate fee display clarifies the distinction.

---

## 7) DELIVERABLES

- [ ] Code changes: `hooks/goliath-yield/useGoliathYieldData.ts` — remove `SECONDS_PER_YEAR` from APR formula
- [ ] Optionally remove unused `SECONDS_PER_YEAR` import if no longer needed
- [ ] Verify build passes

---

## 8) TDD: TESTS FIRST

### 8.1 Test Structure

No test framework is configured in this project. Verification is manual + build check.

### 8.2 Manual Verification

- [ ] After fix, APR displays as ~27.80% on the Goliath staking page
- [ ] Estimated daily earnings for 1000 XCN ≈ 0.76 XCN/day (= 1000 × 27.8 / 365 / 100)
- [ ] `npm run build` passes
- [ ] `npm run lint` passes

---

## 9) STEP-BY-STEP IMPLEMENTATION PLAN

### Phase 0 — Preflight

1. `git status` — ensure clean working tree
2. `git checkout -b fix/staking-apr-calculation`

### Phase 1 — Implement the Fix

- **Step 1:** Edit `hooks/goliath-yield/useGoliathYieldData.ts`
  - Line 139-150: Remove `SECONDS_PER_YEAR *` from the multiplication chain
  - Update the comment to reflect the correct formula
  - Remove `SECONDS_PER_YEAR` from the import on line 12 if no longer used elsewhere in the file
  - Build: `npm run build`
  - Expected: Build succeeds, no type errors
  - Rollback: `git checkout -- hooks/goliath-yield/useGoliathYieldData.ts`

### Phase 2 — Validate

1. `npm run build` — must succeed
2. `npm run lint` — must pass
3. `npm run dev` — verify on Goliath staking page that APR shows ~27.80%

### Phase 3 — Rollback Plan

**Triggers:** APR displays incorrectly after fix, or build breaks
**Procedure:** `git checkout -- hooks/goliath-yield/useGoliathYieldData.ts`

---

## 10) VERIFICATION CHECKLIST

- [ ] APR displays ~27.80% (not 876,700,800%)
- [ ] Daily earnings are reasonable (~0.76 XCN/day per 1000 XCN staked)
- [ ] Build succeeds
- [ ] Lint passes
- [ ] Fee still displays correctly as 10.00%

---

## 11) IMPLEMENTATION LOG

### 11.1 Actions Taken

| Time (UTC) | Task | Action | Result | Notes |
|------------|------|--------|--------|-------|
| 2026-03-25 | task-001-fix-apr-formula | Removed `SECONDS_PER_YEAR` from APR multiplication in `useGoliathYieldData.ts` | PASS | Comment updated, unused import removed |
| 2026-03-25 | task-001-fix-apr-formula | Fixed APR tests in `yieldMath.test.ts` and `goliathStakingIntegration.test.ts` | PASS | Tests now use correct annual rate model |
| 2026-03-25 | task-001-fix-apr-formula | Validator: `npm run build` | PASS | No errors |
| 2026-03-25 | task-001-fix-apr-formula | Validator: `npm run lint` | PASS | No warnings or errors |
| 2026-03-25 | task-001-fix-apr-formula | Validator: `vitest run` (60 tests) | PASS | 60/60 passed |

### 11.2 Failed Attempts

None.

### 11.3 Progress Tracker

- **Last completed task:** task-001-fix-apr-formula
- **Failed tasks:** none
- **Skipped tasks:** none
- **Blocking issues:** none

### 11.4 Final Summary

- **Status:** COMPLETED
- **Tasks completed:** 1 of 1
- **Changes made:** Removed `SECONDS_PER_YEAR` from APR formula in `useGoliathYieldData.ts`, updated comment, removed unused import. Fixed corresponding tests in 2 test files to use correct annual rate model.
- **Tests passing:** 60/60
- **Follow-ups needed:** Consider showing net APR (25.02%) with tooltip; add more test coverage when test framework matures

### 11.5 Bottlenecks & Blockers Encountered

None.

### 11.6 Lessons Learned

##### DO
- Verify contract NatSpec comments to understand whether rates are per-second or annual before writing frontend formulas

##### DON'T
- Don't assume reward rates need annualization — check the contract's `calculateLinearInterest` to see if it divides by `SECONDS_PER_YEAR` (proving the input is already annual)

---

## 12) FOLLOW-UPS

- [ ] Consider showing net APR (25.02%) with a tooltip explaining gross vs net
- [ ] Add unit tests for APR calculation when test framework is added
- [ ] Audit XCN staking APR calculation (`useStakingData.ts`) for similar issues
