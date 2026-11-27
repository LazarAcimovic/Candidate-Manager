# Decision log

> Append-only. One numbered entry per resolved question. **Never edit or
> renumber an existing entry** — supersede it and mark the old one
> `Superseded by D-0NN`.
>
> Any `(per D-0NN)` reference in any document must resolve here.
> An entry is **not** a source of truth: it records *why* a rule is what
> it is. The rule itself lives in PRD / Tech / UI / DB.

### D-001 — Is `contactNumber` a free-form string or a validated phone number?

**Decided:** 2026-11-05 · **Status:** Accepted
**Answer:** Free-form string, no format rule, no length cap at the
application layer. Whatever the user types in `AddCandidatePage.tsx` is
stored verbatim.
**Lives in:** DB §2.1, PRD §3.1
**Why:** The one actor on this system is the HR user who already knows
what a phone number looks like; the scope does not justify a locale-aware
parser. Reconstructed from `Candidate.java:23-24` (only `@Column(nullable
= false)`), confirmed as intended on 2026-11-05.

### D-002 — Why no bean validation on the DTOs?

**Decided:** 2026-11-05 · **Status:** Accepted
**Answer:** Bean validation is not wired. The dependency
`spring-boot-starter-validation` is not on the classpath. DTOs are plain
POJOs with no `@NotBlank` / `@Size` / `@Email` annotations.
**Lives in:** Tech-Backend §6, PRD §4.1 (the 500 failure mode)
**Why:** The project targets a single trusted user on localhost, so a
badly-shaped request is a programming error, not an attack. The cost of
wiring and maintaining the annotation surface outweighs its value at this
scope. Adding it is tracked in task-04 for whenever the deployment target
changes.

### D-003 — Why `ddl-auto=update` instead of Flyway or Liquibase?

**Decided:** 2026-11-05 · **Status:** Accepted
**Answer:** `spring.jpa.hibernate.ddl-auto=update` is the schema-management
mechanism. There is no migration directory, no versioned history, no
rollback.
**Lives in:** Tech.md §3.1, DB §6
**Why:** With one developer, one database, no deployed instances and a
schema that changes rarely, a migration tool is overhead without payoff.
Reconstructed from `application.properties:11`. The planned future path
is refactor-01 (not yet opened).

### D-004 — Is `searchBySkills` OR-semantics or AND-semantics?

**Decided:** 2026-11-05 · **Status:** Accepted
**Answer:** **OR**. The native query at `CandidateRepository.java:25-30`
is `WHERE LOWER(s.name) IN :skillNames`, which returns candidates holding
**at least one** of the requested skills. The `DISTINCT c.*` is only there
to dedup the join; it is not an "all of" filter.
**Lives in:** DB §7.2, PRD §4.7.2
**Why:** Not recorded. Reconstructed from `findAllByAnySkill` and
`CandidateServiceImpl.java:107-116`, confirmed as intended on 2026-11-05
with the direction "does not ruin current app behaviour". The frontend
accepts OR and composes its own intersection with the name filter
(Tech-Frontend §3).

### D-005 — Why are DB credentials and the API base URL hardcoded?

**Decided:** 2026-11-05 · **Status:** Superseded by task-08 on 2026-11-26
**Answer:** `application.properties` holds the DB URL, user and password
literally; `src/services/apiClient.ts:4` hardcodes
`http://localhost:8793`. There is no `.env` loader, no profile indirection.
**Lives in:** Tech.md §5, Tech-Backend §8
**Why:** No deployment target beyond localhost means no environment to
parameterise against. Moving to env-sourced config is task-08.

### D-006 — Why no authentication or authorization?

**Decided:** 2026-11-05 · **Status:** Accepted
**Answer:** The application has no login, no session, no bearer token.
Spring Security is not on the classpath. CORS is the only
cross-origin control (`WebConfig.java:15-21`), and it allows exactly
`http://localhost:5173`.
**Lives in:** PRD §6, Tech-Backend §4
**Why:** The project is an HR tool for a single trusted user running on
their own machine. Confirmed as intentional on 2026-11-05. Any deployment
beyond localhost would re-open this decision.

### D-007 — Why hard delete everywhere?

**Decided:** 2026-11-05 · **Status:** Accepted
**Answer:** `DELETE /candidates/id/{id}` and `DELETE /skills/id/{id}` call
`JpaRepository.deleteById`. No soft-delete column exists; nothing is
archived.
**Lives in:** PRD §4.3, PRD §4.6, DB §4
**Why:** No multi-user audit requirement, no regulatory retention rule,
no business process that resurrects a deleted row. Not recorded as a
decision at the time; confirmed as intended on 2026-11-05.

### D-008 — The `Location` header on `POST /candidates/candidate` points at `/candidate/{id}` (singular, no path prefix). Defect or intentional?

**Decided:** 2026-11-05 · **Status:** Accepted (as a defect; fix in task-03)
**Answer:** Defect. The correct Location is `/candidates/id/{id}`, which
is the actual retrieval endpoint. Today's behaviour at
`CandidateController.java:50-51` is left in place and documented; task-03
switches the header value.
**Lives in:** PRD §4.1
**Why:** The user confirmed on 2026-11-05 that the singular, prefixless
Location is unintended. Because no caller relies on it (the frontend
reads the response body, not the header), fixing it is non-breaking and
scheduled as a standalone task.

### D-009 — Where is candidate-email uniqueness enforced?

**Decided:** 2026-11-05 · **Status:** Accepted
**Answer:** Two layers:
1. The DB unique index on `candidate.email` (DB §2.1) is the system of
   record.
2. The controller pre-check at `CandidateController.java:44` returns a
   clean 409 on create before the DB layer is reached.
The update path (`PUT /candidates/id/{id}`) does **not** re-check, so an
email collision on update surfaces as a 500. Task-09 adds the check.
**Lives in:** PRD §3.1, PRD §4.2
**Why:** The create path was written defensively; the update path is a
gap that nobody closed. Confirmed as intended to be addressed on
2026-11-05.

### D-010 — Should `GET /candidates/search/…` return 404 on an empty result?

**Decided:** 2026-11-05 · **Status:** Accepted (behaviour will change
in task-02; documents describe today's 404 until then)
**Answer:** No. The desired behaviour is **200 OK with `[]`**: an empty
collection is a successful response. Today the controllers at
`CandidateController.java:76-78,86-88` return 404 with a text body; the
`GET /skills/search` endpoint at `SkillController.java:38-42` already
does the right thing and is the model task-02 is converging on.
**Lives in:** PRD §4.7.1, PRD §4.7.2
**Why:** The current 404 forces the frontend to catch the error at the
store level (`candidateStore.ts:72-78`) and translate it back into a
"not found" state, which conflates genuine network failures with
empty-result responses. Decided on 2026-11-05.

### D-011 — How is the server port resolved across local, Docker and Railway?

**Decided:** 2026-11-26 · **Status:** Accepted
**Answer:** `server.port=${PORT:${SERVER_PORT:8793}}`. Railway injects
`PORT`, which wins; a local run may set `SERVER_PORT`; absent both, the
port is `8793`. The same jar runs unchanged in every environment.
**Lives in:** Tech §5, Tech §7
**Why:** task-08 parameterised the port as `SERVER_PORT`, but Railway's
platform injects `PORT` and expects the process to bind it (task-14).
Nesting the two placeholders honours both with no second code change and
keeps `8793` as the committed default.
