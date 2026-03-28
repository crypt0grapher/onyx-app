# Fix Frontend Bridge ABI Mismatch and Stale Sepolia API Names

**Project:** onyx-new-frontend
**Type:** Code Bug
**Priority:** P0
**Risk level:** High
**Requires deployment?:** Yes
**Requires network freeze?:** No
**Owner:** Goliath Engineering
**Date created:** 2026-03-27
**Related docs / prior issues:**
- `~/goliath/goliath-bridge-backend/docs/issues/2026-03-27-mainnet-bridge-three-token-audit.md` (audit)
- `~/goliath/mainnet/docs/bridge-api-integration.md` (canonical API doc)
- `~/goliath/wXCN/contracts/BridgeMint.sol` (deployed contract source)
- `~/goliath/wXCN/deployments/goliath-mainnet-bridge.json` (deployment record)
- `docs/issues/2026-03-26-bridge-xcn-withdraw-stuck-below-minimum.md` (related prior issue)

---

## 1) GOAL / SUCCESS CRITERIA

**What "done" means:**

The frontend bridge withdrawal path for ETH and USDC (Goliath -> Ethereum) encodes the correct 4-argument `burn` call matching the live BridgeMint contract, and all API direction strings use mainnet naming (`goliathToEthereum` / `ethereumToGoliath` / `GOLIATH_TO_ETHEREUM`) instead of stale Sepolia-era names.

**Must-have outcomes**

- [ ] Frontend burn ABI matches deployed BridgeMint: `burn(address,uint256,address,uint64)`
- [ ] `useBridgeBurn` hook passes `destinationChainId` as the 4th argument
- [ ] Fee quote sends `direction: "GOLIATH_TO_ETHEREUM"` (not `"goliathToSepolia"`)
- [ ] Limits response is consumed via `goliathToEthereum` / `ethereumToGoliath` keys
- [ ] Health response type uses `ethereum` chain key (not `sepolia`)
- [ ] Build passes with zero type errors

**Acceptance criteria (TDD)**

- [ ] Test A: `bridgeGoliathAbi` burn function has 4 inputs: `token`, `amount`, `destinationAddress`, `destinationChainId`
- [ ] Test B: `useBridgeBurn.burn()` encodes args array with 4 elements including `sourceChainId` from config
- [ ] Test C: Fee quote request sends `direction: "GOLIATH_TO_ETHEREUM"`
- [ ] Test D: Limits consumption reads `goliathToEthereum.tokens[token]`
- [ ] Test E: `npm run build` succeeds

**Non-goals**

- Funding Ethereum BridgeLock liquidity (ops task, separate from frontend)
- Fixing stale docs in other repos (noted as follow-up)
- Changing bridge fee model or minimum amounts

---

## 2) ENVIRONMENT

### Project Details

- **Repository path:** `~/goliath/onyx-new-frontend`
- **Language/stack:** Next.js 15, React 19, TypeScript, wagmi v2, viem
- **Build command:** `npm run build`
- **Lint command:** `npm run lint`

### Network Context

- **Ethereum chain ID:** 1
- **Goliath chain ID:** 327
- **BridgeMint address (Goliath):** `0x1D14AE13Ca030eB5e9e2857E911Af515cF5fffF2`
- **BridgeLock address (Ethereum):** `0xa9fd64b5095d626f5a3a67e6db7fb766345f8092`
- **Bridge API:** `https://bridge.goliath.net/api/v1`
- **Relayer:** `0x90F26908Ee30C8fA6812f6BA66c050a86C8aF6cB`

---

## 3) CONSTRAINTS

### Hard Safety Constraints

- [ ] Do NOT expose private keys or secrets
- [ ] Do NOT modify contract addresses or relayer configuration
- [ ] Do NOT change the BridgeLock (deposit-side) ABI -- it is already correct

### Code Change Constraints

- [ ] All changes must pass `npm run build`
- [ ] ABI must exactly match deployed BridgeMint.sol source
- [ ] Existing deposit flow (Ethereum -> Goliath) must not break
- [ ] XCN withdrawal flow (native transfer, not burn) must not break

### Operational Constraints

- Allowed downtime: None
- Blast radius: Bridge withdrawal (Goliath -> Ethereum) for ETH/USDC, fee quotes, limits display

