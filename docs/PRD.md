# Candidate Manager — Product Requirements

## Section index

> Agents: do not Read this file whole. `grep -n "^## " docs/PRD.md` for live
> line numbers, then Read with `offset`/`limit`.

| Section | Title |
|---|---|
| 1 | One-line summary |
| 2 | Actors |
| 3 | Core domain model |
| 4 | Main flows |
| 5 | Screen inventory |
| 6 | Security |
| 7 | Data seeding |
| 8 | Deployment target |
| 9 | Implementation task list |
| 10 | Out of scope |

## 1. One-line summary

A local-development HR tool for adding, searching and editing job
candidates and the skills they claim, with a many-to-many link between the
two.

## 2. Actors

One actor: **the HR user**, who is the only person using the app.

- The user **can** list, search, create, view, edit and delete candidates;
  create, list, update and delete skills; attach a skill to a candidate;
  remove a skill from a candidate.
- The user **cannot** sign in (there is no authentication — see §6) or
  share the app with another user who sees different data (there is no
  per-user scoping).
- Accounts: **none**. The app has no user records, no signup, no admin
  seed. The actor exists conceptually, not as a row.

## 3. Core domain model

Two objects, M:N.

### 3.1 Candidate

| Field          | Shape                       | Owned-by rule       |
|----------------|-----------------------------|---------------------|
| `id`           | integer, server-assigned    | DB §2.1             |
| `fullName`     | string, required            | DB §2.1             |
| `dateOfBirth`  | ISO date (`YYYY-MM-DD`), required | DB §2.1       |
| `contactNumber`| string, required, free-form | DB §2.1 (per D-001) |
| `email`        | string, required, unique    | DB §2.1 (per D-009) |
| `skillNames`   | list of skill names         | PRD §3.3            |

Email uniqueness is enforced at the database layer (`UNIQUE` on
`candidate.email`) and in the create path at the service layer (per D-009).
The update path does **not** re-check uniqueness; see §4.2 and task-09.

### 3.2 Skill

| Field  | Shape                    | Owned-by rule |
|--------|--------------------------|---------------|
| `id`   | integer, server-assigned | DB §2.2       |
| `name` | string, required, unique | DB §2.2       |

Skill-name comparison is case-insensitive at lookup
(`LOWER(name)`), so `"Java"` and `"java"` resolve to the same row — but
the row itself stores whatever case was written first. (DB §2.2.)

### 3.3 Candidate ↔ Skill

A candidate holds a list of skills; the same skill may be on any number of
candidates. The link is stored in `candidate_skill` (DB §2.3). In the API
surface a candidate carries `skillNames: string[]`, not ids — skills are
addressed by name on write and returned by name on read.

## 4. Main flows

### 4.1 Create a candidate — `POST /candidates/candidate`

Body: `{ fullName, dateOfBirth, contactNumber, email, skillNames }`.

1. Controller checks `candidateRepository.existsByEmail(dto.email)`. If
   true, respond **409 Conflict**, body `"User with email <email> already
   exists."` (text).
2. Service persists the `Candidate`. For every name in `skillNames`,
   `findByName` is called (case-insensitive) — if the skill exists, it is
   linked; if not, a new `Skill` row is created with the typed name and
   linked.
3. Respond **201 Created**, body is the full `CandidateDto`, header
   `Location: /candidate/{id}`.

**Known defect on the Location header.** The path `/candidate/{id}`
singular does not exist; the actual retrieval endpoint is
`/candidates/id/{id}`. This is the current behaviour (recorded under
D-008) and task-03 fixes it.

**No validation.** A request with a missing `fullName` reaches the JDBC
layer and fails with a 500. See Tech-Backend §6 and D-002.

### 4.2 Update a candidate — `PUT /candidates/id/{id}`

Body: same shape as create.

1. Service loads the candidate by id. If absent, respond **404 Not Found**,
   body `"Candidate with requested ID: {id} could not be updated because
   it doesn't exist"`.
