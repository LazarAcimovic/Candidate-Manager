### Task 14 — Railway deployment (two services)

#### Overview

Make the app deployable on Railway as **two services in one project** — the
Spring Boot backend built from the task-13 `Dockerfile`, and the Vite
frontend built by Nixpacks — talking to a Railway-managed PostgreSQL.
Because this app has **no auth and no cookies** (D-006), the `SameSite` /
Public-Suffix problem that forces single-origin bundling elsewhere does not
apply: two separate `*.up.railway.app` origins work, with CORS allowing the
frontend origin. This task adds the two `railway.toml` files, binds the
server port to Railway's injected `PORT`, documents the topology, and ships
a step-by-step deploy guide.

**The rules for this feature live in `Tech.md` §7** (Railway topology and
the `PG*` → JDBC mapping) and `Tech.md` §5 (the port variable). This file
is only the plan.

**Depends on:** task-08 (env-var contract), task-13 (`Dockerfile`) ·
**Blocks:** nothing

---

#### 14.0 — Docs: Document the Railway deployment in Tech.md §7

Rules: none (this subtask creates the rules' home)
Not in scope: local Docker content (that is §4); the deploy guide prose (14.4).
Docs to update: Tech §7
Verify: `node scripts/check-docs.mjs`

- [x] A new Tech.md `## 7. Railway deployment` section (added to the
      Section index) describes the two-service topology, the env vars each
      service needs, and the `PGHOST`/`PGPORT`/`PGDATABASE`/`PGUSER`/
      `PGPASSWORD` → `jdbc:postgresql://…` mapping (Railway's
      `DATABASE_URL` is not a JDBC URL).
- [x] §7 points at `docs/hosting-railway.md` for the step-by-step guide and
      notes the no-cookie simplification (per D-006).
- Commit: `docs(tech): Railway deployment topology and env mapping`

---

#### 14.1 — DevOps: railway.toml for the backend (Dockerfile build)

Rules: Tech §7
Not in scope: the frontend service (14.2); backend code.
Docs to update: none
Verify: `test -f railway.toml && grep -qi dockerfile railway.toml`

- [x] `railway.toml` at the repo root selects the Dockerfile builder
      (`builder = "DOCKERFILE"`, `dockerfilePath = "Dockerfile"`) and sets
      a restart policy; the Dockerfile `ENTRYPOINT` provides the start
      command.
- [x] A comment lists the env vars the backend service needs in Railway:
      `DB_URL` (built from the Postgres service's `PG*` references),
      `DB_USERNAME`, `DB_PASSWORD`, `CORS_ALLOWED_ORIGIN` (the frontend
      origin). `PORT` is injected by Railway.
- Commit: `build: railway.toml for the backend service`

---

#### 14.2 — DevOps: railway.toml for the frontend (Nixpacks)

Rules: Tech §7
Not in scope: the backend service (14.1).
Docs to update: none
Verify: `test -f frontend/candidate_manager_frontend/railway.toml && grep -qi nixpacks frontend/candidate_manager_frontend/railway.toml`

- [x] `frontend/candidate_manager_frontend/railway.toml` selects the
      Nixpacks builder, builds with `npm ci && npm run build`, and serves
      `dist/` on Railway's `$PORT`.
- [x] A comment marks `VITE_API_BASE_URL` (the backend's public URL) as a
      **required** build-time variable that must be set in the Railway
      frontend service before the first deploy.
- Commit: `build: railway.toml for the frontend service`

---

#### 14.3 — DevOps: Bind server.port to Railway's $PORT

Rules: Tech §5
Not in scope: any other property; the Dockerfile.
Docs to update: Tech §5, Decisions D-011
Verify: `grep -q 'PORT' backend/Candidate_Manager_backend/src/main/resources/application.properties`

- [x] `application.properties` `server.port` honours Railway's injected
      `PORT` first, then the local `SERVER_PORT`, then `8793`
      (`server.port=${PORT:${SERVER_PORT:8793}}`), so the same jar runs
      locally and on Railway unchanged.
- [x] Tech §5 notes the `PORT`-over-`SERVER_PORT` precedence and
      `Decisions.md` records it as D-011.
- Commit: `chore(backend): bind server.port to Railway $PORT`

---

#### 14.4 — Docs: docs/hosting-railway.md step-by-step guide

Rules: none
Not in scope: Tech.md (that is 14.0); code or config files.
Docs to update: none
Verify: `test -f docs/hosting-railway.md`

- [x] `docs/hosting-railway.md` walks through: provision the Railway
      Postgres → set the backend service env vars (`PG*` → `DB_URL`) →
      deploy the backend from the Dockerfile → deploy the frontend with
      Nixpacks and set `VITE_API_BASE_URL` → set `CORS_ALLOWED_ORIGIN` to
      the frontend origin → smoke-test.
- [x] Structure adapted from the attached .NET `hosting_railway.md`, with
      everything mapped to this stack (Spring Boot, JDBC URL) and the
      cookie/SameSite section dropped because this app has no auth (D-006).
- Commit: `docs: step-by-step Railway hosting guide`
