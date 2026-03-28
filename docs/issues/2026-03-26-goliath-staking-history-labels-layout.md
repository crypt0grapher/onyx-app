# Goliath Staking History: Wrong Labels ("common.events.staked") and Narrow Column Layout

**Project:** onyx-new-frontend
**Type:** Code Bug
**Priority:** P1
**Risk level:** Low
**Requires deployment?:** Yes
**Requires network freeze?:** No
**Owner:** Goliath Engineering
**Date created:** 2026-03-26
**Related docs / prior issues:** `docs/issues/2026-03-26-staking-history-empty-hedera-relay-logs.md`, `docs/issues/2026-03-26-history-amounts-zero-double-format.md`

---

## 1) GOAL / SUCCESS CRITERIA

**What "fixed" means:**

Goliath staking events display as **"Liquid Stake"** and **"Liquid Unstake"** across both the staking page history box and the main History page, clearly distinguishing them from Ethereum staking events ("Stake" / "Unstake"). The staking page history table has proper column widths with no text overlap.

**Must-have outcomes**

- [ ] Goliath staking events show "Liquid Stake" / "Liquid Unstake" on the staking page history box (GoliathStakingHistory)
- [ ] Goliath staking events show "Liquid Stake" / "Liquid Unstake" on the History page (HistoryTable via unified history)
- [ ] No raw i18n key like "common.events.staked" is ever displayed
- [ ] Type column on staking page history box is wider — text does not overlap adjacent columns
- [ ] TxnHash and Block columns are pushed right, matching the History page layout style
- [ ] All 4 locale files (en, tr, kr, cn) are updated with new translation keys

**Acceptance criteria (TDD)**

No test framework configured — verify manually:

- [ ] Test A: On staking page, Goliath staking history shows "Liquid Stake" for deposit events, "Liquid Unstake" for withdrawal events
- [ ] Test B: On History page with Goliath network filter, events show "Liquid Stake" / "Liquid Unstake"
- [ ] Test C: Ethereum staking history still shows "Stake" / "Unstake" (no regression)
- [ ] Test D: All 4 locales render correctly (no raw keys shown)
- [ ] Test E: Type column text does not overflow or overlap TxnHash column on the staking page

**Non-goals**

- Changing Ethereum staking event labels
- Changing the History page table column widths (already works well)
- Adding new event icons (reuse existing stake/unstake icons)

---

## 2) ENVIRONMENT

### Project Details

- **Repository path:** `~/goliath/onyx-new-frontend`
- **Language/stack:** Next.js 15, React 19, TypeScript, Tailwind CSS v4, next-intl
- **Entry point:** `app/[locale]/page.tsx` (staking page), `app/[locale]/history/page.tsx`
- **Build command:** `npm run build`
- **Test command:** N/A (no test framework)

---

## 3) CONSTRAINTS

### Code Change Constraints

- [ ] All changes must pass `npm run build`
- [ ] Translation keys must be added to all 4 locales (en, tr, kr, cn)
- [ ] Existing Ethereum staking labels must not change
- [ ] Event icon mapping must still work for the new event types

---

## 4) ISSUE ANALYSIS

### 4.1 Symptoms

1. **Raw i18n key displayed:** On the staking page, the Goliath staking history box shows the raw translation key `"common.events.staked"` instead of a human-readable label. Same for `"common.events.unstaked"`.

2. **No distinction between Goliath and Ethereum staking:** Both types of staking events use the same labels ("Stake" / "Unstake") on the History page, making it impossible for users to distinguish which network a staking event belongs to.

3. **Column overflow:** The Type column on the staking page history box is only 120px wide, causing text to overlap the TxnHash column — especially visible with longer labels.

### 4.2 Impact

- **User impact:** Users see broken translation keys instead of readable labels, and cannot distinguish Goliath staking from Ethereum staking in history views.
- **System impact:** Visual/UX only — no data risk.
- **Scope:** 3 components, 1 hook, 1 adapter, 4 locale files.

### 4.3 Affected Code

