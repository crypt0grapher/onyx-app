# MetaMask Prompts To Add Goliath Twice And Stays On Ethereum

**Project:** onyx-new-frontend
**Type:** Integration
**Priority:** P1
**Risk level:** High
**Requires deployment?:** Yes
**Requires network freeze?:** N/A
**Owner:** Goliath Engineering
**Date created:** 2026-03-25
**Related docs / prior issues:** `d2bc81d` ("Fix chain switch: remove redundant wallet_switchEthereumChain after add"), `5f410ce` ("Fix Goliath network switch failing when chain already exists in wallet"), `.memory-bank/tasks/port-goliath-coolswap/task-002-wagmi-config-extension.md`, `.memory-bank/tasks/port-goliath-coolswap/task-006-wallet-selector-three-networks.md`

---

## 1) GOAL / SUCCESS CRITERIA

**What "fixed" means:**

Switching to chain `327 / 0x147` from any frontend entry point prompts MetaMask at most once to add Goliath when the chain is actually missing, never re-adds an already-known chain just because its label differs, and leaves the wallet connected to Goliath instead of Ethereum after a successful flow.

**Must-have outcomes**

- [ ] Clicking "Connect to Goliath" from the staking page does not trigger two `wallet_addEthereumChain` prompts.
- [ ] A wallet that already has chain `327` stored as `Goliath Mainnet` switches by chain ID without being blocked by the app's `Goliath Network` label.
- [ ] The same switch behavior is used by the staking banner, floating network dropdown, and wallet modal selector.

**Acceptance criteria (TDD)**

Tests that must pass after the fix and are expected to fail before:

- [ ] Test A: `useSwitchNetwork` does not issue a second direct `wallet_addEthereumChain` after `wagmiSwitchChain` has already attempted the add flow.
- [ ] Test B: `switchToChain` completes on Goliath when add succeeds but the wallet does not auto-select the new chain immediately.
- [ ] Test C: switching to an already-installed chain `327` succeeds even when wallet metadata says `Goliath Mainnet` and app metadata says `Goliath Network`.

**Non-goals**

- Changing Goliath chain ID, RPC infrastructure, or contract addresses
- Deploying contracts or changing blockchain state
- Refactoring unrelated wallet connection UI outside the network-switch path

---

## 2) ENVIRONMENT

### Project Details

- **Repository path:** `~/goliath/onyx-new-frontend`
- **Language/stack:** TypeScript, Next.js 15, React 19, wagmi, viem
- **Entry point:** `app/[locale]/page.tsx` with related switch entry points in `components/ui/FloatingNetworkDropdown.tsx` and `components/sidebar/WalletInfoModalContent.tsx`
- **Build command:** `npm run build`
- **Test command:** `npm test`

### Deployment Details (if applicable)

- **Kubernetes namespace:** N/A
- **Deployment name:** N/A
- **Docker image:** N/A
- **RPC endpoints:** `https://rpc.goliath.net`, `https://ethereum-rpc.publicnode.com`
- **Contract addresses:** N/A for this issue

### Network Context (if relevant)

- Chain ID: `327 / 0x147`
- Network: Goliath mainnet
- User-reported wallet label: `Goliath Mainnet`
- App-configured add-chain label: `Goliath Network`

---

## 3) CONSTRAINTS

### Hard Safety Constraints

- [ ] Do NOT delete `.pces` files (consensus loss risk)
- [ ] Do NOT flush iptables on remote servers
- [ ] Do NOT expose private keys or secrets in issue files
- [ ] Do NOT modify consensus-affecting config via rolling restart without freeze

### Code Change Constraints

- [ ] All changes must pass existing tests
- [ ] New functionality must include tests
- [ ] Smart contract changes require careful review of upgrade path
- [ ] Breaking API changes must be documented

### Operational Constraints

- Allowed downtime: limited to a normal frontend deployment
- Blast radius: wallet switching for Ethereum, Onyx, and Goliath across staking page, dropdown, and wallet modal

---

## 4) ISSUE ANALYSIS

### 4.1 Symptoms

