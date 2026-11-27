# Task file template

> Copy this file into `docs/tasks/active/task-NN-<slug>.md`, replacing `NN`
> with the next task number from `docs/tasks/active/index.md`. Do not
> improvise the shape. AGENTS.md §4 and §9 govern what every line does.

---

### Task N — <Title>

#### Overview

<2–4 sentences on what this task delivers.>

**The rules for this feature live in `PRD.md` §X** (and DB §Y, UI §Z).
This file is only the plan — read the rules from those sections, never
from this Overview.

**Depends on:** <task ids or nothing> · **Blocks:** <task ids or nothing>

---

#### N.0 — Docs: Promote the rules into the source-of-truth documents

Rules: none (this subtask creates the rules' home)
Not in scope: any code change.
Docs to update: PRD §X, DB §Y, UI §Z, Decisions D-0NN
Verify: `node scripts/check-docs.mjs`

- [ ] Every rule this task needs is written into PRD / UI / DB / Tech.
- [ ] Any glossary or pointer entry references those sections, not this
      file.
- Commit: `docs: <what the rules are>`

---

#### N.1 — <sub-tag>: <subtask title>

Rules: <PRD §x (short label), UI §y, DB §z, or none>
Not in scope: <what this subtask must not touch>
Docs to update: <sections, or none>
Verify: <the exact command that must pass>

- [ ] <acceptance criterion — becomes a Red-step test case>
- [ ] <acceptance criterion>
- Commit: `<type>(<scope>): <message>`

---

## Hard requirements the checker enforces

Every subtask heading must match `#### N.M — <sub-tag>: <title>` and every
subtask body must carry these four lines in order:

    Rules:          <...>
    Not in scope:   <...>
    Docs to update: <...>
    Verify:         <...>

`Rules:` fragments must start with a document name (`PRD`, `UI`, `DB`,
`Tech`, `Tech-Backend`, `Tech-Frontend`), a `§`, a `D-0NN`, or be
literally `none`. Nothing else is accepted — a task file is never a rule
source (AGENTS §0).

Sub-tags must be one of (AGENTS §9):
`Backend-service`, `Backend-endpoint`, `Backend-migration`,
`Frontend-service`, `Frontend-component`, `Frontend-page`,
`Frontend-store`, `Seed`, `UI`, `Test`, `Refactor`, `Docs`, `DevOps`.
Bare `Backend` / `Frontend` / `DB` are **not** valid.

## Why each line exists

| Line               | Purpose                                                   |
|--------------------|-----------------------------------------------------------|
| `Rules:`           | Makes the agent read the right sections before coding.    |
| `Not in scope:`    | The cheapest anti-scope-creep device available.           |
| `Docs to update:`  | Fires the cross-document protocol per subtask.            |
| `Verify:`          | Removes the agent's freedom to invent "done".             |

## Two optional lines

- `Depends on:` **on a single subtask** when that one subtask has a
  prerequisite the rest of the task does not. Put it directly under the
  heading, above `Rules:`. Task-level dependencies stay in the Overview
  and in `index.md`.
- A **reconciliation note** in the Overview, as a blockquote, when the
  task's recorded state was checked against the code and some subtasks
  turned out to be done already.

## Numbering is the order of work

An agent resumes at the first unchecked subtask. Number subtasks in the
sequence you intend to do them. `index.md` should not carry a competing
"suggested order" list; if one subtask must move, move it in the file.
