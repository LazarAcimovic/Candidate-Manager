# Tech — Frontend

## Section index

| Section | Title |
|---|---|
| 1 | Project layout |
| 2 | Patterns in use (and explicitly not in use) |
| 3 | State: Zustand store |
| 4 | Data-fetching templates |
| 5 | HTTP client |
| 6 | Routing |
| 7 | Forms |
| 8 | Styling |
| 9 | Testing |

## 1. Project layout

```
frontend/candidate_manager_frontend/
├── package.json
├── vite.config.ts
├── tsconfig.json, tsconfig.app.json, tsconfig.node.json
├── eslint.config.js
├── index.html
├── public/
└── src/
    ├── main.tsx                — bootstraps RouterProvider
    ├── App.tsx                 — shell with Navbar + <Outlet />
    ├── index.css               — all global and component styling (448 lines)
    ├── App.css                 — empty (0 lines); do not add to it
    ├── components/
    │   ├── Navbar.tsx
    │   └── SearchSection.tsx
    ├── pages/
    │   ├── HomePage.tsx
    │   ├── AddCandidatePage.tsx
    │   └── CandidateDetailsPage.tsx
    ├── routes/
    │   └── router.tsx          — createBrowserRouter config
    ├── services/
    │   ├── apiClient.ts        — axios instance, hardcoded baseURL
    │   ├── candidateService.ts — /candidates/* calls
    │   └── skillService.ts     — /skills/* calls
    ├── store/
    │   └── candidateStore.ts   — single Zustand store for candidates + filters
    └── models/
        ├── CandidateModel.ts   — Candidate / CandidateCreate / CandidateUpdate
        └── SkillModel.ts       — Skill / SkillCreate / SkillUpdate
```

> verified at a58f5ab

## 2. Patterns in use (and explicitly not in use)

**In use:**
- Function components with hooks (`useState`, `useEffect`, `useMemo`,
  `useParams`, `useNavigate`).
- One **Zustand store** for the candidate list and the active filters
  (`src/store/candidateStore.ts`). See §3.
- Service objects — a flat module exporting a function-bag per resource
  (`src/services/candidateService.ts`, `src/services/skillService.ts`).
- `createBrowserRouter` (data-router API) with nested routes under a shell
  `App` route (`src/routes/router.tsx`).
- Plain CSS with CSS custom properties for the design tokens
  (`src/index.css:1-12`). See UI.md §1.

**Explicitly not in use — do not reach for these:**
- **No TanStack Query / SWR.** Server state is held in the Zustand store
  (`candidates`, `isLoading`, `error`) and refreshed by the store's
  `fetchCandidates` action. Adding another server-state layer is out of
  scope.
- **No form library.** Forms use `useState({…})` and controlled inputs;
  validation is `required` on the `<input>` only. (See `AddCandidatePage.tsx`
  and `CandidateDetailsPage.tsx`.) React Hook Form / Formik are not
  installed.
- **No Tailwind / MUI / styled-components.** All class names are strings
  that resolve to selectors in `src/index.css`.
- **No test framework.** There is no Vitest, Jest, Testing Library, or
  Playwright on the frontend. Adding one is task-07. Nothing in the code
  assumes tests exist.
- **No i18n.** Copy is English, inlined in JSX.

## 3. State: Zustand store

One store, `useCandidateStore`, at
`src/store/candidateStore.ts:19-116`. It owns:

| Field           | Purpose                                                  |
|-----------------|----------------------------------------------------------|
| `candidates`    | The last fetched list (what the Dashboard renders).      |
| `isLoading`     | True while an action is in flight.                       |
| `error`         | The user-visible error message, or `null`.               |
| `nameFilter`    | The current name-filter string. Survives navigation.     |
| `skillsFilter`  | The current list of selected skills. Survives navigation.|

Actions:
- `fetchCandidates()` — reads the current `nameFilter` and `skillsFilter`
  and chooses the appropriate backend call. If `skillsFilter.length > 0`,
  it calls `/candidates/search/skills` and then intersects with
  `nameFilter` client-side (see PRD §5.1 and the README section
  "Synchronized Multi-Criteria Filtering").
- `searchByName(name)` / `searchBySkills(skills)` — update the filter,
  then re-run the same intersecting logic.
- `removeCandidate(id)` — optimistic-style: DELETE then splice out the
  row from `candidates` locally.
- `clearError()` — convenience.

Lifting the filters into the store was a deliberate response to
navigation-reset: see the README section "Persistent Filter State During
Navigation" and `candidateStore.ts:9-10`. Pages that read/write filters
must go through the store rather than a local `useState`.

