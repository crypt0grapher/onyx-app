# Goliath ETH Minting Stuck: Relayer Address Mismatch

**Project:** onyx-new-frontend + goliath-bridge-backend
**Type:** Code Bug + Contract Misconfiguration
**Priority:** P0
**Risk level:** High
**Requires deployment?:** Yes (backend + frontend redeploy + on-chain setRelayer call)
**Requires network freeze?:** No
**Owner:** Goliath Engineering
**Date created:** 2026-03-26
**Related docs:** `docs/issues/2026-03-26-bridge-stuck-transactions-no-api-polling.md`

---

## 1) GOAL / SUCCESS CRITERIA

**What "fixed" means:**

ETH bridge deposits from Ethereum to Goliath complete the full lifecycle: deposit -> confirm -> relay -> mint -> complete. The frontend correctly displays progress, shows the exact step where failure occurred, and surfaces error messages from the backend.

**Must-have outcomes**

- [x] Frontend: FAILED operations show which step failed (red X on failed step, green checks on completed steps)
- [x] Frontend: API error messages displayed to user in status modal
- [x] Backend: Startup verification of BridgeMint `relayer()` vs configured signer — logs CRITICAL if mismatched
- [x] Backend: ETHEREUM_TO_GOLIATH batch processing skipped when relayer mismatch detected (prevents burning retries)
- [ ] Contract: `setRelayer(0x90F26908Ee30C8fA6812f6BA66c050a86C8aF6cB)` called from owner on BridgeMint
- [ ] Operations: Retry stuck/failed operations for user `0xaa91057C8F98Af30C44BB8708399bF4daA188A81`

**Non-goals**

- USDC or XCN bridge flows (ETH-specific issue)
- Database HA or multi-region changes
- Contract upgrade

---

## 2) ENVIRONMENT

### Affected User

- **Address:** `0xaa91057C8F98Af30C44BB8708399bF4daA188A81`
- **Operation:** ETH deposit from Ethereum to Goliath
- **Symptom:** "Minting on Goliath" step stuck indefinitely, nothing happens

### Network Context

- Ethereum mainnet (chain ID 1) <-> Goliath mainnet (chain ID 327)
- BridgeLock (Ethereum): `0xA9FD64B5095d626F5A3A67e6DB7FB766345F8092`
- BridgeMint (Goliath): `0x1d14ae13ca030eb5e9e2857e911af515cf5ffff2`
- Signer wallet: `0x90F26908Ee30C8fA6812f6BA66c050a86C8aF6cB`
- Contract owner: `0xE708B75F7b6914479E63D3897bEF9e0dedcA3640`

---

## 3) ISSUE ANALYSIS

### 3.1 Root Cause: BridgeMint relayer() Returns Zero Address

The BridgeMint contract on Goliath has an `onlyRelayer` modifier on `mint()`. On-chain query returns:

```
relayer() -> 0x0000000000000000000000000000000000000000
```

This means ALL `mint()` calls are rejected. The backend submitter picks up AWAITING_RELAY operations, transitions them to PROCESSING_DESTINATION, attempts `mint()`, gets rejected, retries 3 times, then marks FAILED.

### 3.2 Frontend Bug: FAILED Status Display Broken

`BridgeStatusModal.getStepIndex("FAILED")` returned 0 (since FAILED isn't in STEP_ORDER), causing:
- All 5 progress steps shown as grey dots (no completed steps visible)
- User sees no indication of which steps succeeded before failure
- Error message from API never displayed

Expected behavior: steps before failure show green checks, the failed step shows a red X, and the error message is visible.

### 3.3 Backend Bug: No Relayer Verification

The TransactionSubmitter had no startup check for relayer address correctness. When `relayer()` returns zero, the submitter silently burned through all 3 retry attempts on every operation before marking FAILED. No CRITICAL log message indicated the root cause.

### 3.4 ETH Minting Flow (ETHEREUM_TO_GOLIATH)

For non-XCN tokens (ETH, USDC), the submitter calls:
```
bridgeGoliath.mint(depositId, destTokenAddress, recipient, amount)
```

Where `destTokenAddress` for ETH = `0x9253587505c3B7E7b9DEE118AE1AcB53eEC0E4b6` (wrapped ETH on Goliath).

This path requires `relayer()` to return the caller's address. With zero address, every call reverts.

---

## 4) CHANGES APPLIED

### Frontend: `components/bridge/BridgeStatusModal.tsx`

1. **Added `getFailedStepIndex()` helper** — Uses API timestamps (`destinationSubmittedAt`, `finalizedAt`, `depositedAt`) to determine which step was reached before failure. Falls back to operation data (destinationTxHash, originTxHash).

2. **Fixed `activeIndex` for FAILED status** — When `isFailed`, uses `getFailedStepIndex()` instead of `getStepIndex()` which returned 0.

3. **Added failed step indicator** — The step where failure occurred shows a red X (instead of grey dot). Completed steps before it show green checks.

4. **Added error message display** — When operation is FAILED and API returns an error, a red alert box shows the backend error message.

### Backend: `src/worker/transactionSubmitter.ts`

1. **Added `verifyRelayerConfig()` method** — On startup, queries `bridgeGoliathReadOnly.relayer()` and compares with `config.relayer.address`. Logs CRITICAL error if zero address or mismatch. Sets `relayerMismatch` flag.

2. **Added batch processing guard** — When `relayerMismatch` is true, `processDirectionBatch()` skips ETHEREUM_TO_GOLIATH processing with a warning log. Prevents burning retries and making operations fail.

---

## 5) REMAINING ON-CHAIN ACTION REQUIRED

The code fixes prevent silent failures and improve UX, but the **root fix** requires calling `setRelayer()` on the BridgeMint contract:

```
Contract: 0x1d14ae13ca030eb5e9e2857e911af515cf5ffff2
Function: setRelayer(address)
Argument: 0x90F26908Ee30C8fA6812f6BA66c050a86C8aF6cB
Caller:   0xE708B75F7b6914479E63D3897bEF9e0dedcA3640 (owner)
```

Options:
- `cast send 0x1d14ae13ca030eb5e9e2857e911af515cf5ffff2 "setRelayer(address)" 0x90F26908Ee30C8fA6812f6BA66c050a86C8aF6cB --rpc-url rpc.goliath.net --private-key <owner-key>`
- Hedera SDK `ContractExecuteTransaction` if relay is unreliable

After `setRelayer()`, verify:
```bash
curl -s -X POST rpc.goliath.net -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_call","params":[{"to":"0x1d14ae13ca030eb5e9e2857e911af515cf5ffff2","data":"0x8406c079"},"latest"],"id":1}'
```

Then retry failed operations via admin API.

---

## 6) FOLLOW-UPS

- [ ] Add Prometheus alert for relayer address mismatch
- [ ] Add periodic re-verification of relayer address (e.g., every 5 minutes)
- [ ] Update deployment scripts to verify relayer address on-chain after contract deployment
- [ ] Consider adding a "Retry" button in the frontend for FAILED bridge operations
