# Fix Goliath Swap: Token List, Liquidity Pools, and Multi-Hop Routing

**Project:** onyx-new-frontend + wXCN (on-chain)
**Type:** Feature + Code Bug
**Priority:** P1
**Risk level:** Medium
**Requires deployment?:** Yes (frontend rebuild + on-chain liquidity)
**Requires network freeze?:** No
**Owner:** Goliath Engineering
**Date created:** 2026-03-26
**Related docs / prior issues:** CoolSwap-Interface testnet reference, wXCN mainnet deployment

---

## 1) GOAL / SUCCESS CRITERIA

**What "done" means:**

The Goliath swap page at onyx.org shows only XCN, ETH, and USDC tokens. Users can swap any pair (including ETH<>XCN via USDC 2-hop routing). Liquidity pools exist on-chain with specified amounts. Ethereum/Onyx swap behavior is completely unchanged.

**Must-have outcomes**

- [ ] Token list limited to XCN, ETH, USDC on Goliath swap
- [ ] USDC address in config defaults matches mainnet (`0xC8410270bb53f6c99A2EFe6eD3686a8630Efe22B`)
- [ ] USDC/WXCN pool exists with ~150K USDC / ~28.46M XCN
- [ ] USDC/ETH pool exists with ~150K USDC / ~69 ETH
- [ ] Swapping USDC<>XCN shows correct output amount
- [ ] Swapping USDC<>ETH shows correct output amount
- [ ] Swapping ETH<>XCN routes through USDC (2-hop) and shows correct output
- [ ] Ethereum/Onyx swap page behavior unchanged

**Acceptance criteria (TDD)**

- [ ] Test: `findBestRoute()` finds direct route for USDC->WXCN with mock reserves
- [ ] Test: `findBestRoute()` finds 2-hop route ETH->USDC->WXCN when no direct ETH/WXCN pair exists
- [ ] Test: Token list exported from controller contains exactly 3 tokens (XCN, USDC, ETH)
- [ ] Test: `getAmountOut()` with known reserves returns expected output
- [ ] Manual: On Goliath mainnet, entering 100 USDC shows ~18,975 XCN output (approx)
- [ ] Manual: On Goliath mainnet, entering 1 ETH shows ~2,173 USDC output (approx)
- [ ] Manual: On Goliath mainnet, entering 1 ETH shows XCN output via 2-hop route

**Non-goals**

- Modifying Ethereum or Onyx swap behavior
- Adding new token contracts
- Changing smart contracts (Uniswap V2 factory/router/pair)
- Adding liquidity management UI
- Price feed / USD value display for Goliath tokens

---

## 2) ENVIRONMENT

### Project Details

- **Repository path:** `~/goliath/onyx-new-frontend` (frontend), `~/goliath/wXCN` (on-chain scripts)
- **Language/stack:** Next.js 15 + React 19 + wagmi v2 + viem (frontend), Hardhat + ethers v6 (on-chain)
- **Entry point:** `app/[locale]/swap/page.tsx` -> `GoliathSwapPage`
- **Build command:** `npm run build`
- **Test command:** `npm test`

### Network Context

- **Goliath Mainnet Chain ID:** 327
- **RPC:** https://rpc.goliath.net
- **Factory:** `0x008c99EedA17E193e5F788536234C6b3520B8D15`
- **Router:** `0xa973c5626eEaF7F482439753953e9B28C6aF3674`
- **WXCN:** `0x1a0Da75ADf091a69E7285e596bB27218D77E17a9`
- **ETH:** `0x9253587505c3B7E7b9DEE118AE1AcB53eEC0E4b6`
- **USDC:** `0xC8410270bb53f6c99A2EFe6eD3686a8630Efe22B`
- **InitCodeHash:** `0x29ac827a7d364439c40cf6909f17f7f9144875302b275bae9498ac55cafc04ea`

### Wallets

- **Bridge wallet (XCN source):** Account 0.0.1009, EVM `0x3e72e970211403fff7fb29dd2c4d081f912aa7f7`, 1B HBAR. Keys in `~/goliath/mainnet/keys/.wallets.txt`
- **Deployer (token owner):** `0xE708B75F7b6914479E63D3897bEF9e0dedcA3640`. Key in `~/goliath/wXCN/.env` as `DEPLOYER_PRIVATE_KEY`
- **Note:** On mainnet, ETH and USDC token ownership was transferred to BridgeMint (`0xb8D5a904089C3333C83de199beE73CaF1Cad37D5`). Minting requires calling through the bridge contract or reclaiming ownership.

---

## 3) CONSTRAINTS

### Hard Safety Constraints

- [ ] Do NOT modify Ethereum or Onyx swap logic
- [ ] Do NOT expose private keys in any committed file
- [ ] Do NOT deploy or modify smart contracts
- [ ] Do NOT touch the `main` branch of onyx-new-frontend (merge to `develop` only)

