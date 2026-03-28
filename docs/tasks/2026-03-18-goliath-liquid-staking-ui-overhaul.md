# Goliath Liquid Staking UI Overhaul

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

The staking section is rebranded to "Goliath Liquid Staking", a floating network switcher is available on all pages, and the migration flow is simplified to a single "Migrate" button with an animated progress status bar — all with Slingshot-inspired visual polish.

**Must-have outcomes**

- [ ] All "Staking" / "Stake" labels in navigation and Goliath staking page renamed to "Goliath Liquid Staking"
- [ ] Floating network dropdown in top-right corner to toggle Goliath / Ethereum / Onyx
- [ ] Migration flow uses single "Migrate" button — no separate Approve / Unstake / Bridge buttons
- [ ] Animated green-dot progress bar: (1) Approval · · · (2) Unstake · · · (3) Bridge
- [ ] Polished, Slingshot-inspired UI for migration page

**Acceptance criteria (TDD)**

No test framework configured; validation via `npm run build` + visual inspection:

- [ ] Build succeeds with zero errors
- [ ] All translation keys resolve in en/tr/kr/cn
- [ ] Network switching triggers wagmi chain switch
- [ ] Migration auto-advances through steps on wallet signatures
- [ ] Progress bar animates correctly through each step

**Non-goals**

- No changes to the Ethereum legacy staking page
- No smart contract changes
- No changes to bridge backend/API

---

## 2) ENVIRONMENT

### Project Details

- **Repository path:** `~/goliath/onyx-new-frontend`
- **Language/stack:** Next.js 15, React 19, TypeScript, Tailwind CSS v4, wagmi v2, Framer Motion
- **Entry point:** `app/[locale]/layout.tsx`
- **Build command:** `npm run build`
- **Test command:** N/A (no test framework configured)

---

## 3) CONSTRAINTS

### Code Change Constraints

- [ ] All changes must pass `npm run build`
- [ ] Do NOT modify Ethereum staking variant labels
- [ ] Do NOT change smart contract interactions — only UI/UX layer
- [ ] Translation keys must be consistent across all 4 locales
- [ ] Maintain accessibility (ARIA roles, keyboard navigation)

### Operational Constraints

- Allowed downtime: None (frontend-only changes)
- Blast radius: UI-only — no backend or contract changes

---

## 4) TASK ANALYSIS

### 4.1 Symptoms

- Navigation shows generic "Stake" instead of branded "Goliath Liquid Staking"
- No global network switcher — users must use sidebar wallet modal
- Migration flow exposes internal steps (Approve, Unstake, Bridge) as separate actions — confusing UX
- Migration page UI is functional but lacks visual polish

### 4.2 Impact

- **User impact:** Confusing multi-step migration, inconsistent branding, no easy network switching
- **System impact:** None — purely UI/UX improvements
- **Scope:** Frontend components, hooks, translations, layout

### 4.3 Affected Code

| File | Function/Component | Issue |
|------|-------------------|-------|
| `config/navigation.ts` | navItems | Labels say "Stake" |
| `messages/*.json` | sidebar.navigation, goliathYield.title | Translation keys use "Stake"/"Goliath Staking" |
| `components/migrate/MigrationStepper.tsx` | MigrationStepper | Per-step action buttons need removal |
| `hooks/migration/useMigrationFlow.ts` | useMigrationFlow | Needs auto-advance orchestration |
| `app/[locale]/migrate/page.tsx` | Migrate | Needs single-button UX + progress bar |
| `app/[locale]/layout.tsx` | LocaleLayout | Needs floating network dropdown |

### 4.5 Tasks

| # | File | Description | Blockers |
|---|------|-------------|----------|
| 001 | `task-001-rename-staking-labels.md` | Rename "Staking"/"Stake" to "Goliath Liquid Staking" | None |
| 002 | `task-002-floating-network-dropdown.md` | Add floating top-right network selector | None |
| 003 | `task-003-migration-single-button-flow.md` | Replace step buttons with single "Migrate" button + orchestrator hook | None |
| 004 | `task-004-migration-progress-status-bar.md` | Animated green-dot progress bar | task-003 |
| 005 | `task-005-migration-ui-refinement.md` | Slingshot-inspired UI polish for migration page | task-003, task-004 |

### 4.6 Historical Context

**Prior issues searched:** No prior issues or tasks found.
**Regression from recent changes?** No — this is new feature work.

---

## 5) ROOT CAUSE ANALYSIS

N/A — this is a feature/UX enhancement, not a bug fix.

---

## 6) SOLUTIONS

### Option A — Incremental enhancement (Chosen)

Modify existing components in-place, add new components as needed. Keep existing hook architecture, add orchestrator layer on top.

**Changes required:**
- `config/navigation.ts` — update labels
- `messages/*.json` — update translations
- New: `components/ui/FloatingNetworkDropdown.tsx`
- New: `hooks/migration/useMigrationOrchestrator.ts`
- New: `components/migrate/MigrationProgressBar.tsx`
- Modified: `components/migrate/MigrationStepper.tsx` — remove buttons
- Modified: `app/[locale]/migrate/page.tsx` — new layout
- Modified: `app/[locale]/layout.tsx` — add floating dropdown

**Pros:** Minimal risk, builds on existing code, each task independently deployable
**Cons:** None significant

**Complexity:** Medium
**Rollback:** Easy — git revert

### Decision

**Chosen option:** A — Incremental enhancement
**Justification:** Low risk, builds on existing well-structured codebase
**Accepted tradeoffs:** None

---

## 7) DELIVERABLES

- [ ] Code changes: 5 task files covering labels, network dropdown, migration flow, progress bar, UI polish
- [ ] Tests: Visual verification (no test framework)
- [ ] Config changes: Navigation labels, translation files
- [ ] Documentation: None needed
- [ ] Deployment: Standard frontend deployment
- [ ] Monitoring/alerts: None needed

---

## 9) STEP-BY-STEP IMPLEMENTATION PLAN

### Execution Order (respecting dependencies)

**Parallel batch 1** (no dependencies):
- Task 001: Rename staking labels
- Task 002: Floating network dropdown
- Task 003: Migration single-button flow

**Sequential after batch 1:**
- Task 004: Migration progress bar (depends on 003)
- Task 005: UI refinement (depends on 003 + 004)

### Execution

Use `/dotask` to execute from `.memory-bank/tasks/goliath-liquid-staking-ui-overhaul/`

---

## 10) VERIFICATION CHECKLIST

- [ ] `npm run build` succeeds
- [ ] Navigation shows "Goliath Liquid Staking"
- [ ] Floating network dropdown works on all pages
- [ ] Migration uses single "Migrate" button
- [ ] Progress bar animates through steps
- [ ] UI is polished and consistent
- [ ] All 4 locales render correctly
- [ ] Mobile responsive