| File | Function/Component | Issue |
|------|-------------------|-------|
| `components/goliath-yield/GoliathStakingHistory.tsx:119` | `formatCellData` | `evT(event.type)` where `event.type = "staked"` — key doesn't exist in `common.events` |
| `components/goliath-yield/GoliathStakingHistory.tsx:332` | Mobile render | Same `evT(event.type)` bug |
| `components/goliath-yield/GoliathStakingHistory.tsx:81-106` | `tableHeaders` | Type column `w-[120px]` too narrow |
| `hooks/goliath-yield/useGoliathStakingHistory.ts:44` | query mapper | Maps to `"staked"/"unstaked"` — no matching `common.events` key |
| `hooks/history/adapters/yieldAdapter.ts:40` | `adaptYieldEvents` | Maps to `"stake"/"unstake"` — same as Ethereum staking, no differentiation |
| `components/history/HistoryTable.tsx:175` | `getTypeLabel` | Resolves Goliath staking to "Stake"/"Unstake" — identical to Ethereum |
| `messages/en.json` | `common.events` | Missing keys: `staked`, `unstaked`, `liquidStake`, `liquidUnstake` |

### 4.4 Evidence

**Bug 1 — Translation key mismatch:**

`useGoliathStakingHistory.ts:44` produces:
```typescript
type: ev.type === "Staked" ? "staked" : "unstaked"
```

`GoliathStakingHistory.tsx:119` calls:
```typescript
<span>{evT(event.type)}</span>  // evT("staked") — key doesn't exist!
```

`common.events` namespace only has `"stake"` and `"unstake"` — NOT `"staked"` or `"unstaked"`. next-intl renders the raw key path as fallback.

**Bug 2 — No Goliath/Ethereum distinction:**

`yieldAdapter.ts:40` normalizes Goliath staking to `type: "stake" | "unstake"` — same type values as Ethereum subgraph events. On the History page, both resolve to "Stake" / "Unstake" via `common.events`.

**Bug 3 — Column width:**

GoliathStakingHistory has only 4 columns (Type, TxnHash, Block, Amount) but Type is set to `w-[120px]`, same as the 7-column History page. With fewer columns, there's more available width — the Type column should be wider to accommodate labels like "Liquid Stake" without overlap.

### 4.5 Tasks

- `task-001-add-translation-keys.md` — Add `liquidStake` / `liquidUnstake` to all 4 locale files
- `task-002-update-event-types.md` — Change hook and adapter to use `liquidStake` / `liquidUnstake` type values
- `task-003-update-icon-mapping.md` — Update `getEventIcon()` to handle `LiquidStake` / `LiquidUnstake`
- `task-004-fix-column-layout.md` — Widen Type column and adjust layout in GoliathStakingHistory

### 4.6 Historical Context

**Prior issues searched:** `docs/issues/`, `docs/tasks/`

**Regression from recent changes?**
- No — the `"staked"` vs `"stake"` key mismatch has existed since commit `dab7e48` (Goliath staking page initial design). The label distinction was never implemented.

**Similar prior issues found?**
- `docs/issues/2026-03-26-history-amounts-zero-double-format.md` — related to staking history display, but for amount formatting. Different root cause.

---

## 5) ROOT CAUSE ANALYSIS

### 5.1 Hypothesis

The `useGoliathStakingHistory` hook maps contract event names (`"Staked"` / `"Unstaked"`) to lowercase past-tense forms (`"staked"` / `"unstaked"`), but the `common.events` i18n namespace only contains present-tense keys (`"stake"` / `"unstake"`). Additionally, no distinct type was created for Goliath liquid staking vs Ethereum staking.

### 5.2 Supporting Evidence

- `common.events` keys: `stake`, `unstake` — no `staked` or `unstaked`
- `useGoliathStakingHistory.ts:44`: produces `"staked"` / `"unstaked"`
- `GoliathStakingHistory.tsx:119`: calls `evT("staked")` — key not found
- `yieldAdapter.ts:40`: produces `"stake"` / `"unstake"` — indistinguishable from Ethereum

### 5.3 Gaps / Items to Verify

- None — root cause is clear from code inspection.

### 5.4 Root Cause (final)