### Code Change Constraints

- [ ] All changes must pass existing tests
- [ ] New functionality must include tests
- [ ] Frontend changes only affect Goliath swap variant

### Operational Constraints

- Allowed downtime: none (frontend update is seamless)
- Blast radius: Goliath swap page only

---

## 4) TASK ANALYSIS

### 4.1 Symptoms

- On the swap page, selecting USDC or XCN as input shows nothing on the output side
- Token dropdown shows 7 tokens (XCN, USDC, ETH, USDT, BTC, XAUX, XAGX) — should be 3
- No liquidity pools exist on Goliath mainnet for any token pair

### 4.2 Impact

- **User impact:** Swap feature completely non-functional on Goliath mainnet
- **System impact:** No data risk; purely UX/functional issue
- **Scope:** `onyx-new-frontend` Goliath swap hooks + `wXCN` on-chain liquidity

### 4.3 Affected Code

| File | Function/Component | Issue |
|------|-------------------|-------|
| `config/goliath.ts:138` | `loadGoliathConfig()` | USDC default address is wrong (`0x60bB...`) |
| `hooks/goliath-swap/useGoliathSwapController.ts:35-98` | `GOLIATH_TOKENS` | Lists 7 tokens, should be 3 |
| `hooks/goliath-swap/useGoliathPairs.ts:39` | `baseTokens` | Includes USDT which doesn't exist on mainnet |
| On-chain | N/A | No USDC/WXCN or USDC/ETH pairs created |

### 4.4 Evidence

**Wrong USDC default in config/goliath.ts:136-139:**
```typescript
USDC: envAddress(
    "NEXT_PUBLIC_GOLIATH_USDC_ADDRESS",
    "0x60bB118298F4a6f54A73891E5Ba66CAAb7229654",  // WRONG — should be 0xC8410270...
),
```

**.env.mainnet has correct address (line 34):**
```
NEXT_PUBLIC_GOLIATH_USDC_ADDRESS=0xC8410270bb53f6c99A2EFe6eD3686a8630Efe22B
```

**But if .env.mainnet is not copied to .env.local, the fallback kicks in and breaks pair address computation.**

### 4.5 Tasks

See `.memory-bank/tasks/2026-03-26-goliath-swap-fix/`

### 4.6 Historical Context

**Prior issues searched:** No prior swap issues in docs/issues/

**Regression from recent changes?** No — this is a first-time mainnet setup issue. The USDC fallback address was likely a placeholder or copied from a different network.

**Similar prior issues found?** CoolSwap-Interface (testnet) has working swap with same architecture. The gap is:
1. CoolSwap uses hardcoded addresses per chain ID (no env fallback mismatch risk)
2. CoolSwap has MAX_HOPS=3 vs onyx-new-frontend's 1-hop (sufficient for current needs)
3. CoolSwap has MIN_RESERVE filtering with per-decimal normalization (onyx uses flat 1e15)
4. CoolSwap has dust amount handling to prevent white-screen on MAX button

---

## 5) ROOT CAUSE ANALYSIS

### 5.1 Hypothesis

Swap output is empty because: (1) no liquidity pools exist on mainnet, and (2) the USDC fallback address is wrong, causing pair address computation to target non-existent contracts even if pools existed.

### 5.2 Supporting Evidence

- `.env.mainnet` has correct USDC address but it's not the code default
- `config/goliath.ts` fallback USDC is `0x60bB...` which doesn't match the deployed mainnet USDC (`0xC8410270...`)
- `computePairAddress()` uses token addresses + factory + initCodeHash — wrong USDC address = wrong pair address = `getReserves()` call returns nothing
- No `createPair()` or `addLiquidity()` transactions have been made on mainnet factory/router

### 5.3 Gaps / Items to Verify

- TO VERIFY: Current owner of ETH and USDC tokens on mainnet (likely BridgeMint)
- TO VERIFY: Whether BridgeMint has an admin mint function or if ownership needs to be reclaimed
- TO VERIFY: USDT, BTC, XAUX, XAGX addresses in config defaults — likely also wrong/undeployed on mainnet

### 5.4 Root Cause (final)

- **Root cause:** No liquidity pools + wrong USDC fallback address
- **Contributing factors:** Token list too broad for mainnet readiness, no mainnet pool creation scripts

---

## 6) SOLUTIONS (compare options)

### Option A — Fix defaults + limit tokens + create pools

