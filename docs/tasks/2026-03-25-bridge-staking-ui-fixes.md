# Bridge, Staking, History & Migrate UI Fixes

**Project:** onyx-new-frontend
**Type:** Code Bug + Feature
**Priority:** P1
**Risk level:** Medium
**Requires deployment?:** Yes (frontend only for issues 1-4, 6-7; frontend + potential backend for issue 5)
**Requires network freeze?:** No
**Owner:** Goliath Engineering
**Date created:** 2026-03-25
**Related docs / prior issues:** `docs/issues/2026-03-25-goliath-metamask-double-add-no-switch.md`, `docs/tasks/2026-03-18-bridging-ui-update.md`

---

## 1) GOAL / SUCCESS CRITERIA

**What "done" means:**

All seven reported UI/UX issues are resolved: bridge and staking buttons are actionable for network switching, the bridge actually executes transactions, recipient info is complete, history pages display all relevant data, and migration progress states are correct.

**Must-have outcomes**

- [ ] Bridge: "Switch to Ethereum" / "Switch to Goliath" buttons are clickable and trigger network switch
- [ ] Goliath Staking: "Switch to Goliath" button is clickable; "Enter XCN amount to Stake" shown when amount empty
- [ ] Bridge: Recipient shows full address with "(You)" and explorer link to destination chain
- [ ] Bridge: "Confirm bridge" actually executes on-chain transactions (deposit/burn/XCN-withdraw)
- [ ] History page: Shows bridging and staking/unstaking history on Goliath
- [ ] Goliath Staking page: History section shows staking/unstaking for connected wallet regardless of current chain
- [ ] Migrate: Progress dots and "Claim" are gray when not started; green only when process is running

**Acceptance criteria (TDD)**

No test framework is configured, so acceptance is manual verification:

- [ ] Test A: Connect wallet on Goliath → go to Bridge → set direction "Bridge to Goliath from Ethereum" → button shows "Switch to Ethereum" and is clickable → clicking switches chain to Ethereum
- [ ] Test B: Connect on Ethereum → go to Goliath Staking (/) → button shows "Switch to Goliath" and is clickable → clicking switches to Goliath; once on Goliath with no amount → button shows "Enter XCN amount to Stake" (greyed out)
- [ ] Test C: On bridge form, recipient row shows full 0x address + "(You)" linked to destination explorer
- [ ] Test D: On correct chain with valid amount → click "Bridge ETH" → confirm modal → "Confirm" → wallet signs transaction → bridge operation tracked
- [ ] Test E: History page with Goliath filter shows bridge operations AND staking/unstaking events
- [ ] Test F: Goliath staking page history shows staking events even when connected on Ethereum
- [ ] Test G: Migrate page loads with all steps gray/no animation; clicking "Migrate" starts process and turns first step green with animation

**Non-goals**

- Custom recipient input (flag exists in config but not exposed)
- Backend changes for staking event indexing (chain event queries are sufficient)
- Adding the `onyx-goliath-app-backend` project (the existing `goliath-bridge-backend` already provides necessary APIs)

---

## 2) ENVIRONMENT

### Project Details

- **Repository path:** `~/goliath/onyx-new-frontend`
- **Language/stack:** Next.js 15, React 19, TypeScript, wagmi v2, viem, Tailwind CSS v4
- **Entry point:** `app/[locale]/layout.tsx`
- **Build command:** `npm run build`
- **Test command:** N/A (no test framework configured)

### Network Context

- Ethereum Mainnet: Chain ID 1
- Goliath Mainnet: Chain ID 327
- Bridge backend: `bridge.goliath.net` (Fastify API on K3s)
- Goliath Explorer: `https://explorer.goliath.net`

---

## 3) CONSTRAINTS

### Hard Safety Constraints

- [ ] Do NOT expose private keys or secrets in task files
- [ ] Do NOT deploy smart contracts

### Code Change Constraints

- [ ] All changes must pass `npm run build`
- [ ] All changes must pass `npm run lint`
- [ ] No breaking changes to existing working functionality
- [ ] Maintain i18n compliance (add translation keys where needed)

### Operational Constraints

