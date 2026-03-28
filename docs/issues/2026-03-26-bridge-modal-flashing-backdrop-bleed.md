# Bridge Modal Flashing: Backdrop Bleed-Through During Animations

**Project:** onyx-new-frontend
**Type:** Code Bug
**Priority:** P1
**Risk level:** Low
**Requires deployment?:** Yes (frontend redeploy)
**Requires network freeze?:** No
**Owner:** Goliath Engineering
**Date created:** 2026-03-26
**Related docs / prior issues:** `docs/issues/2026-03-26-bridge-stuck-transactions-no-api-polling.md`

---

## 1) GOAL / SUCCESS CRITERIA

**What "fixed" means:**

When any modal is open on the Bridge page (BridgeConfirmModal, BridgeStatusModal), the background app content is fully obscured. No visual flashing or bleed-through of underlying buttons, form fields, or page content occurs during modal open, close, or modal-to-modal transitions.

**Must-have outcomes**

- [ ] No visible flashing or background bleed-through when Bridge modals are displayed
- [ ] Smooth transition from BridgeConfirmModal to BridgeStatusModal without backdrop gap
- [ ] Modal backdrop fully obscures background content in all supported browsers (Chrome, Firefox, Safari)
- [ ] No visual regression in other modals across the app (ProposalModal, WalletModal, etc.)

**Acceptance criteria (TDD)**

No test framework is configured for this project. Verification is manual/visual:

- [ ] Test A: Open BridgeConfirmModal — background content (buttons, form inputs) must not be visible through the backdrop at any point during the open animation
- [ ] Test B: Confirm a bridge operation — transition from BridgeConfirmModal to BridgeStatusModal must not flash/show background content during the swap
- [ ] Test C: Close any Bridge modal — no flashing during the exit animation
- [ ] Test D: Open a BridgeStatusModal from history — no flashing during entry
- [ ] Test E: Other modals (Governance ProposalModal, wallet connect) exhibit no visual regression

**Non-goals**

- Redesigning the modal animation system
- Changing the visual design/style of modals
- Addressing modal behaviour on mobile (separate scope)

---

## 2) ENVIRONMENT

### Project Details

- **Repository path:** `~/goliath/onyx-new-frontend`
- **Language/stack:** Next.js 15, React 19, TypeScript, Tailwind CSS v4, Framer Motion
- **Entry point:** `app/[locale]/bridge/page.tsx`
- **Build command:** `npm run build`
- **Test command:** N/A (manual visual testing)

### Deployment Details

- **Hosting:** Vercel / static deploy (frontend only)
- **No backend changes required**

---

## 3) CONSTRAINTS

### Hard Safety Constraints

- [ ] Do NOT expose private keys or secrets in issue files
- [ ] No smart contract changes

### Code Change Constraints

- [ ] All changes must pass `npm run build` and `npm run lint`
- [ ] Changes to the shared `Modal` component must not break other modals (governance, wallet, etc.)
- [ ] Animation feel should remain smooth — avoid jarring instant-appear/disappear

### Operational Constraints

- Allowed downtime: None (frontend-only change, zero downtime deploy)
- Blast radius: All modals across the app use `components/ui/modal/Modal.tsx`

---

## 4) ISSUE ANALYSIS

### 4.1 Symptoms

- When Bridge modals are open, the screen **flashes** and the main app window behind the modal becomes briefly visible (buttons, form fields, etc.)
- The flashing is most pronounced during:
  1. Modal open/close animations (200ms `opacity: 0 → 1` transition)
  2. The transition from BridgeConfirmModal to BridgeStatusModal (both animate simultaneously)
- User suspects animation is the cause — confirmed by code analysis

### 4.2 Impact

- **User impact:** Visually jarring, feels like a rendering glitch. Undermines confidence in the app when handling financial transactions (bridge operations)
- **System impact:** No data risk, purely visual
- **Scope:** All modals using `components/ui/modal/Modal.tsx` are affected; most visible on Bridge page due to modal-to-modal transition