- Clicking the Goliath switch CTA causes MetaMask to try adding the Goliath network twice.
- After the prompts resolve, the wallet can remain connected to Ethereum instead of switching to Goliath.
- The wallet already contains chain `327`, but it is labeled `Goliath Mainnet` while the app submits `Goliath Network`.

### 4.2 Impact

- **User impact:** users cannot reliably enter the Goliath staking flow and may get stuck on Ethereum after approving wallet prompts.
- **System impact:** core wallet onboarding to Goliath is unreliable, which blocks staking and any Goliath-only actions.
- **Scope:** shared network switch logic in hook/helper code plus Goliath network metadata in config.

### 4.3 Affected Code

| File | Function/Component | Issue |
|------|-------------------|-------|
| `hooks/wallet/useSwitchNetwork.ts` | `switchNetwork` | Calls `wagmiSwitchChain`, then unconditionally falls back to direct `wallet_addEthereumChain`, creating a second add attempt |
| `lib/wallet/chain.ts` | `switchToChain` | Assumes add-and-switch semantics that are not guaranteed and never performs a delayed final switch retry after a successful add |
| `config/networks.ts` | `networkToChainConfig` | Emits `chainName: "Goliath Network"` while user wallets may already store chain `327` as `Goliath Mainnet` |
| `app/[locale]/page.tsx` | `GoliathStakePage` | Main user-facing entry point that invokes the regressed hook |
| `components/ui/FloatingNetworkDropdown.tsx` | `handleSelect` | Secondary entry point using the same regressed hook |
| `components/sidebar/WalletInfoModalContent.tsx` | `handleNetworkSelect` | Uses the separate direct helper path, so switch semantics are already divergent across UI entry points |

### 4.4 Evidence

- `hooks/wallet/useSwitchNetwork.ts:39-75` calls `wagmiSwitchChain(wagmiConfig, { chainId })` and, on any thrown error, immediately issues a direct `wallet_addEthereumChain`.
- `node_modules/@wagmi/connectors/src/baseAccount.ts:223-260` shows wagmi already performs `wallet_switchEthereumChain` and then `wallet_addEthereumChain` internally when it sees `4902`.
- This means one UI click can reach two different add-chain attempts: the first inside wagmi, the second in app code.
- `lib/wallet/chain.ts:152-229` treats a successful add as if the wallet should already be on the target chain, but only polls `eth_chainId` and never performs a delayed final switch retry if the wallet remains on Ethereum.
- EIP-3085 says a successful add request must not be assumed to automatically select the new chain, so the current helper logic is stricter than the standard allows.
- `config/networks.ts:71-114` defines Goliath as `Goliath Network`; `__tests__/config/networks.test.ts:66-70` locks that string in tests, while the user already has the same chain ID stored as `Goliath Mainnet`.
- Historical search results:
  - `rg -n "wallet_addEthereumChain|wallet_switchEthereumChain|MetaMask|Goliath Mainnet|Goliath Network|4902" docs/issues docs/tasks .memory-bank`
  - Found design-task references in `.memory-bank/tasks/port-goliath-coolswap/task-002-wagmi-config-extension.md` and `task-006-wallet-selector-three-networks.md`, but no prior issue document describing this regression.
- Baseline validation:
  - `npm test` passed with `18` files and `340` tests, but coverage is limited to config metadata and does not exercise `hooks/wallet/useSwitchNetwork.ts` or `lib/wallet/chain.ts`.
  - `npm run build` passed, with existing MetaMask SDK warnings about missing `@react-native-async-storage/async-storage`.

### 4.5 Tasks

Task files generated for implementation:

- `.memory-bank/tasks/2026-03-25-goliath-metamask-double-add-no-switch/task-001-add-network-switch-regression-tests.md`
- `.memory-bank/tasks/2026-03-25-goliath-metamask-double-add-no-switch/task-002-unify-chain-switch-logic.md`
- `.memory-bank/tasks/2026-03-25-goliath-metamask-double-add-no-switch/task-003-align-goliath-network-metadata.md`
- `.memory-bank/tasks/2026-03-25-goliath-metamask-double-add-no-switch/task-004-validate-metamask-switch-flow.md`

