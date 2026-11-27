# Tech — Backend

## Section index

| Section | Title |
|---|---|
| 1 | Project layout |
| 2 | Request pipeline |
| 3 | Dependency injection |
| 4 | Authorization layering |
| 5 | Tokens |
| 6 | Validation |
| 7 | Error handling |
| 8 | Secrets |
| 9 | Time handling |
| 10 | Testing |

## 1. Project layout

Package root: `candidateManager`
(`backend/Candidate_Manager_backend/src/main/java/candidateManager/`). The
package name is a single lowercase identifier rather than reverse-DNS; this
is a historical choice. The module layout follows a controller → service →
repository Spring convention.

```
backend/Candidate_Manager_backend/
├── pom.xml
├── mvnw, mvnw.cmd
└── src/
    ├── main/
    │   ├── java/candidateManager/
    │   │   ├── CandidateManagerBackendApplication.java   — @SpringBootApplication entry
    │   │   ├── config/
    │   │   │   ├── OpenApiConfig.java                    — Swagger metadata
    │   │   │   └── WebConfig.java                        — CORS mapping
    │   │   ├── controllers/
    │   │   │   ├── CandidateController.java              — /candidates/**
    │   │   │   └── SkillController.java                  — /skills/**
    │   │   ├── DTOs/                                     — folder name uppercase by convention
    │   │   │   ├── CandidateCreateDto.java
    │   │   │   ├── CandidateDto.java
    │   │   │   ├── CandidateUpdateDto.java
    │   │   │   ├── SkillCreateDto.java
    │   │   │   ├── SkillDto.java
    │   │   │   └── SkillUpdateDto.java
    │   │   ├── implementation/
    │   │   │   ├── CandidateServiceImpl.java
    │   │   │   └── SkillServiceImpl.java
    │   │   ├── models/
    │   │   │   ├── Candidate.java                        — @Entity, @ManyToMany FetchType.EAGER
    │   │   │   └── Skill.java                            — @Entity, mapped-by side
    │   │   ├── repository/
    │   │   │   ├── CandidateRepository.java              — JpaRepository + 3 native queries
    │   │   │   └── SkillRepository.java                  — JpaRepository + 2 native queries
    │   │   └── services/
    │   │       ├── CandidateService.java                 — interface
    │   │       └── SkillService.java                     — interface
    │   └── resources/
    │       └── application.properties                    — DB creds, Hibernate DDL mode, log levels
    └── test/
        └── java/candidateManager/
            ├── CandidateManagerBackendApplicationTests.java  — context-load smoke test
            ├── controllers/
            │   ├── CandidateControllerTest.java          — @WebMvcTest slice
            │   └── SkillControllerTest.java              — @WebMvcTest slice
            └── services/
                ├── CandidateServiceImplTest.java         — @ExtendWith(MockitoExtension.class)
                └── SkillServiceImplTest.java             — same
```

> verified at a58f5ab

Notes:
- `DTOs/` (uppercase folder) is a convention deviation from `models/`,
  `services/`, etc., but it is left as-is to avoid churn. Not to be extended
  elsewhere.
- `services/` holds interfaces; `implementation/` holds `*Impl` classes. Each
  concrete service implements its sibling interface.
- The `@SpringBootApplication` scans `candidateManager`, so controllers,
  services and repositories under any subpackage are auto-registered.

## 2. Request pipeline

Standard Spring MVC stack, nothing custom in it:

1. Embedded Tomcat on port **8793** (`application.properties:1`) accepts the
   HTTP request.
2. `WebConfig.addCorsMappings` (`WebConfig.java:15-21`) is the first and
   **only** CORS gate. Allowed origin: exactly
   `http://localhost:5173`. Allowed methods: GET, POST, PUT, DELETE, OPTIONS.
3. Spring MVC routes to the matching `@RequestMapping`. All endpoints are
   `@RestController` methods under `controllers/`.
4. Request bodies are Jackson-deserialised into the DTOs under `DTOs/`.
   `LocalDate` is parsed as ISO-8601 (`YYYY-MM-DD`) via Jackson's JSR-310
   module (pulled in by `spring-boot-starter-web`).
5. Controller calls a `*Service` interface; `@Service` picks up the `*Impl`
   under `implementation/`.
6. Response bodies are serialised back through Jackson. `Skill.candidates`
   carries `@JsonIgnore` (`Skill.java:20`) to break the M:N cycle.

No filters, no interceptors, no middleware beyond CORS.

## 3. Dependency injection

Field injection via `@Autowired` on private fields. Example:
`CandidateController.java:21-25`. Constructor injection is **not** used
anywhere; adopting it is a refactor-tier change and is not blocking (no task
yet). Service beans are picked up by `@Service`; controllers by
`@RestController`; repositories by `@Repository` (and by Spring Data's
proxy).

## 4. Authorization layering

**There is no authorization layer.** Every endpoint is public. Spring
Security is not on the classpath. No bearer token, no cookie, no API key is
required or honoured. This is the shape today and documented in PRD §6 and
D-006. Adding any layer at all is out of scope until the project moves off
localhost.

