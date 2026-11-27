# Hosting Candidate Manager on Railway

> A practical, step-by-step guide. It is a how-to, not a source of truth:
> the env-var contract lives in `docs/Tech.md` §5, the schema in
> `docs/DB.md`, and the no-auth decision in `docs/Decisions.md` D-006.

---

## 0. How to read this document

| Part | What it contains |
|------|------------------|
| §1   | What we are deploying and the topology |
| §2   | Before you start (prerequisites) |
| §3   | Step-by-step procedure (steps 1-6) |
| §4   | Optional: loading `seed.sql` |
| §5   | The one thing to get right: CORS |
| §6   | Updating, maintenance, cost |
| §7   | Troubleshooting |

Markers used above code and instructions:

- **LOCAL** - run on your own machine (terminal)
- **RAILWAY** - click in the Railway dashboard, no commands

---

## 1. What we are deploying

| Piece    | Technology                              | How Railway builds it              |
|----------|-----------------------------------------|------------------------------------|
| Backend  | Spring Boot 3.2, Java 17, Maven         | Repo-root `Dockerfile`             |
| Frontend | React 18 + Vite (static SPA)            | Nixpacks, root directory `frontend/candidate_manager_frontend` |
| Database | PostgreSQL                              | Railway-managed Postgres service   |

**Topology: one Railway project, three services.**

```
Browser
  |-- https://<frontend>.up.railway.app   (Vite static site)
  |        |
  |        |  fetch(VITE_API_BASE_URL)
  |        v
  |-- https://<backend>.up.railway.app    (Spring Boot, binds $PORT)
           |
           |  JDBC (private network)
           v
        Postgres (Railway-managed)
```

**Why two separate public origins are fine here.** The application has no
login, no session and no cookies (D-006), so the usual cross-site cookie
problems (SameSite, Public Suffix List on `*.up.railway.app`) do not
apply. The browser simply makes cross-origin `fetch` calls, which the
backend permits through CORS. CORS is the one thing to configure
correctly (§5).

**Security note.** D-006 states the app is meant for a single trusted
user on their own machine and that "any deployment beyond localhost would
re-open this decision". A public Railway deployment has no authentication:
anyone with the URL can read and delete candidates. Treat this as a demo
deployment and do not load real personal data into it.

---

## 2. Before you start

- A GitHub account and this repository (it must be pushed to GitHub).
- A Railway account (railway.com). Sign in with GitHub. Check current
  plan limits and pricing on railway.com yourself; they change.
- The repo contains, from earlier work:
  - env-var configuration in `application.properties`, `WebConfig.java`
    and `apiClient.ts` (`docs/Tech.md` §5),
  - the repo-root `Dockerfile` and `railway.toml` (task-13 / task-14).
    Confirm they exist on the branch you deploy.

Railway injects `PORT` into the backend. `application.properties` uses
`server.port=${PORT:${SERVER_PORT:8793}}`, so the backend binds the right
port automatically. No code change is needed at deploy time.

---

## 3. Step-by-step procedure

### Step 1 - Push the repository to GitHub

**LOCAL**

```bash
git status                 # working tree should be clean
git push origin main
```

Railway deploys from GitHub, so everything it needs (`Dockerfile`,
`railway.toml`, both source trees) must be on the pushed branch.

### Step 2 - Create the project and provision PostgreSQL

**RAILWAY**

1. Dashboard -> **New Project** -> **Deploy PostgreSQL**.
2. Railway creates a project containing one service. Rename it to
   `Postgres` (click the service, Settings -> name). The reference
   variables below use that exact name; if you pick another name, change
   `Postgres` accordingly in step 3.
3. Open the service's **Variables** tab. You should see `PGHOST`,
   `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD`, `DATABASE_URL` and
   `DATABASE_PUBLIC_URL`.

> `DATABASE_URL` looks like `postgresql://user:pass@host:5432/railway`.
> That is **not** a JDBC URL and Spring cannot use it. The backend gets
> its connection from the individual `PG*` variables instead (step 3).

The database is empty. You do not need to run any migration: with
`ddl-auto=update` Hibernate creates the tables on the backend's first
boot (`docs/Tech.md` §3, `docs/DB.md`).

### Step 3 - Add the backend service (Dockerfile build)

**RAILWAY**

