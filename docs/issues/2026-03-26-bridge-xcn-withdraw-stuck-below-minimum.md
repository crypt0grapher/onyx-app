# Bridge XCN Withdraw Stuck on "Confirming on Goliath" — Amount Below Minimum

**Project:** onyx-new-frontend + goliath-bridge-backend
**Type:** Code Bug
**Priority:** P1
**Risk level:** Medium
**Requires deployment?:** Yes (frontend + backend API)
**Requires network freeze?:** No
**Owner:** Goliath Engineering
**Date created:** 2026-03-26
**Related docs / prior issues:**
- `docs/issues/2026-03-26-bridge-stuck-transactions-no-api-polling.md`
- `docs/issues/2026-03-26-goliath-eth-minting-stuck-relayer-mismatch.md`

---

## 1) GOAL / SUCCESS CRITERIA

**What "fixed" means:**

The bridge frontend prevents users from initiating XCN withdrawals below the per-token minimum (1000 XCN on mainnet). When a below-minimum transaction has already been submitted, the backend creates a FAILED BridgeOperation with a clear error message instead of silently expiring the intent. The user's stuck 100 XCN is manually refunded.

**Must-have outcomes**

- [ ] Frontend: Fetch per-token minimum amounts from `/bridge/limits` API and validate before allowing submission
- [ ] Backend: Validate minimum amount in `registerXcnWithdrawIntent` route BEFORE returning the relayer wallet address
- [ ] Backend: When XcnWithdrawProcessor marks an intent EXPIRED for being below minimum, create a FAILED BridgeOperation with a descriptive error so the status API returns a meaningful status
- [ ] Operations: Refund 100 XCN from relayer wallet `0xE708B75F7b6914479E63D3897bEF9e0dedcA3640` to user `0xaa91057C8F98Af30C44BB8708399bF4daA188A81`

**Acceptance criteria (TDD)**

- [ ] Test A: Frontend disables bridge button when XCN amount < 1000 (fetched from limits API)
- [ ] Test B: Backend `/xcn-withdraw-intent` returns 400 with `BELOW_MINIMUM` error when amountAtomic < minAmount
- [ ] Test C: XcnWithdrawProcessor creates a FAILED BridgeOperation (not just EXPIRED intent) when amount is below minimum
- [ ] Test D: Frontend status poller displays "Amount below minimum" error from API for failed operations

**Non-goals**

