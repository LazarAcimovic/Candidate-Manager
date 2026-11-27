# Tech — stack snapshot and deployment

## Section index

> Agents: do not Read this file whole. `grep -n "^## " docs/Tech.md` for live
> line numbers, then Read with `offset`/`limit`. This index carries **no**
> line numbers on purpose.

| Section | Title |
|---|---|
| 1 | Shape |
| 2 | Installed dependencies |
| 3 | Database tooling |
| 4 | Deployment |
| 5 | Env-var contract |
| 6 | What's intentionally simple |
| 7 | Railway deployment |

## 1. Shape

Two-tier app in one repository:

```
Candidate-Manager/
├── backend/   — Spring Boot 3.2 / Java 17 / PostgreSQL
└── frontend/  — React 18 / TypeScript / Vite
```

Backend details live in `Tech-Backend.md`, frontend in `Tech-Frontend.md`.
This file carries only cross-tier facts — the libraries, the deployment
target, and the env-var contract.

## 2. Installed dependencies

### 2.1 Backend (`backend/Candidate_Manager_backend/pom.xml`)

| Dependency                                     | Version | Role                                    |
|------------------------------------------------|---------|-----------------------------------------|
| `spring-boot-starter-parent`                   | 3.2.4   | Platform BOM.                           |
| `spring-boot-starter-data-jpa`                 | (BOM)   | JPA + Hibernate + Spring Data.          |
| `spring-boot-starter-web`                      | (BOM)   | MVC + embedded Tomcat.                  |
| `spring-boot-starter-test`                     | (BOM)   | JUnit 5, Mockito, Spring Test, MockMvc. |
| `spring-boot-devtools`                         | (BOM)   | Hot reload on classpath change.         |
| `org.postgresql:postgresql`                    | (BOM)   | JDBC driver.                            |
| `org.springdoc:springdoc-openapi-starter-webmvc-ui` | 2.3.0 | OpenAPI + Swagger UI.               |

Java target: **17** (`<java.version>17</java.version>` in `pom.xml:30`).
Build tool: **Maven wrapper** (`mvnw`, `mvnw.cmd`).

### 2.2 Frontend (`frontend/candidate_manager_frontend/package.json`)

| Dependency                 | Version | Role                                    |
|----------------------------|---------|-----------------------------------------|
| `react`, `react-dom`       | 18.3.1  | UI runtime.                             |
| `react-router-dom`         | 7.14.0  | Routing (data-router API).              |
| `zustand`                  | 5.0.12  | Global state (see Tech-Frontend §3).    |
| `axios`                    | 1.14.0  | HTTP client.                            |
| `typescript`               | 5.9.3   | Types.                                  |
| `vite`                     | 8.0.1   | Dev server + bundler.                   |
| `@vitejs/plugin-react`     | 6.0.1   | React plugin for Vite.                  |
| `eslint` + `typescript-eslint` + `eslint-plugin-react-hooks` + `eslint-plugin-react-refresh` | (dev) | Linting. |

Note: `@types/react` is 19.x against a react 18.x runtime
(`package.json:16,22`). This is a type-package mismatch that has not surfaced
as a build error but is recorded as a defect in task-06.

### 2.3 Not installed, by design

No Flyway / Liquibase (see §3). No Spring Security. No bean-validation starter
(`spring-boot-starter-validation`) — DTOs have no `@Valid` / `@NotBlank`
annotations; see task-04 and D-002. No test framework on the frontend (no
Vitest, no Jest, no Playwright, no Testing Library); see Tech-Frontend §5
and task-07. No bundler-side env-file loader (frontend reads no env vars;
backend URL is hardcoded, see `frontend/candidate_manager_frontend/src/services/apiClient.ts:4`).

## 3. Database tooling

**PostgreSQL 15+** via the stock `org.postgresql` JDBC driver.

### 3.1 Schema management

`spring.jpa.hibernate.ddl-auto=update`
(`backend/Candidate_Manager_backend/src/main/resources/application.properties:11`).
Hibernate reconciles the entity graph against the live schema on each boot:
new columns are added, existing columns are left alone. There is no
migration directory, no versioned history, and no rollback. See D-003 for
the trade-off and refactor-01 for the planned replacement.

### 3.2 Connection

Hardcoded in `application.properties`:

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/hr_platform
spring.datasource.username=postgres
spring.datasource.password=postgres
```

See §5 for the env-var contract that **should** carry these in a non-dev
deployment.

## 4. Deployment

### 4.1 Local development

Two ways to run the stack locally.

**With Docker (recommended).** `docker-compose.yml` at the repo root runs
PostgreSQL 15 and the backend (built from the multi-stage `Dockerfile`);
the frontend is still run with Vite:

```bash
docker compose up -d            # Postgres + backend (backend on :8793)
docker compose logs -f backend  # tail backend logs
docker compose down             # stop everything