**Changes required**
- `config/goliath.ts:138` — Fix USDC default address to `0xC8410270bb53f6c99A2EFe6eD3686a8630Efe22B`
- `hooks/goliath-swap/useGoliathSwapController.ts:35-98` — Remove USDT, BTC, XAUX, XAGX from GOLIATH_TOKENS
- `hooks/goliath-swap/useGoliathPairs.ts:39` — Remove USDT from baseTokens (keep WXCN, USDC, ETH)
- `wXCN/scripts/` — Create mainnet mint + addLiquidity scripts
- On-chain — Create 2 pools with specified liquidity

**Pros**
- Minimal code changes
- Fixes root cause directly
- 2-hop routing (ETH<>XCN via USDC) works automatically via existing `findBestRoute()`

**Cons / risks**
- Minting requires figuring out current token ownership on mainnet

**Complexity:** Low (frontend) + Medium (on-chain)
**Rollback:** Easy (git revert + pools remain harmless)

---

### Option B — Port full CoolSwap routing engine

**Changes required**
- Port `Trade.bestTradeExactIn()` with MAX_HOPS=3 from CoolSwap SDK
- Port dust amount handling
- Port per-decimal MIN_RESERVE normalization
- All Option A changes

**Pros**
- More robust routing for future tokens
- Better edge-case handling

**Cons / risks**
- Significantly more code changes
- Over-engineering for 3 tokens
- 1-hop is sufficient when USDC is the hub token

**Complexity:** High
**Rollback:** Moderate

---

### Decision

**Chosen option:** A — Fix defaults + limit tokens + create pools
**Justification:** 1-hop routing already covers all 3 token pairs via USDC as hub. 3-hop routing is unnecessary for 3 tokens. Minimal changes = lower risk.
**Accepted tradeoffs:** If more tokens are added later, may need to revisit routing depth.

---

## 7) DELIVERABLES

- [ ] Code changes: `config/goliath.ts`, `useGoliathSwapController.ts`, `useGoliathPairs.ts`
- [ ] Tests: `__tests__/hooks/goliath-swap/` — route finding + token list tests
- [ ] Config changes: Verify `.env.local` or `.env.mainnet` is active
- [ ] On-chain: Mint scripts + pool creation scripts in `wXCN/scripts/`
- [ ] On-chain: USDC/WXCN and USDC/ETH pools with liquidity

---

## 8) TDD: TESTS FIRST

### 8.1 Test Structure

- **Test location:** `__tests__/hooks/goliath-swap/`
- **Run command:** `npm test`
- **Framework:** Vitest / Jest (whatever onyx-new-frontend uses)

### 8.2 Required Tests

**Unit tests**
- [ ] `findBestRoute()` returns direct route for USDC->WXCN with mock pair data
- [ ] `findBestRoute()` returns 2-hop ETH->USDC->WXCN when only USDC/ETH and USDC/WXCN pairs exist
- [ ] `findBestRoute()` returns null when no valid route exists
- [ ] `getAmountOut()` with known reserves matches Uniswap V2 math
- [ ] Token list contains exactly XCN, USDC, ETH

**Integration tests (manual)**
- [ ] Goliath swap page loads with 3 tokens in dropdown
- [ ] Entering amount in USDC shows XCN output
- [ ] Entering amount in ETH shows XCN output (2-hop via USDC)
- [ ] Ethereum swap page unchanged (still shows all Ethereum tokens)

---

## 9) STEP-BY-STEP IMPLEMENTATION PLAN

### Phase 0 — Preflight

1. `cd ~/goliath/onyx-new-frontend && git checkout develop && git pull`
2. `git checkout -b fix/swap`
3. Verify current tests pass: `npm test`

### Phase 1 — Frontend: Fix token addresses and list (tasks 001-003)

See decomposed tasks in `.memory-bank/tasks/2026-03-26-goliath-swap-fix/`

### Phase 2 — On-chain: Mint tokens and create pools (tasks 004-006)

See decomposed tasks.

### Phase 3 — Integration test (task 007)

See decomposed tasks.

### Phase 4 — Commit and merge

1. Ask user to review changes
2. Commit to `fix/swap`
3. Merge to `develop`
4. Push

---

## 10) VERIFICATION CHECKLIST

- [ ] All tests pass
- [ ] Build succeeds
- [ ] No regressions in Ethereum/Onyx swap
- [ ] Goliath swap shows 3 tokens only
- [ ] All 3 swap pairs produce output amounts
- [ ] Pools verified on-chain with expected liquidity
- [ ] Branch merged to develop (NOT main)

---

## 11) IMPLEMENTATION LOG

### Actions Taken

| Time (UTC) | Action | Result | Notes |
|------------|--------|--------|-------|
| | | | |

---

## 12) FOLLOW-UPS

- [ ] Add USD price display for Goliath tokens (currently shows $0.00)
- [ ] Consider porting CoolSwap's dust amount handling for MAX button edge case
- [ ] Add more tokens (BTC, USDT, etc.) when pools are ready
- [ ] Add pool management UI for liquidity providers
