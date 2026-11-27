# Agent dispatcher — how to work in this repo

> Loaded on every chat (via `CLAUDE.md`). Which documents are authoritative,
> which to read for which task, how to read long ones cheaply, and the rules
> for keeping them in sync.

## 0. Precedence — read this before anything else

| Kind of truth                                       | Owner                                     |
|-----------------------------------------------------|-------------------------------------------|
| Product behaviour, rules, states, numbers, flows    | `docs/PRD.md`                             |
| Visual rules, copy, classes, breakpoints            | `docs/UI.md` — only where PRD is silent   |
| Schema: tables, columns, types, indexes             | `docs/DB.md`                              |
| Code structure, libraries, patterns, tests          | `docs/Tech.md`, `docs/Tech-Backend.md`, `docs/Tech-Frontend.md` |

A value is defined in exactly one document; everywhere else points at it.

**When two documents disagree, you do not choose.** Stop, append an `OPEN`
entry to `docs/Decisions.md` naming both sources as `file:line`, report it,
and wait. Never write code that depends on an unresolved rule.

- **A task file is a plan, never a source of truth.** Its `Rules:` line may
  only name PRD / UI / DB / Tech sections, or `none`. A task introducing a
  new rule writes it into the owning document in its subtask 0 first.
- **`docs/Decisions.md` is the log of *why*, not *what*.** Every
  `(per D-0NN)` reference in any document must resolve to an entry there.

## 1. Always start here

Read `docs/Overview.md` first, every time.

**`docs/old/**` is not authoritative.** It is a git-ignored snapshot of
superseded documents whose rules contradict the current ones. Never Read,
Grep or Glob it unless the user names it.

## 2. Pick documents by sub-tag

Your sub-tag sets the **minimum** you must read. A floor, not a suggestion.

| Sub-tag              | Minimum reads |
|----------------------|---------------|
| `Backend-service`    | Tech-Backend architecture + testing sections · + every `Rules:` section |
| `Backend-endpoint`   | Tech-Backend pipeline, error handling, validation · + `Rules:` sections |
| `Backend-migration`  | DB.md (whole) · Tech.md database tooling · + `Rules:` sections |
| `Frontend-service`   | Tech-Frontend data-fetching + HTTP client · + `Rules:` sections |
| `Frontend-component` | Tech-Frontend layout + patterns · UI.md (the screen) · + `Rules:` sections |
| `Frontend-page`      | Tech-Frontend layout → forms · UI.md (the screen) · + `Rules:` sections |
| `Frontend-store`     | Tech-Frontend §3 (store) + data-fetching · + `Rules:` sections |
| `Seed`               | DB.md seed · Tech-Backend testing · + `Rules:` sections |
| `UI`                 | UI.md (the screen) + copy conventions · + `Rules:` sections |
| `Test`               | the Testing section of the relevant Tech file · + `Rules:` sections |
| `Refactor`           | the Tech section for the layer you are changing · + `Rules:` sections |
| `Docs`, `DevOps`     | whatever the subtask names |

**Before writing a single line of code, echo the sections you loaded:**

    Loaded: PRD §4.7, Tech-Backend §2, Tech-Backend §7

A subtask whose `Rules:` line names a section you did not load is not
started correctly.

A localized bug fix still reads the PRD section owning the behaviour you
touch; the architecture documents are what you may skip when the pattern
is visible in the code around you.

## 3. How to read long documents

Each long document carries a **Section index** listing headings only,
deliberately with **no line numbers**. Never Read these files whole:

1. `grep -n "^## " docs/<file>.md` — live, correct line numbers. For a
   subsection, `grep -n "^### " docs/<file>.md` the same way.
2. Pick your section; the next heading's line minus one is its end.
3. `Read` with `offset` and `limit`.

Never trust a line number written inside a document. Grep for the heading
instead.

## 4. Tasks

- One file per task in `docs/tasks/active/`. Read `index.md` first, then
  only your task file.
- **Every subtask carries a checkbox.** Resume at the first unchecked
  one; tick it in the same commit as its work. A task file existing does
  not mean nothing has been done.
- **A task file is read by section too, never whole** — see §4.1.
- Respect `Depends on:` / `Blocks:` in `index.md`, and any `Depends on:`
  line on an individual subtask. If a task or subtask is blocked, say so
  instead of starting it.