cd frontend/candidate_manager_frontend
npm install && npm run dev      # UI on :5173
```

`seed.sql` loads idempotent sample data:
`docker compose exec -T db psql -U postgres -d hr_platform < seed.sql`.
Copy `.env.example` to `.env` to override any value in the §5 contract.

**Without Docker.** Run PostgreSQL yourself (a database named `hr_platform`)
and start each tier directly:

```bash
cd backend/Candidate_Manager_backend && ./mvnw spring-boot:run        # :8793
cd frontend/candidate_manager_frontend && npm install && npm run dev  # :5173
```

Open `http://localhost:5173` for the UI; `http://localhost:8793/swagger-ui.html`
for the API explorer (see `OpenApiConfig.java:9-19`).

### 4.2 Cloud

Railway — two services plus a managed PostgreSQL. The contract is §7; the
step-by-step guide is `docs/hosting-railway.md`.

## 5. Env-var contract

Every value that differs between a developer's laptop and any other
environment is read from an environment variable, with the old hardcoded
value kept as the default. With **no** variables set, the app behaves
exactly as it did before task-08 (per D-005, now superseded).

| Variable              | Default                                        | Consumer                                                        |
|-----------------------|------------------------------------------------|-----------------------------------------------------------------|
| `SERVER_PORT`         | `8793`                                          | `application.properties` → `server.port`                        |
| `DB_URL`              | `jdbc:postgresql://localhost:5432/hr_platform` | `application.properties` → `spring.datasource.url`              |
| `DB_USERNAME`         | `postgres`                                      | `application.properties` → `spring.datasource.username`         |
| `DB_PASSWORD`         | `postgres`                                      | `application.properties` → `spring.datasource.password`         |
| `CORS_ALLOWED_ORIGIN` | `http://localhost:5173`                         | `WebConfig.java` CORS allowed origin(s)                         |
| `VITE_API_BASE_URL`   | `http://localhost:8793`                         | `frontend/candidate_manager_frontend/src/services/apiClient.ts` |

The backend reads its variables through Spring's `${VAR:default}`
placeholder syntax — directly in `application.properties`, and via
`@Value` in `WebConfig`. `CORS_ALLOWED_ORIGIN` accepts a comma-separated
list, so a deployed frontend origin and `http://localhost:5173` can both
be allowed at once. The frontend variable is a Vite build-time value read
as `import.meta.env.VITE_API_BASE_URL` with a `?? "http://localhost:8793"`
fallback; `frontend/candidate_manager_frontend/.env.example` documents it.

## 6. What's intentionally simple

These are not bugs. They are shape decisions whose cost the project has
accepted.

- **No authentication.** API is open; frontend assumes a single trusted user
  on localhost. See PRD §6 and D-006.
- **No authorization.** Every endpoint is reachable; nothing is per-tenant.
- **No input validation.** DTO fields are nullable at the type level and
  nothing rejects bad shapes before they reach the service layer. (D-002.)
- **No pagination.** List and search endpoints return the full result set.
  Documented current behaviour; task-01 adds server-side pagination.

## 7. Railway deployment

The app deploys to **Railway** as **two services in one project** plus a
Railway-managed PostgreSQL. Because there is no auth and no cookies
(D-006), the two services may sit on separate `*.up.railway.app` origins;
CORS is the only cross-origin concern. The step-by-step guide is
`docs/hosting-railway.md`; this section is the contract.

| Service  | Build                                    | Key variables set in Railway                                 |
|----------|------------------------------------------|--------------------------------------------------------------|
| backend  | root `Dockerfile` + `railway.toml`       | `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `CORS_ALLOWED_ORIGIN` |
| frontend | Nixpacks (frontend `railway.toml`)       | `VITE_API_BASE_URL` (the backend's public URL)               |
| Postgres | Railway plugin                           | provides `PGHOST` / `PGPORT` / `PGDATABASE` / `PGUSER` / `PGPASSWORD` |

**Database URL.** Railway's `DATABASE_URL` (`postgresql://…`) is not a JDBC
URL, so the datasource is assembled from the Postgres service's reference
variables:

```
DB_URL      = jdbc:postgresql://${PGHOST}:${PGPORT}/${PGDATABASE}
DB_USERNAME = ${PGUSER}
DB_PASSWORD = ${PGPASSWORD}
```

(written in Railway's console as `${{Postgres.PGHOST}}` and so on).

**Port.** The backend binds Railway's injected `PORT` with no code change,
through `server.port=${PORT:${SERVER_PORT:8793}}` (§5, D-011).

**Schema.** `ddl-auto=update` (§3.1) creates the tables on first boot
against the empty Railway database; no migration tool is required to
deploy. `seed.sql` can be loaded over the public connection string.

**CORS.** Set the backend's `CORS_ALLOWED_ORIGIN` to the frontend's public
URL; it accepts a comma-separated list, so `http://localhost:5173` can stay
allowed alongside it.
- **No soft delete.** Everything is a hard DELETE. (D-007.)
- **No structured logging / observability beyond Hibernate SQL at DEBUG.**
- **No CI, no deploy pipeline, no containerisation.** Local only.