## 5. Tokens

Not applicable. See §4.

## 6. Validation

Not wired. DTOs are plain POJOs with getters and setters, no annotations.
A `POST /candidates/candidate` with an empty body is deserialised to a
`CandidateCreateDto` whose fields are all `null`, and the service writes
that row (except the `email` existence check bails first). Database
`NOT NULL` constraints catch what the service does not — a null
`full_name` fails at the JDBC layer with a `DataIntegrityViolationException`
that Spring turns into a **500 Internal Server Error**, not a 400.

This is current behaviour, confirmed intentional for the demo scope under
D-002, with task-04 open to add bean validation.

## 7. Error handling

No `@ControllerAdvice`. Each controller method wires its own branch for
the "not found" / "conflict" paths and returns the specific status plus a
plain-text body (e.g. `CandidateController.java:38-39`,
`CandidateController.java:45-46`). Anything the controllers do not catch —
validation failure, constraint violation, database outage — falls through
to Spring's default `BasicErrorController`, which returns a JSON body with
`timestamp`, `status`, `error`, `path`. Timing or request IDs are not
logged.

Status-code conventions in use:
- `200 OK` — happy read / happy write / happy delete.
- `201 Created` with `Location: …` — successful `POST /candidates/candidate`
  and `POST /skills/skill`. See PRD §4.1 and D-008 (the Location header on
  create-candidate is wrong today).
- `404 Not Found` — missing resource by id **and** empty search result
  (today; task-02 switches search endpoints to 200 with `[]`).
- `409 Conflict` — duplicate email on create (`CandidateController.java:44-47`),
  duplicate skill name on create (`SkillController.java:46-49`).

## 8. Secrets

Hardcoded in `application.properties`: DB username `postgres`, password
`postgres`. See Tech.md §5 for the env-var contract and task-08 for the
move to environment-sourced config.

## 9. Time handling

`LocalDate` only (date-of-birth). No timestamps, no timezones, no `Instant`
anywhere in the entity graph. There is no "created at" or "updated at"
column; the audit question is answered by the absence — records carry no
timeline.

`spring.jpa.show-sql=true` and `logging.level.org.hibernate.SQL=DEBUG`
(`application.properties:12,15`) make every SQL statement visible in the
console. Not safe to leave on in a shared environment.

## 10. Testing

### 10.1 Framework and location

- **JUnit 5** (`org.junit.jupiter.api.*`) — assertions.
- **Mockito** (`org.mockito.*`) — mocking collaborators at the service layer.
- **Spring Test / MockMvc** (`@WebMvcTest`, `@MockBean`) — slice tests at the
  controller layer.
- No integration tests against a real database. No Testcontainers.
- No end-to-end tests.

Test tree:

```
src/test/java/candidateManager/
├── CandidateManagerBackendApplicationTests.java   — context-load smoke test
├── controllers/                                   — WebMvcTest slice
│   ├── CandidateControllerTest.java
│   └── SkillControllerTest.java
└── services/                                      — Mockito unit
    ├── CandidateServiceImplTest.java
    └── SkillServiceImplTest.java
```

### 10.2 Conventions

- **Unit tests** use `@ExtendWith(MockitoExtension.class)` with `@Mock`
  for repositories and `@InjectMocks` on the service. One `*Impl` per
  test class. No `@SpringBootTest`.
- **Slice tests** use `@WebMvcTest(ControllerClass.class)` with `@MockBean`
  for every service the controller depends on. Serialisation goes through
  the autowired `ObjectMapper`.
- **No fixtures / no test data builders.** Each test builds its objects
  inline. For a project of this size this is accepted; growing fixtures
  is out of scope.
- **No seed strategy.** Service tests mock the repositories; controller
  slice tests mock the services. No real Postgres is reached by any test.

### 10.3 Mocking convention

- Controllers get `@MockBean` services.
- Services get `@Mock` repositories, `@InjectMocks` on the SUT.
- `when(...)...thenReturn(...)` for stubbing; `verify(...)` for behavioural
  assertions where the test is about the call, not the return value.

### 10.4 Anti-patterns to avoid

- Do not add `@SpringBootTest` to a controller slice test — the
  `@WebMvcTest` slice is deliberate: it is fast, and it does not pull in
  the JPA layer.
- Do not stub `candidateRepository.save(...)` to return a different object
  than its argument unless the test is specifically about that case; the
  service `save → map → return` pipeline expects identity.
- Do not test two `*Impl` classes in the same file.
- Do not put integration tests in `src/test/java` beside the unit tests
  without a package or naming convention — when integration arrives, give
  it its own subtree. (Task-10.)

### 10.5 How to run

```bash
cd backend/Candidate_Manager_backend
./mvnw test                         # all suites
./mvnw test -Dtest=CandidateServiceImplTest   # one class
./mvnw test -Dtest='*ControllerTest'          # pattern
```
