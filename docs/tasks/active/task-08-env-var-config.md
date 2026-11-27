### Task 08 — Move hardcoded config to environment variables

#### Overview

DB credentials, the backend port, the CORS allowed origin and the
frontend's API base URL are hardcoded (Tech.md §5, D-005). This task
moves them behind environment variables with sensible local defaults,
without changing any observable behaviour when the defaults apply.

**The rules for this feature live in `Tech.md` §5.**

**Depends on:** nothing · **Blocks:** nothing

---

#### 08.0 — Docs: Specify the env-var contract

Rules: none
Not in scope: code.
Docs to update: Tech.md §5, Decisions D-005
Verify: `node scripts/check-docs.mjs`

- [x] Tech.md §5 lists each variable with its default and its
      consumer: `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `SERVER_PORT`,
      `CORS_ALLOWED_ORIGIN`, `VITE_API_BASE_URL`.
- [x] D-005 flipped to "Superseded by task-08 on <date>".
- Commit: `docs(tech): env-var contract`

---

#### 08.1 — Backend-service: Parameterise application.properties

Rules: Tech.md §5
Not in scope: changing any default.
Docs to update: none
Verify: `./mvnw test` and a manual boot with no env vars set still
listens on `:8793` against `hr_platform`.

- [x] `application.properties` values become
      `${DB_URL:jdbc:postgresql://localhost:5432/hr_platform}` etc.
- [x] `WebConfig` reads `${CORS_ALLOWED_ORIGIN:http://localhost:5173}`.
- Commit: `chore(backend): env-var defaults for config`

---

#### 08.2 — Frontend-service: Read `VITE_API_BASE_URL`

Rules: Tech.md §5, Tech-Frontend §5
Not in scope: the services beyond `apiClient.ts`.
Docs to update: Tech-Frontend §5 (replace the hardcoded URL with the
env read), Tech.md §5
Verify: `npm run build`; with no `.env`, `import.meta.env.VITE_API_BASE_URL`
is `undefined` and the client falls back to `http://localhost:8793`.

- [x] `apiClient.ts` reads
      `import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8793"`.
- [x] `.env.example` at the frontend root documents the variable.
- Commit: `chore(frontend): VITE_API_BASE_URL with localhost fallback`