## 4. Data-fetching templates

Three shapes, used consistently. Follow them when adding another page.

### 4.1 Page that reads list state from the store

```tsx
const HomePage = () => {
  const { candidates, isLoading, error, fetchCandidates } = useCandidateStore();
  useEffect(() => { fetchCandidates(); }, [fetchCandidates]);
  // render
};
```

See `src/pages/HomePage.tsx:7-12`.

### 4.2 Page that loads one record directly from a service

```tsx
const [data, setData] = useState<T | null>(null);
const [isLoading, setIsLoading] = useState(true);
useEffect(() => {
  (async () => {
    try   { const d = await someService.getById(Number(id)); setData(d); }
    catch { alert("..."); }
    finally { setIsLoading(false); }
  })();
}, [id]);
```

See `src/pages/CandidateDetailsPage.tsx:24-49`. Note this uses local state,
not the store: one-record reads do not belong in the shared list state.

### 4.3 Submit a form

```tsx
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  try   { await candidateService.create(formData); navigate("/"); }
  catch (err: any) {
    if (err.response?.status === 409) setError(err.response.data);
    else setError("...");
  }
};
```

See `src/pages/AddCandidatePage.tsx:71-84`. HTTP error responses are
inspected on `err.response`; the `409` conflict body is plain text and is
rendered verbatim (PRD §4.1).

## 5. HTTP client

Single `axios` instance, `src/services/apiClient.ts:3-8`, with:
- `baseURL: "http://localhost:8793"` (hardcoded; see Tech.md §5).
- `Content-Type: application/json` default.
- No interceptors. No auth header. No retry logic. No timeout override.

Services wrap the client: one function per endpoint in
`src/services/candidateService.ts` and `src/services/skillService.ts`. The
functions return the parsed `.data` and let errors propagate — they do not
swallow. Callers decide what to do with a thrown `AxiosError`.

## 6. Routing

React Router 7 data-router (`createBrowserRouter`,
`src/routes/router.tsx:7-30`). Four routes:

| Path                 | Element                                          |
|----------------------|--------------------------------------------------|
| `/`                  | `App` → `HomePage` (index)                       |
| `/candidate/:id`     | `App` → `CandidateDetailsPage`                   |
| `/add-candidate`     | `App` → `AddCandidatePage`                       |
| `*`                  | 404 element inline in the router                 |

Use `useNavigate` for programmatic transitions (post-submit redirect) and
`<Link>` / `<NavLink>` for in-page links. No loaders, no actions, no
`defer` — the data-router API is present but used only for the config
shape.

## 7. Forms

Pattern: single `useState({ … })` holding every field. `handleInputChange`
spreads `(prev) => ({ ...prev, [name]: value })`. See
`AddCandidatePage.tsx:14-20,35-38` and `CandidateDetailsPage.tsx:16-22,60-63`.

Validation is HTML-only (`required`, `type="email"`, `type="date"`). There
is no field-level error display in the form itself; a submission failure
raises a banner at the bottom of the form or, in the edit flow, a browser
`alert` (see `CandidateDetailsPage.tsx:102`). Replacing the `alert` is
captured in task-11.

The skills picker is a custom dropdown built with:
- a text input that filters `allSkills` by case-insensitive substring,
- a `<ul>` of unselected matches below it,
- `Enter` on free text adds the typed value as a new skill tag,
- `onBlur` closes the dropdown with a `setTimeout(…, 200)` so a click
  on an item can land before the blur hides it.

Duplicated in `AddCandidatePage.tsx:7-69` and
`CandidateDetailsPage.tsx:8-93`, and partially in
`SearchSection.tsx:6-52`. Extracting a shared `<SkillPicker>` is in
refactor-02 (not opened).

## 8. Styling

Plain CSS, loaded globally from `src/index.css`. All class names are
hand-written and defined there. See UI.md for the visual rules.

`src/App.css` exists but is empty; do not add rules to it. Everything goes
through `src/index.css`.

## 9. Testing

**None installed.** Running `npm test` on this project does nothing because
there is no `test` script in `package.json` and no runner is on the dev
dependency list. Adding one is **task-07**.

The intended end state (not yet realised):

- **Unit tests** co-located as `Thing.test.tsx` beside `Thing.tsx`, with
  Vitest + Testing Library. Mock the HTTP boundary with MSW.
- **Integration tests** for pages under `src/__tests__/` with the router
  and the store wired up, HTTP mocked at MSW.
- **Fixtures** in `src/__tests__/fixtures/` — one file per entity type.

Until that lands, the frontend is covered only by manual exploratory
testing against the running stack.