---

## 4) TASK ANALYSIS

### 4.1 Symptoms

- **Goliath -> Ethereum withdrawals for ETH and USDC will revert** because the frontend encodes a 3-argument `burn(address,uint256,address)` call, but the deployed BridgeMint contract expects `burn(address,uint256,address,uint64)`.
- **Fee quotes fail silently** because the frontend sends `direction: "goliathToSepolia"` but the live API only accepts `GOLIATH_TO_ETHEREUM` / `ETHEREUM_TO_GOLIATH`.
- **Per-token minimum validation reads wrong key** -- `limits?.goliathToSepolia?.tokens?.[token]` returns `undefined` because the API returns `goliathToEthereum`.

### 4.2 Impact

- **User impact:** Any user attempting to withdraw ETH or USDC from Goliath to Ethereum via the frontend will get a wallet revert. Fee quotes and minimum validation are silently broken for all withdrawal directions.
- **System impact:** The withdrawal path is non-functional for 2 of 3 tokens.
- **Scope:** 4 files, isolated to bridge feature.

### 4.3 Affected Code

| File | Function/Component | Issue |
|------|-------------------|-------|
| `contracts/abis/goliath/bridgeGoliath.ts:10-36` | `bridgeGoliathAbi` | 3-arg `burn` ABI; `Withdraw` event missing `destinationChainId` field |
| `hooks/bridge/useBridgeBurn.ts:47-53` | `burn()` | Passes 3 args `[token, amount, recipient]`; missing `destinationChainId` |
| `components/bridge/BridgeForm.tsx:242` | fee quote effect | Sends `direction: "goliathToSepolia"` |
| `components/bridge/BridgeForm.tsx:360` | `tokenMinimum` memo | Reads `limits?.goliathToSepolia?.tokens?.[selectedToken]` |
| `lib/api/services/bridge.ts:63` | `BridgeHealthResponse` | Chain key is `sepolia` instead of `ethereum` |
| `lib/api/services/bridge.ts:106-107` | `LimitsResponse` | Properties are `goliathToSepolia` / `sepoliaToGoliath` |

### 4.4 Evidence

**Deployed BridgeMint.sol burn signature (source of truth):**

```solidity
// ~/goliath/wXCN/contracts/BridgeMint.sol:116-121
function burn(
    address token,
    uint256 amount,
    address destinationAddress,
    uint64 destinationChainId
) external returns (bytes32 withdrawId) {
```

**Deployed BridgeMint.sol Withdraw event (source of truth):**

```solidity
// ~/goliath/wXCN/contracts/BridgeMint.sol:49-58
event Withdraw(
    bytes32 indexed withdrawId,
    address indexed token,
    address indexed sender,
    address destinationAddress,
    uint256 amount,
    uint64 timestamp,
    uint64 sourceChainId,
    uint64 destinationChainId  // <-- missing from frontend ABI
);
```

**Current frontend ABI (WRONG):**

```typescript
// contracts/abis/goliath/bridgeGoliath.ts:10-21
{
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'destinationAddress', type: 'address' },
      // MISSING: { name: 'destinationChainId', type: 'uint64' }
    ],
    name: 'burn',
    outputs: [{ name: 'withdrawId', type: 'bytes32' }],
    ...
}
```

**Current frontend hook call (WRONG):**

```typescript
// hooks/bridge/useBridgeBurn.ts:51
args: [params.tokenAddress, params.amount, recipient],
// MISSING: 4th arg for destinationChainId
```

**Live API validation (confirmed 2026-03-27):**

```
GET /bridge/fee-quote?...&direction=goliathToSepolia  --> 400 validation error
GET /bridge/fee-quote?...&direction=GOLIATH_TO_ETHEREUM  --> 200 OK
GET /bridge/limits  --> returns { goliathToEthereum: {...}, ethereumToGoliath: {...} }
```

### 4.5 Tasks

- `.memory-bank/tasks/bridge-mainnet-abi-api-fix/task-001-update-bridgemint-abi.md`
- `.memory-bank/tasks/bridge-mainnet-abi-api-fix/task-002-update-burn-hook-4arg.md`
- `.memory-bank/tasks/bridge-mainnet-abi-api-fix/task-003-rename-api-sepolia-to-ethereum.md`
- `.memory-bank/tasks/bridge-mainnet-abi-api-fix/task-004-update-bridgeform-directions.md`
- `.memory-bank/tasks/bridge-mainnet-abi-api-fix/task-005-build-verify.md`