### 4.6 Historical Correlation (required)

- **Recent-change regression likely?:** Yes
- **Suspected introducing change:** `d2bc81d` on 2026-03-25
- **Key change detail:** the hook was changed from a single custom switch helper to a wagmi-first flow plus a catch-all direct `wallet_addEthereumChain` fallback, which duplicates add-chain behavior and hides the actual failure mode.
- **Fix strategy for that change:** patch forward in `hooks/wallet/useSwitchNetwork.ts`, `lib/wallet/chain.ts`, `config/networks.ts`, and new regression tests.
- **Similar prior issue/task found?:** Yes, partially
- **Prior solution summary:** `5f410ce` tried to handle "chain already exists with different params" by retrying a plain switch after add failures. Task docs also expected separate add and switch semantics for Goliath.
- **Applicability now:** Partial. The earlier fix addressed a real edge case, but `d2bc81d` replaced that path with overlapping wagmi/manual add logic and reintroduced a different regression.

---

## 5) ROOT CAUSE ANALYSIS

### 5.1 Hypothesis

The current frontend runs two overlapping add-chain strategies and also assumes a successful add implies an active switch, so MetaMask can be asked to add chain `327` twice and still leave the wallet on Ethereum.

### 5.2 Supporting Evidence

- `useSwitchNetwork` catches all wagmi switch errors and performs a second direct `wallet_addEthereumChain`.
- Wagmi's connector already performs `wallet_addEthereumChain` on `4902`, so the app duplicates that step.
- The helper comment in `lib/wallet/chain.ts` states that add both registers and switches, but the standard does not guarantee that.
- The wallet label mismatch (`Goliath Mainnet` vs `Goliath Network`) is metadata drift around the same chain ID, which should be handled by switching on `chainId`, not by attempting to re-add the chain repeatedly.
- There are no regression tests for `hooks/wallet/useSwitchNetwork.ts` or `lib/wallet/chain.ts`.

### 5.3 Gaps / Items to Verify

- Exact provider error returned from wagmi's first add/switch sequence in the user environment
- Whether aligning the chain label to `Goliath Mainnet` removes a secondary MetaMask metadata prompt in addition to the logic fix
- TO VERIFY: in browser devtools, instrument `window.ethereum.request`, reproduce from `/en`, and confirm the current build emits `wallet_switchEthereumChain` -> `wallet_addEthereumChain` -> app-level `wallet_addEthereumChain`
- TO VERIFY: after implementing the fix, repeat the same instrumentation and confirm the flow emits at most one add request and ends on `eth_chainId === 0x147`

### 5.4 Root Cause (final)

- **Root cause:** `hooks/wallet/useSwitchNetwork.ts` duplicates wagmi's internal add-chain logic, while `lib/wallet/chain.ts` still relies on add-as-switch behavior that MetaMask is not required to provide.
- **Contributing factors:** broad catch-all fallback, divergent switch implementations across UI entry points, metadata drift in the configured Goliath chain name, and missing wallet-switch regression tests.

---

## 6) SOLUTIONS (compare options)

### Option A - Single spec-correct switch helper for all UI entry points

**Changes required**

- `hooks/wallet/useSwitchNetwork.ts` - replace the wagmi-plus-manual-add overlap with a single helper call or a single shared decision tree
- `lib/wallet/chain.ts` - switch first, add only on recognized missing-chain errors, then verify `eth_chainId`; if still wrong, retry `wallet_switchEthereumChain` once after a short delay
- `components/sidebar/WalletInfoModalContent.tsx` - use the same shared switch path as the banner and dropdown
- `config/networks.ts` - align the Goliath display/add label with deployed mainnet naming
- `__tests__/hooks/wallet/useSwitchNetwork.test.ts` and `__tests__/lib/wallet/chain.test.ts` - add regression coverage

**Pros**

- Removes duplicate add prompts by design
- Gives one deterministic RPC sequence across all switch entry points
- Fixes both reported symptoms: double add and staying on Ethereum
- Easier to maintain and test

**Cons / risks**