- Allowed downtime: None (frontend deployment is atomic)
- Blast radius: Bridge, Staking, History, Migrate pages

---

## 4) TASK ANALYSIS

### 4.1 Symptoms

1. **Bridge button greyed out on wrong network** — shows "Switch to Ethereum" or "Switch to Goliath" but is not clickable
2. **Goliath staking button greyed out on wrong network** — shows "Stake XCN" but disabled; no helpful label when amount empty
3. **Bridge recipient truncated** — only shows first 6 + last 4 chars, no "(You)" indicator, no explorer link
4. **Bridge confirm does nothing** — pressing "Confirm" just shows spinner for 1.5s and closes modal
5. **History page missing Goliath data** — no bridging or staking/unstaking history for Goliath chain
6. **Goliath staking history empty** — doesn't show when user is on a different chain
7. **Migrate progress bar always green** — "Claim" step and dots are green/animated even before process starts

### 4.2 Impact

- **User impact:** Users cannot bridge tokens (completely broken), cannot switch networks from within key workflows, cannot track their history
- **System impact:** Core DeFi functionality (bridging) is non-functional; UX friction on staking and migration flows
- **Scope:** 4 pages affected (Bridge, Staking, History, Migrate), ~15 files need modification

### 4.3 Affected Code

| File | Function/Component | Issue |
|------|-------------------|-------|
| `components/bridge/BridgeForm.tsx:287-292` | `isButtonDisabled` | Disables button when `!isOnCorrectNetwork` instead of making it switch networks |
| `components/bridge/BridgeForm.tsx:255-266` | `handleConfirmBridge` | Placeholder implementation (1500ms timeout) — no actual bridge execution |
| `components/bridge/BridgeForm.tsx:475-479` | Recipient display | Truncated address, no "(You)", no explorer link |
| `components/goliath-yield/GoliathYieldPanel.tsx:180-187` | `isButtonDisabled` | Disables button when `!onGoliath`; no "Enter amount" label |
| `components/goliath-yield/GoliathYieldPanel.tsx:166-178` | `getButtonLabel` | Missing "Switch to Goliath" and "Enter XCN amount" states |
| `hooks/history/useUnifiedHistory.ts:48-101` | `allItems` | Only aggregates bridge ops + swaps; missing stXCN events + migration ops |
| `hooks/goliath-yield/useGoliathStakingHistory.ts:78` | `enabled` | Query disabled when `!onGoliath` — history invisible on wrong chain |
| `components/migrate/MigrationProgressBar.tsx:21-29` | `getStepState` | Returns "active" for first step even when process not started |

### 4.4 Evidence

**Issue 1 & 2 — Button disabled logic:**
```typescript
// BridgeForm.tsx:287-292
const isButtonDisabled =
    !isConnected ||
    !isOnCorrectNetwork ||    // ← This disables the "Switch to X" button
    !hasValidAmount ||
    hasInsufficientBalance ||
    isBelowMinimum;
```

**Issue 4 — Placeholder bridge execution:**
```typescript
// BridgeForm.tsx:255-266
const handleConfirmBridge = useCallback(async () => {
    setIsConfirming(true);
    try {
        // placeholder -- will be replaced by contract write logic
        await new Promise((resolve) => setTimeout(resolve, 1500));
    } finally {
        setIsConfirming(false);
        setShowConfirmModal(false);
    }
}, []);
```

**Issue 5 — Missing unified history sources:**
```typescript
// useUnifiedHistory.ts:48-101 — only bridge + swaps, no stXCN events
const allItems = useMemo(() => {
    const items: UnifiedHistoryItem[] = [];
    if (bridgeOps.length > 0) { items.push(...bridgeOps.map(...)); }
    if (localSwaps.length > 0) { items.push(...adaptLocalSwaps(...)); }
    // Missing: stXCN staking events
    // Missing: migration operations
    return mergeAndDedup(items);
}, [bridgeOps, localSwaps, goliathChainId]);
```

**Issue 6 — History disabled on wrong chain:**
```typescript
// useGoliathStakingHistory.ts:78
enabled: !!address && !!publicClient && onGoliath,  // ← onGoliath check
```