2. All fields on the loaded entity are overwritten from the DTO. If
   `skillNames` is non-null, the skill list is rebuilt the same way as in
   §4.1 — existing skills matched by case-insensitive name, missing ones
   created.
3. Save; respond **200 OK** with the updated DTO.

**No email-uniqueness re-check** on update. Setting the email to a value
another candidate already holds raises a unique-constraint violation at
the DB and bubbles up as **500**. This is current behaviour and task-09
adds the uniqueness check.

### 4.3 Delete a candidate — `DELETE /candidates/id/{id}`

1. Service checks `existsById`; if false, respond **404 Not Found**.
2. Otherwise, `deleteById`. The join rows in `candidate_skill` go with the
   candidate (DB §2.3); the `skill` rows do not.
3. Respond **200 OK** with the body `"Candidate with ID: {id} has been
   successfully deleted"`.

**Hard delete, always** (per D-007). No undo, no archive.

### 4.4 Attach a skill to a candidate — `POST /candidates/{candidateId}/skill/{skillName}`

The skill name travels in the URL path (not the body), URL-encoded on the
client (`candidateService.ts:40`).

1. Load the candidate. If absent, respond **404 Not Found**, body
   `"Candidate with ID: {id} not found"`.
2. `skillRepository.findByName(skillName)` — case-insensitive. If present,
   reuse. If absent, create a new skill row with the typed name.
3. If the candidate already has that skill, respond **200 OK** with the
   unchanged candidate DTO; do **not** save (idempotent).
4. Otherwise append the skill, save, respond **200 OK** with the updated
   candidate DTO.

### 4.5 Remove a skill from a candidate — `DELETE /candidates/{candidateId}/skill/{skillId}`

Addresses the skill by **id**, not name — the only endpoint that does.

1. Load the candidate and the skill. If either is absent, respond
   **404 Not Found**.
2. Remove the skill from the candidate's list. Save. Respond **200 OK**
   with the updated DTO.

### 4.6 Skill lifecycle

Skills are:
- **Created** either directly (`POST /skills/skill` — body `{ name }`,
  returns **201** with `Location: /skill/id/{id}`, or **409** on duplicate
  name) or implicitly as part of §4.1 / §4.4.
- **Read** via `GET /skills`, `GET /skills/id/{id}`, or
  `GET /skills/search?prefix=…` (case-insensitive prefix, always **200**,
  returns `[]` on no match — not 404).
- **Updated** via `PUT /skills/id/{id}`. Returns **200** with the new DTO,
  **404** if the id is unknown.
- **Deleted** via `DELETE /skills/id/{id}`. Returns **200** with a text
  body on success, **404** if the id is unknown. If the skill is still
  referenced by any `candidate_skill` row the DELETE fails with a
  constraint violation that bubbles up as **500**. Task-05 adds the
  pre-check.

### 4.7 Search flows

#### 4.7.1 Search candidates by name — `GET /candidates/search/name?name=…`

Case-insensitive substring match on `fullName` (DB §7.1). Returns
**200 OK** with the matching list, or **404 Not Found** with the body
`"No candidates found with name containing: {name}"` when the list is
empty.

**Task-02** changes the empty case to **200 OK** with `[]` (per D-010).

#### 4.7.2 Search candidates by skills — `GET /candidates/search/skills?skillNames=…`

Query parameter `skillNames` is a comma-separated list on the wire; Spring
binds it to `List<String>` (`CandidateController.java:84`). Returns
candidates matching **any** of the requested skills (OR semantics, DB §7.2
and D-004). Returns **404** on empty (same defect as §4.7.1, same fix in
task-02).

The frontend intersects the result with the name filter client-side when
both are present (Tech-Frontend §3 and `candidateStore.ts:37-41`).

#### 4.7.3 Search skills by prefix — `GET /skills/search?prefix=…`

Case-insensitive prefix (DB §7.1-equivalent for skills). Always returns
**200 OK**, even on an empty result (`SkillController.java:38-42`). This
is the shape task-02 is bringing the candidate-search endpoints to.

## 5. Screen inventory

