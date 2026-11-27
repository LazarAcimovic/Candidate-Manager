### Task 11 — Replace `window.alert` with an inline banner on edit

#### Overview

`CandidateDetailsPage` opens a `window.alert("Error updating
candidate.")` on a submit failure (UI §4). `AddCandidatePage` already
renders an inline banner (UI §3). This task makes the edit page match.

**The rules for this feature live in `UI.md` §3 and §4.**

**Depends on:** task-07 (so the banner can have a test) · **Blocks:** nothing

---

#### 11.0 — Docs: Align the two pages' error UIs

Rules: none
Not in scope: code.
Docs to update: UI.md §4
Verify: `node scripts/check-docs.mjs`

- [ ] UI.md §4 rewritten: on submit failure, render an inline error
      banner with the same shape as §3.
- Commit: `docs(ui): edit page uses inline error banner`

---

#### 11.1 — Frontend-page: Swap the alert for a banner

Rules: UI §4
Not in scope: changing the banner's styling (that goes with task-12).
Docs to update: none
Verify: `npm run test` (once task-07 has landed)

- [ ] `CandidateDetailsPage` holds `error: string | null` state and
      renders the banner when set, per UI §3's shape.
- [ ] The `alert(...)` call at `CandidateDetailsPage.tsx:102` is
      removed.
- [ ] A new test renders the page, forces the submit to fail (MSW),
      and asserts the banner is visible with the expected text.
- Commit: `fix(frontend): inline error banner on edit submit failure`
