# Fix Staking Migration Tests and Add Goliath Migration Test Coverage

**Project:** onyx-new-frontend
**Type:** Test Fix + Test Coverage
**Priority:** P1
**Risk level:** Medium
**Requires deployment?:** No (test-only changes)
**Requires network freeze?:** No
**Owner:** Goliath Engineering
**Date created:** 2026-03-27
**Related docs / prior issues:**
- `docs/tasks/2026-03-27-bridge-mainnet-abi-api-fix.md` (bridge ABI fix that broke existing tests)
- `docs/issues/2026-03-26-goliath-staking-history-labels-layout.md` (event type rename that broke history tests)
- `docs/issues/2026-03-26-staking-history-empty-hedera-relay-logs.md` (Blockscout migration)

---

## 1) GOAL / SUCCESS CRITERIA

**What "done" means:**

All existing tests pass (0 failures), stale Sepolia references in staking/migration code are cleaned up, and the staking migration flow to Goliath has comprehensive test coverage matching the bridge test suite's depth.

**Must-have outcomes**

- [ ] Fix 4 failing tests across 2 test files (0 failures on `npx vitest run`)
- [ ] Fix stale "Sepolia" JSDoc in `chnStaking.ts` ABI
- [ ] Fix migration adapter inline types — import from `migration.ts` service
- [ ] Remove Sepolia chain ID (11155111) from migration adapter `resolveNetwork`
- [ ] Add tests for migration transaction argument shapes (claim, approve, unstake, bridge)
- [ ] Add tests for migration orchestrator state machine (idle → running → paused → completed)
- [ ] Add tests for migration status polling and terminal detection
- [ ] Add tests for migration API service (method existence + type shapes)
- [ ] Add tests for Goliath liquid staking hook validation (zero-amount guard, gas limits)
- [ ] `npx vitest run` passes with 0 failures

**Acceptance criteria (TDD)**

- [ ] Test A: `bridgeGoliathAbi` burn function has 4 inputs (fix stale assertion)
- [ ] Test B: `adaptYieldEvents` maps Staked → `"liquidStake"`, Unstaked → `"liquidUnstake"` (fix stale assertions)
- [ ] Test C: Migration flow steps include `CLAIM_REWARDS` only when `claimEnabled && rewards > 0`
- [ ] Test D: Migration orchestrator transitions: `idle → running → completed` when all steps confirm
- [ ] Test E: Migration orchestrator pauses on wallet rejection (step IDLE after attempt)
- [ ] Test F: Migration orchestrator pauses on step FAILED
- [ ] Test G: `executeClaim` calls `withdraw(0, 0)` on the CHNStaking contract
- [ ] Test H: `executeApprove` approves `bridgeAddress` for `maxUint256`
- [ ] Test I: `executeUnstake` calls `withdraw(0, staked)` on the CHNStaking contract
- [ ] Test J: `executeBridge` calls `deposit(xcnAddress, amount, address)` on BridgeLock
- [ ] Test K: `executeBridge` signs EIP-712 StakePreference typed data with correct domain
- [ ] Test L: Migration status terminal set is `["COMPLETED", "FAILED", "EXPIRED"]`
- [ ] Test M: `shouldPromptStaking` is true only when COMPLETED + stakeOnGoliath + no stakingTxHash
- [ ] Test N: Migration API service has all 5 methods (submitStakePreference, bindOriginTxHash, getMigrationStatus, getMigrationStats, getMigrationHistory)
- [ ] Test O: `useGoliathStake` throws for zero amount
- [ ] Test P: `useGoliathUnstake` throws for zero amount
- [ ] Test Q: Migration config addresses are valid Ethereum addresses
- [ ] Test R: `resolveNetwork` returns "goliath" for chain 327, "ethereum" for chain 1

**Non-goals**

- Changing any runtime behavior (all changes are test/JSDoc/type-import only)
- Adding integration tests that hit live contracts or APIs
- Refactoring the migration hooks themselves

---

## 2) ENVIRONMENT

### Project Details

- **Repository path:** `~/goliath/onyx-new-frontend`
- **Language/stack:** Next.js 15, React 19, TypeScript, wagmi v2, viem, Vitest
- **Test command:** `npx vitest run`
- **Build command:** `npm run build`

### Test Framework