- **Leftover work inside a ticked subtask is a box, not a nested
  subtask.** When you find that a finished subtask needs more — a
  refactor, an alignment, a missed case — add a `- [ ]` box to it. It
  drops back to part-done and the `index.md` progress cell falls with it.
  Do **not** nest subtasks, and do **not** add a routine `Refactor`
  subtask beside every implementation subtask.
- A new task file follows `docs/tasks/TEMPLATE.md`. Copy it; do not
  improvise the shape.
- **Archival gate** — a task may be archived only when: every rule in its
  Overview lives in PRD / UI / DB / Tech; every pointer to the task file
  is repointed; every subtask is ticked. Then one commit: append the
  trimmed entry to `docs/tasks/done/YYYY-MM.md`, delete the task file,
  remove its index row.

### 4.1 Opening a task file

Task files are navigated by grep, exactly like the documents in §3.
Subtask headings are always `#### <id> — <sub-tag>: <title>`, so they are
greppable. Two commands, then two targeted Reads:

    grep -n "^#### " docs/tasks/active/task-NN-<slug>.md        # the subtask map
    grep -n "^- \[ \]" docs/tasks/active/task-NN-<slug>.md | head -3   # first unfinished boxes

1. The second command gives the line of the first `- [ ]`. **The subtask
   that owns it is the last `####` at or before that line** — read it off
   the map from the first command.
2. `Read` the **Overview**: line 1 to the first `####` minus one. That
   holds the "rules live in" pointer, `Depends on:` and `Blocks:`.
3. `Read` **your subtask only**: its `####` line to the next `####` minus
   one.
4. Stop there. Earlier subtasks are done, later ones are not yours, and
   reading them wastes context and invites work nobody asked for.

## 5. Refactor campaigns

Structural work that changes no behaviour is a **campaign**, tracked
exactly like a task but in its own folder. Everything in §4 and §4.1
applies verbatim.

- Campaigns live one per file in `docs/refactors/active/`. Read
  `docs/refactors/active/index.md` first, then only the campaign file
  you are working on.
- Campaigns have their own number sequence — `refactor-01`, `refactor-02`
  — independent of task numbers. A new campaign follows
  `docs/refactors/TEMPLATE.md`; do not reuse the task template.
- Subtask ids are `RNN.M` (`#### R01.3 — Refactor: …`), so they grep like
  task subtasks.
- **A campaign changes structure only.** Sub-tag `Refactor`, which means
  **no new test** (§9): the existing suites are the net, and `Verify:`
  names the suites that must *stay* green. `Rules:` points at the
  `Tech*.md` section defining the target structure, never at PRD
  behaviour.
- Every campaign records a **baseline** before its first subtask.
- **Archival gate.** Every subtask `- [x]`, the baseline table's "After"
  column filled in, the named suites green, and any layout block it
  touched carrying a fresh `verified at <sha>`. Then, in one commit:
  **move the whole file** to `docs/refactors/done/YYYY-MM-<slug>.md` and
  remove its row from the index.

## 6. Cross-document update protocol

Whenever you change product behaviour, schema or a screen — **wherever
the change originates** — update the owning siblings in the same commit.
The trigger is the change, not the file you started in; "I only edited a
task file" is not an exemption.

## 7. Keeping documents honest

- No stored line numbers. Adding a section adds its heading row to the
  index, same commit.
- No `##` section over ~150 lines. Split the section or the file.
- Layout blocks are verified, not remembered: they carry a
  `verified at <sha>` marker, and you confirm a parent directory exists
  before creating a file there. If the document is wrong, fix it in the
  same commit as your change.
- One definition per value. Two definitions is a bug even when they
  currently agree.

## 8. Do not invent

Do not invent requirements, patterns, tables or UI copy that the owning
document does not have. If something is ambiguous or two documents
conflict, follow §0 — an `OPEN` decision and a report, not a guess and
not a silent choice.

## 9. TDD discipline

Red → Green → Refactor → Verify on every implementation subtask. Load the
relevant Testing section before writing tests.