**Issue 7 — Progress bar always active:**
```typescript
// MigrationProgressBar.tsx:21-29
function getStepState(step, activeStep, execution): StepState {
    if (execution.status === "CONFIRMED") return "completed";
    if (execution.status === "FAILED") return "failed";
    if (step === activeStep) return "active";  // ← First step is always "active" when idle
    return "pending";
}
```

### 4.5 Tasks

Decomposed into 7 subtask files in `.memory-bank/tasks/bridge-staking-ui-fixes/`:

1. `task-001-bridge-switch-network-button.md` — Make bridge "Switch to X" button actionable
2. `task-002-staking-switch-network-button.md` — Make staking "Switch to Goliath" button actionable + empty amount label
3. `task-003-bridge-recipient-display.md` — Full address + "(You)" + explorer link
4. `task-004-bridge-execution-wiring.md` — Wire actual bridge contract execution
5. `task-005-history-goliath-integration.md` — Integrate stXCN events into unified history
6. `task-006-staking-history-cross-chain.md` — Show staking history regardless of current chain
7. `task-007-migrate-progress-idle-state.md` — Fix migration progress bar idle state

### 4.6 Historical Context

**Prior issues searched:** `docs/issues/`, `docs/tasks/`, `.memory-bank/`

**Regression from recent changes?**
- No — Issues 1-4, 7 are original implementation gaps (placeholder code, incomplete wiring)
- Issues 5-6 are missing features that were never implemented

**Similar prior issues found?**
- Yes: `docs/issues/2026-03-25-goliath-metamask-double-add-no-switch.md` — network switching issues with MetaMask double-add prompts
  - Prior root cause: Duplicate `wallet_addEthereumChain` calls in `useSwitchNetwork` hook
  - Prior solution: Use wagmi's `switchChain` as sole mechanism, fallback only retries `wallet_switchEthereumChain`
  - Applicable here? Yes — the `useSwitchNetwork` hook (already fixed) is the correct mechanism to use for issues 1 & 2

---

## 5) ROOT CAUSE ANALYSIS

### 5.1 Hypothesis

Multiple independent issues stemming from incomplete feature implementation: bridge execution is a placeholder, network-switch buttons are disabled instead of actionable, history sources are not fully integrated, and progress bar lacks idle-state awareness.

### 5.2 Supporting Evidence

- `handleConfirmBridge` contains explicit "placeholder" comment (line 256-260)
- `useBridgeExecutor` hook exists and is fully implemented but never imported or used in `BridgeForm`
- `isButtonDisabled` includes `!isOnCorrectNetwork` which conflicts with the "Switch to X" button label
- `useUnifiedHistory` only maps 2 of 4 available data sources
- `useGoliathStakingHistory` gates on `onGoliath` which prevents cross-chain visibility
- `getStepState` doesn't consider orchestrator state (idle vs running)

### 5.3 Gaps / Items to Verify

- TO VERIFY: Goliath RPC can handle `getContractEvents` from block 0 to latest (for cross-chain staking history)
- TO VERIFY: Bridge backend API (`bridge.goliath.net`) is operational and responds to `/api/v1/bridge/status`

### 5.4 Root Cause (final)

- **Root cause:** Incomplete feature wiring — execution hooks exist but are not connected to UI; button logic doesn't differentiate "wrong network" from "invalid input" states
- **Contributing factors:** Feature was built incrementally with placeholder code that was never replaced; history integration was partially implemented (adapters exist but not wired)

---

## 6) SOLUTIONS (compare options)

### Option A — Incremental Fix (Targeted Changes)

Fix each issue in the minimal set of affected files. Reuse all existing hooks, adapters, and utilities.

**Changes required**
- `BridgeForm.tsx` — Add `useSwitchNetwork`, `useBridgeExecutor`, `useBridgeOperations`; rewire button logic and confirm handler; update recipient display
- `GoliathYieldPanel.tsx` — Add `useSwitchNetwork`; update button logic and labels
- `useUnifiedHistory.ts` — Add stXCN event source via existing yield adapter
- `useGoliathStakingHistory.ts` — Use dedicated Goliath public client instead of wagmi default
- `MigrationProgressBar.tsx` — Accept `orchestratorState` prop; treat idle as all-pending
- Translation files — Add new keys for "Switch to X", "Enter amount", "(You)"