- **Vitest** with jsdom environment
- **Config:** `vitest.config.ts` — includes `__tests__/**/*.test.{ts,tsx}`, pool: forks
- **Setup:** `vitest.setup.ts` — mocks wagmi, next-intl, next/navigation
- **Path alias:** `@/*` → project root

### Current Test State

| Metric | Value |
|--------|-------|
| Test files | 21 |
| Total tests | 376 |
| Passing | 372 |
| **Failing** | **4** |
| Duration | ~2.5s |

### Failing Tests

| File | Test | Expected | Actual | Root Cause |
|------|------|----------|--------|------------|
| `bridgeIntegration.test.ts:120` | BridgeGoliath ABI burn has 3 inputs | `toHaveLength(3)` | Length is 4 | Bridge ABI fix added `destinationChainId` (task 2026-03-27) |
| `stakingHistory.test.ts:22` | Staked events map to type "stake" | `"stake"` | `"liquidStake"` | yieldAdapter updated for label fix (issue 2026-03-26) |
| `stakingHistory.test.ts:50` | Unstaked events map to type "unstake" | `"unstake"` | `"liquidUnstake"` | Same — yieldAdapter uses `liquidStake`/`liquidUnstake` |
| `stakingHistory.test.ts:107` | Mixed events filter by type "stake"/"unstake" | 2 + 1 | 0 + 0 | Same — filter predicates use old type names |

---

## 3) CONSTRAINTS

### Hard Safety Constraints

- [ ] Do NOT modify any runtime code that affects transaction execution
- [ ] Do NOT change contract addresses, ABIs, or config values
- [ ] Do NOT change any hook behavior — tests must validate existing behavior

### Code Change Constraints

- [ ] `npx vitest run` must pass with 0 failures after all changes
- [ ] `npm run build` must still succeed
- [ ] Existing passing tests must not regress
- [ ] New test files follow existing `__tests__/` directory structure

### Operational Constraints

- Test-only changes — no deployment needed
- No blast radius — tests do not affect production behavior

---

## 4) TASK ANALYSIS

### 4.1 Symptoms

- **4 test failures on every `npx vitest run`** — caused by two recent code changes (bridge ABI fix + staking history label fix) that updated runtime code without updating corresponding test assertions.
- **No test coverage for the entire migration-to-Goliath flow** — the most complex multi-step user flow in the app (claim → approve → unstake → EIP-712 sign → API submit → bridge deposit → bind tx) has only basic step-ordering and persistence tests, with zero coverage of transaction argument shapes, orchestrator state machine, status polling, or API service methods.
- **Stale Sepolia references in chnStaking ABI and migration adapter** — leftover from pre-mainnet development.

### 4.2 Impact

- **Developer impact:** Failing tests erode CI signal. Developers cannot trust the test suite as a regression check.
- **Risk impact:** The migration flow bridges real XCN tokens across chains. Without tests validating argument shapes and contract call configurations, a regression in transaction encoding could cause fund loss (wrong pool ID, wrong contract address, wrong chain ID).
- **Coverage impact:** Migration flow has 8 source files and 0 dedicated tests for transaction logic, orchestrator state machine, or status polling.

### 4.3 Affected Code

#### Fix targets (stale tests + JSDoc)

| File | Issue |
|------|-------|
| `__tests__/hooks/bridge/bridgeIntegration.test.ts:111-124` | Expects 3-arg burn; ABI now has 4 |
| `__tests__/hooks/goliath-yield/stakingHistory.test.ts:22,50,107` | Expects `"stake"`/`"unstake"`; adapter returns `"liquidStake"`/`"liquidUnstake"` |
| `contracts/abis/goliath/chnStaking.ts:2` | JSDoc says "CHNStaking contract (Sepolia)" — should say Ethereum mainnet |
| `hooks/history/adapters/migrationAdapter.ts:11-37` | Inline type definitions instead of importing from `migration.ts` |
| `hooks/history/adapters/migrationAdapter.ts:50` | `resolveNetwork` checks for Sepolia chain ID 11155111 |

#### New test targets (migration-to-Goliath coverage)