1. In the project: **New** -> **GitHub Repo** -> select this repository.
2. Rename the new service to `backend`.
3. **Settings** -> confirm:
   - **Root Directory**: empty (repo root, where the `Dockerfile` is).
   - **Builder**: Dockerfile (Railway detects the root `Dockerfile`; a
     `railway.toml` can also pin this).
4. **Variables** tab -> add the following. Use **New Variable** for each;
   the `${{...}}` syntax is Railway's reference to another service's
   variable and is resolved at deploy time.

| Variable              | Value                                                                | Notes |
|-----------------------|----------------------------------------------------------------------|-------|
| `DB_URL`              | `jdbc:postgresql://${{Postgres.PGHOST}}:${{Postgres.PGPORT}}/${{Postgres.PGDATABASE}}` | Built from parts, JDBC format |
| `DB_USERNAME`         | `${{Postgres.PGUSER}}`                                               | |
| `DB_PASSWORD`         | `${{Postgres.PGPASSWORD}}`                                           | |
| `CORS_ALLOWED_ORIGIN` | set in step 5                                                        | Needs the frontend URL, which does not exist yet |

   Do **not** set `PORT` or `SERVER_PORT`; Railway provides `PORT`.

5. **Settings** -> **Networking** -> **Generate Domain**. Note the URL,
   for example `https://backend-production-xxxx.up.railway.app`. Call it
   `BACKEND_URL`.
6. Watch **Deployments** -> **View logs**. A healthy start ends with a
   Spring Boot "Started ... in N seconds" line, and Hibernate's DDL
   output shows the tables being created.

Quick check from your machine:

**LOCAL**

```bash
curl -i https://<BACKEND_URL>/swagger-ui.html
```

A redirect or HTML response means the backend is up. A browser request
from the frontend will still be blocked by CORS until step 5.

### Step 4 - Add the frontend service (Nixpacks)

**RAILWAY**

1. In the same project: **New** -> **GitHub Repo** -> the same
   repository again. This creates a second service from the same repo.
2. Rename it to `frontend`.
3. **Settings** -> **Root Directory** -> `frontend/candidate_manager_frontend`.
   Railway then builds only that folder with Nixpacks (it detects
   `package.json`, runs `npm install` and the `build` script).
4. **Variables** tab -> add:

| Variable            | Value                      |
|---------------------|----------------------------|
| `VITE_API_BASE_URL` | `https://<BACKEND_URL>`    |

   Use the backend's public `https://` URL from step 3, with no trailing
   slash. This is a **Vite build-time** variable: it is baked into the JS
   bundle during the build. If you change it later, you must **redeploy**
   the frontend, not just restart it.

5. Make sure the service serves the built `dist/` output. The start
   command (set in Settings -> Deploy, or in the service's
   `railway.toml` if one is present for the frontend) must serve static
   files on `$PORT`, for example:

   ```
   npx serve -s dist -l $PORT
   ```

   If the frontend directory already carries a Railway config from
   task-14, use that instead. Check the repo rather than assuming.

6. **Settings** -> **Networking** -> **Generate Domain**. Note the URL,
   for example `https://frontend-production-yyyy.up.railway.app`. Call it
   `FRONTEND_URL`.

### Step 5 - Point the backend's CORS at the frontend

**RAILWAY**

1. Open the `backend` service -> **Variables**.
2. Set `CORS_ALLOWED_ORIGIN` = `https://<FRONTEND_URL>` (scheme and host
   only: no path, no trailing slash).
3. Optional: a comma-separated list is supported, so you can keep local
   development working as well:

   ```
   https://<FRONTEND_URL>,http://localhost:5173
   ```

4. Saving a variable triggers a redeploy of the backend. Wait for it to
   become healthy again.

The origin must match **exactly** what the browser shows in the address
bar of the frontend (scheme, host, no trailing slash). `http` vs `https`
or a stray `/` makes the browser reject every response.

### Step 6 - Smoke test

1. Open `https://<FRONTEND_URL>` in a browser. The candidate list page
   should load without an error banner.