**Pros**
- Minimal blast radius — each fix is isolated
- Reuses all existing infrastructure (hooks, adapters, ABIs)
- No backend changes needed
- Fastest to implement

**Cons / risks**
- Cross-chain event queries (issue 6) may be slow on some RPCs

**Complexity:** Medium
**Rollback:** Easy (per-file git revert)

---

### Option B — Refactor with Unified Action Button Pattern

Create a shared `ActionButton` component that handles the network-switch → approve → execute pipeline uniformly across Bridge, Staking, and Migrate.

**Pros**
- DRY — single pattern for all three flows
- Prevents future inconsistencies

**Cons / risks**
- Larger refactor scope
- Touches more files than necessary for current bugs
- Higher risk of regressions

**Complexity:** High
**Rollback:** Moderate

---

### Decision

**Chosen option:** A — Incremental Fix
**Justification:** All issues have clear, isolated fixes. The existing hook infrastructure is well-designed and just needs to be wired up. A broader refactor is premature given the immediate UX impact.
**Accepted tradeoffs:** Some pattern duplication in button logic across Bridge/Staking/Migrate.

---

## 7) DELIVERABLES

- [ ] Code changes: 8-10 files modified (see task files)
- [ ] Translation keys: New entries in `messages/en.json` (and other locales)
- [ ] No config changes needed
- [ ] No backend changes needed
- [ ] Frontend deployment required

---

## 8) TDD: TESTS FIRST

No test framework is configured. Acceptance testing is manual per criteria in Section 1.

---

## 9) STEP-BY-STEP IMPLEMENTATION PLAN

### Phase 0 — Preflight

1. `git checkout -b fix/bridge-staking-ui-fixes`
2. `npm run build` — confirm clean baseline

### Phase 1 — Independent Tasks (can be parallelized)

Execute subtasks from `.memory-bank/tasks/bridge-staking-ui-fixes/`:

| Task | Description | Deps |
|------|-------------|------|
| task-001 | Bridge switch network button | None |
| task-002 | Staking switch network button | None |
| task-003 | Bridge recipient display | None |
| task-004 | Bridge execution wiring | task-001 (uses same file) |
| task-005 | History Goliath integration | task-006 (uses same hook pattern) |
| task-006 | Staking history cross-chain | None |
| task-007 | Migrate progress idle state | None |

Tasks 001, 002, 003, 006, 007 have no blockers — execute first.
Task 004 depends on 001 (both modify BridgeForm.tsx).
Task 005 depends on 006 (reuses the cross-chain public client pattern).

### Phase 2 — Validate

1. `npm run lint`
2. `npm run build`
3. Manual testing of each acceptance criterion

### Phase 3 — Rollback Plan

**Triggers:** Any broken page, failed build, or wallet interaction regression
**Procedure:** `git revert <commit>` per task

---

## 10) VERIFICATION CHECKLIST

- [ ] `npm run lint` passes
- [ ] `npm run build` passes
- [ ] Bridge: network switch buttons are actionable
- [ ] Bridge: confirm executes real transactions
- [ ] Bridge: recipient shows full address + "(You)" + explorer link
- [ ] Staking: switch network and enter amount states work
- [ ] History: shows Goliath bridge + staking data
- [ ] Staking history: visible cross-chain
- [ ] Migrate: idle state is all gray

---

## 11) IMPLEMENTATION LOG

| Time (UTC) | Action | Result | Notes |
|------------|--------|--------|-------|
| | | | |

---

## 12) FOLLOW-UPS

- [ ] Add end-to-end test framework (Playwright/Cypress) to cover wallet interaction flows
- [ ] Consider backend-powered history endpoint for faster Goliath event queries
- [ ] Unify button action pattern across Bridge/Staking/Migrate into shared component
- [ ] Add bridge operation status panel to bridge page (BridgeStatusModal exists but unused)