| New Test File | Tests What |
|---------------|-----------|
| `__tests__/hooks/migration/migrationTransactions.test.ts` | Transaction argument shapes for claim, approve, unstake, bridge; EIP-712 domain; wallet rejection detection |
| `__tests__/hooks/migration/migrationOrchestrator.test.ts` | Orchestrator state machine transitions; auto-advance; pause on rejection; pause on failure; retry |
| `__tests__/hooks/migration/migrationStatus.test.ts` | Terminal status detection; shouldPromptStaking logic; polling interval behavior |
| `__tests__/hooks/migration/migrationApi.test.ts` | MigrationApiService method existence and type shapes |
| `__tests__/hooks/migration/migrationConfig.test.ts` | Migration config address validation; chain IDs; feature flags |
| `__tests__/hooks/goliath-yield/goliathStakingHooks.test.ts` | Zero-amount guard; gas limit constants; ABI function references |
| `__tests__/hooks/history/migrationAdapter.test.ts` | Migration adapter: status mapping, network resolution, explorer URLs |

### 4.4 Evidence

**Current failing output (`npx vitest run`):**

```
FAIL  __tests__/hooks/bridge/bridgeIntegration.test.ts
  > BridgeGoliath ABI > has a burn function with params (...)
    expect(inputs).toHaveLength(3)   // actual: 4

FAIL  __tests__/hooks/goliath-yield/stakingHistory.test.ts
  > adaptYieldEvents > converts Staked events ...
    expected 'liquidStake' to be 'stake'
  > adaptYieldEvents > converts Unstaked events correctly
    expected 'liquidUnstake' to be 'unstake'
  > adaptYieldEvents > handles multiple events of mixed types
    expected [] to have length 2 but got 0
```

**chnStaking ABI stale JSDoc:**

```typescript
// contracts/abis/goliath/chnStaking.ts:2
 * ABI for the CHNStaking contract (Sepolia).
// Should be: ABI for the CHNStaking contract (Ethereum mainnet).
```

**Migration adapter inline types (should import from service):**

```typescript
// hooks/history/adapters/migrationAdapter.ts:10
// Source types -- defined inline because the migration API service has not
// been created yet.  Once it ships, swap these for real imports.
// ^ The migration service NOW EXISTS at lib/api/services/migration.ts
```

**Migration adapter Sepolia chain ID:**

```typescript
// hooks/history/adapters/migrationAdapter.ts:50
function resolveNetwork(chainId: number): HistoryNetwork {
  if (chainId === 1 || chainId === 11155111) return "ethereum";
  //                     ^^^^^^^^ Sepolia testnet — remove
```

### 4.5 Historical Context

**Why are tests stale?**
- The bridge ABI fix (task 2026-03-27-bridge-mainnet-abi-api-fix) updated `bridgeGoliath.ts` to 4-arg burn but did not update the bridge integration test that asserts 3 args.
- The staking history label fix (issue 2026-03-26-goliath-staking-history-labels-layout) updated `yieldAdapter.ts` to return `"liquidStake"`/`"liquidUnstake"` but did not update the stakingHistory test that asserts `"stake"`/`"unstake"`.

**Why is migration test coverage thin?**
- The initial migration implementation (port-goliath-coolswap task set) focused on getting the feature working. Tests were added for flow logic and persistence but transaction encoding and orchestrator state machine tests were deferred.
- The vitest setup was added relatively recently — many hooks predate it.

---

## 5) ROOT CAUSE ANALYSIS

### 5.1 Root Cause (test failures)

Runtime code was updated without updating corresponding test assertions in two separate fixes:
1. Bridge ABI fix added `destinationChainId` to burn — test still asserts 3 inputs
2. Yield adapter event type rename to `liquidStake`/`liquidUnstake` — test still asserts `stake`/`unstake`

### 5.2 Root Cause (coverage gaps)

The migration flow is the most complex user journey in the app but was implemented in a feature-first sprint where test coverage was deferred. The vitest framework was set up later and only partial tests were backfilled.

### 5.3 Root Cause (stale references)

Incomplete mainnet migration — same pattern as the bridge ABI/API fix. The chnStaking ABI JSDoc and migration adapter were written for Sepolia testnet and never updated.

---

## 6) SOLUTIONS

### Option A — Fix failing tests + add migration test suite (Chosen)

**Changes required:**
- Fix 2 test files (4 assertions)
- Fix 1 JSDoc, 1 adapter file (type imports + Sepolia removal)
- Add 7 new test files covering the full migration-to-Goliath flow

