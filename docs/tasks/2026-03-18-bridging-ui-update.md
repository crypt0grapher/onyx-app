# Bridging UI Update — Slingshot-Style Redesign

**Project:** onyx-new-frontend
**Type:** Feature
**Priority:** P1
**Risk level:** Low
**Requires deployment?:** No (frontend-only)
**Requires network freeze?:** N/A
**Owner:** Goliath Engineering
**Date created:** 2026-03-18
**Related docs / prior issues:** CoolSwap-Interface bridge reference (`~/goliath/CoolSwap-Interface/src/components/bridge/`)
**Branch:** `feat/bridging-ui-update` (from `develop`)

---

## 1) GOAL / SUCCESS CRITERIA

**What "done" means:**

The Bridge page in onyx-new-frontend is visually upgraded to match the Slingshot/CoolSwap bridging experience — with a "You receive" output section, animated token selector (reusing the Switcher sliding-box pattern from Staking), and overall more polished, fancy interactions.

**Must-have outcomes**

- [ ] Animated token selector using sliding-box pattern (like Staking's Stake/Withdraw toggle)
- [ ] "You receive" output section showing estimated received amount after fees
- [ ] Enhanced direction swap button with rotation animation on hover
- [ ] Summary section (fee, ETA, recipient) styled like CoolSwap's BridgeSummary
- [ ] Smoother overall transitions and micro-animations
- [ ] All existing bridge functionality preserved (direction toggle, token select, amount input, validation, fee quotes, modals)
- [ ] i18n translations updated for new UI strings

**Acceptance criteria (TDD)**

No test framework configured. Manual verification:

- [ ] Token selector sliding box animates smoothly between ETH/USDC/XCN
- [ ] "You receive" section shows correct output amount (input - fee for withdrawals, same as input for deposits)
- [ ] Direction swap button rotates 180° on hover
- [ ] All validation still works (insufficient balance, below minimum, wrong network)
- [ ] Fee quotes still load and display correctly
- [ ] Confirmation modal still opens with correct data
- [ ] Page renders correctly on mobile and desktop
- [ ] `npm run build` passes without errors
- [ ] `npm run lint` passes

**Non-goals**

- No changes to bridge execution logic (still placeholder)
- No changes to bridge API/hooks
- No changes to BridgeConfirmModal or BridgeStatusModal internals
- No new contract interactions

---

## 2) ENVIRONMENT

### Project Details

- **Repository path:** `~/goliath/onyx-new-frontend`
- **Language/stack:** Next.js 15, React 19, TypeScript, Tailwind CSS v4, Framer Motion
- **Entry point:** `app/[locale]/bridge/page.tsx`
- **Build command:** `npm run build`
- **Lint command:** `npm run lint`

### Key Files

| File | Role |
|------|------|
| `app/[locale]/bridge/page.tsx` | Bridge page entry |
| `components/bridge/BridgeForm.tsx` | Main form component (primary changes) |
| `components/bridge/BridgeTokenSelector.tsx` | Token selector (rewrite to use Switcher pattern) |
| `components/ui/buttons/Switcher.tsx` | Reference: animated sliding-box toggle |
| `messages/en.json` | i18n strings |

### Reference Files (CoolSwap)

| File | What to reference |
|------|-------------------|
| `CoolSwap-Interface/src/pages/Bridge/BridgeForm.tsx` | OutputContainer layout with "You receive" |
| `CoolSwap-Interface/src/pages/Bridge/styleds.tsx` | OutputContainer, OutputAmount, OutputLabel styling |
| `CoolSwap-Interface/src/components/bridge/BridgeSummary.tsx` | Fee + receive + ETA summary panel |
| `CoolSwap-Interface/src/components/bridge/DirectionSwapButton.tsx` | 180° rotation hover animation |

---

## 3) CONSTRAINTS

### Code Change Constraints

- [ ] All changes must pass `npm run build` and `npm run lint`
- [ ] Preserve all existing bridge functionality
- [ ] Use existing design tokens from `globals.css` (bg-bg-primary, text-primary, etc.)
- [ ] Use Tailwind CSS classes (not styled-components — that's CoolSwap's approach)
- [ ] Reuse the Switcher component's sliding-box animation pattern (CSS transitions, not Framer Motion)
- [ ] Update i18n translations for en, tr, kr, cn locales

### Operational Constraints

- Blast radius: Bridge page UI only, no other pages affected
- No backend/API changes

---

## 4) TASK ANALYSIS

### 4.1 Symptoms

Not a bug — this is a feature/design enhancement request. The current bridge UI is functional but:
- Token selector uses plain buttons without animated selection indicator
- No "You receive" output section showing what user gets after fees
- Direction swap button has basic scale animation, lacks the polished rotation effect
- Fee/info section is plain text rows, not a cohesive summary panel

### 4.2 Impact

- **User impact:** Better UX, more confidence in bridge operations, clearer fee/output visibility
- **System impact:** None — purely cosmetic/UX
- **Scope:** Bridge page components only

### 4.3 Affected Code

| File | Function/Component | Change |
|------|-------------------|--------|
| `components/bridge/BridgeTokenSelector.tsx` | Full component | Rewrite with sliding-box animation (Switcher pattern) |
| `components/bridge/BridgeForm.tsx` | Full component | Add "You receive" section, refactor layout, add summary panel |
| `components/bridge/index.ts` | Exports | Add new component exports if needed |
| `messages/en.json` | bridge section | Add youReceive, recipient, summary labels |
| `messages/tr.json` | bridge section | Add Turkish translations |
| `messages/kr.json` | bridge section | Add Korean translations |
| `messages/cn.json` | bridge section | Add Chinese translations |

### 4.4 Evidence

**Current BridgeTokenSelector** — plain buttons with border/bg state toggle:
```tsx
// components/bridge/BridgeTokenSelector.tsx:43-55
<button className={[
    "flex items-center gap-2 px-4 py-[10px] rounded-full",
    "transition-all duration-200 cursor-pointer",
    isActive
        ? "bg-[#1B1B1B] border border-[#292929] text-[#E6E6E6]"
        : "bg-transparent border border-transparent text-[#808080]",
].join(" ")}>
```

**Switcher sliding-box pattern** — animated background that slides:
```tsx
// components/ui/buttons/Switcher.tsx:77-85
<div className="absolute ... rounded-full ... transition-all duration-300 ease-out"
    style={{
        width: `${slidingBg.width}px`,
        transform: `translateX(${slidingBg.left}px)`,
    }}
/>
```

**CoolSwap "You receive" section:**
```tsx
// CoolSwap-Interface/src/pages/Bridge/BridgeForm.tsx:158-166
<OutputContainer>
    <OutputLabel>{t('youWillReceiveBridge')}</OutputLabel>
    <OutputAmount>
        {outputAmount || '0'} {selectedToken}
    </OutputAmount>
    <OutputBalance>
        {t('balanceLabel')} {destinationBalance} {selectedToken}
    </OutputBalance>
</OutputContainer>
```

### 4.5 Tasks

- `task-001-animated-token-selector.md` — Rewrite BridgeTokenSelector with Switcher sliding-box animation
- `task-002-you-receive-section.md` — Add "You receive" output display section
- `task-003-direction-swap-animation.md` — Enhance direction swap button with rotation animation
- `task-004-summary-panel.md` — Create cohesive summary panel (fee, ETA, recipient)
- `task-005-i18n-translations.md` — Add i18n translations for new UI strings
- `task-006-polish-and-integrate.md` — Final integration, layout polish, build verification

### 4.6 Historical Context

**Prior issues searched:** `docs/issues/`, `docs/tasks/`, `.memory-bank/`

**Regression from recent changes?**
- No — this is a new feature request.

**Similar prior issues found?**
- `docs/tasks/2026-03-18-staking-ui-update.md` — Related staking UI overhaul. The Switcher component created for that task is the exact animation pattern we'll reuse here.

---

## 5) ROOT CAUSE ANALYSIS

N/A — Feature enhancement, not a bug fix.

---

## 6) SOLUTIONS (compare options)

### Option A — Extend Existing Switcher Component

Modify `BridgeTokenSelector` to use the existing `Switcher` component from `components/ui/buttons/Switcher.tsx`, passing 3 items instead of 2.

**Changes required**
- `components/ui/buttons/Switcher.tsx` — Generalize from `[SwitcherItem, SwitcherItem]` to `SwitcherItem[]` (support 3+ items)
- `components/bridge/BridgeTokenSelector.tsx` — Replace custom buttons with `<Switcher items={tokens} />`
- `components/bridge/BridgeForm.tsx` — Add "You receive" section and summary panel

**Pros**
- Reuses existing, proven animation code
- Consistent animation behavior across Staking and Bridge pages
- Less new code to write and maintain

**Cons / risks**
- Switcher currently typed for exactly 2 items — needs generalization
- Token icons in Switcher may need different sizing than Staking icons

**Complexity:** Low
**Rollback:** Easy — `git revert`

---

### Option B — Build Custom Animated Token Selector

Create a new `AnimatedTokenSelector` component with its own sliding-box implementation, tailored specifically for the 3-token bridge use case.

**Changes required**
- New `components/bridge/AnimatedTokenSelector.tsx`
- `components/bridge/BridgeForm.tsx` — Integration

**Pros**
- Fully customizable for bridge-specific needs
- No risk of breaking Staking's Switcher

**Cons / risks**
- Duplicates animation logic
- More code to maintain
- Inconsistency between Staking and Bridge animations

**Complexity:** Medium
**Rollback:** Easy

---

### Decision

**Chosen option:** A — Extend Existing Switcher Component
**Justification:** Reuses proven animation code, ensures UI consistency, and minimizes new code. Generalizing Switcher from 2 to N items is a small, safe change.
**Accepted tradeoffs:** Need to update Switcher type from `[SwitcherItem, SwitcherItem]` to `SwitcherItem[]` — this is backwards compatible since arrays of 2 items still satisfy `SwitcherItem[]`.

---

## 7) DELIVERABLES

- [ ] Code changes: `Switcher.tsx`, `BridgeTokenSelector.tsx`, `BridgeForm.tsx`
- [ ] i18n: `messages/en.json`, `messages/tr.json`, `messages/kr.json`, `messages/cn.json`
- [ ] No new tests (no test framework configured)
- [ ] Build verification: `npm run build` and `npm run lint` pass

---

## 8) TDD: TESTS FIRST

No test framework configured. Manual verification checklist serves as acceptance criteria (see Section 1).

---

## 9) STEP-BY-STEP IMPLEMENTATION PLAN

### Phase 0 - Preflight

1. `git checkout -b feat/bridging-ui-update` from `develop`
2. `npm run build` — verify clean baseline

### Phase 1 - Generalize Switcher (task-001)

1. Update `Switcher.tsx` type from `[SwitcherItem, SwitcherItem]` to `SwitcherItem[]`
2. Verify Staking page still works with 2-item Switcher

### Phase 2 - Animated Token Selector (task-001)

1. Rewrite `BridgeTokenSelector.tsx` to use `<Switcher>` with token items
2. Map token icons to `SwitcherItem` format
3. Verify sliding animation works with 3 items

### Phase 3 - "You Receive" Section (task-002)

1. Add `receiveAmount` computed value to `BridgeForm.tsx`
2. Add output container below the direction swap / "To" network section
3. Style with large amount display (28px font), label, and destination balance

### Phase 4 - Direction Swap Animation (task-003)

1. Add CSS `hover:rotate-180` and `transition-transform duration-300` to swap button
2. Replace up/down arrow SVG with a bidirectional arrow icon

### Phase 5 - Summary Panel (task-004)

1. Refactor fee/ETA rows into a cohesive summary panel with bg-[#0F0F0F] background
2. Add "You receive" row, recipient row, fee row, ETA row
3. Add loading spinner for fee fetching

### Phase 6 - i18n (task-005)

1. Add translation keys: `bridge.form.youReceive`, `bridge.form.recipient`, `bridge.summary.*`
2. Update all 4 locale files

### Phase 7 - Polish & Integration (task-006)

1. Full layout pass — spacing, alignment, responsive behavior
2. `npm run build` — verify
3. `npm run lint` — verify
4. Manual testing on desktop and mobile viewports

### Phase 8 - Rollback Plan

**Triggers:** Build failure, visual regression on other pages
**Procedure:** `git checkout develop` — all changes are on feature branch

---

## 10) VERIFICATION CHECKLIST

- [ ] `npm run build` passes
- [ ] `npm run lint` passes
- [ ] Token selector animates with sliding box between 3 tokens
- [ ] "You receive" shows correct output amount
- [ ] Direction swap button rotates on hover
- [ ] Summary panel shows fee, ETA, receive amount
- [ ] All existing validation works
- [ ] Staking page Switcher not broken by generalization
- [ ] Mobile responsive layout correct
- [ ] All 4 locales have new translation keys

---

## 11) IMPLEMENTATION LOG

### Actions Taken

| Task | Pipeline Stage | Result | Notes |
|------|---------------|--------|-------|
| task-001 | Developer + Validator + Simplifier | PASS | Switcher generalized to `SwitcherItem[]`, BridgeTokenSelector rewritten to use Switcher. Also updated `InteractivePanel.tsx` type for consistency. (Note: these changes were already on develop from staking UI task) |
| task-002 | Developer + Validator + Simplifier | PASS | Added `receiveAmount` useMemo and "You receive" output box with 24px font, loading skeleton. Fixed `??` / `||` operator precedence issue. (Note: already on develop) |
| task-003 | Developer + Validator + Simplifier | PASS | Swap button: `hover:rotate-180`, `transition-transform duration-300 ease-out`, `my-[-6px]` overlap, glow shadow. (Note: already on develop) |
| task-004 | Developer + Validator + Simplifier | PASS | Replaced plain fee/ETA rows with cohesive summary panel (bg-[#0F0F0F], rounded-[12px]). Added Fee (green for free), ETA, Recipient rows. Removed redundant Dividers. Cleaned up feeDisplay memo. (Note: already on develop) |
| task-005 | Developer + Validator + Simplifier | PASS | Added 6 i18n keys to all 4 locales (youReceive, recipient, connectWallet, youSend, feeFree, destinationBalance). Replaced 3 hardcoded strings in BridgeForm.tsx. (Note: partially on develop, new keys added) |
| task-006 | Developer + Validator + Simplifier | PASS | Final polish: replaced last hardcoded "~5 min" with `t("form.estimatedArrivalValue")`. Added estimatedArrivalValue key to all 4 locales. Verified layout, build, lint all clean. |

### Progress Tracker

- **Last completed task:** task-006-polish-and-integrate
- **Failed tasks:** None
- **Skipped tasks:** None
- **Blocking issues:** None

### Final Summary

- **Status:** COMPLETED
- **Tasks completed:** 6 of 6
- **Changes on this branch (vs develop):** `BridgeForm.tsx` (i18n for ETA value), `messages/{en,tr,kr,cn}.json` (added `estimatedArrivalValue` key)
- **Note:** Most UI changes (tasks 001-005) were already committed on develop from the prior staking UI redesign task. This branch adds the final i18n polish.
- **Build:** `npm run build` — PASS (36 static pages)
- **Lint:** `npm run lint` — PASS (0 warnings/errors)
- **Follow-ups needed:** See Section 12

---

## 12) FOLLOW-UPS

- [ ] Add Framer Motion entrance animation for the "You receive" section (fade-in on amount change)
- [ ] Consider adding token price USD display in "You receive" section
- [ ] Review BridgeConfirmModal to match updated design language