### 4.6 Historical Context

**Prior issues searched:** `docs/issues/`, `docs/tasks/`, `.memory-bank/tasks/`

**Regression from recent changes?**
- No. The ABI has been wrong since the initial Goliath support commit `d10861d` ("Add Goliath network support and update related components"). The frontend was written against the old `BridgeGoliath` contract (3-arg burn), but the deployed mainnet contract is `BridgeMint` (4-arg burn with `destinationChainId`).
- The Sepolia API names are also original -- the frontend was built for testnet and never updated for mainnet API naming.

**Similar prior issues found?**
- `.memory-bank/tasks/mainnet-ready/task-002-rename-bridge-sepolia-to-bridge-lock.md` -- partially addressed the Sepolia naming (renamed the Ethereum-side ABI file from `bridgeSepolia` to `bridgeLock`), but did NOT address the Goliath-side ABI mismatch or the API direction strings.
- `docs/issues/2026-03-26-bridge-xcn-withdraw-stuck-below-minimum.md` -- added per-token minimum validation that reads from `limits?.goliathToSepolia` which silently fails because the API returns `goliathToEthereum`. The fix in that issue's implementation log uses the stale key.

---

## 5) ROOT CAUSE ANALYSIS

### 5.1 Hypothesis

The frontend bridge was built against the pre-mainnet `BridgeGoliath` contract and Sepolia testnet API, then only partially updated for mainnet. The Goliath-side burn ABI and all API direction strings were never migrated.

### 5.2 Supporting Evidence

- `bridgeGoliath.ts` ABI matches the old `BridgeGoliath.sol` contract (3-arg burn), not the deployed `BridgeMint.sol` (4-arg burn)
- The ABI file has not been modified since the initial Goliath commit `d10861d`
- The Ethereum-side ABI was correctly renamed from `bridgeSepolia` to `bridgeLock` in the mainnet-ready task, but the Goliath-side ABI content was not updated
- All 3 API direction string occurrences (`goliathToSepolia`, `sepoliaToGoliath`) predate the mainnet backend deployment
- Live API rejects the old direction strings with a 400 validation error

### 5.3 Gaps / Items to Verify

- TO VERIFY: Confirm the production frontend build uses this codebase revision:
  ```bash
  # Check the deployed build version vs local HEAD
  curl -s https://app.onyx.org/version.json 2>/dev/null || echo "No version endpoint"
  ```

### 5.4 Root Cause (final)

- **Root cause:** Incomplete mainnet migration. The frontend's Goliath bridge ABI still reflects the old `BridgeGoliath` contract (3-arg burn) instead of the deployed `BridgeMint` contract (4-arg burn with `destinationChainId`). API direction strings were never updated from Sepolia-era names to mainnet names.
- **Contributing factors:**
  - The mainnet-ready task set only renamed the Ethereum-side ABI file, not the Goliath-side ABI content
  - No automated contract ABI generation from Solidity source
  - No integration test that validates ABI compatibility with deployed contracts

---

## 6) SOLUTIONS (compare options)

### Option A - Direct ABI + API string fix

**Changes required**
- `contracts/abis/goliath/bridgeGoliath.ts` — update burn ABI to 4 args, Withdraw event to 8 fields
- `hooks/bridge/useBridgeBurn.ts` — add `destinationChainId` param to burn call, pass source chain ID from config
- `lib/api/services/bridge.ts` — rename `sepolia` to `ethereum` in health type, `goliathToSepolia`/`sepoliaToGoliath` to `goliathToEthereum`/`ethereumToGoliath` in limits type
- `components/bridge/BridgeForm.tsx` — update fee quote direction and limits key

**Pros**
- Minimal, targeted changes
- Each change is independently verifiable
- No risk to deposit path or XCN withdrawal path

**Cons / risks**
- Manual ABI maintenance (no codegen)

**Complexity:** Low
**Rollback:** Easy -- `git revert`

---

### Option B - Full ABI codegen from Solidity artifacts

