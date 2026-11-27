### Task 13 — Docker local-dev stack

#### Overview

Give the repo a one-command local-dev stack: a `docker-compose.yml` that
runs **PostgreSQL 15** plus the **backend** built from a multi-stage
`Dockerfile`, a root `.env.example` documenting every variable the stack
reads, an idempotent `seed.sql` with sample data, and a README quick-start.
The frontend is still run with `npm run dev` (it is not containerised here).
Nothing about product behaviour changes — this is tooling only.

**The rules for this feature live in `Tech.md` §4** (local-dev workflow and
build), `Tech.md` §5 (env-var contract, already set by task-08) and
`DB.md` §2 / §5 (schema the seed targets, and the seed-data entry).
This file is only the plan — read the rules from those sections.

**Depends on:** task-08 (env-var contract) · **Blocks:** task-14 (Railway
reuses the `Dockerfile`)

---

#### 13.0 — Docs: Document the Docker local-dev workflow in Tech.md §4

Rules: none (this subtask creates the rules' home)
Not in scope: any Railway/cloud content (that is task-14 §7); code or compose files.
Docs to update: Tech §4
Verify: `node scripts/check-docs.mjs`

- [x] Tech.md §4 describes the Docker workflow: `docker compose up -d`
      starts Postgres + backend, `docker compose down` stops them, and the
      frontend still runs separately with `npm run dev`.
- [x] §4 names the artefacts (`docker-compose.yml`, `Dockerfile`,
      `.env.example`, `seed.sql`) and keeps the manual (`mvnw` + local
      Postgres) path as the no-Docker alternative.
- Commit: `docs(tech): document Docker local-dev workflow`

---

#### 13.1 — DevOps: Multi-stage Dockerfile for the backend

Rules: Tech §4
Not in scope: the frontend image; compose wiring (13.2).
Docs to update: none
Verify: `docker build -t candidate-manager-backend .`

- [x] `Dockerfile` at the repo root. Stage 1 builds the jar with
      `maven:3.9-eclipse-temurin-17`; the final stage runs it on a
      Temurin 17 JRE. Build context is the repo root so it can copy
      `backend/Candidate_Manager_backend/`.
- [x] The container binds the port from `${PORT:-8793}` (Railway injects
      `PORT`; local compose sets `SERVER_PORT`), and `EXPOSE`s 8793.
- [x] A `.dockerignore` at the repo root excludes `target/`,
      `node_modules/`, `.git/`, `docs/` so the build context stays small.
- Commit: `build: multi-stage Dockerfile for the backend`

---

#### 13.2 — DevOps: docker-compose.yml for Postgres + backend

Rules: Tech §4, Tech §5
Not in scope: the frontend service; the Dockerfile itself (13.1).
Docs to update: none
Verify: `docker compose config`

- [x] `docker-compose.yml` at the repo root with a `db` service
      (`postgres:15`, `POSTGRES_DB=hr_platform`, user/password `postgres`,
      a named volume, `5432:5432`) and a `backend` service built from the
      `Dockerfile`, `depends_on: db`, published on `8793:8793`.
- [x] `backend` reads its config from the env-var contract (Tech §5):
      `DB_URL=jdbc:postgresql://db:5432/hr_platform`, `DB_USERNAME`,
      `DB_PASSWORD`, `SERVER_PORT`, `CORS_ALLOWED_ORIGIN`, sourced from
      `.env` with the same defaults.
- Commit: `build: docker-compose for Postgres + backend`

---

#### 13.3 — DevOps: Root .env.example for the compose stack

Rules: Tech §5
Not in scope: the frontend `.env.example` (that is task-08's, under `frontend/`).
Docs to update: none
Verify: `docker compose config`

- [x] `.env.example` at the repo root lists every variable the compose
      stack reads with its local default: `DB_URL`, `DB_USERNAME`,
      `DB_PASSWORD`, `SERVER_PORT`, `CORS_ALLOWED_ORIGIN` (and notes the
      frontend's `VITE_API_BASE_URL`).
- [x] Copying it to `.env` makes `docker compose config` resolve every
      `${VAR}` with no warnings.
- Commit: `build: root .env.example for the compose stack`

---

#### 13.4 — Seed: Idempotent seed.sql with sample data

Rules: DB §2.1, DB §2.2, DB §2.3
Not in scope: wiring the seed into app startup; changing the schema.
Docs to update: DB §5
Verify: `docker compose up -d db` then loading `seed.sql` twice yields identical row counts.

- [x] `seed.sql` at the repo root starts with
      `TRUNCATE TABLE candidate_skill, candidate, skill RESTART IDENTITY CASCADE;`
      then inserts a handful of sample `skill`, `candidate` and
      `candidate_skill` rows against the real (singular) table and column
      names from DB §2.
- [x] Re-running the whole script always produces the same clean result
      (idempotent): identity columns are left to auto-generate after the
      reset, so ids are deterministic.
- Commit: `chore(db): idempotent seed.sql with sample data`

---

#### 13.5 — Docs: README Docker quick-start and seed instructions

Rules: none
Not in scope: the source docs under `docs/` (those are 13.0 / 13.4).
Docs to update: none
Verify: `node scripts/check-docs.mjs`

- [x] A **Local dev quick start** block is added at the very top of
      `README.md` (before any other section): `docker compose up -d`,
      `docker compose down`, `docker compose logs -f backend`, and how to
      run the frontend with `npm run dev`.
- [x] A **Seed** note explains that `seed.sql` loads sample data and
      resets corrupted data, with the exact command to run it against the
      compose DB (`hr_platform`).
- Commit: `docs(readme): Docker quick-start and seed instructions`