- Shared wallet behavior changes for all supported chains, so regression tests are mandatory
- Requires mocking EIP-1193 provider behavior carefully in Vitest

**Complexity:** Medium
**Rollback:** Easy

---

### Option B - Keep wagmi as primary path, but restrict fallback to verification/switch only

**Changes required**

- `hooks/wallet/useSwitchNetwork.ts` - keep `wagmiSwitchChain`, but remove the manual direct add fallback; if post-switch verification fails, perform only a delayed `wallet_switchEthereumChain`
- `lib/wallet/chain.ts` - patch the wallet modal helper separately so add does not imply switch
- `config/networks.ts` - optionally align `Goliath Mainnet` naming to reduce wallet metadata drift

**Pros**

- Smaller change to the current hook
- Preserves wagmi-managed connector state where it already works

**Cons / risks**

- Leaves two switch implementations in the codebase
- Still depends on wagmi error behavior, which is less explicit than a local helper
- Easier for future regressions to reintroduce divergent wallet semantics

**Complexity:** Medium
**Rollback:** Moderate

---

### Decision

**Chosen option:** Option A
**Justification:** the regression exists because two implementations now overlap. A single spec-correct helper removes the duplicate add path outright, gives consistent behavior across all UI entry points, and is easier to lock down with tests.
**Accepted tradeoffs:** shared wallet logic is touched for all supported chains, so the implementation must be test-first and include targeted manual verification against MetaMask.

---

## 7) DELIVERABLES

- [ ] Code changes: `hooks/wallet/useSwitchNetwork.ts`, `lib/wallet/chain.ts`, `components/sidebar/WalletInfoModalContent.tsx`, `config/networks.ts`
- [ ] Tests: `__tests__/hooks/wallet/useSwitchNetwork.test.ts`, `__tests__/lib/wallet/chain.test.ts`, updates to `__tests__/config/networks.test.ts`
- [ ] Config changes: Goliath display/add chain metadata if label alignment is accepted
- [ ] Documentation: this issue file and follow-up implementation notes
- [ ] Deployment: frontend deployment after validation
- [ ] Monitoring/alerts: manual post-deploy wallet verification across Goliath entry points

---

## 8) TDD: TESTS FIRST

### 8.1 Test Structure

- **Test location:** `__tests__/hooks/wallet/useSwitchNetwork.test.ts`, `__tests__/lib/wallet/chain.test.ts`, `__tests__/config/networks.test.ts`
- **Run command:** `npx vitest run __tests__/hooks/wallet/useSwitchNetwork.test.ts __tests__/lib/wallet/chain.test.ts __tests__/config/networks.test.ts`
- **Framework:** Vitest

### 8.2 Required Tests

**Unit tests**

- [ ] `useSwitchNetwork` issues at most one `wallet_addEthereumChain` for a missing Goliath chain
- [ ] `useSwitchNetwork` does not direct-add again after wagmi throws a user rejection or internal add error
- [ ] `switchToChain` retries or completes a final switch when add succeeds but `eth_chainId` is still `0x1`
- [ ] `switchToChain` handles an already-present chain `327` whose metadata differs from app defaults

**Integration tests (if applicable)**

- [ ] Goliath staking page and floating dropdown both call the same shared switch path
- [ ] Wallet modal uses the same switch semantics as the other entry points

**E2E tests (if applicable)**

- [ ] Manual MetaMask verification on a wallet that already contains chain `327` labeled `Goliath Mainnet`

**Contract tests (if smart contract)**

- [ ] N/A

### 8.3 Baseline

- Test run before fix: `npm test` passed (`18` files, `340` tests)
- Build before fix: `npm run build` passed, with pre-existing MetaMask SDK warnings unrelated to this bug
- Coverage gap before fix: no tests target `hooks/wallet/useSwitchNetwork.ts` or `lib/wallet/chain.ts`

---

## 9) STEP-BY-STEP IMPLEMENTATION PLAN

### Phase 0 - Preflight

1. Record current state.
   - Command: `git status --short`
   - Expected: clean tree or only intentional edits
   - Failure modes: unrelated local changes in wallet/network files
   - Rollback: none