Three pages plus a 404.

### 5.1 Dashboard — `/`

Source: `src/pages/HomePage.tsx`.

- Header with the title "Candidates Dashboard".
- `SearchSection` with a name-filter text input and a skills-filter
  dropdown. Both are bound to the Zustand store (Tech-Frontend §3).
- On first mount, calls `fetchCandidates()`, which re-reads the store's
  current filters and runs the matching backend call. This is what lets
  filters survive back-navigation from §5.2.
- Renders a grid of cards, one per candidate: name, email, up to 5 skill
  tags ("+N" badge if more), contact number, and "Details" / "Delete"
  buttons.
- Delete: `window.confirm(...)` then `removeCandidate(id)` from the store
  (optimistic UI — see Tech-Frontend §3).

See UI §2 for visual rules.

### 5.2 Edit candidate — `/candidate/:id`

Source: `src/pages/CandidateDetailsPage.tsx`.

- Loads one candidate by id plus the full skill list in parallel.
- Form pre-populated with the candidate's values; `dateOfBirth` normalised
  to `YYYY-MM-DD` for the `<input type="date">` via
  `.split("T")[0]` (`CandidateDetailsPage.tsx:36`).
- Skills picker works the same way as §5.3.
- Submit calls `PUT /candidates/id/{id}` and navigates to `/`. A failure
  pops a `window.alert("Error updating candidate.")` — task-11 replaces
  this with an inline banner to match §5.3.

### 5.3 Add candidate — `/add-candidate`

Source: `src/pages/AddCandidatePage.tsx`.

- Empty form with the same five fields.
- Skills picker: typing filters `allSkills` (fetched once on mount) by
  case-insensitive substring; typed-but-not-selected values become new
  skills on submit (per §4.1); `Enter` on free text also adds the typed
  value as a tag before submit.
- Submit calls `POST /candidates/candidate` and navigates to `/`. On
  **409** the server's plain-text body (e.g. `"User with email
  foo@bar.com already exists."`) is rendered in an inline error banner.

### 5.4 Not found — `*`

Inline in the router: `<h1 className="p-4">404 - Page not found.</h1>`.
Single `<h1>`, no navigation help. Noted — not a priority.

## 6. Security

**None, by design.** The application assumes:
- It runs on `localhost` only.
- A single trusted user interacts with it.
- The database runs on `localhost` under the hardcoded
  `postgres:postgres` credentials (Tech-Backend §8).
- The only cross-origin allowance is `http://localhost:5173`
  (`WebConfig.java:17`).

There is no authentication, no authorization, no CSRF protection (not
needed without sessions), no rate limiting, no audit log. This is accepted
under D-006 for the current scope. Any deployment beyond localhost would
require this to be rewritten.

## 7. Data seeding

None. See DB §5. The intended use is to add candidates via the UI once the
services are up. Clearing data is `psql -c "TRUNCATE candidate,
candidate_skill, skill RESTART IDENTITY CASCADE"`.

## 8. Deployment target

Local developer machine, two terminals. See Tech.md §4. There is no
container image, no CI, no hosted environment.

## 9. Implementation task list

See `docs/tasks/active/`. Do not list tasks here — the index is the index.

## 10. Out of scope

Items the project has deliberately not built. Each one is here because the
user confirmed it, not because it was forgotten.

- **Authentication and authorization.** §6, D-006.
- **User management.** No signup, no admin console, no profile.
- **Multi-tenancy / per-user data scoping.** The single database is the
  single workspace.
- **Email verification / password recovery.** No user accounts.
- **File upload** (resume PDFs, photos). No binary data of any kind.
- **Candidate-to-job matching.** This is a catalogue, not a matcher.
- **Reporting / analytics.** No dashboards, no exports, no charts.
- **Notifications** (email, in-app, webhooks).
- **Audit log** (who did what when). No actor exists to record.
- **Internationalisation.** English-only, hardcoded copy.
- **Accessibility compliance work** beyond native HTML semantics.
- **Public cloud deployment** of any kind.