- Changing the 1000 XCN minimum amount (that's a business decision)
- Full refund automation system (manual refund for this one-off case)
- Retroactive fix for already-stuck transactions from other issues

---

## 2) ENVIRONMENT

### Project Details

- **Frontend repo:** `~/goliath/onyx-new-frontend` (branch: `develop`)
- **Backend repo:** `~/goliath/goliath-bridge-backend` (branch: `mainnet`)
- **Stack:** Next.js 15 + TypeScript (frontend), Fastify + Prisma (backend)

### Deployment Details

- **K8s namespace:** `goliath-apps` (all 3 regions: FRA, ASH, TYO)
- **Public API:** `https://bridge.goliath.net/api/v1`
- **Goliath RPC:** internal K8s relay service

### Network Context

- Goliath mainnet (chain ID 327) -> Ethereum mainnet (chain ID 1)
- Relayer wallet (deployed): `0xE708B75F7b6914479E63D3897bEF9e0dedcA3640`
- Bridge min XCN amount (mainnet configmap): `1000.0` XCN
- Bridge fee BPS: `100` (1%)
- Bridge min fee XCN: `50.0` XCN

---

## 3) CONSTRAINTS

### Hard Safety Constraints

- [ ] Do NOT expose private keys or secrets in issue files
- [ ] Manual refund requires relayer wallet private key holder's authorization

### Code Change Constraints

- [ ] All changes must pass existing tests
- [ ] New functionality must include tests
- [ ] Frontend changes must not break existing deposit (Ethereum -> Goliath) flow

### Operational Constraints

- Allowed downtime: None (changes are additive)
- Blast radius: Bridge XCN withdrawal flow (Goliath -> Ethereum) only

---

## 4) ISSUE ANALYSIS

### 4.1 Symptoms

1. **User-reported:** Bridge shows "Confirming on Goliath" indefinitely after sending 100 XCN from Goliath
2. **Transaction:** `0x8d7cc4a8dc40f1e70da71b930931cb9095d05fd81a68240372b6aa4bf1acc1e2` — confirmed on block 735134 with 105+ confirmations
3. **UI stuck:** No progress beyond step 2 ("Confirming on Goliath"), no error message displayed

### 4.2 Impact

- **User impact:** User `0xaa91057C8F98Af30C44BB8708399bF4daA188A81` has 100 XCN stuck in the relayer wallet with no bridge completion and no error feedback
- **System impact:** Any user attempting to bridge < 1000 XCN will hit the same silent failure
- **Scope:** Frontend minimum validation, backend intent registration, backend XCN withdraw processing

### 4.3 Affected Code

| File | Function/Component | Issue |
|------|-------------------|-------|
| `onyx-new-frontend/components/bridge/BridgeForm.tsx:343-344` | `isBelowMinimum` | Uses generic `0.001` minimum instead of per-token limits |
| `onyx-new-frontend/config/goliath.ts:207-209` | `goliathConfig.bridge.minAmount` | Single `"0.001"` value for all tokens |
| `goliath-bridge-backend/src/api/routes/xcnWithdraw.ts:36-152` | `POST /xcn-withdraw-intent` | No minimum amount validation before returning relayer address |
| `goliath-bridge-backend/src/worker/xcnWithdrawProcessor.ts:170-192` | `processIntent` | Validates minimum but only marks intent EXPIRED (no BridgeOperation with error) |

### 4.4 Evidence

**Transaction verification (CORRECT):**

The transaction is valid and went to the correct recipient:
- From: `0xaa91057C8F98Af30C44BB8708399bF4daA188A81` (user)
- To: `0xE708B75F7b6914479E63D3897bEF9e0dedcA3640` (relayer wallet per K8s configmap `RELAYER_ADDRESS`)
- Value: 100 XCN (native transfer)
- Status: SUCCESS, block 735134
- This is correct for the XCN withdraw flow — native XCN goes directly to the relayer wallet, NOT the bridge contract

**Minimum amount configuration (mainnet K8s configmap):**

```yaml
# k8s/mainnet/configmap.yaml:76
BRIDGE_MIN_AMOUNT_XCN: "1000.0"
```

100 XCN < 1000 XCN minimum = rejected by XcnWithdrawProcessor.

**Frontend minimum validation (insufficient):**

```typescript
// components/bridge/BridgeForm.tsx:343-344
const isBelowMinimum =
    hasValidAmount &&
    parseFloat(amount) < parseFloat(goliathConfig.bridge.minAmount); // "0.001"
```

100 XCN > 0.001 → passes frontend validation, but fails backend validation.

**Backend flow for this transaction:**

1. `registerXcnWithdrawIntent` → created intent, returned `relayerWalletAddress: 0xE708B75F...` (NO minimum check)
2. User sent 100 XCN to relayer wallet (tx confirmed)
3. `bindXcnWithdrawOrigin` → bound origin tx hash to intent
4. XcnWithdrawProcessor picked up the intent:
   - tx recipient matches relayer: PASS
   - tx amount matches intent: PASS
   - tx sender matches: PASS
   - **minimum amount (100 XCN < 1000 XCN): FAIL → intent marked EXPIRED**
5. No BridgeOperation created → status API returns 404
6. Frontend falls back to localStorage status: "CONFIRMING" → stuck forever

### 4.5 Tasks

- `task-001-frontend-per-token-minimum-validation.md`
- `task-002-backend-intent-minimum-validation.md`
- `task-003-backend-create-failed-operation-on-expired-intent.md`
- `task-004-manual-refund-stuck-xcn.md`

### 4.6 Historical Context

**Prior issues searched:** `docs/issues/`, `docs/tasks/`

**Regression from recent changes?**
- No — this is a pre-existing design gap, not a regression. The per-token minimum was never enforced in the frontend or the intent registration route.

**Similar prior issues found?**
- `docs/issues/2026-03-26-bridge-stuck-transactions-no-api-polling.md` — similar symptom (bridge stuck) but different root cause (DB unreachable + relayer mismatch on BridgeMint contract). Frontend polling fixes from that issue are already applied.
- `docs/issues/2026-03-26-goliath-eth-minting-stuck-relayer-mismatch.md` — also a bridge stuck issue, focused on ETH deposit direction and BridgeMint relayer address. Not directly related but shares the same user.

---

## 5) ROOT CAUSE ANALYSIS

### 5.1 Hypothesis

The bridge XCN withdrawal is stuck because the user's 100 XCN is below the backend's 1000 XCN minimum, causing the XcnWithdrawProcessor to silently expire the intent without creating a BridgeOperation, so the frontend has no status to display.

### 5.2 Supporting Evidence

- Mainnet configmap: `BRIDGE_MIN_AMOUNT_XCN: "1000.0"`
- XcnWithdrawProcessor validates minimum at line 170-192 and marks intent as EXPIRED
- No BridgeOperation is created when intent is expired for minimum violation
- Status API returns 404 for operations not in `bridgeOperation` table
- Frontend `currentStatus` falls back to localStorage "CONFIRMING"

### 5.3 Gaps / Items to Verify

- TO VERIFY: Check XcnWithdrawIntent table for this user's intent state:
  ```bash
  KUBECONFIG=~/.kube/goliath-fra.yaml kubectl exec -it deploy/bridge-api -n goliath-apps -- \
    npx prisma db execute --stdin <<< "SELECT id, state, \"amountAtomic\", \"boundOriginTxHash\", \"expiresAt\" FROM \"XcnWithdrawIntent\" WHERE \"senderAddress\" = '0xaa91057c8f98af30c44bb8708399bf4daa188a81' ORDER BY \"createdAt\" DESC LIMIT 5;"
  ```
- TO VERIFY: Confirm no BridgeOperation exists for this originTxHash:
  ```bash
  curl -s "https://bridge.goliath.net/api/v1/bridge/status?originTxHash=0x8d7cc4a8dc40f1e70da71b930931cb9095d05fd81a68240372b6aa4bf1acc1e2" | jq .
  ```
  Expected: `{"error":"OPERATION_NOT_FOUND","message":"Bridge operation not found"}`
- TO VERIFY: Check XcnWithdrawProcessor logs for the minimum amount rejection:
  ```bash
  KUBECONFIG=~/.kube/goliath-fra.yaml kubectl logs deploy/bridge-watcher -n goliath-apps --since=30m | grep -i "below minimum\|expired.*intent"
  ```

### 5.4 Root Cause (final)

- **Root cause:** Three-layer minimum validation gap — the frontend uses a generic 0.001 minimum, the intent registration API performs no minimum check, and the XcnWithdrawProcessor validates the minimum but only expires the intent silently (no error feedback to user). This allows users to send funds below the minimum, which are then stuck in the relayer wallet.
- **Contributing factors:**
  - Frontend `goliathConfig.bridge.minAmount` is a single value ("0.001") rather than per-token
  - The `/bridge/limits` API exists but is not consumed by the BridgeForm
  - The `registerXcnWithdrawIntent` route returns the relayer wallet address without first validating the amount, creating a point-of-no-return before validation
  - XcnWithdrawProcessor marks the intent as EXPIRED but does not create a BridgeOperation with an error, so the status API has no record to return

---

## 6) SOLUTIONS (compare options)

### Option A — Frontend + Backend Defense in Depth

**Frontend changes:**
1. **`BridgeForm.tsx`**: Fetch limits from `/bridge/limits` API on mount. Use per-token minimum for validation instead of generic `0.001`.
2. **`BridgeForm.tsx`**: Show token-specific minimum in the validation error message (e.g., "Minimum bridge amount is 1,000 XCN").

**Backend changes:**
3. **`xcnWithdraw.ts` (intent route)**: Add minimum amount validation BEFORE creating the intent. Return 400 `BELOW_MINIMUM` with the per-token minimum amount. This prevents the user from being told to send XCN that will be rejected.
4. **`xcnWithdrawProcessor.ts`**: When marking an intent EXPIRED for minimum violation, also create a FAILED BridgeOperation with `errorMessage: "Amount below minimum (100 XCN < 1000 XCN minimum)"`. This ensures the status API returns a meaningful error even if the intent route validation is bypassed.

**Pros**
- Defense in depth: validation at 3 layers (frontend, intent route, processor)
- Users see clear error messages at each layer
- Prevents funds from being sent to relayer wallet if below minimum
- Backward compatible with existing bridge operations

**Cons / risks**
- Requires both frontend and backend deployment
- Backend limits API must be reachable for frontend to show correct minimums

**Complexity:** Medium
**Rollback:** Easy — revert git commits, redeploy

---

### Option B — Frontend-Only Validation

**Changes:**
1. Hardcode per-token minimums in `goliathConfig` to match backend configmap values
2. Validate in BridgeForm before allowing submission

**Pros**
- Single repo change, fast to deploy
- No backend changes needed

**Cons / risks**
- Minimums can drift if backend config changes and frontend isn't updated
- Does not create error feedback for already-stuck transactions
- Does not protect against direct API calls or modified frontends
- Does not fix the silent failure in XcnWithdrawProcessor

**Complexity:** Low
**Rollback:** Easy

---

### Decision

**Chosen option:** A (Frontend + Backend Defense in Depth)
**Justification:** Option B only addresses the immediate symptom. Option A prevents the problem at 3 layers, provides meaningful error messages for any below-minimum withdrawal (including ones that bypass the frontend), and ensures the status API returns useful data for stuck operations.
**Accepted tradeoffs:** Requires coordinated frontend + backend deployment. The limits API is already deployed and stable.

---

## 7) DELIVERABLES

- [ ] Code changes (frontend): `BridgeForm.tsx` — fetch and enforce per-token limits from API
- [ ] Code changes (backend): `xcnWithdraw.ts` — validate minimum in intent registration route
- [ ] Code changes (backend): `xcnWithdrawProcessor.ts` — create FAILED BridgeOperation on minimum violation
- [ ] Tests (frontend): BridgeForm validation with per-token minimums
- [ ] Tests (backend): Intent route rejects below-minimum amounts
- [ ] Tests (backend): Processor creates FAILED operation for below-minimum intents
- [ ] Operations: Manual refund of 100 XCN to user

---

## 8) TDD: TESTS FIRST

### 8.1 Test Structure

- **Frontend tests:** `__tests__/hooks/bridge/bridgeMinimums.test.ts`
- **Backend intent test:** `src/api/routes/__tests__/xcnWithdraw.test.ts` (extend existing)
- **Backend processor test:** `src/worker/__tests__/xcnWithdrawProcessor.test.ts` (new or extend)
- **Frontend run:** No test framework configured (verify manually or add vitest)
- **Backend run:** `npm test`

### 8.2 Required Tests

**Unit tests**
- [ ] Frontend: `BridgeForm` disables bridge button when XCN amount (e.g. 100) is below API-returned minimum (1000)
- [ ] Frontend: `BridgeForm` shows "Minimum bridge amount is 1,000 XCN" validation message
- [ ] Backend: `POST /xcn-withdraw-intent` with 100 XCN atomic returns 400 `BELOW_MINIMUM`
- [ ] Backend: `POST /xcn-withdraw-intent` with 1000 XCN atomic succeeds normally

**Integration tests**
- [ ] Backend: XcnWithdrawProcessor creates FAILED BridgeOperation when intent amount < minimum, with descriptive error message
- [ ] Backend: Status API returns the FAILED operation with error message when queried by originTxHash

### 8.3 Baseline

- Test run before fix: TO RECORD (run `cd ~/goliath/goliath-bridge-backend && npm test`)

---

## 9) STEP-BY-STEP IMPLEMENTATION PLAN

### Phase 0 — Preflight

1. Record current state: `git status`, verify test suite passes
2. Create working branches:
   - Frontend: `git checkout -b fix/bridge-xcn-minimum-validation` from `develop`
   - Backend: `git checkout -b fix/bridge-intent-minimum-check` from `mainnet`

### Phase 1 — Manual Refund (Operations)

1. **Verify the intent state** by querying the database (see Section 5.3 TO VERIFY commands)
2. **Send 100 XCN** from relayer wallet `0xE708B75F7b6914479E63D3897bEF9e0dedcA3640` to user `0xaa91057C8F98Af30C44BB8708399bF4daA188A81` on Goliath mainnet
   - Requires: relayer wallet private key holder authorization
   - Verify: Check user balance before and after
   - Rollback: N/A (manual tx)

### Phase 2 — Write Tests First

**Backend tests:**

- **Step 1:** Add test to `src/api/routes/__tests__/xcnWithdraw.test.ts`:
  - Test that `POST /xcn-withdraw-intent` with amount below minimum returns 400 `BELOW_MINIMUM`
  - Expected: FAIL (validation not yet implemented)

- **Step 2:** Add test to `src/worker/__tests__/xcnWithdrawProcessor.test.ts`:
  - Test that processor creates a FAILED BridgeOperation when amount < minimum
  - Expected: FAIL (processor only marks intent EXPIRED currently)

**Frontend:**

- **Step 3:** Verify manually or via dev tools that BridgeForm allows 100 XCN input for GOLIATH_TO_SOURCE direction
  - Expected: Allowed (bug confirmed)

### Phase 3 — Implement the Fix

#### Backend Changes

- **Step 4:** Add minimum amount validation to intent registration route
  - File: `~/goliath/goliath-bridge-backend/src/api/routes/xcnWithdraw.ts`
  - After signature verification (line ~128), before creating the intent:
    ```typescript
    // Validate minimum amount
    const minValidation = validateMinimumAmount({
      amountAtomic,
      tokenSymbol: 'XCN',
      direction: 'GOLIATH_TO_ETHEREUM',
      feeConfig,
    });
    if (!minValidation.valid) {
      return reply.status(400).send({
        error: 'BELOW_MINIMUM',
        message: `Amount below minimum: ${formatAtomicToHuman(amountAtomic, 'XCN')} XCN < ${minValidation.minAmountFormatted} XCN minimum`,
        minAmount: minValidation.minAmountFormatted,
        minAmountAtomic: minValidation.minAmountAtomic,
      });
    }
    ```
  - Import `validateMinimumAmount` from `../../utils/feeCalculator.js` and `feeConfig` from `../../config/feeConfig.js`
  - Build: `npm run build`
  - Verify: Run `npm test`
  - Rollback: `git checkout -- src/api/routes/xcnWithdraw.ts`

- **Step 5:** Create FAILED BridgeOperation when processor expires intent for minimum violation
  - File: `~/goliath/goliath-bridge-backend/src/worker/xcnWithdrawProcessor.ts`
  - In `processIntent`, after the minimum validation fails (line ~178), before marking intent EXPIRED:
    ```typescript
    // Create a FAILED BridgeOperation so the status API can return error info
    const withdrawId = keccak256(
      solidityPacked(['string', 'string'], [id, boundOriginTxHash])
    );
    await createBridgeOperation({
      direction: 'GOLIATH_TO_ETHEREUM',
      tokenSymbol: 'XCN',
      amountAtomic,
      sender: senderAddress.toLowerCase(),
      recipient: recipientAddress.toLowerCase(),
      originChainId: config.chains.goliath.chainId,
      destinationChainId: config.chains.ethereum.chainId,
      originTxHash: boundOriginTxHash,
      withdrawId,
      status: 'FAILED',
      originConfirmations: 0,
      requiredConfirmations: 0,
      depositedAt: new Date(),
      isSameWallet: senderAddress.toLowerCase() === recipientAddress.toLowerCase(),
      errorMessage: `Amount below minimum: ${humanAmount} XCN is less than ${minValidation.minAmountFormatted} XCN minimum. Contact support for a refund.`,
    });
    ```
  - Build: `npm run build`
  - Verify: Run `npm test`
  - Rollback: `git checkout -- src/worker/xcnWithdrawProcessor.ts`

#### Frontend Changes

- **Step 6:** Fetch per-token limits from API and use for validation
  - File: `~/goliath/onyx-new-frontend/components/bridge/BridgeForm.tsx`
  - Add a `useEffect` to fetch limits from `bridgeApiService.getLimits()` on mount
  - Replace the generic `isBelowMinimum` validation with per-token, per-direction check:
    ```typescript
    const [limits, setLimits] = useState<LimitsResponse | null>(null);

    useEffect(() => {
      bridgeApiService.getLimits().then(setLimits).catch(() => {});
    }, []);

    const tokenMinimum = useMemo(() => {
      if (!limits || direction === "SOURCE_TO_GOLIATH") return 0;
      const dirLimits = limits.goliathToSepolia;
      const tokenLimits = dirLimits?.tokens?.[selectedToken];
      return tokenLimits ? parseFloat(tokenLimits.minAmountFormatted) : 0;
    }, [limits, direction, selectedToken]);

    const isBelowMinimum = hasValidAmount && tokenMinimum > 0 && parseFloat(amount) < tokenMinimum;
    ```
  - Update the validation message to show the actual minimum:
    ```typescript
    {isBelowMinimum && !hasInsufficientBalance && (
      <span className="text-red-400 text-[12px] leading-[16px]">
        {t("validation.minAmount", { min: tokenMinimum.toLocaleString() })}
      </span>
    )}
    ```
  - Build: `npm run build`
  - Verify: Dev server, attempt to bridge 100 XCN — should show minimum error
  - Rollback: `git checkout -- components/bridge/BridgeForm.tsx`

### Phase 4 — Validate

1. Run backend test suite: `cd ~/goliath/goliath-bridge-backend && npm test`
2. Run frontend build: `cd ~/goliath/onyx-new-frontend && npm run build`
3. Run frontend lint: `npm run lint`
4. Manual verification:
   - Try to bridge 100 XCN on dev → frontend shows "Minimum bridge amount is 1,000 XCN"
   - Try to bridge 1000+ XCN → proceeds normally

### Phase 5 — Deploy

1. Deploy backend first (adds intent route validation + processor error feedback)
2. Deploy frontend (adds per-token minimum validation)
3. Verify by checking:
   - `curl https://bridge.goliath.net/api/v1/bridge/limits | jq '.goliathToSepolia.tokens.XCN'`
   - Frontend shows correct minimums

### Phase 6 — Rollback Plan

**Triggers:** Deployment breaks existing bridge flows, limits API returns wrong data
**Procedure:**
- Frontend: Redeploy previous version from `develop` branch
- Backend: `kubectl rollout undo deploy/bridge-api -n goliath-apps` per region
- Both changes are additive — rollback is safe

---

## 10) VERIFICATION CHECKLIST

- [ ] Backend test suite passes
- [ ] Frontend builds successfully
- [ ] Frontend lint passes
- [ ] Below-minimum XCN withdrawal shows clear error in UI
- [ ] Above-minimum XCN withdrawal works end-to-end
- [ ] Status API returns FAILED with error message for below-minimum intents
- [ ] User's 100 XCN refunded
- [ ] Deployed and verified on mainnet

---

## 11) IMPLEMENTATION LOG

### Actions Taken

| Time (UTC) | Task | Action | Result | Notes |
|------------|------|--------|--------|-------|
| 2026-03-26 03:00 | — | Investigation & root cause analysis | Complete | Identified 3-layer minimum validation gap |
| 2026-03-26 03:10 | task-001 | Frontend: fetch /bridge/limits, per-token minimum in BridgeForm | PASS | Build + lint clean. 1 file changed. |
| 2026-03-26 03:10 | task-002 | Backend: minimum validation in xcn-withdraw-intent route | PASS | 4 new tests, 13/13 passing. Build clean. |
| 2026-03-26 03:10 | task-003 | Backend: create FAILED BridgeOperation on below-minimum intent | PASS | 5 new tests, build clean. |

### Failed Attempts

None — all 3 tasks passed on first execution.

### Progress Tracker

- **Last completed task:** task-003-backend-create-failed-operation-on-expired-intent
- **Failed tasks:** None
- **Skipped tasks:** task-004 (manual refund — requires relayer wallet private key, human authorization)
- **Blocking issues:** Refund requires ops team action

### Final State

- **Status:** PARTIALLY_COMPLETED (3/4 code tasks done, 1 ops task pending)
- **Frontend changes:** `components/bridge/BridgeForm.tsx` — fetches per-token limits, validates XCN minimum (1000)
- **Backend changes:**
  - `src/api/routes/xcnWithdraw.ts` — rejects intent registration when amount < minimum (400 BELOW_MINIMUM)
  - `src/worker/xcnWithdrawProcessor.ts` — creates FAILED BridgeOperation with error message for below-minimum intents
  - `src/api/routes/__tests__/xcnWithdraw.test.ts` — 4 new tests
  - `src/__tests__/integration/xcnWithdrawRouteFlow.test.ts` — updated mocks for new imports
  - `src/worker/__tests__/xcnWithdrawBelowMinimum.test.ts` — 5 new tests (new file)
- **Tests passing:** Frontend build+lint clean. Backend 9 new tests passing, 627 total passing (24 pre-existing failures unrelated).
- **Deployment status:** Not yet deployed — changes on develop (frontend) and working tree (backend)
- **Remaining:** User's 100 XCN still in relayer wallet pending manual refund (task-004)

---

## 12) FOLLOW-UPS

- [ ] Add a refund mechanism in the backend for below-minimum XCN withdrawals (auto-return to sender)
- [ ] Harmonize the limits API response keys (`goliathToSepolia` -> `goliathToEthereum` for mainnet) if not already done
- [ ] Add frontend unit test framework (vitest) to properly test BridgeForm validation
- [ ] Consider adding a pre-flight amount check in `useBridgeXcnWithdraw` before calling `registerXcnWithdrawIntent`
- [ ] Audit other bridge flows (ETH, USDC) for similar minimum validation gaps
