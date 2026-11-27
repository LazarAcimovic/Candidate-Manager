# Refactor campaign template

> Copy this file into `docs/refactors/active/refactor-NN-<slug>.md`,
> replacing `NN` with the next campaign number from
> `docs/refactors/active/index.md`. Use the task template for a feature
> task — it is a separate shape.

A campaign is **not** a feature task. Nothing it does is visible to a
user, so there is no behaviour to specify and no new test to go red. Its
safety property is the opposite: *the existing suites never went red at
all.*

`RNN` means `R` + the campaign's two-digit number, matching the filename.
So `refactor-01-<slug>.md` has subtasks `R01.1`, `R01.2`, `R01.3`, …,
written as `#### R01.3 — Refactor: Remove the superseded page folders`.

The two subtask blocks below are **recurring shapes, not literally
subtasks 1 and 2**: repeat the "one path, one move" shape once per path
in the scope inventory, then close with the layout-block refresh and the
archiving subtask.

---

### Refactor NN — <Title>

#### Overview

<The structural problem as a measurement, not an adjective: "426 lines
holding six components and an inline label map", not "cleaner code".>

**The target structure is defined in `Tech-Frontend.md` §X** (or
`Tech-Backend.md` §X). This file is only the plan for getting there.
**No behaviour changes in this campaign** — a bug found while moving code
is left alone and gets a box on the task that owns it.

**Depends on:** <ids, or nothing> · **Blocks:** <ids, or nothing>

#### Baseline — captured before step one

| Measure                          | Before                   | After (fill in at the end) |
|----------------------------------|--------------------------|----------------------------|
| `<suite>`                        | <n> tests passing        |                            |
| typecheck                        | clean                    |                            |
| build                            | succeeds                 |                            |
| <the thing being fixed>          | <the measurement>        |                            |

#### Out of scope

- <what looks related and is deliberately untouched, and why>

#### Rollback

Each subtask is one commit touching one path. If a step breaks a suite
and the cause is not obvious within a few minutes, `git revert` that
commit and record what failed in the box rather than pressing on.

---

#### RNN.1 — Refactor: <one path, one move — repeat this shape per path>

Rules: <Tech-Backend §x (the target structure), or none>
Not in scope: any behaviour change — no new props, no renames beyond the
move, no copy or styling edits.
Docs to update: <the layout block and its `verified at <sha>` marker, or
none>
Verify: `<the suites that must stay green>` and `<typecheck/build>`

- [ ] `grep` the tree for imports of the old path; record the hit count
      in the commit message.
- [ ] <the move itself>
- [ ] Imports re-pointed; no reference to the old path remains.
- [ ] Named suites green, typecheck clean.
- Commit: `refactor(<scope>): <what moved where>`

---

#### RNN.2 — Docs: Refresh the layout block — second-to-last subtask, always

Rules: Tech-Backend §1 or Tech-Frontend §1 (layout blocks are verified,
not remembered — AGENTS §7)
Not in scope: code.
Docs to update: Tech-Backend §1 or Tech-Frontend §1
Verify: `node scripts/check-docs.mjs`

- [ ] Layout block regenerated from a real directory listing.
- [ ] `verified at <sha>` marker updated.
- [ ] Any "legacy — do not extend" paragraph this campaign emptied is
      removed.
- Commit: `docs(tech): refresh the layout block after the cleanup`

---

**Done when** every subtask is ticked, the baseline table's "After"
column is filled in, the named suites are green, the layout block
matches the tree, and `check-docs.mjs` passes. Then, in one commit: move
the whole file to `docs/refactors/done/YYYY-MM-<slug>.md` and remove its
index row.
