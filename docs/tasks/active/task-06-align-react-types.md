### Task 06 — Align `@types/react` to the React 18.x runtime

#### Overview

`package.json` ships `react@18.3.1` and `react-dom@18.3.1` but
`@types/react@^19.2.14` and `@types/react-dom@^19.2.3` (Tech.md §2.2).
Nothing is breaking today, but the type definitions describe APIs the
runtime does not have. This task downgrades the two type packages to
the 18.x line matching the runtime.

**The rules for this feature live in `Tech-Frontend.md` §1** (layout
block) — no PRD rule changes.

**Depends on:** nothing · **Blocks:** nothing

---

#### 06.1 — Frontend-service: Pin `@types/react` and `@types/react-dom` to 18.x

Rules: Tech.md §2.2
Not in scope: upgrading to React 19 (a separate effort of its own).
Docs to update: Tech.md §2.2 (strike the mismatch note), Tech-Frontend §1 (regenerate the layout block)
Verify: `npm run build` in `frontend/candidate_manager_frontend`

- [ ] `@types/react` pinned to `^18.3.12` (or the latest 18.x on the
      day of the change — not a floating `^19`).
- [ ] `@types/react-dom` matched to the same minor.
- [ ] `tsc -b` clean.
- [ ] Tech.md §2.2 "Not installed, by design" picks up no new entry;
      the mismatch note is deleted.
- Commit: `chore(frontend): align @types/react with the React 18 runtime`
