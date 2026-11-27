### Task 01 — Server-side pagination on list and search

#### Overview

`GET /candidates`, `GET /candidates/search/name` and
`GET /candidates/search/skills` return the full table today — there is
no pagination (Tech.md §6, PRD §9). This task adds Spring Data `Pageable`
to the three list endpoints, documents the page contract in PRD, and
updates the frontend store to request and page through results.

**The rules for this feature live in `PRD.md` §4.7** (search flows) and
will be extended with a new subsection on pagination. This file is only
the plan — read the rules from those sections, never from this Overview.

**Depends on:** nothing · **Blocks:** nothing

---

#### 01.0 — Docs: Define the pagination contract

Rules: none (this subtask creates the rules' home)
Not in scope: any code change.
Docs to update: PRD §4.7 (new §4.7.4 "Pagination contract"), Tech-Backend §2, a new Decisions entry
Verify: `node scripts/check-docs.mjs`

- [ ] PRD §4.7.4 added: query params (`page`, `size`), defaults
      (page=0, size=20), max size (100), response shape
      (`{ content, page, size, totalElements, totalPages }`).
- [ ] A new Decisions entry records: server-side chosen over client-side
      (unbounded result sets are a scale issue, not a UX one).
- [ ] Tech-Backend §2 notes that pageable params are bound by Spring
      automatically from `?page=&size=`.
- Commit: `docs: pagination contract for /candidates and search`

---

#### 01.1 — Backend-endpoint: Paginate `/candidates`, `/candidates/search/name`, `/candidates/search/skills`

Rules: PRD §4.7.4 (pagination contract), Tech-Backend §2
Not in scope: `/skills` endpoints (out of scope for this task — skills
list is bounded by the skill vocabulary, pagination there would be churn).
Docs to update: none (rule lives in PRD §4.7.4 from 01.0)
Verify: `./mvnw test -Dtest=CandidateControllerTest`

- [ ] Repository methods accept `Pageable` and return `Page<Candidate>`;
      the native queries get a matching `countQuery`.
- [ ] Service methods return `Page<CandidateDto>`.
- [ ] Controllers accept `Pageable pageable` and return the `Page<...>`
      (Spring serialises it to the contract in PRD §4.7.4).
- [ ] Slice tests cover: default page, custom `size`, `size > 100` clamps
      to 100, empty page is `200 OK` with `content: []`.
- [ ] Note: this task also realises the PRD §4.7 "200 on empty"
      intent (task-02) for the paginated endpoints. Task-02 remains
      responsible for the non-paginated `GET /candidates/search/*`
      shapes that still exist after this task — there are none, so
      task-02 scope reduces to the plain `/skills/search` path (which
      is already 200). Revisit task-02 after this one lands.
- Commit: `feat(backend): server-side pagination on candidate list and searches`

---

#### 01.2 — Frontend-store: Add pagination state and advance/go-to-page actions

Rules: Tech-Frontend §3 (store), PRD §4.7.4
Not in scope: changing the Dashboard layout beyond adding "Previous /
Next / page N of M". Virtualisation is out of scope.
Docs to update: Tech-Frontend §3
Verify: `npm run build` in `frontend/candidate_manager_frontend`
(there is no frontend test runner yet — see task-07; once that lands,
add store tests for the paging actions).

- [ ] Store holds `page`, `size`, `totalPages`, `totalElements`.
- [ ] `fetchCandidates`, `searchByName`, `searchBySkills` pass
      `{ page, size }` through to `candidateService.*` and populate the
      metadata from the response.
- [ ] `nextPage` / `prevPage` / `setPage(n)` actions.
- [ ] Dashboard gets a pager row below the grid. UI.md §2 updated to
      show it.
- Commit: `feat(frontend): paginate the dashboard`