- Set up Hardhat artifact import or wagmi CLI codegen
- Auto-generate all bridge ABIs from compiled contracts

**Pros**
- Prevents future ABI drift permanently

**Cons / risks**
- Significantly more work
- Requires build pipeline changes
- Overkill for 2 contract ABIs

**Complexity:** High
**Rollback:** Moderate

---

### Decision

**Chosen option:** A (Direct fix)
**Justification:** The issue is 4 files, 6 precise changes. ABI codegen is a good follow-up but not needed to unblock withdrawals.
**Accepted tradeoffs:** Manual ABI maintenance continues; mitigated by this task documenting the exact source-of-truth contract.

---

## 7) DELIVERABLES

- [ ] Code changes: `contracts/abis/goliath/bridgeGoliath.ts` — 4-arg burn ABI + 8-field Withdraw event
- [ ] Code changes: `hooks/bridge/useBridgeBurn.ts` — pass `destinationChainId` as 4th arg
- [ ] Code changes: `lib/api/services/bridge.ts` — rename Sepolia types to Ethereum
- [ ] Code changes: `components/bridge/BridgeForm.tsx` — fix fee quote direction + limits key
- [ ] Build verification: `npm run build` clean

---

## 8) TDD: TESTS FIRST

### 8.1 Test Structure

- **No test framework configured** in this project (per CLAUDE.md)
- Verification is via TypeScript compilation (`npm run build`) and manual inspection
- Type errors from ABI/type changes will surface at build time

### 8.2 Required Verifications

**Build-time (TypeScript compiler)**
- [ ] `bridgeGoliathAbi` burn inputs has 4 entries
- [ ] `useBridgeBurn` args array has 4 elements
- [ ] `LimitsResponse` uses `goliathToEthereum` / `ethereumToGoliath`
- [ ] `BridgeHealthResponse` uses `ethereum` chain key

**Manual (dev server)**
- [ ] Fee quote fires with `direction=GOLIATH_TO_ETHEREUM` (check network tab)
- [ ] Limits are populated for withdrawal direction (check component state)

### 8.3 Baseline

- Build status before fix: TO RECORD (`npm run build`)

---

## 9) STEP-BY-STEP IMPLEMENTATION PLAN

### Phase 0 - Preflight

1. `git status` — confirm clean working tree on `develop`
2. `npm run build` — record baseline
3. `git checkout -b fix/bridge-mainnet-abi-api`

### Phase 1 - Update BridgeMint ABI (task-001)

- **File:** `contracts/abis/goliath/bridgeGoliath.ts`
- **Change:**
  - Add `{ name: 'destinationChainId', type: 'uint64' }` as 4th input to `burn` function
  - Add `{ indexed: false, name: 'destinationChainId', type: 'uint64' }` as 8th input to `Withdraw` event
  - Update JSDoc to reference BridgeMint, not BridgeGoliath
- **Verify:** File compiles; grep confirms 4 burn inputs
- **Rollback:** `git checkout -- contracts/abis/goliath/bridgeGoliath.ts`

### Phase 2 - Update burn hook to pass 4 args (task-002)

- **File:** `hooks/bridge/useBridgeBurn.ts`
- **Change:**
  - Import `goliathConfig` source chain ID
  - Change args from `[token, amount, recipient]` to `[token, amount, recipient, BigInt(sourceChainId)]`
  - The `destinationChainId` for a Goliath->Ethereum burn is the Ethereum chain ID (`goliathConfig.bridge.sourceChainId`)
  - Update JSDoc to mention the 4-arg signature
- **Verify:** `npm run build` — no type errors from wagmi's `writeContractAsync`
- **Rollback:** `git checkout -- hooks/bridge/useBridgeBurn.ts`

### Phase 3 - Rename API Sepolia types to Ethereum (task-003)

- **File:** `lib/api/services/bridge.ts`
- **Changes:**
  - `BridgeHealthResponse.chains.sepolia` → `BridgeHealthResponse.chains.ethereum`
  - `LimitsResponse.goliathToSepolia` → `LimitsResponse.goliathToEthereum`
  - `LimitsResponse.sepoliaToGoliath` → `LimitsResponse.ethereumToGoliath`