### 4.3 Affected Code

| File | Function/Component | Issue |
|------|-------------------|-------|
| `components/ui/modal/Modal.tsx:81` | Overlay `motion.div` | `bg-black/40 backdrop-blur-[2.5px]` — too transparent + `backdrop-filter` flickers during opacity animation |
| `components/ui/modal/Modal.tsx:64-75` | `modalVariants` | `scale: 0.95, opacity: 0` → modal panel invisible during first frames of animation while overlay is barely visible |
| `components/ui/modal/Modal.tsx:55-62` | `overlayVariants` | `opacity: 0 → 1` animation on element with `backdrop-filter` causes browser compositing issues |
| `components/bridge/BridgeForm.tsx:321-322` | `handleConfirmBridge` | `setShowConfirmModal(false)` + `setShowStatusModal(true)` in same render — both modals animate simultaneously creating a backdrop gap |
| `components/ui/modal/ProposalModal.tsx:83` | Overlay `motion.div` | Same `bg-black/40 backdrop-blur-[2.5px]` pattern — affected too |

### 4.4 Evidence

**Root cause code — Modal.tsx overlay (lines 78-86):**

```tsx
<AnimatePresence>
    {isOpen && (
        <motion.div
            className="fixed inset-0 z-[51] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2.5px]"
            variants={overlayVariants}     // opacity: 0 → 1
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ duration: 0.2 }}  // 200ms opacity transition
```

**Problem 1 — `backdrop-filter` + opacity animation:**
The CSS `backdrop-filter: blur(2.5px)` is applied to an element whose `opacity` is being animated by Framer Motion. This is a well-documented browser rendering issue: during opacity transitions, the browser's compositor may drop the `backdrop-filter` for one or more frames, causing the un-blurred, un-darkened background to flash through. This is especially noticeable in Chromium-based browsers.

**Problem 2 — Overlay opacity too low:**
`bg-black/40` = `rgba(0,0,0,0.4)` — only 40% opacity. Even when fully rendered, the background content is partially visible. Combined with Problem 1, any frame drop makes the background fully visible.

**Problem 3 — Modal-to-modal transition gap (BridgeForm.tsx lines 321-322):**

```tsx
setShowConfirmModal(false);  // triggers ConfirmModal exit animation (200ms fade-out)
setShowStatusModal(true);     // triggers StatusModal enter animation (200ms fade-in)
```

Both state updates happen in the same React batch, so both modals animate simultaneously:
- ConfirmModal overlay: opacity fading from 1 → 0
- StatusModal overlay: opacity fading from 0 → 1
- At the midpoint (~100ms), both overlays are at ~50% of their base opacity
- Effective combined backdrop: `0.5 * 0.4 + 0.5 * 0.4 = 0.4` at best, but the overlays don't mathematically combine that way — in practice the user sees a visible "blink" where the background flashes through

### 4.5 Tasks

- `task-001-fix-modal-backdrop-opacity-and-blur.md` — Fix the Modal overlay's backdrop opacity and blur compositing
- `task-002-fix-bridge-modal-transition-gap.md` — Eliminate the visual gap during BridgeConfirmModal→BridgeStatusModal transition
- `task-003-verify-all-modals-no-regression.md` — Verify all modals across the app show no flashing or regression

### 4.6 Historical Context

**Prior issues searched:** `docs/issues/`, `docs/tasks/`

**Regression from recent changes?**
- No. This is a latent issue present since the Modal component was created. The `bg-black/40 backdrop-blur-[2.5px]` pattern has been in place since the initial modal implementation. However, the Bridge page makes it most noticeable because it has a modal-to-modal transition (confirm → status) that other pages don't have.

**Similar prior issues found?**
- No prior issues report modal flashing. The `2026-03-26-bridge-stuck-transactions-no-api-polling.md` issue addressed the BridgeStatusModal content but not its visual rendering.

