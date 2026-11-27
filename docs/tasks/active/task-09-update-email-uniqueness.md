### Task 09 — Email-uniqueness pre-check on `PUT /candidates/id/{id}`

#### Overview

`PUT /candidates/id/{id}` lets the user write an email another
candidate already holds; the DB raises a unique-constraint violation
and the controller surfaces it as 500 (D-009). The create path already
pre-checks and returns 409; this task does the same for update.

**The rules for this feature live in `PRD.md` §4.2.**

**Depends on:** nothing · **Blocks:** nothing

---

#### 09.0 — Docs: State the update-side 409

Rules: none
Not in scope: code.
Docs to update: PRD §4.2, Decisions D-009
Verify: `node scripts/check-docs.mjs`

- [ ] PRD §4.2 step 2 extended: if the new email belongs to a
      different candidate, return 409 with the same body as §4.1.
- [ ] D-009 picks up a trailing "Fixed by task-09 on <date>" when the
      task lands.
- Commit: `docs(prd): PUT /candidates/id/{id} returns 409 on email collision`

---

#### 09.1 — Backend-endpoint: Pre-check and return 409

Rules: PRD §4.2
Not in scope: changing the create path.
Docs to update: none
Verify: `./mvnw test -Dtest=CandidateControllerTest`

- [ ] `CandidateRepository` already has `existsByEmail`; add
      `findByEmail(String) : Optional<Candidate>` or an
      `existsByEmailAndIdNot(email, id)` and call it.
- [ ] If present and the id differs from the path id, return 409 with
      `"User with email <email> already exists."`.
- [ ] Slice test covers: collision with another candidate → 409; same
      email on the same row → 200 (not a collision).
- Commit: `fix(backend): 409 on update email collision`
