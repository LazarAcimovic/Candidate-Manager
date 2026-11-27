### Task 04 — Add bean validation to DTOs

#### Overview

DTOs have no `@NotBlank` / `@Size` / `@Email` annotations and the
project does not depend on `spring-boot-starter-validation` (D-002). A
request with a missing `fullName` reaches the JDBC layer and surfaces
as a 500 instead of a clean 400. This task installs the starter,
annotates the five DTOs, and wires a `@ControllerAdvice` that returns
`400 Bad Request` with a shape like `{ field: message }` on validation
failure.

**The rules for this feature live in `PRD.md` §4.1 (create) and §4.2
(update) and will be extended with a new §6.1 "Validation".** This file
is only the plan.

**Depends on:** nothing · **Blocks:** nothing

---

#### 04.0 — Docs: Specify the field rules

Rules: none (this subtask creates the rules' home)
Not in scope: code.
Docs to update: PRD §6.1 (new), Tech-Backend §6, Decisions D-002
Verify: `node scripts/check-docs.mjs`

- [ ] PRD §6.1 added with: `fullName` 1..120 chars; `email` RFC-ish via
      `@Email`; `contactNumber` 1..40 chars; `dateOfBirth` not in the
      future; `skillNames` each 1..60 chars.
- [ ] Tech-Backend §6 updated to say validation is wired; the
      `@ControllerAdvice` shape is specified here.
- [ ] D-002 flipped to "Superseded by task-04 on <date>" once the task
      lands.
- Commit: `docs(prd): validation rules on candidate inputs`

---

#### 04.1 — Backend-endpoint: Annotate DTOs and wire the advice

Rules: PRD §6.1, Tech-Backend §6
Not in scope: the `SkillCreateDto` / `SkillUpdateDto` beyond
`@NotBlank` on `name` — the skills surface has no other inputs.
Docs to update: Tech-Backend §6 (confirm the implementation matches)
Verify: `./mvnw test`

- [ ] `spring-boot-starter-validation` added to `pom.xml`.
- [ ] DTOs carry the annotations from PRD §6.1.
- [ ] Controllers mark DTOs with `@Valid`.
- [ ] `GlobalExceptionHandler` under
      `candidateManager.controllers` (or a new `.advice` package) maps
      `MethodArgumentNotValidException` to `400` with
      `{ field: message }`.
- [ ] New tests: a missing-field payload for create returns 400 with
      the mapped shape; a malformed email returns 400.
- Commit: `feat(backend): bean validation on candidate and skill DTOs`
