# Active implementation tasks

> Open tasks live as individual files in this folder. Read this index
> first, then only the task file you are working on. **Resume at the first
> unchecked subtask** and tick it in the same commit as its work. A task
> file still being here does not mean nothing has been done.

Progress counts subtasks; a subtask counts as done only when every one of
its boxes is ticked.

`What's left` describes the *remaining* work in a dozen words or so; it
never restates the count, and it only changes when the shape of what
remains changes.

| Task | Title | Progress | What's left | Depends on | Blocks | File |
|---|---|---|---|---|---|---|
| 01 | Server-side pagination on list and search | 0/3 | design the page contract; add Pageable to repos; wire frontend | — | — | [task-01-server-side-pagination.md](task-01-server-side-pagination.md) |
| 02 | Search endpoints return 200 with `[]` instead of 404 | 0/3 | flip controllers, update slice tests, update store error path | — | — | [task-02-search-200-on-empty.md](task-02-search-200-on-empty.md) |
| 03 | Fix `POST /candidates/candidate` Location header | 0/2 | align header to `/candidates/id/{id}` | — | — | [task-03-fix-location-header.md](task-03-fix-location-header.md) |
| 04 | Add bean validation to DTOs | 0/2 | install starter, annotate DTOs, surface 400s | — | — | [task-04-add-bean-validation.md](task-04-add-bean-validation.md) |
| 05 | Pre-check skill deletion against `candidate_skill` | 0/2 | detect in-use skill; return 409 instead of 500 | — | — | [task-05-skill-delete-in-use.md](task-05-skill-delete-in-use.md) |
| 06 | Align `@types/react` to the React 18.x runtime | 0/1 | downgrade the two @types packages | — | — | [task-06-align-react-types.md](task-06-align-react-types.md) |
| 07 | Install a frontend test framework | 0/3 | Vitest + Testing Library + MSW baseline | — | 11 | [task-07-frontend-test-framework.md](task-07-frontend-test-framework.md) |
| 08 | Move hardcoded config to environment variables | 3/3 | ready to archive | — | — | [task-08-env-var-config.md](task-08-env-var-config.md) |
| 09 | Email-uniqueness pre-check on `PUT /candidates/id/{id}` | 0/2 | detect collision; return 409 instead of 500 | — | — | [task-09-update-email-uniqueness.md](task-09-update-email-uniqueness.md) |
| 10 | Backend integration-test suite with Testcontainers | 0/3 | add dep, first schema test, docs | — | — | [task-10-backend-integration-tests.md](task-10-backend-integration-tests.md) |
| 11 | Replace `window.alert` with an inline banner on edit | 0/2 | banner markup + tests | 07 | — | [task-11-edit-page-error-banner.md](task-11-edit-page-error-banner.md) |
| 12 | Extract error-banner primitive and token | 0/2 | lift `#f8d7da` into `--danger-bg`; one component | 11 | — | [task-12-error-banner-primitive.md](task-12-error-banner-primitive.md) |
| 13 | Docker local-dev stack | 6/6 | all subtasks done — ready to archive | 08 | 14 | [task-13-docker-local-dev.md](task-13-docker-local-dev.md) |
| 14 | Railway deployment (two services) | 5/5 | all subtasks done — ready to archive | 08, 13 | — | [task-14-railway-deploy.md](task-14-railway-deploy.md) |