2. Create a working branch.
   - Command: `git checkout -b codex/fix-goliath-metamask-double-add`
   - Expected: branch created and checked out
   - Failure modes: branch already exists, or working tree is not safe to branch from
   - Rollback: `git checkout develop && git branch -D codex/fix-goliath-metamask-double-add` if no commits were made

### Phase 1 - Backup / Safety (if any risk)

1. No persistent data or chain state changes are required.
   - Command: N/A
   - Expected: frontend-only patch
   - Failure modes: none
   - Rollback: N/A

### Phase 2 - Write Tests First

- **Step 1:** Add hook regression tests
  - File: `__tests__/hooks/wallet/useSwitchNetwork.test.ts`
  - Code: mock `@wagmi/core` and `window.ethereum.request`; assert a missing-chain flow produces one add request max and no duplicate add after wagmi failure
  - Run: `npx vitest run __tests__/hooks/wallet/useSwitchNetwork.test.ts`
  - Expected: FAIL before fix
  - Failure modes: incorrect EIP-1193 mocks, jsdom setup gaps
  - Rollback: `git checkout -- __tests__/hooks/wallet/useSwitchNetwork.test.ts`

- **Step 2:** Add shared-helper regression tests
  - File: `__tests__/lib/wallet/chain.test.ts`
  - Code: simulate `wallet_switchEthereumChain` errors, successful add with delayed chain update, and pre-existing chain metadata mismatch
  - Run: `npx vitest run __tests__/lib/wallet/chain.test.ts`
  - Expected: FAIL before fix
  - Failure modes: timer handling or provider sequencing bugs in mocks
  - Rollback: `git checkout -- __tests__/lib/wallet/chain.test.ts`

- **Step 3:** Update metadata tests if chain label is aligned
  - File: `__tests__/config/networks.test.ts`
  - Code: assert the expected Goliath display/add label
  - Run: `npx vitest run __tests__/config/networks.test.ts`
  - Expected: FAIL before fix if the expected label changes
  - Failure modes: stale string assertions in other tests
  - Rollback: `git checkout -- __tests__/config/networks.test.ts`

### Phase 3 - Implement the Fix

- **Step 4:** Remove the duplicate add-chain path from the hook
  - File: `hooks/wallet/useSwitchNetwork.ts`
  - Change: replace `wagmiSwitchChain(...)` plus direct add fallback with a single shared switch path, or ensure the fallback never calls `wallet_addEthereumChain` after wagmi already did
  - Build: `npx vitest run __tests__/hooks/wallet/useSwitchNetwork.test.ts`
  - Expected: no second add request in the mocked flow
  - Verify: provider call log contains one add request maximum
  - Rollback: `git checkout -- hooks/wallet/useSwitchNetwork.ts`

- **Step 5:** Make the shared helper spec-correct after add
  - File: `lib/wallet/chain.ts`
  - Change: only add on missing-chain errors; after add, verify `eth_chainId`; if still wrong, wait briefly and retry `wallet_switchEthereumChain` once before surfacing failure
  - Build: `npx vitest run __tests__/lib/wallet/chain.test.ts`
  - Expected: delayed-switch scenario ends on `0x147`
  - Verify: helper returns `success: true` when the wallet eventually switches
  - Rollback: `git checkout -- lib/wallet/chain.ts`

- **Step 6:** Align Goliath chain metadata and callers
  - File: `config/networks.ts`, `components/sidebar/WalletInfoModalContent.tsx`, related copy/tests if needed
  - Change: align the configured Goliath label with mainnet naming and ensure all UI entry points use the same shared switch semantics
  - Build: `npx vitest run __tests__/config/networks.test.ts __tests__/hooks/wallet/useSwitchNetwork.test.ts`
  - Expected: metadata assertions and switch-path assertions pass together
  - Verify: chain name shown in UI/add flow is consistent with expected mainnet labeling
  - Rollback: `git checkout -- config/networks.ts components/sidebar/WalletInfoModalContent.tsx __tests__/config/networks.test.ts`

### Phase 4 - Validate

