### Task 07 — Install a frontend test framework

#### Overview

There is no test framework on the frontend (Tech-Frontend §9). This
task installs Vitest + Testing Library + MSW, writes the first smoke
test on the store, documents the conventions already outlined in
Tech-Frontend §9 so they become enforceable, and adds an `npm run test`
script.

**The rules for this feature live in `Tech-Frontend.md` §9.**

**Depends on:** nothing · **Blocks:** task-11

---

#### 07.0 — Docs: Lock the conventions

Rules: none
Not in scope: code.
Docs to update: Tech-Frontend §9, Decisions (a new entry)
Verify: `node scripts/check-docs.mjs`

- [ ] Tech-Frontend §9 rewritten with: Vitest config, co-located
      `*.test.tsx`, Testing Library render helpers, MSW at the HTTP
      boundary, fixtures under `src/__tests__/fixtures/`, time control
      via `vi.useFakeTimers`.
- [ ] A new Decisions entry records the choice of Vitest over Jest (native ESM, same
      bundler as the app).
- Commit: `docs(tech-frontend): lock the test-framework conventions`

---

#### 07.1 — Frontend-service: Install Vitest, Testing Library, MSW

Rules: Tech-Frontend §9
Not in scope: writing component or page tests (those come with the
feature tasks).
Docs to update: Tech.md §2.2 (strike "no test framework on the
frontend"), Tech-Frontend §1 (update the layout block for the new files)
Verify: `npm run test` runs and exits 0 with the single smoke test
passing.

- [ ] `vitest`, `@testing-library/react`, `@testing-library/user-event`,
      `@testing-library/jest-dom`, `msw`, `jsdom` added to
      `devDependencies`.
- [ ] `vitest.config.ts` (or `vite.config.ts` test block) with
      `environment: "jsdom"` and a `setupFiles` for Testing Library's
      jest-dom matchers.
- [ ] One smoke test: `src/store/candidateStore.test.ts` asserts the
      initial `nameFilter === ""` and `skillsFilter.length === 0`.
- [ ] `"test": "vitest"` added to `package.json` scripts.
- Commit: `feat(frontend): install vitest and testing library`

---

#### 07.2 — Frontend-service: Wire MSW for service tests

Rules: Tech-Frontend §9
Not in scope: writing MSW handlers for every endpoint — only the ones
the first service test needs.
Docs to update: Tech-Frontend §9
Verify: `npm run test`

- [ ] `src/__tests__/msw/handlers.ts` with a baseline handler for
      `GET /candidates`.
- [ ] `src/__tests__/msw/server.ts` exporting `setupServer(...)`.
- [ ] `setupFiles` starts and stops the server per suite.
- [ ] One service test: `src/services/candidateService.test.ts` asserts
      `getAll()` resolves to the MSW-mocked list.
- Commit: `feat(frontend): msw baseline for service tests`