**Pros:**
- Fixes CI immediately
- Comprehensive coverage for the highest-risk user flow
- Validates all transaction argument shapes against config
- Catches future ABI/config drift via assertion

**Cons:**
- ~7 new test files to write and maintain

**Complexity:** Medium
**Rollback:** Easy — test-only changes, `git revert`

### Option B — Fix only the 4 failing tests

**Pros:** Minimal change
**Cons:** Migration flow remains untested; next config change risks silent breakage

### Decision

**Chosen option:** A
**Justification:** The migration flow moves real tokens across chains. The bridge ABI drift that just happened proves that untested code paths will silently break. The marginal cost of writing migration tests now is far lower than the cost of a user losing funds to a stale argument.

---

## 7) DELIVERABLES

### Phase 1 — Fix failing tests

- [ ] `__tests__/hooks/bridge/bridgeIntegration.test.ts` — update burn ABI assertion to 4 inputs including `destinationChainId`
- [ ] `__tests__/hooks/goliath-yield/stakingHistory.test.ts` — update event type assertions to `"liquidStake"`/`"liquidUnstake"`

### Phase 2 — Fix stale Sepolia references

- [ ] `contracts/abis/goliath/chnStaking.ts` — JSDoc: "(Sepolia)" → "(Ethereum mainnet)"
- [ ] `hooks/history/adapters/migrationAdapter.ts` — import types from `lib/api/services/migration.ts` instead of inline definitions; remove Sepolia chain ID from `resolveNetwork`

### Phase 3 — Migration transaction tests

- [ ] `__tests__/hooks/migration/migrationTransactions.test.ts`
  - `executeClaim` calls `withdraw(pid=0, amount=0)` on `sourceStakingAddress` with `chnStakingAbi`
  - `executeApprove` calls `approve(bridgeAddress, maxUint256)` on `xcnAddress` with `erc20Abi`
  - `executeUnstake` calls `withdraw(pid=0, snapshot.staked)` on `sourceStakingAddress`
  - `executeUnstake` throws when `snapshot.staked === 0n`
  - `executeBridge` throws when wallet not connected
  - `executeBridge` throws when `walletXcn === 0n`
  - `executeBridge` signs EIP-712 with domain `{ name: "GoliathBridge", version: "1", chainId: sourceChainId }`
  - `executeBridge` calls `deposit(xcnAddress, walletXcn, address)` on `sourceBridgeAddress`
  - `executeWithLifecycle` transitions: IDLE → WAITING_SIGNATURE → TX_PENDING → CONFIRMED
  - `executeWithLifecycle` detects user rejection ("rejected", "denied", "4001") → resets to IDLE
  - `executeWithLifecycle` marks FAILED on non-rejection errors
  - `bindWithRetry` retries up to 5 times with exponential backoff

### Phase 4 — Migration orchestrator tests

- [ ] `__tests__/hooks/migration/migrationOrchestrator.test.ts`
  - Orchestrator starts in `"idle"` state
  - `startMigration()` transitions to `"running"`
  - Completing all steps transitions to `"completed"`
  - Step FAILED transitions orchestrator to `"paused"`
  - Wallet rejection (step reverts to IDLE for same step) transitions to `"paused"`
  - `retryMigration()` resets current step to IDLE and resumes `"running"`
  - `lockToggle()` prevents `stakeOnGoliath` from being changed after bridge step starts
  - `preferences.stakeOnGoliath` defaults to `true`

### Phase 5 — Migration status + API tests

- [ ] `__tests__/hooks/migration/migrationStatus.test.ts`
  - Terminal statuses: `["COMPLETED", "FAILED", "EXPIRED"]`
  - `shouldPromptStaking` is `true` when: status=COMPLETED + stakeOnGoliath=true + stakingTxHash=null
  - `shouldPromptStaking` is `false` when: status=COMPLETED + stakeOnGoliath=false
  - `shouldPromptStaking` is `false` when: status=COMPLETED + stakingTxHash exists
  - `shouldPromptStaking` is `false` when: status=FAILED
  - `isPolling` is `true` for non-terminal statuses with a txHash
  - `isPolling` is `false` for terminal statuses

- [ ] `__tests__/hooks/migration/migrationApi.test.ts`
  - `MigrationApiService` is instantiable
  - Has method `submitStakePreference`
  - Has method `bindOriginTxHash`
  - Has method `getMigrationStatus`
  - Has method `getMigrationStats`
  - Has method `getMigrationHistory`

