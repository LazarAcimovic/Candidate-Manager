### Task 02 — Search endpoints return 200 with `[]` instead of 404

#### Overview

`GET /candidates/search/name` and `GET /candidates/search/skills` return
HTTP 404 with a text body when no rows match (D-010). The desired
behaviour, and what `GET /skills/search` already does, is **200 OK with
`[]`**. This task flips both controller methods, aligns the slice tests,
and simplifies the Zustand store's error-path logic that was papering
over the old 404.

**The rules for this feature live in `PRD.md` §4.7.1 and §4.7.2.**
This file is only the plan — read the rules from those sections, never
from this Overview.

**Depends on:** nothing (can run in parallel with task-01; whichever
lands second drops the overlap it discovers). · **Blocks:** nothing

---

#### 02.0 — Docs: Rewrite the empty-result rule as 200

Rules: none (this subtask promotes D-010 into PRD)
Not in scope: code.
Docs to update: PRD §4.7.1, PRD §4.7.2, Decisions D-010
Verify: `node scripts/check-docs.mjs`

- [ ] PRD §4.7.1 reads: always 200; empty result is `[]`.
- [ ] PRD §4.7.2 reads: always 200; empty result is `[]`.
- [ ] D-010 status flips from "Accepted (behaviour will change)" to
      "Accepted" with a line noting the task has landed.
- Commit: `docs(prd): search endpoints return 200 with []`

---

#### 02.1 — Backend-endpoint: Return `200 OK` with the (possibly empty) list

Rules: PRD §4.7.1, PRD §4.7.2
Not in scope: the service layer — the lists it already returns are
possibly empty. Only the controller's 404-on-empty branch is removed.
Docs to update: none (rules live in PRD §4.7 after 02.0)
Verify: `./mvnw test -Dtest=CandidateControllerTest`

- [ ] `searchCandidateByName` returns `ResponseEntity.ok(list)` for any
      list (including empty).
- [ ] `searchCandidateBySkills` the same.
- [ ] Slice tests updated:
      `testSearchByName_Empty` expects 200 and `jsonPath("$").isArray()`
      with length 0; same for skills.
- Commit: `fix(backend): 200 with [] on empty search`

---

#### 02.2 — Frontend-store: Stop interpreting 200-empty as an error

Rules: Tech-Frontend §3
Not in scope: the catch branch for real network errors — keep that.
Docs to update: Tech-Frontend §3 (remove the paragraph about
404-translation)
Verify: `npm run build`; manual check against a running stack that
searching for a non-existent name shows the `.empty-state` panel
(UI §2) instead of the `.error-text` band.

- [ ] `candidateStore.searchByName` no longer sets `error` on an empty
      result; it sets `candidates: []`.
- [ ] `candidateStore.searchBySkills` the same.
- [ ] `candidateStore.fetchCandidates` unchanged (it was already
      correct for the non-empty path).
- Commit: `fix(frontend): empty search renders empty-state, not error`