- **Verify:** `npm run build` — type errors will surface in any consumer using the old property names
- **Rollback:** `git checkout -- lib/api/services/bridge.ts`

### Phase 4 - Fix BridgeForm direction strings (task-004)

- **File:** `components/bridge/BridgeForm.tsx`
- **Changes:**
  - Line 242: `direction: "goliathToSepolia"` → `direction: "GOLIATH_TO_ETHEREUM"`
  - Line 360: `limits?.goliathToSepolia?.tokens?.[selectedToken]` → `limits?.goliathToEthereum?.tokens?.[selectedToken]`
- **Verify:** `npm run build` — clean
- **Rollback:** `git checkout -- components/bridge/BridgeForm.tsx`

### Phase 5 - Build verification (task-005)

1. `npm run build` — must succeed with zero errors
2. `npm run lint` — must pass
3. Grep verification:
   - `grep -r "goliathToSepolia\|sepoliaToGoliath" --include="*.ts" --include="*.tsx" lib/ hooks/ components/ contracts/` — must return zero results (excluding docs/)
   - `grep "destinationChainId" contracts/abis/goliath/bridgeGoliath.ts` — must match

### Phase 6 - Rollback Plan

**Triggers:** Build fails, deposit flow breaks, type errors cascade
**Procedure:**
- `git checkout develop` — all changes on feature branch, no risk to develop
- If already merged: `git revert <merge-commit>`

---

## 10) VERIFICATION CHECKLIST

- [x] `npm run build` succeeds
- [x] `npm run lint` passes
- [x] No `goliathToSepolia` or `sepoliaToGoliath` in source files (excluding docs)
- [x] `bridgeGoliathAbi` burn function has 4 inputs
- [x] `useBridgeBurn` passes 4 args to `writeContractAsync`
- [x] Deposit path (useBridgeDeposit) unchanged
- [x] XCN withdrawal path (useBridgeXcnWithdraw) unchanged

---

## 11) IMPLEMENTATION LOG

### Actions Taken

| Time (UTC) | Task | Action | Result | Notes |
|------------|------|--------|--------|-------|
| 2026-03-27 | task-001 | Updated bridgeGoliath ABI: 4-arg burn + 8-field Withdraw event | PASS | JSDoc updated to reference BridgeMint |
| 2026-03-27 | task-003 | Renamed Sepolia types to Ethereum in bridge.ts | PASS | 3 type property renames, zero grep matches for sepolia |
| 2026-03-27 | task-002 | Added destinationChainId as 4th arg in useBridgeBurn | PASS | Uses BigInt(goliathConfig.bridge.sourceChainId) |
| 2026-03-27 | task-004 | Fixed BridgeForm fee quote direction + limits key | PASS | goliathToSepolia -> GOLIATH_TO_ETHEREUM / goliathToEthereum |
| 2026-03-27 | task-005 | Build + lint + grep audit | PASS | npm run build clean, npm run lint clean, zero stale refs |

### Failed Attempts

None — all 5 tasks passed on first execution.

### Progress Tracker

- **Last completed task:** task-005-build-verify
- **Failed tasks:** None
- **Skipped tasks:** None
- **Blocking issues:** None

### Final State

- **Status:** COMPLETED
- **Tasks completed:** 5 of 5
- **Changes made:** 4 files modified (`bridgeGoliath.ts`, `useBridgeBurn.ts`, `bridge.ts`, `BridgeForm.tsx`)
- **Build:** Clean (npm run build + npm run lint)
- **Deposit path:** Unchanged (useBridgeDeposit.ts untouched)
- **XCN withdrawal path:** Unchanged (useBridgeXcnWithdraw.ts untouched)

---

## 12) FOLLOW-UPS

- [ ] Fund Ethereum BridgeLock with ETH, USDC, XCN release liquidity (ops task)
- [ ] Update `~/goliath/mainnet/docs/bridge-api-integration.md` burn ABI section to show 4-arg signature (doc also shows 3-arg)
- [ ] Clean stale `0x3e72...` relayer references in `goliath-bridge-backend/docs/tasks/2026-03-18-bridge-mainnet-migration.md`
- [ ] Consider ABI codegen from Hardhat artifacts to prevent future drift
- [ ] Add integration smoke test for bridge ABI compatibility