- **Root cause:** Key mismatch between hook output (`"staked"/"unstaked"`) and i18n namespace (`"stake"/"unstake"`), plus no distinct event type for Goliath liquid staking.
- **Contributing factors:** No test coverage for translation key resolution. Copy-paste of Ethereum staking types without distinguishing network context.

---

## 6) SOLUTIONS (compare options)

### Option A — New `liquidStake` / `liquidUnstake` event types (end-to-end)

**Changes required**
- `messages/{en,tr,kr,cn}.json`: Add `common.events.liquidStake` = "Liquid Stake", `common.events.liquidUnstake` = "Liquid Unstake" (+ locale-appropriate translations)
- `hooks/goliath-yield/useGoliathStakingHistory.ts:44`: Change type mapping to `"liquidStake"` / `"liquidUnstake"`
- `hooks/history/adapters/yieldAdapter.ts:40`: Change type mapping to `"liquidStake"` / `"liquidUnstake"`
- `types/history.ts`: Add `"liquidStake"` | `"liquidUnstake"` to `HistoryType` union
- `utils/events.ts`: Add `"LiquidStake"` / `"LiquidUnstake"` cases mapping to existing stake/unstake icons
- `components/goliath-yield/GoliathStakingHistory.tsx`: Widen Type column to `w-[180px]`, shrink or adjust other columns

**Pros**
- Single source of truth — type value carries the meaning
- Works automatically in both GoliathStakingHistory and HistoryTable (via unified history)
- Clean, no special-case logic in rendering components
- History page type filter can distinguish Goliath staking events

**Cons / risks**
- More files to touch (6+ files)
- Need to add translations to all 4 locales

**Complexity:** Medium
**Rollback:** Easy — `git revert`

---

### Option B — Component-level label override using `goliathYield.history` namespace

**Changes required**
- `messages/{en,tr,kr,cn}.json`: Change `goliathYield.history.staked` to "Liquid Stake", `goliathYield.history.unstaked` to "Liquid Unstake"
- `GoliathStakingHistory.tsx:119`: Change `evT(event.type)` to use `goliathYield.history` namespace `t(event.type)`
- `HistoryTable.tsx`: Add special case for source="stxcn-events" to use different labels
- Fix column width in GoliathStakingHistory

**Pros**
- Fewer translation changes (keys already exist in `goliathYield.history`)

**Cons / risks**
- Requires special-case logic in HistoryTable to detect Goliath events and override labels
- Doesn't fix the History page type dropdown filter distinction
- Two different label resolution paths for the same concept

**Complexity:** Medium
**Rollback:** Easy

---

### Decision

**Chosen option:** A — New `liquidStake` / `liquidUnstake` event types
**Justification:** Cleaner data model. The type value itself distinguishes Goliath liquid staking from Ethereum staking, so both the staking page and History page automatically render correct labels without special-case rendering logic.
**Accepted tradeoffs:** More files to modify, but each change is small and mechanical.

---

## 7) DELIVERABLES

- [ ] Code changes: `useGoliathStakingHistory.ts`, `yieldAdapter.ts`, `GoliathStakingHistory.tsx`, `utils/events.ts`, `types/history.ts`
- [ ] Translations: `messages/en.json`, `messages/tr.json`, `messages/kr.json`, `messages/cn.json`
- [ ] Config changes: None
- [ ] Documentation: None
- [ ] Deployment: Yes (frontend redeploy)
- [ ] Monitoring/alerts: None

---

## 8) TDD: TESTS FIRST

No test framework configured. Manual verification checklist:

1. Connect wallet on Goliath network
2. Staking page → history box shows "Liquid Stake" / "Liquid Unstake" with proper icon
3. History page → Goliath filter shows "Liquid Stake" / "Liquid Unstake"
4. History page → Ethereum filter still shows "Stake" / "Unstake"
5. Switch locale to tr/kr/cn — labels render correctly
6. Type column text does not overflow on staking page
7. `npm run build` passes with no errors

---

## 9) STEP-BY-STEP IMPLEMENTATION PLAN

### Phase 0 — Preflight

1. `git checkout -b fix/goliath-staking-labels`
2. `npm run build` — confirm clean baseline

### Phase 1 — Add translation keys (all 4 locales)

