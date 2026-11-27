### Task 12 — Extract error-banner primitive and token

#### Overview

The duplicate-email error banner in `AddCandidatePage.tsx:184-193` is
styled inline (`backgroundColor: "#f8d7da"`, `color: "#721c24"`) — the
one inline-colour exception documented in UI §1.4. This task adds a
`--danger-bg` / `--danger-text` CSS token pair and a reusable
`<ErrorBanner>` component so the exception becomes a rule.

**The rules for this feature live in `UI.md` §1.4 and §5.**

**Depends on:** task-11 (so both pages use the same shape before
extraction) · **Blocks:** nothing

---

#### 12.0 — Docs: Add the tokens and the primitive to UI

Rules: none
Not in scope: code.
Docs to update: UI.md §1.1 (add `--danger-bg` / `--danger-text`),
UI.md §5 (new §5.5 "ErrorBanner"), delete the "one exception" paragraph
in §1.4
Verify: `node scripts/check-docs.mjs`

- [ ] UI.md §1.1 lists the two new tokens with their hex values.
- [ ] UI.md §5.5 describes the ErrorBanner component (props: `message`;
      renders the `.error-banner` class).
- [ ] UI.md §1.4 no longer carries the exception paragraph.
- Commit: `docs(ui): error banner primitive and danger tokens`

---

#### 12.1 — Frontend-component: Create `<ErrorBanner>` and wire both pages

Rules: UI §1.1, UI §5.5
Not in scope: changing the banner's behaviour beyond what UI §5.5
specifies.
Docs to update: Tech-Frontend §1 (layout block picks up
`src/components/ErrorBanner.tsx`)
Verify: `npm run test`

- [ ] `--danger-bg: #f8d7da` and `--danger-text: #721c24` added to
      `:root` in `src/index.css`.
- [ ] `.error-banner` class defined in `src/index.css` with the tokens.
- [ ] `src/components/ErrorBanner.tsx` renders `<div
      className="error-banner">{message}</div>`.
- [ ] `AddCandidatePage` and `CandidateDetailsPage` both use
      `<ErrorBanner message={error} />` instead of the inline-styled
      div / the removed `alert`.
- [ ] One component test for the primitive.
- Commit: `refactor(ui): extract ErrorBanner primitive`
