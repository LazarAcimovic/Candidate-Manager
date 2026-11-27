### Task 10 — Backend integration-test suite with Testcontainers

#### Overview

Service tests are mocked and controller tests are `@WebMvcTest` slices
(Tech-Backend §10). Nothing exercises the real repository queries or
the Hibernate mapping against a live Postgres. This task adds
Testcontainers + Postgres and the first integration test — a schema
assertion that the entity graph boots against an empty database.

**The rules for this feature live in `Tech-Backend.md` §10.**

**Depends on:** nothing · **Blocks:** nothing

---

#### 10.0 — Docs: Add the integration-test layout

Rules: none
Not in scope: code.
Docs to update: Tech-Backend §10, Decisions (a new entry)
Verify: `node scripts/check-docs.mjs`

- [ ] Tech-Backend §10 gains a subsection "Integration tests" naming
      `src/test/java/.../integration/` and the Testcontainers container
      reuse strategy.
- [ ] A new Decisions entry records Testcontainers over an embedded DB (schema parity
      with prod is the priority).
- Commit: `docs(tech-backend): integration test shape`

---

#### 10.1 — Backend-migration: Add the dependency and the first test

Rules: Tech-Backend §10 (integration subsection)
Not in scope: rewriting any existing mocked test as integration.
Docs to update: Tech.md §2.1 (list the new test dep)
Verify: `./mvnw test`

- [ ] `org.testcontainers:postgresql` added to `pom.xml` under `test`.
- [ ] `src/test/resources/application-test.properties` points at the
      container URL via a `@DynamicPropertySource`.
- [ ] One test under
      `src/test/java/candidateManager/integration/SchemaIT.java`
      asserts that `candidateRepository.count()` returns 0 on a fresh
      container.
- Commit: `test(backend): testcontainers + schema smoke test`

---

#### 10.2 — Backend-migration: One happy-path integration test per resource

Rules: Tech-Backend §10
Not in scope: covering every branch — this is a baseline, not the
whole suite.
Docs to update: none
Verify: `./mvnw test`

- [ ] `CandidateIT.create_then_get` — POST a candidate, GET it back,
      skill list persists.
- [ ] `SkillIT.search_by_prefix_is_case_insensitive` — insert two
      skills, search with a mixed-case prefix, assert both match.
- Commit: `test(backend): happy-path integration tests for candidates and skills`