1. Run the full test suite.
   - Command: `npm test`
   - Expected: existing `340` tests plus new wallet tests pass
   - Failure modes: shared-chain regressions for Ethereum or Onyx
   - Rollback: revert the failing patch and re-run targeted tests
2. Build the project.
   - Command: `npm run build`
   - Expected: build succeeds; known MetaMask SDK warnings may remain unless separately fixed
   - Failure modes: SSR/type issues from new mocks or imports
   - Rollback: revert the offending changes and rebuild
3. Manual MetaMask verification.
   - Command: `npm run dev`
   - Expected: switching from `/en` to Goliath triggers one prompt max and ends on chain `327`
   - Failure modes: extension cache, stale chain metadata, or connector-specific behavior
   - Rollback: do not deploy; revert or patch forward locally

### Phase 5 - Deploy (if applicable)

1. Deploy the frontend through the normal release path.
   - Command: use the repository's standard frontend deploy process
   - Expected: updated build available to users
   - Failure modes: stale assets, environment drift, or deployment pipeline errors
   - Rollback: redeploy the previous working frontend artifact
2. Post-deploy verification.
   - Command: manually verify `/en`, wallet modal network selector, and floating dropdown with MetaMask
   - Expected: all three entry points switch to Goliath reliably
   - Failure modes: one entry point still uses old logic
   - Rollback: rollback frontend deployment and reopen issue

### Phase 6 - Rollback Plan

**Triggers:** duplicate MetaMask add prompts persist, wallet remains on Ethereum after switch approval, or Ethereum/Onyx switching regresses

**Procedure:**

- Code: revert the wallet-switch patch commit or `git checkout` affected files before merge
- Deployment: redeploy the previous frontend version
- Contract: N/A

---

## 10) VERIFICATION CHECKLIST

- [ ] All tests pass
- [ ] Build succeeds
- [ ] No regressions in existing functionality
- [ ] Code review completed (or self-reviewed)
- [ ] Deployed and verified (if applicable)
- [ ] Monitoring shows healthy state (if applicable)

---

## 11) IMPLEMENTATION LOG

### Actions Taken

| Time (UTC) | Action | Result | Notes |
|------------|--------|--------|-------|
| 2026-03-25 15:40 | Searched repo for wallet switch/add paths | Completed | Found active logic in `hooks/wallet/useSwitchNetwork.ts` and `lib/wallet/chain.ts` |
| 2026-03-25 15:44 | Reviewed recent git history for affected files | Completed | `5f410ce` and `d2bc81d` are the key recent changes |
| 2026-03-25 15:49 | Ran `npm test` | Passed | `18` files, `340` tests; no wallet-switch regression coverage |
| 2026-03-25 15:50 | Ran `npm run build` | Passed with warnings | Existing MetaMask SDK warning about missing `@react-native-async-storage/async-storage` |
| 2026-03-25 15:51 | Created report-only issue + task breakdown | Completed | No application code changed in this turn |

### Failed Attempts

- Attempt 1: `5f410ce` patched the earlier "chain exists with different params" case by retrying a plain switch after add failure
  - Why it failed: it fixed one edge case but did not prevent later divergence between switch implementations
  - What we learned: the project needs one authoritative switch flow, not multiple overlapping ones
- Attempt 2: `d2bc81d` removed the immediate redundant switch after add
  - Why it failed: the hook now relies on wagmi plus a second manual add fallback, and the helper still assumes add implies selection
  - What we learned: removing the immediate switch was directionally correct, but the new overlap introduced a new duplicate-add regression

### Final State

- Changes made (diff summary): report-only; no source files modified
- Tests passing: baseline suite passes before the fix
- Deployment status: not deployed
- Remaining risks / follow-ups: issue persists until wallet-switch logic is unified and regression tests are added

---

## 12) FOLLOW-UPS

- [ ] Add regression tests for wallet switch/add flows before further wallet UX changes
- [ ] Align Goliath naming across config, copy, and wallet prompts
- [ ] Audit Ethereum and Onyx switch flows for the same duplicated fallback pattern
- [ ] Evaluate whether the existing MetaMask SDK build warning should be cleaned up in a separate issue