2. Create a candidate through the UI form.
3. Reload the page. The candidate is still there, so it persisted in
   Postgres. (Optionally confirm in the Postgres service's **Data** tab.)
4. Open `https://<BACKEND_URL>/swagger-ui.html`. Swagger UI should load
   and list the API endpoints.
5. Open the browser dev tools -> Network. API calls should go to
   `BACKEND_URL` and return 2xx, with no CORS errors in the console.

If any of these fail, see §7.

---

## 4. Optional: loading seed data

The tables are created by Hibernate on first boot and start empty. If the
repo has a `seed.sql` (see `docs/DB.md` seed section), load it once:

1. **RAILWAY**: Postgres service -> **Settings** -> **Networking** ->
   enable **Public Networking** (TCP proxy). This makes
   `DATABASE_PUBLIC_URL` usable from your machine.
2. Copy `DATABASE_PUBLIC_URL` from the Postgres **Variables** tab.
3. **LOCAL** (requires a `psql` client):

   ```bash
   psql "<DATABASE_PUBLIC_URL>" -f seed.sql
   ```

   Run this **after** the backend has booted once, otherwise the tables
   do not exist yet.
4. Afterwards, disable Public Networking again. An open database port
   with a password is exposure you do not need.

Do not put the public URL or password into the repository or into chat
logs.

---

## 5. The one thing to get right: CORS

Two variables must reference each other's public URL:

| Where      | Variable              | Must equal                               |
|------------|-----------------------|------------------------------------------|
| backend    | `CORS_ALLOWED_ORIGIN` | the frontend's public URL                |
| frontend   | `VITE_API_BASE_URL`   | the backend's public URL                 |

Rules:

- Both are full origins with `https://` and no trailing slash.
- `VITE_API_BASE_URL` is read at **build** time; after changing it,
  redeploy the frontend.
- `CORS_ALLOWED_ORIGIN` is read at backend start; saving it redeploys the
  backend.
- Because the two URLs depend on each other, you set the backend's CORS
  value after the frontend domain exists (step 5), not in step 3.
- If you later attach a custom domain to the frontend, update
  `CORS_ALLOWED_ORIGIN` to the new origin (you can list both).

There are no cookies or credentials involved (D-006), so no
`allowCredentials` setup, no SameSite settings and no shared parent
domain are needed.

---

## 6. Updating and maintenance

- **Deploy a change**: `git push` to the tracked branch; Railway rebuilds
  the affected service. Settings -> **Source** lets you choose the branch
  and, if you want, disable automatic deploys.
- **Schema changes**: `ddl-auto=update` adds new tables and columns but
  does not drop or rename. Anything beyond that is a manual SQL change
  (`docs/Tech.md` §3).
- **Logs**: each service -> **Deployments** -> **View logs**.
- **Rollback**: Deployments -> pick an earlier successful deployment and
  redeploy it.
- **Cost**: check the project's **Usage** tab and railway.com/pricing.
  Three always-on services consume usage-based credit; remove the project
  if you stop needing the demo.
- **Backups**: this is a demo setup with no auth and hard deletes (D-007).
  Do not rely on it for data you cannot lose.

---

## 7. Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Backend crashes: connection refused / `UnknownHost` | `DB_URL` wrong, or the service is not named `Postgres` | Check the reference variables; the name inside `${{ }}` must match the Postgres service name exactly |
| Backend crashes: `Driver ... claims to not accept jdbcUrl` | Used `DATABASE_URL` (`postgresql://`) as `DB_URL` | Use the `jdbc:postgresql://host:port/db` form from step 3 |
| Backend crashes: password authentication failed | `DB_USERNAME` / `DB_PASSWORD` not set or not resolving | Confirm both reference `${{Postgres.PGUSER}}` / `${{Postgres.PGPASSWORD}}` |
| Deploy is "healthy" but URL gives 502 | App not listening on `$PORT` | Do not hardcode `SERVER_PORT`; keep the `PORT` fallback chain in `application.properties` |
| Browser console: CORS error / blocked by CORS policy | `CORS_ALLOWED_ORIGIN` missing, or differs from the frontend origin | Set it to the exact frontend URL (step 5), wait for the redeploy |
| Frontend calls `http://localhost:8793` | `VITE_API_BASE_URL` was not set when the frontend was built | Set it, then trigger a **redeploy** (build-time variable) |
| Frontend shows blank page / 404 on refresh of a deep link | Static server not configured for SPA fallback | Serve with `serve -s dist` (the `-s` flag is the SPA fallback) |
| Tables missing after first boot | Backend never connected, or `ddl-auto` overridden | Read backend logs; confirm `ddl-auto=update` is in effect |
| `psql` cannot connect | Public Networking disabled | Enable it temporarily (§4) |
| Build fails on backend | `Dockerfile` not found or Root Directory set | Root Directory must be empty for the backend service |
| Build fails on frontend | Root Directory not set | Set it to `frontend/candidate_manager_frontend` |