**Step 1:** Add to `common.events` in `messages/en.json`:
```json
"liquidStake": "Liquid Stake",
"liquidUnstake": "Liquid Unstake"
```

**Step 2:** Add to `common.events` in `messages/tr.json`:
```json
"liquidStake": "Liquid Stake",
"liquidUnstake": "Liquid Unstake"
```

**Step 3:** Add to `common.events` in `messages/kr.json`:
```json
"liquidStake": "리퀴드 스테이킹",
"liquidUnstake": "리퀴드 언스테이킹"
```

**Step 4:** Add to `common.events` in `messages/cn.json`:
```json
"liquidStake": "流动性质押",
"liquidUnstake": "流动性解除质押"
```

**Step 5:** Add to `history.types` in all 4 locales (same values as `common.events` — fallback namespace for HistoryTable).

### Phase 2 — Update data types and mappings

**Step 6:** `types/history.ts` — Add `"liquidStake" | "liquidUnstake"` to the `HistoryType` union.

**Step 7:** `hooks/goliath-yield/useGoliathStakingHistory.ts:44` — Change:
```typescript
type: ev.type === "Staked" ? "liquidStake" : "liquidUnstake",
```

**Step 8:** `hooks/history/adapters/yieldAdapter.ts:40` — Change:
```typescript
type: event.type === "Staked" ? ("liquidStake" as const) : ("liquidUnstake" as const),
```

**Step 9:** `utils/events.ts` — Add cases for `"LiquidStake"` and `"LiquidUnstake"` mapping to existing `stakeIcon` and `withdrawIcon`.

### Phase 3 — Fix column layout in GoliathStakingHistory

**Step 10:** `components/goliath-yield/GoliathStakingHistory.tsx` — Change Type column width from `w-[120px]` to `w-[180px]`, and push TxnHash/Block columns right to match History page spacing.

### Phase 4 — Validate

1. `npm run build` — must succeed
2. `npm run dev` — manual verification per checklist in Section 8

### Phase 5 — Rollback Plan

**Triggers:** Labels display incorrectly or build fails.
**Procedure:** `git revert <commit>`

---

## 10) VERIFICATION CHECKLIST

- [ ] All translations render correctly in en/tr/kr/cn
- [ ] Build succeeds (`npm run build`)
- [ ] Staking page shows "Liquid Stake" / "Liquid Unstake"
- [ ] History page shows "Liquid Stake" / "Liquid Unstake" for Goliath events
- [ ] Ethereum staking still shows "Stake" / "Unstake"
- [ ] No text overlap in staking page history table
- [ ] Event icons render correctly for new types

---

## 11) IMPLEMENTATION LOG

### Actions Taken

| Time (UTC) | Task | Action | Result | Notes |
|------------|------|--------|--------|-------|
| — | task-001 | Added liquidStake/liquidUnstake keys to all 4 locales (common.events + history.types) | PASS | 8 edits across 4 files |
| — | task-003 | Added LiquidStake/LiquidUnstake to EventType union and getEventIcon switch | PASS | Fall-through to existing stake/withdraw icons |
| — | task-002 | Updated GoliathStakingEvent type, useGoliathStakingHistory mapper, yieldAdapter, HistoryType | PASS | 3 files, surgical edits |
| — | task-004 | Widened Type column from w-[120px] to w-[180px] in GoliathStakingHistory | PASS | Single line change |
| — | all | Final build verification (`npm run build`) | PASS | 40 pages generated, no errors |
| — | all | Committed and pushed to develop | PASS | Commit cdc8286 |

### Final State

- **Status:** COMPLETED
- **Tasks completed:** 4 of 4
- **Changes made:** 9 files, 34 insertions, 12 deletions
- **Build passing:** Yes (`npm run build` clean)
- **Deployment status:** Pushed to `develop` branch (commit `cdc8286`)
- **Remaining risks / follow-ups:** Runtime verification needed (connect wallet, check labels visually)

---

## 12) FOLLOW-UPS

- [ ] Consider adding the History page type filter dropdown to include "Liquid Stake" / "Liquid Unstake" as separate filter options
- [ ] Audit other event types that may need Goliath-specific labels (e.g., bridge, swap)