Each subtask body carries a mandatory `Rules:` line naming the sections
it implements, or `Rules: none`. Load every section it names **before**
the Red step: the bullets become the test cases, the sections tell you
why each bullet is a rule.

**Sub-tags.** Pick the one matching the *subject* of the change. Bare
`Backend` / `Frontend` are not valid.

| Sub-tag              | The change is in…                                            | Test type |
|----------------------|--------------------------------------------------------------|-----------|
| `Backend-service`    | a service or repository class                                | Unit, mocked dependencies (Mockito) |
| `Backend-endpoint`   | a controller, route, DTO or validator                        | Slice (@WebMvcTest + MockMvc) |
| `Backend-migration`  | the schema: an entity change under `ddl-auto=update`         | Integration, schema assertion (new suite; see task-10) |
| `Frontend-service`   | a function in `src/services/`                                | Unit with HTTP mocking (see task-07) |
| `Frontend-component` | one presentational component taking props                   | Unit, co-located, mocked deps (see task-07) |
| `Frontend-page`      | a page, or a section owning state/fetches/mutations          | Integration, router + HTTP mock (see task-07) |
| `Frontend-store`     | a Zustand store slice                                        | Unit with HTTP mocked at the service boundary (see task-07) |
| `Seed`               | a seed script (none today)                                   | Integration against the real DB |
| `UI`                 | UI.md only, no code                                          | None required |
| `Test`               | tests only                                                   | the task body says which |
| `Refactor`           | behaviour-preserving restructuring                           | **No new test.** Existing suites stay green; say which you ran |
| `Docs`               | documentation only                                           | Exempt |
| `DevOps`             | CI, hooks, scripts, tooling                                  | Exempt |

There is no `DB` sub-tag: schema work is `Backend-migration`, seed work
is `Seed`, a documentation-only schema edit is `Docs`.

Use `Test:` only for test-only work — never as a duplicate of the subtask
already producing the test in its Red step.

**Every subtask body also carries:**

    Rules:          <PRD §x / UI §x / DB §x / Tech-Backend §x / none>
    Not in scope:   <what this subtask must not touch>
    Docs to update: <PRD §x / UI §x / DB §x / none>
    Verify:         <the exact command that must pass>

`Not in scope` is what keeps a subtask from growing. `Verify` is what
stops you inventing your own definition of done.

## 10. Mechanical check

`node scripts/check-docs.mjs` validates what prose cannot. It runs from
the pre-commit hook (`.githooks/pre-commit`, enabled with
`git config core.hooksPath .githooks`). If it fails, fix the documents —
do not bypass the hook.

## 11. Committing

- **Never commit until the user says so.** Finish the subtask, tick its
  boxes, update the `index.md` progress cell, run
  `node scripts/check-docs.mjs`, then **show the diff and stop**. Wait
  for explicit approval, then commit with the subtask's `Commit:` message.
  A green test run is not approval.
- **One subtask per commit.** Do not batch two subtasks into one commit,
  and do not split one subtask across two unless the user asks.
- Never run `git push`, `commit --amend`, `--force`, or `reset --hard`
  unless the user asks for that specific operation by name.

## 12. When work comes back wrong

Four situations, and only one of them touches git history. Identify which
before doing anything.

**A — not committed yet.** The normal case, because of §11. Nothing to
undo: the boxes are not ticked and history is untouched. Revise in place,
leave the boxes unticked, show the diff again.

**B — committed, and the approach is wrong.** `git revert <sha>` — never
`reset --hard`, which would also destroy uncommitted work elsewhere in
the tree. Then untick the subtask's boxes, correct the `index.md`
progress cell, and run `node scripts/check-docs.mjs`, which fails until
the count is right again. Then **add a line to the subtask recording
which approach was rejected and why**.

**C — committed, correct but incomplete.** Do not revert. Add a `- [ ]`
box to that subtask for the missing part (§4, leftover work), drop the
progress cell, and do the extra work as its own commit.

**D — the code matched the document, and the document was wrong.** Then
the document is the defect, not the code. Fix the owning section first,
add a `docs/Decisions.md` entry for the changed rule, commit that as a
`docs:` commit on its own, and only then change the code to match.

The B-versus-D distinction is the one that matters: **if the agent did
what the document said, the defect is in the document.**