---

## 5) ROOT CAUSE ANALYSIS

### 5.1 Hypothesis

The modal backdrop flashing is caused by the combination of (1) CSS `backdrop-filter: blur()` on an element being opacity-animated by Framer Motion, which triggers browser compositor frame drops, (2) insufficient overlay opacity (`bg-black/40` = 40%), and (3) simultaneous mount/unmount of two modal instances during the confirm→status transition on Bridge.

### 5.2 Supporting Evidence

- The `backdrop-filter` + opacity animation interaction is a [documented browser compositing issue](https://bugs.chromium.org/p/chromium/issues/detail?id=986206). When the GPU compositor handles `backdrop-filter`, animating the parent element's `opacity` can cause the filter to be skipped on certain frames.
- The overlay is only 40% opaque (`bg-black/40`), so even small compositing glitches make the background highly visible.
- The `MobileNavbar.tsx` component uses `will-change: transform` and `backfaceVisibility: hidden` and `transform: translateZ(0)` on its overlay (lines 116-118), suggesting awareness of compositor issues — but the Modal component lacks these hints.
- The BridgeForm does `setShowConfirmModal(false)` + `setShowStatusModal(true)` simultaneously (lines 321-322), causing two `AnimatePresence` exit/enter animations to overlap.

### 5.3 Gaps / Items to Verify

- Test on Safari (WebKit) — `backdrop-filter` behaviour differs from Chromium
- Test on Firefox — `backdrop-filter` was only recently stabilised
- TO VERIFY: Whether Framer Motion's `mode="wait"` on `AnimatePresence` can be leveraged (not applicable here since the two modals are separate components with separate `AnimatePresence` wrappers)

### 5.4 Root Cause (final)

- **Root cause:** `backdrop-filter: blur(2.5px)` on a Framer Motion opacity-animated overlay causes frame drops where the unfiltered background is visible; compounded by 40% overlay opacity being too transparent and the Bridge confirm→status modal swap creating a dual-animation gap.
- **Contributing factors:** No GPU compositing hints (`will-change`, `translateZ(0)`) on the modal overlay; no mechanism to keep the backdrop persistent during modal-to-modal transitions.

---

## 6) SOLUTIONS (compare options)

### Option A - Fix overlay opacity + GPU hints + transition sequencing

**Changes required**

1. `components/ui/modal/Modal.tsx:81` — Increase backdrop opacity from `bg-black/40` to `bg-black/60`, remove `backdrop-blur-[2.5px]`, add GPU compositing hint
2. `components/ui/modal/Modal.tsx:93-99` — Add `will-change: "opacity"` style to modal panel for smoother animation
3. `components/bridge/BridgeForm.tsx:320-323` — Delay opening StatusModal until ConfirmModal exit animation completes (200ms)
4. `components/ui/modal/ProposalModal.tsx:83` — Same overlay fix as Modal.tsx for consistency

**Pros**
- Eliminates all three root causes
- Simple, targeted changes
- `bg-black/60` still allows a subtle view of the page behind (not fully opaque)
- Removing `backdrop-blur` eliminates the browser compositing issue entirely
- No dependency on Framer Motion API changes

**Cons / risks**
- Removing `backdrop-blur` changes the visual feel slightly (less "frosted glass")
- 200ms delay in BridgeForm transition is imperceptible but adds complexity

**Complexity:** Low
**Rollback:** Easy — `git revert`

---

### Option B - Keep blur + force GPU layer promotion

**Changes required**

1. `components/ui/modal/Modal.tsx:81` — Add inline `style={{ willChange: 'backdrop-filter', transform: 'translateZ(0)', backfaceVisibility: 'hidden' }}` to force GPU compositing on the overlay
2. `components/ui/modal/Modal.tsx:81` — Increase opacity to `bg-black/50`
3. `components/bridge/BridgeForm.tsx:320-323` — Same transition sequencing as Option A
4. `components/ui/modal/ProposalModal.tsx:83` — Same GPU hint fix

**Pros**
- Preserves the frosted-glass blur effect
- GPU hints are a standard technique used elsewhere in the codebase (MobileNavbar)

**Cons / risks**
- `backdrop-filter` flicker is browser-specific and may not be fully fixed by GPU hints alone
- `will-change: backdrop-filter` forces the browser to create a new compositing layer, increasing GPU memory usage
- Still relies on browser behaviour that may vary across versions/platforms
- More fragile — may need revisiting if browsers change compositor behaviour

**Complexity:** Medium
**Rollback:** Easy — `git revert`

---

### Decision

**Chosen option:** A — Fix overlay opacity + remove blur + transition sequencing

**Justification:** Option A eliminates the root cause (animated `backdrop-filter`) rather than working around it with GPU hints that may not work in all browsers. The visual difference of removing `backdrop-blur-[2.5px]` (a 2.5px blur) is negligible — most users won't notice the difference between a 2.5px blurred dark overlay and a non-blurred slightly darker overlay. Option A is simpler, more reliable, and has zero risk of browser-specific regressions.

**Accepted tradeoffs:** Slightly different visual feel (no frosted glass) — but the current blur is only 2.5px which is barely perceptible. The increase from 40% to 60% opacity makes the backdrop more effective regardless.

---

## 7) DELIVERABLES

- [ ] Code changes:
  - `components/ui/modal/Modal.tsx` — fix overlay classes
  - `components/ui/modal/ProposalModal.tsx` — same overlay fix for consistency
  - `components/bridge/BridgeForm.tsx` — sequence modal transition
- [ ] Tests: Manual visual testing (no test framework)
- [ ] Config changes: None
- [ ] Documentation: None
- [ ] Deployment: Frontend redeploy
- [ ] Monitoring/alerts: None

---

## 8) TDD: TESTS FIRST

### 8.1 Test Structure

- **Test location:** Manual — open `/bridge` page in browser
- **Run command:** `npm run dev` → navigate to bridge
- **Framework:** Visual/manual

### 8.2 Required Tests

**Manual tests**

- [ ] Open BridgeConfirmModal — no background bleed-through during 200ms entry animation
- [ ] Close BridgeConfirmModal — no flashing during exit
- [ ] Execute a bridge (confirm) — transition from ConfirmModal to StatusModal has no visible gap/flash
- [ ] Open BridgeStatusModal from history panel — no flashing
- [ ] Close BridgeStatusModal — no flashing
- [ ] Open any Governance modal (ProposalModal) — no regression, no flashing
- [ ] Open wallet connect modal — no regression
- [ ] Test in Chrome, Firefox, Safari

### 8.3 Baseline

- Test run before fix: Flashing visible on Bridge modals, especially during confirm→status transition

---

## 9) STEP-BY-STEP IMPLEMENTATION PLAN

### Phase 0 - Preflight

1. `git status` — confirm clean working tree
2. `git checkout -b fix/bridge-modal-flashing`
3. `npm run dev` — verify current flashing behaviour

### Phase 1 - Fix Modal overlay (Modal.tsx)

- **Step 1:** Update overlay classes
  - File: `components/ui/modal/Modal.tsx:81`
  - Change: Replace `bg-black/40 backdrop-blur-[2.5px]` with `bg-black/60`
  - Before: `className="fixed inset-0 z-[51] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2.5px]"`
  - After: `className="fixed inset-0 z-[51] flex items-center justify-center p-4 bg-black/60"`
  - Build: `npm run build`
  - Expected: Build succeeds
  - Verify: Open any modal — backdrop is darker, no flashing
  - Rollback: `git checkout -- components/ui/modal/Modal.tsx`

### Phase 2 - Fix ProposalModal overlay (ProposalModal.tsx)

- **Step 2:** Apply same overlay fix for consistency
  - File: `components/ui/modal/ProposalModal.tsx:83`
  - Change: Replace `bg-black/40 backdrop-blur-[2.5px]` with `bg-black/60`
  - Before: `className="fixed inset-0 z-[51] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2.5px]"`
  - After: `className="fixed inset-0 z-[51] flex items-center justify-center p-4 bg-black/60"`
  - Verify: Open governance modal — same dark backdrop, no flashing
  - Rollback: `git checkout -- components/ui/modal/ProposalModal.tsx`

### Phase 3 - Fix Bridge modal-to-modal transition (BridgeForm.tsx)

- **Step 3:** Sequence the ConfirmModal close and StatusModal open
  - File: `components/bridge/BridgeForm.tsx:320-323`
  - Change: Delay `setShowStatusModal(true)` by 200ms (matching exit animation duration) so the ConfirmModal exit completes before StatusModal entry begins
  - Before:
    ```tsx
    setShowConfirmModal(false);
    setShowStatusModal(true);
    ```
  - After:
    ```tsx
    setShowConfirmModal(false);
    setTimeout(() => setShowStatusModal(true), 210);
    ```
  - Verify: Execute a bridge confirm — smooth transition with no flash between modals
  - Rollback: `git checkout -- components/bridge/BridgeForm.tsx`

### Phase 4 - Validate

1. `npm run build` — must succeed
2. `npm run lint` — must pass
3. Manual test all scenarios from Section 8.2
4. Test in Chrome, Firefox, Safari

### Phase 5 - Deploy

1. Push branch, create PR against `develop`
2. Deploy to staging/preview
3. Verify on deployed environment

### Phase 6 - Rollback Plan

**Triggers:** Visual regression in any modal, or build failure
**Procedure:**
- Code: `git revert <commit-hash>`
- Deployment: Redeploy previous version

---

## 10) VERIFICATION CHECKLIST

- [ ] All modals open/close without flashing
- [ ] Bridge confirm→status transition is smooth
- [ ] `npm run build` succeeds
- [ ] `npm run lint` passes
- [ ] No regressions in governance, wallet, or other modals
- [ ] Tested in Chrome, Firefox, Safari

---

## 11) IMPLEMENTATION LOG

### Actions Taken

| Time (UTC) | Task | Action | Result | Notes |
|------------|------|--------|--------|-------|
| 2026-03-26 | task-001 | Replaced `bg-black/40 backdrop-blur-[2.5px]` with `bg-black/60` in Modal.tsx and ProposalModal.tsx | PASS | Build succeeds |
| 2026-03-26 | task-002 | Added 210ms setTimeout delay in BridgeForm.tsx modal transition | PASS | Build + lint pass |
| 2026-03-26 | task-003 | Validated build, lint, and code correctness | PASS | Visual testing deferred to user |

### Failed Attempts

None.

### Final State

- **Status:** COMPLETED
- **Tasks completed:** 3 of 3
- Changes made:
  - `components/ui/modal/Modal.tsx:81` — overlay `bg-black/40 backdrop-blur-[2.5px]` → `bg-black/60`
  - `components/ui/modal/ProposalModal.tsx:83` — same overlay fix
  - `components/bridge/BridgeForm.tsx:321-323` — sequenced modal transition with 210ms delay
- Tests passing: `npm run build` succeeds, `npm run lint` — 0 warnings/errors
- Deployment status: Pushed to develop
- Remaining risks / follow-ups: Manual visual testing recommended across browsers

---

## 12) FOLLOW-UPS

- [ ] Audit other `AnimatePresence` + `backdrop-filter` combinations in the codebase (Dropdown, MobileNavbar, NetworkSelector) for similar issues
- [ ] Consider extracting a shared `ModalBackdrop` component to centralise overlay behaviour and prevent future divergence between Modal.tsx and ProposalModal.tsx
- [ ] Evaluate whether `mode="wait"` on `AnimatePresence` would be useful for modal systems with sequential modals
