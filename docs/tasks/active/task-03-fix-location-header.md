### Task 03 — Fix `POST /candidates/candidate` Location header

#### Overview

`POST /candidates/candidate` returns `Location: /candidate/{id}` — a
singular, prefixless URL that does not exist on this service (D-008).
The correct value is `/candidates/id/{id}`, which is the actual GET
endpoint. No caller relies on today's header (the frontend reads the
body), so changing it is non-breaking.

**The rules for this feature live in `PRD.md` §4.1.** This file is only
the plan.

**Depends on:** nothing · **Blocks:** nothing

---

#### 03.0 — Docs: Rewrite the Location in PRD §4.1

Rules: none (this subtask flips the documented value)
Not in scope: code.
Docs to update: PRD §4.1, Decisions D-008
Verify: `node scripts/check-docs.mjs`

- [ ] PRD §4.1 step 3 reads: `Location: /candidates/id/{id}`.
- [ ] D-008 status updated: "Accepted; fixed by task-03 on <date>."
- Commit: `docs(prd): Location header is /candidates/id/{id}`

---

#### 03.1 — Backend-endpoint: Return the correct Location

Rules: PRD §4.1
Not in scope: changing the response body or the 409 branch.
Docs to update: none (rule lives in PRD §4.1 from 03.0)
Verify: `./mvnw test -Dtest=CandidateControllerTest#testCreateCandidate`

- [ ] `CandidateController.createCandidate` builds the URI as
      `URI.create("/candidates/id/" + savedCandidate.getId())`.
- [ ] `testCreateCandidate` asserts
      `header().string("Location", "/candidates/id/1")`.
- Commit: `fix(backend): Location header points at /candidates/id/{id}`
