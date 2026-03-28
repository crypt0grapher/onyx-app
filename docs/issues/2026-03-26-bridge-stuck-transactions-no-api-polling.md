# Bridge Stuck Transactions: No API Polling & Failed Relay

**Project:** onyx-new-frontend + goliath-bridge-backend
**Type:** Code Bug + Infrastructure
**Priority:** P0
**Risk level:** High
**Requires deployment?:** Yes (backend contract fix + frontend redeploy)
**Requires network freeze?:** No
**Owner:** Goliath Engineering
**Date created:** 2026-03-26
**Related docs / prior issues:** `docs/issues/2026-03-25-goliath-metamask-double-add-no-switch.md`

---

## 1) GOAL / SUCCESS CRITERIA

**What "fixed" means:**

Bridge deposits from Ethereum to Goliath are processed end-to-end: deposit detected, confirmed, minted on Goliath, and the frontend displays real-time status with tx hashes.

**Must-have outcomes**

- [ ] BridgeMint contract `relayer()` returns the actual signer address (`0x90F26908Ee30C8fA6812f6BA66c050a86C8aF6cB`)
- [ ] Bridge database (`dal.database.lsh.io:32294`) is reachable from all K3s regions
- [ ] Bridge submitter can successfully call `mint()` on BridgeMint
- [ ] Stuck operation `778494a0-a690-41ca-a4a2-054b2f13ffc8` is retried and completed
- [ ] Frontend displays originTxHash from API response as fallback
- [ ] Frontend displays error messages for FAILED operations

**Non-goals**

- Full HA multi-region submitter testing
- XCN or USDC bridge flow (only ETH affected currently)
- Contract upgrade or migration

---

## 2) ENVIRONMENT

### Project Details

- **Frontend repo:** `~/goliath/onyx-new-frontend` (branch: `develop`)
- **Backend repo:** `~/goliath/goliath-bridge-backend` (branch: `mainnet`)
- **Contract repo:** `~/goliath/wXCN` (BridgeMint.sol, BridgeLock.sol)
- **Stack:** Next.js 15 + TypeScript (frontend), Fastify + Prisma (backend), Solidity 0.8.28 (contracts)

### Deployment Details

- **K8s namespace:** `goliath-apps` (all 3 regions: FRA, ASH, TYO)
- **Components:** bridge-api, bridge-watcher, bridge-submitter, bridge-signer (1 replica each per region)
- **Database:** External managed PostgreSQL at `dal.database.lsh.io:32294`
- **Public API:** `https://bridge.goliath.net/api/v1`
- **Goliath RPC:** `rpc.goliath.net` (NOT `mainnet.rpc.goliath.net`)

### Network Context

- Ethereum mainnet (chain ID 1) <-> Goliath mainnet (chain ID 327)
- BridgeLock (Ethereum): `0xA9FD64B5095d626F5A3A67e6DB7FB766345F8092`
- BridgeMint (Goliath): `0x1d14ae13ca030eb5e9e2857e911af515cf5ffff2` (Hedera EVM address)
- Signer wallet: `0x90F26908Ee30C8fA6812f6BA66c050a86C8aF6cB`
- Contract owner: `0xE708B75F7b6914479E63D3897bEF9e0dedcA3640`

---

## 3) ISSUE ANALYSIS

### 3.1 Symptoms

1. **User-reported:** Bridge transaction 0.001 ETH from Ethereum to Goliath shows "Ethereum Tx: Awaiting..." and "Goliath Tx: Awaiting..." with no API polling to `bridge.goliath.net`
2. **Backend:** Operation `778494a0` reached FAILED status: "Recovery ceiling reached (3/3): operation stuck in PROCESSING_DESTINATION repeatedly"
3. **Infrastructure:** Submitter pods logging "Can't reach database server at dal.database.lsh.io:32294"

### 3.2 Impact

- **User impact:** ALL bridge users - no deposits or withdrawals can complete
- **System impact:** Bridge is completely non-functional (3 compounding failures)
- **Scope:** Bridge backend (all regions), BridgeMint contract, frontend status display

### 3.3 Three Compounding Root Causes

#### Root Cause 1: BridgeMint `relayer()` returns ZERO ADDRESS

On-chain query via `rpc.goliath.net`:
```
relayer() -> 0x0000000000000000000000000000000000000000
owner()   -> 0xE708B75F7b6914479E63D3897bEF9e0dedcA3640
```

The `onlyRelayer` modifier on `mint()` rejects all calls since no address matches zero.

The deployment metadata says constructor was called with `relayer = 0xE708...`, but on-chain reads zero. Possible causes:
- Mirror node state lag (relay uses mirror for `eth_call`)
- Constructor args were different than recorded

#### Root Cause 2: Bridge Database Unreachable

All submitter pods across FRA/ASH/TYO log:
```
ERROR: Can't reach database server at dal.database.lsh.io:32294
```

Without database access, no operations can be tracked, retried, or completed.

#### Root Cause 3: Relayer Address Mismatch (Secondary)