### Phase 6 — Migration config + adapter tests

- [ ] `__tests__/hooks/migration/migrationConfig.test.ts`
  - `migration.sourceStakingAddress` is a valid Ethereum address
  - `migration.sourceStakingAddress` matches known CHNStaking address `0x23445c63feef8d85956dc0f19ade87606d0e19a9`
  - `migration.migrationEnabled` is `true` by default
  - `migration.claimEnabled` is `true` by default
  - `migration.deadline` is 1800 (30 min)
  - `bridge.sourceChainId` is 1 (Ethereum)
  - `bridge.sourceTokens.XCN` matches known XCN address `0xA2cd3D43c775978A96BdBf12d733D5A1ED94fb18`
  - `bridge.sourceBridgeAddress` is a valid Ethereum address

- [ ] `__tests__/hooks/history/migrationAdapter.test.ts`
  - `adaptMigrationItems` maps COMPLETED → `"confirmed"`, FAILED → `"failed"`, PENDING/PROCESSING → `"pending"`
  - `adaptMigrationItems` sets `type: "migrate"` and `source: "migration-api"`
  - `resolveNetwork` returns `"ethereum"` for chain 1, `"goliath"` for chain 327, `"onyx"` for chain 80888
  - `resolveNetwork` does NOT match Sepolia (11155111) — mainnet only
  - Empty items array returns empty result
  - Explorer URLs are built correctly for origin and destination chains

### Phase 7 — Goliath liquid staking hook tests

- [ ] `__tests__/hooks/goliath-yield/goliathStakingHooks.test.ts`
  - `parseEther("0")` should cause stake to throw "Amount must be greater than 0"
  - `parseEther("0")` should cause unstake to throw "Amount must be greater than 0"
  - Stake gas limit constant is 150,000
  - Unstake gas limit constant is 200,000
  - Stake function references `goliathConfig.staking.stXcnAddress`
  - Unstake function references `goliathConfig.staking.stXcnAddress`
  - `stakedXcnAbi` stake function is payable with no args
  - `stakedXcnAbi` unstake function takes 1 uint256 arg

### Phase 8 — Verification

- [ ] `npx vitest run` — 0 failures
- [ ] `npm run build` — clean
- [ ] Grep: zero `Sepolia` references in source files (excluding docs/, node_modules/, .memory-bank/)

---

## 8) TDD: TESTS FIRST

### 8.1 Test Structure

All tests use **Vitest** with the existing jsdom environment and wagmi mocks from `vitest.setup.ts`.

New test files follow the existing convention:
- `__tests__/hooks/{domain}/{testName}.test.ts`
- `__tests__/hooks/history/{testName}.test.ts`

Tests are **pure logic tests** — they validate:
- ABI shapes (input counts, types, mutability)
- Config values (addresses, chain IDs, feature flags)
- State machine transitions (orchestrator, status)
- Transaction argument construction (contract calls, EIP-712 types)
- Adapter output mapping (status → history status, chainId → network)

Tests do **NOT**:
- Call real contracts or APIs
- Render React components
- Require network access

### 8.2 Test Categorization

| Category | Count | Files |
|----------|-------|-------|
| Fix stale assertions | 4 | 2 existing files |
| Migration transactions | 12 | 1 new file |
| Migration orchestrator | 8 | 1 new file |
| Migration status + API | 13 | 2 new files |
| Migration config + adapter | 14 | 2 new files |
| Goliath staking hooks | 8 | 1 new file |
| **Total new tests** | **~55** | **7 new files** |

---

## 9) STEP-BY-STEP IMPLEMENTATION PLAN

### Phase 0 — Preflight

1. `git status` — confirm on `develop`
2. `npx vitest run` — confirm 4 failures as baseline
3. `git checkout -b fix/staking-migration-tests`

### Phase 1 — Fix failing tests (task-001, task-002)

**task-001: Fix bridgeIntegration.test.ts**

- **File:** `__tests__/hooks/bridge/bridgeIntegration.test.ts`
- **Change at line 111-124:**
  - Update test name: "has a burn function with params (..., destinationChainId: uint64)"
  - Change `expect(inputs).toHaveLength(3)` → `expect(inputs).toHaveLength(4)`
  - Add assertion: `expect(inputs[3]).toMatchObject({ name: "destinationChainId", type: "uint64" })`
