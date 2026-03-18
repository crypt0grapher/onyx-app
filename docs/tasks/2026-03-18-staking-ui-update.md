# Goliath Staking Page UI Redesign

**Project:** onyx-new-frontend
**Type:** Feature
**Priority:** P1
**Risk level:** Low
**Requires deployment?:** Yes
**Requires network freeze?:** No
**Owner:** Goliath Engineering
**Date created:** 2026-03-18
**Related docs / prior issues:** None

---

## 1) GOAL / SUCCESS CRITERIA

**What "done" means:**

The Goliath staking page (`GoliathStakePage` at `app/[locale]/page.tsx`) is redesigned to match the polish and structure of the Ethereum staking page, with added visual flair: protocol stats as top data boxes, a "Staking History" section with user staking transactions, and a hero background section featuring the Onyx logo (similar to the Swap page's `OnyxBackground` usage).

**Must-have outcomes**

- [ ] Top row of protocol metric data boxes (APR, Fee, Total stXCN Supply, Contract Balance) replacing the simple list-style `GoliathProtocolStats`
- [ ] Staking History section with user staking transaction history table (stake/unstake events) for Goliath network
- [ ] Hero/background visual element with Onyx logo behind the staking panel (like `OnyxBackground` on Swap page)
- [ ] Consistent design language with Ethereum staking page (same DataBox, Divider, section heading patterns)
- [ ] Fully responsive (mobile card layout, tablet grid, desktop two-column)
- [ ] All existing staking functionality preserved (stake/unstake XCN, protocol stats data, APR calculation)

**Acceptance criteria (TDD)**

No test framework is configured; acceptance is verified by:

- [ ] `npm run build` succeeds with zero TypeScript errors
- [ ] `npm run lint` passes
- [ ] Visual review: top data boxes render with correct protocol values from `useGoliathYieldData`
- [ ] Visual review: staking history table shows user's stake/unstake events
- [ ] Visual review: Onyx logo background is visible behind the staking action panel
- [ ] Visual review: responsive layout works at mobile (<768px), tablet (768-1024px), and desktop (>1024px)
- [ ] Switching between Ethereum and Goliath chains correctly renders the appropriate staking page variant

**Non-goals**

- Changing the Ethereum staking page design
- Modifying smart contract interactions or staking logic
- Adding new data points not already available via `useGoliathYieldData`
- Changing i18n for other locales (only English translations needed initially)

---

## 2) ENVIRONMENT

### Project Details

- **Repository path:** `~/goliath/onyx-new-frontend`
- **Language/stack:** Next.js 15, React 19, TypeScript, Tailwind CSS v4, wagmi v2, viem
- **Entry point:** `app/[locale]/page.tsx`
- **Build command:** `npm run build`
- **Test command:** N/A (no test framework configured)
- **Lint command:** `npm run lint`

### Network Context

- **Goliath Network** (chain ID from `config/networks.ts` — dynamically resolved)
- stXCN contract address from `config/goliath.ts`
- Protocol data via `useGoliathYieldData()` hook (multicall to stXCN contract)

---

## 3) CONSTRAINTS

### Code Change Constraints

- [ ] All changes must pass `npm run build` and `npm run lint`
- [ ] Reuse existing shared components (`DataBox`, `DataBoxesSection`, `StakingHistoryTable`, `OnyxBackground`, `InteractivePanel`, `StatsDisplay`, `Divider`) wherever possible
- [ ] Maintain the existing `useStakeVariant()` routing logic (`stxcn-goliath` → `GoliathStakePage`)
- [ ] Do not modify Ethereum staking page components
- [ ] Follow existing design tokens from `globals.css` (`--color-bg-boxes`, `--color-primary`, etc.)
- [ ] Use `next-intl` for all user-facing strings

### Operational Constraints

- Allowed downtime: None (frontend only, no on-chain changes)
- Blast radius: Goliath staking page only

---

## 4) TASK ANALYSIS

### 4.1 Current State

The Goliath staking page currently has:
- A simple two-column layout with `GoliathYieldPanel` (stake/unstake form) and `GoliathProtocolStats` (simple list of stats)
- No top data boxes (unlike Ethereum staking page which has 5 `DataBox` cards)
- No staking history section (unlike Ethereum staking page which has `StakingHistoryTable`)
- No decorative background element (unlike Swap page which has `OnyxBackground`)
- Overall feels minimal and "bare" compared to the Ethereum staking page

### 4.2 Design Reference: Ethereum Staking Page Structure

```
┌─────────────────────────────────────────────────────────┐
│  [DataBox: APR] [DataBox: Emission] [DataBox: Staked]  │
│  [DataBox: Treasury] [DataBox: Points APR]              │
├─────────────────────────────────────────────────────────┤
│  ┌──── Left Column ────┐ ┌──── Right Column ────┐      │
│  │ "Staking & Yield"   │ │ "Staked Tokens"       │     │
│  │ StakeActionPanel    │ │ StakeStats + Graph    │      │
│  └─────────────────────┘ └───────────────────────┘      │
├─────────────────────────────────────────────────────────┤
│  "Staking History"                                      │
│  StakingHistoryTable                                    │
└─────────────────────────────────────────────────────────┘
```

### 4.3 Target Design: New Goliath Staking Page

```
┌─────────────────────────────────────────────────────────┐
│  [DataBox: APR] [DataBox: Fee] [DataBox: Total stXCN]  │
│  [DataBox: Contract Balance]                            │
├─────────────────────────────────────────────────────────┤
│  ┌──── Left Column ────┐ ┌──── Right Column ────┐      │
│  │ "Goliath Staking"   │ │ "Your Position"       │     │
│  │ GoliathYieldPanel   │ │ GoliathUserStats      │      │
│  │ (with OnyxBackground│ │ (stXCN balance,       │      │
│  │  behind it)         │ │  underlying, graph)   │      │
│  └─────────────────────┘ └───────────────────────┘      │
├─────────────────────────────────────────────────────────┤
│  "Staking History"                                      │
│  GoliathStakingHistoryTable                             │
└─────────────────────────────────────────────────────────┘
```

### 4.4 Affected Code

| File | Component | Change |
|------|-----------|--------|
| `app/[locale]/page.tsx` | `GoliathStakePage` | Restructure layout to match Ethereum staking page pattern |
| `components/goliath-yield/GoliathDataBoxes.tsx` | NEW | Top protocol metric cards using `DataBox` pattern |
| `components/goliath-yield/GoliathUserStats.tsx` | NEW | Right column: user position stats + optional graph |
| `components/goliath-yield/GoliathStakingHistory.tsx` | NEW | Staking history table for Goliath network events |
| `hooks/goliath-yield/useGoliathStakingHistory.ts` | NEW | Hook to fetch stake/unstake events from Goliath |
| `messages/en.json` | `goliathYield` section | Add new translation keys for data boxes, history, user stats |
| `components/goliath-yield/GoliathProtocolStats.tsx` | EXISTING | May be simplified/removed once data boxes replace it |

### 4.5 Tasks

- `task-001-goliath-data-boxes.md` — Create top protocol metric data boxes
- `task-002-goliath-user-stats.md` — Create right-column user position stats panel
- `task-003-goliath-staking-history.md` — Create staking history section with table
- `task-004-page-layout-redesign.md` — Restructure GoliathStakePage layout with OnyxBackground
- `task-005-translations.md` — Add i18n translation keys for new UI elements

### 4.6 Historical Context

**Prior issues searched:** No `docs/issues/` or `.memory-bank/` found for this project.

**Regression from recent changes?** No — this is a new feature/redesign.

**Similar prior issues found?** No — first time this redesign is being done.

---

## 5) ROOT CAUSE ANALYSIS

N/A — this is a feature request, not a bug.

**Summary:** The Goliath staking page was implemented as a minimal MVP with basic functionality. The Ethereum staking page serves as the design reference for how it should look. The gap is purely visual/UX — all data hooks and contract interactions already exist.

---

## 6) SOLUTIONS (compare options)

### Option A — Extend existing components with Goliath-specific wrappers

Create new Goliath-specific components (`GoliathDataBoxes`, `GoliathUserStats`, `GoliathStakingHistory`) that wrap the same shared UI primitives used by the Ethereum staking page (`DataBox`, `StatsDisplay`, `StakingHistoryTable` pattern). Restructure the `GoliathStakePage` layout.

**Pros**
- Reuses proven UI patterns (DataBox, InteractivePanel, table components)
- Consistent look & feel with Ethereum staking page
- Lower risk of regressions since shared components are well-tested in production
- Clean separation — Goliath components remain independent

**Cons / risks**
- Some shared components may need minor adaptations (e.g., DataBox types)
- Need to create a staking history hook for Goliath events

**Complexity:** Medium
**Rollback:** Easy (`git revert`)

---

### Option B — Refactor GoliathProtocolStats inline with layout changes

Modify `GoliathProtocolStats` to render as data boxes directly, modify the page layout inline, and add history as a standalone section without creating separate component files.

**Pros**
- Fewer files to create
- Faster initial implementation

**Cons / risks**
- Mixes concerns — protocol stats component would handle both box layout and stat display
- Harder to maintain and test
- Less aligned with the Ethereum staking page architecture

**Complexity:** Low
**Rollback:** Easy

---

### Decision

**Chosen option:** A — Extend existing components with Goliath-specific wrappers

**Justification:** This matches the established pattern in the codebase (Ethereum staking page architecture), provides clean component separation, and makes future maintenance easier. The additional files are justified by the clarity they bring.

**Accepted tradeoffs:** Slightly more files, but better architecture alignment.

---

## 7) DELIVERABLES

- [ ] Code changes:
  - `components/goliath-yield/GoliathDataBoxes.tsx` — NEW
  - `components/goliath-yield/GoliathUserStats.tsx` — NEW
  - `components/goliath-yield/GoliathStakingHistory.tsx` — NEW
  - `hooks/goliath-yield/useGoliathStakingHistory.ts` — NEW (or adapt existing subgraph hook)
  - `app/[locale]/page.tsx` — MODIFY `GoliathStakePage`
  - `messages/en.json` — MODIFY (add goliathYield translations)
  - `components/goliath-yield/index.ts` — MODIFY (add exports)
- [ ] Translations: English (`messages/en.json`)
- [ ] No deployment changes needed (frontend only)

---

## 8) STEP-BY-STEP IMPLEMENTATION PLAN

### Phase 0 - Preflight

1. Branch: `feat/staking-ui-update` (already created)
2. Verify build: `npm run build`
3. Verify lint: `npm run lint`

### Phase 1 - Translations (task-005)

Add all new i18n keys to `messages/en.json` under the `goliathYield` section.

### Phase 2 - Protocol Data Boxes (task-001)

Create `GoliathDataBoxes.tsx` that renders a row of `DataBox` cards showing:
- APR (from `useGoliathYieldData().apr`)
- Fee (from `protocolData.feePercentBps`)
- Total stXCN Supply (from `protocolData.totalSupply`)
- Contract Balance (from `protocolData.contractBalance`)

### Phase 3 - User Position Stats (task-002)

Create `GoliathUserStats.tsx` showing:
- User's stXCN balance
- Underlying XCN value
- APR info
Using the `StatsDisplay` or a similar layout to the Ethereum `StakeStats`.

### Phase 4 - Staking History (task-003)

Create `GoliathStakingHistory.tsx` with a hook (`useGoliathStakingHistory`) to fetch user's stake/unstake events. Follow the same table pattern as `StakingHistoryTable`.

### Phase 5 - Page Layout Redesign (task-004)

Restructure `GoliathStakePage` in `app/[locale]/page.tsx`:
1. Add `GoliathDataBoxes` at top
2. Keep `GoliathYieldPanel` in left column with `OnyxBackground` behind it
3. Add `GoliathUserStats` in right column
4. Add `GoliathStakingHistory` section below with divider

### Phase 6 - Validate

1. `npm run build` — must succeed
2. `npm run lint` — must pass
3. Visual review at all breakpoints

---

## 9) VERIFICATION CHECKLIST

- [ ] `npm run build` succeeds
- [ ] `npm run lint` passes
- [ ] DataBox cards show correct protocol values
- [ ] User stats show correct balances when wallet connected
- [ ] Staking history table populates with events
- [ ] OnyxBackground renders behind staking panel
- [ ] Mobile layout is responsive and usable
- [ ] Ethereum staking page is unaffected
- [ ] Chain switching correctly routes to appropriate page variant

---

## 10) IMPLEMENTATION LOG

### Actions Taken

| Time (UTC) | Task | Action | Result | Notes |
|------------|------|--------|--------|-------|
| — | task-005 | Added i18n translation keys | PASS | Added dataBoxes, userStats, history sections to en.json |
| — | task-001 | Created GoliathDataBoxes component | PASS | 4 DataBox cards, reuses existing DataBox component |
| — | task-002 | Created GoliathUserStats component | PASS | Card with stXCN balance, underlying XCN, APR |
| — | task-003 | Created GoliathStakingHistory + hook | PASS | Table + hook using contract events via getContractEvents |
| — | task-004 | Restructured GoliathStakePage layout | PASS | Added data boxes, OnyxBackground, history section |
| — | ALL | npm run build | PASS | 36/36 pages generated |
| — | ALL | npm run lint | PASS | Zero warnings or errors |

### Final State

- **Status:** COMPLETED
- **Tasks completed:** 5 of 5
- Changes made:
  - `messages/en.json` — added goliathYield.dataBoxes, userStats, history translations
  - `components/goliath-yield/GoliathDataBoxes.tsx` — NEW (protocol metric cards)
  - `components/goliath-yield/GoliathUserStats.tsx` — NEW (user position panel)
  - `components/goliath-yield/GoliathStakingHistory.tsx` — NEW (history table)
  - `hooks/goliath-yield/useGoliathStakingHistory.ts` — NEW (event fetching hook)
  - `components/goliath-yield/index.ts` — updated barrel exports
  - `hooks/goliath-yield/index.ts` — updated barrel exports
  - `app/[locale]/page.tsx` — restructured GoliathStakePage layout
- Tests passing: N/A (no test framework)
- Build: PASS (npm run build succeeds)
- Lint: PASS (npm run lint passes)
- Deployment status: Not yet deployed

---

## 11) FOLLOW-UPS

- [ ] Add translations for other locales (tr, kr, cn)
- [ ] Add staking graph visualization for Goliath (similar to `StakingGraph` for Ethereum)
- [ ] Consider adding Points APR data box if Goliath points system is implemented
- [ ] Performance optimization: lazy-load staking history section