Even if the contract relayer were non-zero:
- Contract deployed with relayer: `0xE708B75F7b6914479E63D3897bEF9e0dedcA3640`
- Signer's actual key derives to: `0x90F26908Ee30C8fA6812f6BA66c050a86C8aF6cB`
- These don't match, so `onlyRelayer` would still reject mint calls

### 3.4 Ethereum Transaction Verification

- **TX Hash:** `0x4cb4b6f8f2e1dfc14c94b16d8c66157913c8a29fee1ec86383ff09c27c4332be`
- **Status:** SUCCESS (0x1)
- **Block:** 24,737,650 (458+ confirmations)
- **Value:** 0.001 ETH to BridgeLock
- **Function:** `depositNative(0xaa91057C8F98Af30C44BB8708399bF4daA188A81)`
- **Deposit ID:** `0x592c441269cba7b09c42a2a98667dd52c1d3714cb97e48e472dffe90846baebe`

### 3.5 Frontend Code Issues

1. `BridgeStatusModal` only uses `operation.originTxHash` (from local state/localStorage), not `status?.originTxHash` (from API) - **FIXED**
2. No error message displayed for FAILED operations - **FIXED**

### 3.6 Timeline (March 25, 2026 UTC)

| Time | Event |
|------|-------|
| 22:47:59 | User deposits 0.001 ETH to BridgeLock on Ethereum |
| 22:48:01 | Watcher detects deposit, creates operation in CONFIRMING |
| 22:51:25 | Signer: 1st broadcast attempt FAILS |
| 22:51:56 | Signer: 2nd broadcast attempt FAILS |
| 22:57:10 | Signer: 3rd broadcast attempt FAILS |
| 23:03:15 | Submitter: recovery ceiling reached (3/3), marks FAILED |

---

## 4) SOLUTION

### Chosen Approach: Call setRelayer() + Fix DB + Retry

1. **Fix database connectivity** - check DNS, managed DB status, firewall rules
2. **Call `setRelayer(0x90F26908Ee30C8fA6812f6BA66c050a86C8aF6cB)`** on BridgeMint from owner
3. **Retry failed operation** via admin API
4. **Deploy frontend fix** for status modal

### Implementation Steps

#### Step 1: Fix Database Connectivity

```bash
# Check DNS from K3s pod
KUBECONFIG=~/.kube/goliath-fra.yaml kubectl run -it --rm dns-test \
  --image=busybox -n goliath-apps -- nslookup dal.database.lsh.io

# Check managed DB status on Vultr dashboard
# Verify firewall rules include K3s node IPs
```

#### Step 2: Call setRelayer()

Contract: `0x1d14ae13ca030eb5e9e2857e911af515cf5ffff2`
Function: `setRelayer(address)` selector `0xb18242fe`
New relayer: `0x90F26908Ee30C8fA6812f6BA66c050a86C8aF6cB`
Caller: owner `0xE708B75F7b6914479E63D3897bEF9e0dedcA3640`

Options:
- Use Hardhat: `npx hardhat run scripts/set-relayer.ts --network mainnet`
- Use cast: `cast send 0x1d14ae... "setRelayer(address)" 0x90F269... --rpc-url rpc.goliath.net --private-key <owner-key>`
- If relay unreliable: Use Hedera SDK `ContractExecuteTransaction`

Verify:
```bash
curl -s -X POST rpc.goliath.net -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_call","params":[{"to":"0x1d14ae13ca030eb5e9e2857e911af515cf5ffff2","data":"0x8406c079"},"latest"],"id":1}'
```

#### Step 3: Retry Failed Operation

```bash
# Get admin key
KUBECONFIG=~/.kube/goliath-fra.yaml kubectl get secret bridge-worker-secret \
  -n goliath-apps -o jsonpath='{.data.ADMIN_API_KEY}' | base64 -d

# Retry
curl -X POST https://bridge.goliath.net/api/v1/admin/retry-operation \
  -H "Content-Type: application/json" \
  -H "X-Bridge-Admin-Key: <key>" \
  -d '{"operationId": "778494a0-a690-41ca-a4a2-054b2f13ffc8"}'
```

#### Step 4: Deploy Frontend Fix

Frontend changes already applied on `develop` branch:
- `components/bridge/BridgeStatusModal.tsx`: API originTxHash fallback + error display

---

## 5) DELIVERABLES

- [x] Frontend: BridgeStatusModal uses API `originTxHash` as fallback
- [x] Frontend: BridgeStatusModal displays error message for FAILED operations
- [ ] Contract: Call `setRelayer(0x90F26908...)` on BridgeMint
- [ ] Infrastructure: Fix database connectivity
- [ ] Operations: Retry failed operation
- [ ] Monitoring: Add DB connectivity alert

---

## 6) FOLLOW-UPS

- [ ] Add Prometheus alert for DB connectivity loss
- [ ] Add pre-flight check in submitter: verify `relayer()` matches signer address on startup
- [ ] Improve signer error logging (include actual RPC error, not just "FAILED during broadcast")
- [ ] Consider Hedera SDK `ContractCallQuery` for on-chain reads (more reliable than relay `eth_call`)
- [ ] Update deployment script to verify relayer address on-chain after deployment