- **Verify:** `npx vitest run __tests__/hooks/bridge/bridgeIntegration.test.ts`
- **Rollback:** `git checkout -- __tests__/hooks/bridge/bridgeIntegration.test.ts`

**task-002: Fix stakingHistory.test.ts**

- **File:** `__tests__/hooks/goliath-yield/stakingHistory.test.ts`
- **Changes:**
  - Line 22: `"stake"` → `"liquidStake"`
  - Line 50: `"unstake"` → `"liquidUnstake"`
  - Line 107: `i.type === "stake"` → `i.type === "liquidStake"`
  - Line 108: `i.type === "unstake"` → `i.type === "liquidUnstake"`
- **Verify:** `npx vitest run __tests__/hooks/goliath-yield/stakingHistory.test.ts`
- **Rollback:** `git checkout -- __tests__/hooks/goliath-yield/stakingHistory.test.ts`

### Phase 2 — Fix stale Sepolia references (task-003, task-004)

**task-003: Fix chnStaking JSDoc**

- **File:** `contracts/abis/goliath/chnStaking.ts`
- **Change:** Line 2: `(Sepolia)` → `(Ethereum mainnet)`
- **Verify:** grep confirms no "Sepolia" in contracts/ (excluding docs)

**task-004: Fix migration adapter**

- **File:** `hooks/history/adapters/migrationAdapter.ts`
- **Changes:**
  - Remove inline `MigrationStatus`, `MigrationTimestamps`, `MigrationStatusResponse` types (lines 11-37)
  - Import `MigrationStatusResponse` from `@/lib/api/services/migration`
  - Define a local `MigrationStatus` type alias derived from the imported response (the adapter's `MigrationStatus` is a subset: PENDING | PROCESSING | COMPLETED | FAILED)
  - Remove `chainId === 11155111` from `resolveNetwork` (line 50)
  - Remove stale "not been created yet" comment (line 10)
- **Verify:** `npm run build` clean; `npx vitest run`

### Phase 3 — New migration transaction tests (task-005)

- **File:** `__tests__/hooks/migration/migrationTransactions.test.ts`
- **Tests:** See Deliverables Phase 3
- **Approach:** Test pure argument construction logic by extracting testable values from config and verifying contract call shapes match expectations

### Phase 4 — New migration orchestrator tests (task-006)

- **File:** `__tests__/hooks/migration/migrationOrchestrator.test.ts`
- **Tests:** See Deliverables Phase 4
- **Approach:** Test state machine transitions using the type definitions and transition rules

### Phase 5 — New migration status + API tests (task-007, task-008)

- **Files:**
  - `__tests__/hooks/migration/migrationStatus.test.ts`
  - `__tests__/hooks/migration/migrationApi.test.ts`
- **Tests:** See Deliverables Phase 5

### Phase 6 — New migration config + adapter tests (task-009, task-010)

- **Files:**
  - `__tests__/hooks/migration/migrationConfig.test.ts`
  - `__tests__/hooks/history/migrationAdapter.test.ts`
- **Tests:** See Deliverables Phase 6

### Phase 7 — New Goliath staking hook tests (task-011)

- **File:** `__tests__/hooks/goliath-yield/goliathStakingHooks.test.ts`
- **Tests:** See Deliverables Phase 7

### Phase 8 — Final verification (task-012)

1. `npx vitest run` — 0 failures
2. `npm run build` — clean
3. `grep -r "Sepolia\|sepolia" --include="*.ts" --include="*.tsx" contracts/ hooks/ components/ lib/ config/` — 0 results
4. Count new test files and test count

### Rollback Plan

**Triggers:** Build fails, existing tests regress
**Procedure:** `git checkout develop` — all changes on feature branch

---

## 10) VERIFICATION CHECKLIST

- [x] `npx vitest run` passes with 0 failures — 28 files, 653 tests, 0 failures
- [x] `npm run build` succeeds
- [x] No `Sepolia`/`sepolia` references in source files (contracts/, hooks/, components/, lib/, config/)
- [x] `bridgeIntegration.test.ts` asserts 4-arg burn with `destinationChainId`
- [x] `stakingHistory.test.ts` asserts `"liquidStake"` / `"liquidUnstake"` event types
- [x] `chnStaking.ts` JSDoc references "Ethereum mainnet"
- [x] `migrationAdapter.ts` imports types from `migration.ts` service
- [x] `resolveNetwork` does not match Sepolia chain ID
- [x] Migration transaction argument shapes validated for all 4 steps (88 tests)
- [x] Migration orchestrator state transitions validated (58 tests)
- [x] Migration status terminal detection validated (33 tests)
- [x] Migration API service methods validated (20 tests)
- [x] Goliath staking hook validation tested (41 tests)

---

## 11) IMPLEMENTATION LOG

### Actions Taken

| Time (UTC) | Task | Action | Result | Notes |
|------------|------|--------|--------|-------|
| 2026-03-27 | task-001 | Fixed bridgeIntegration.test.ts: 3→4 burn inputs + destinationChainId assertion | PASS | Test now matches 4-arg BridgeMint ABI |
| 2026-03-27 | task-002 | Fixed stakingHistory.test.ts: stake→liquidStake, unstake→liquidUnstake in 3 tests | PASS | Tests now match yieldAdapter event types |
| 2026-03-27 | task-003 | Fixed chnStaking.ts JSDoc: "(Sepolia)" → "(Ethereum mainnet)" | PASS | 1 line change |
| 2026-03-27 | task-004 | Rewrote migrationAdapter.ts: imported MigrationStatusResponse from service, removed inline types, removed Sepolia chain ID 11155111, exported resolveNetwork, updated timestamp field (initiatedAt→depositedAt) | PASS | Also updated adapters/index.ts barrel exports |
| 2026-03-27 | task-005 | Created migrationTransactions.test.ts | PASS | 88 tests: claim/approve/unstake/bridge arg shapes, EIP-712, lifecycle, retry |
| 2026-03-27 | task-006 | Created migrationOrchestrator.test.ts | PASS | 58 tests: step visibility, active step, state machine, preferences, transitions |
| 2026-03-27 | task-007 | Created migrationStatus.test.ts | PASS | 33 tests: terminal status, shouldPromptStaking, polling behavior |
| 2026-03-27 | task-008 | Created migrationApi.test.ts | PASS | 20 tests: service instantiation, 5 methods, request/response type shapes |
| 2026-03-27 | task-009 | Created migrationConfig.test.ts | PASS | 15 tests: feature flags, addresses, timing, cross-reference consistency |
| 2026-03-27 | task-010 | Created migrationAdapter.test.ts | PASS | 22 tests: status mapping, resolveNetwork (no Sepolia), adaptMigrationItems output |
| 2026-03-27 | task-011 | Created goliathStakingHooks.test.ts | PASS | 41 tests: zero-amount guard, gas limits, ABI validation, config, APR formula |
| 2026-03-27 | task-012 | Final verification: vitest, build, grep | PASS | 28 files, 653 tests, 0 failures, build clean, 0 Sepolia refs |

### Failed Attempts

None — all 12 tasks passed on first execution.

### Progress Tracker

- **Last completed task:** task-012 (final verification)
- **Failed tasks:** None
- **Skipped tasks:** None
- **Blocking issues:** None

### Final State

- **Status:** COMPLETED
- **Tasks completed:** 12 of 12
- **Test suite:** 28 files, 653 tests, 0 failures (was: 21 files, 376 tests, 4 failures)
- **New tests added:** 277 across 7 new files
- **Source files modified:** 4 (`bridgeIntegration.test.ts`, `stakingHistory.test.ts`, `chnStaking.ts`, `migrationAdapter.ts`, `adapters/index.ts`)
- **Build:** Clean (`npm run build` + `npx vitest run`)
- **Sepolia references:** 0 in source code (contracts/, hooks/, components/, lib/, config/)

---

## 12) FOLLOW-UPS

- [ ] Consider adding a CI step that runs `npx vitest run` on every PR
- [ ] Add ABI codegen from Hardhat artifacts to prevent future ABI drift (also noted in bridge fix follow-ups)
- [ ] Add integration smoke test that validates ABI function selectors match deployed bytecode
- [ ] Consider testing `bindWithRetry` exponential backoff timing with fake timers
- [ ] Consider testing the MigrationStepper/MigrationSummary React components with React Testing Library
