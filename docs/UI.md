# UI — Visual rules

## Section index

| Section | Title |
|---|---|
| 1 | Visual foundation |
| 2 | Dashboard — `/` |
| 3 | Add candidate — `/add-candidate` |
| 4 | Edit candidate — `/candidate/:id` |
| 5 | Reusable primitives |
| 6 | Responsiveness |
| 7 | Copy conventions |
| 8 | Accessibility baseline |

## 1. Visual foundation

### 1.1 Framework

No CSS framework. Plain CSS with CSS custom properties, defined once in
`src/index.css:1-12`:

```css
:root {
  --primary-color: #2563eb;   /* blue-600 */
  --primary-hover: #1d4ed8;   /* blue-700 */
  --bg-color: #f8fafc;        /* slate-50 */
  --text-color: #1e293b;      /* slate-800 */
  --danger-color: #ef4444;    /* red-500 */
  --danger-hover: #dc2626;    /* red-600 */
  --border-color: #e2e8f0;    /* slate-200 */
  --white: #ffffff;
  --shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1),
            0 1px 2px -1px rgb(0 0 0 / 0.1);
  --navbar-height: 64px;
}
```

Any new colour added to the UI must be a `var(--…)` reference. If a
one-off value is required, declare it at `:root` first.

### 1.2 Icons

Two inline emoji icons are in use in the source:
- `📞` prefix on the contact-number line on a candidate card
  (`HomePage.tsx:54`).
- `×` on the filter-tag remove button (`SearchSection.tsx:94`, and the
  skill-tag remove in the form pages).

No icon library.

### 1.3 Typography

Single system font stack, declared on `body` at `index.css:21-25`:

```css
font-family: "Inter", system-ui, -apple-system, sans-serif;
line-height: 1.5;
```

`Inter` is not self-hosted and not linked from Google Fonts in the
`<head>` — if the user does not have it installed the stack falls back to
`system-ui`. This is current behaviour; a future font-loading strategy is
not in scope.

### 1.4 Colour usage

| Token              | Where it appears                               |
|--------------------|------------------------------------------------|
| `--primary-color`  | Navbar brand, primary buttons, active nav link |
| `--primary-hover`  | Hover state on the above                       |
| `--danger-color`   | Delete button background                       |
| `--danger-hover`   | Delete button hover                            |
| `--bg-color`       | `body` background                              |
| `--white`          | Navbar, cards, form card                       |
| `--border-color`   | Cards, inputs, navbar underline                |
| `--text-color`     | `body` text                                    |
| `--shadow`         | Navbar, cards                                  |

One ad-hoc colour pair — the red banner on the Add-candidate form's
duplicate-email error — is inlined as `style={{…}}` at
`AddCandidatePage.tsx:184-193` with `backgroundColor: "#f8d7da"` and
`color: "#721c24"`. This is a documented exception; do not add another
inline colour to the codebase. Promote it to a token in task-12 when the
error-banner primitive is extracted.

## 2. Dashboard — `/`

Source: `src/pages/HomePage.tsx`, classes defined in `src/index.css`.

- `.dashboard` wrapper, `.dashboard-header-stack` for the title+search
  stack, `<h1>` "Candidates Dashboard".
- `<SearchSection />` immediately below the title (§5.1).
- Status row: `.status-text` while loading, `.error-text` on error,
  `.empty-state` when both filters are empty-ish and the list is empty.
- `.candidate-grid` → `.candidate-card` for each row.
- A card shows `<h3>` for the name, `.candidate-email` for the email,
  `.skill-tags` for up to **5** skill chips (`.skill-tag`) followed by a
  `.skill-tag-more` chip reading `+N` when more exist
  (`HomePage.tsx:43-52`), and `.contact-info` for the phone with the `📞`
  prefix.
- `.card-actions` holds a `.btn.btn-outline` "Details" link and a
  `.btn.btn-danger` "Delete" button.

The 5-skill truncation is a UI-only rule and lives in this document.

## 3. Add candidate — `/add-candidate`

Source: `src/pages/AddCandidatePage.tsx`.

- `.form-container` → `.form-card`, `<h1>` "Add New Candidate".
- `.form-group` wraps each `<label>` + input pair. Field order (top to
  bottom): Full Name, Date of Birth, Email Address, Contact Number,
  Skills.
- Every input uses `className="search-input"` — the single input style
  is shared between search and forms.
- Skills picker is the `.custom-select-container` pattern (§5.2).
- On duplicate email (409), the inline error banner at
  `AddCandidatePage.tsx:184-197` shows the server's plain-text message.
  See §1.4 — this is the one documented inline-colour exception.
- `.form-actions`: "Cancel" (`.btn.btn-outline`) left, "Save Candidate"
  (`.btn.btn-primary`) right.

## 4. Edit candidate — `/candidate/:id`

Source: `src/pages/CandidateDetailsPage.tsx`.

Same shape as §3, with:
- Title `<h1>` reads "Edit Candidate".
- Fields pre-populated from the loaded record.
- Buttons: "Back to Dashboard" and "Update Candidate".
- **Error UI diverges from §3:** a submit failure opens a
  `window.alert("Error updating candidate.")` instead of rendering a
  banner (`CandidateDetailsPage.tsx:102`). This is current behaviour;
  task-11 brings this page's error UI into alignment with §3.

## 5. Reusable primitives

### 5.1 `SearchSection`

Source: `src/components/SearchSection.tsx`. Used only on the Dashboard
(§2). Two inputs side by side (`.search-inputs-row`): a name input bound
to `nameFilter` and a skill-picker bound to `skillsFilter`. Below the
inputs, when `skillsFilter.length > 0`, a `.active-filters` row of
`.filter-tag` chips with `×` buttons plus a `.clear-all` button.

### 5.2 Custom skill picker

Duplicated across three pages — `SearchSection`, `AddCandidatePage`,
`CandidateDetailsPage`. Shape:

- A text input with `className="search-input"` plus a placeholder
  matching the context ("Search skill…", "Add skill filter…",
  "e.g. React, .NET…").
- `.custom-select-container` wraps input + dropdown so the dropdown can
  be positioned absolutely.
- On focus or on typing, show a `.custom-dropdown` `<ul>` of unselected
  matches. Each `<li>` is clickable.
- `Enter` on free text selects/adds the typed value.
- `onBlur` closes via `setTimeout(…, 200)` so the click lands.
- Already-selected skills render as `.filter-tag` (search) or `.filter-tag`
  under `.active-filters` (forms); both share the same CSS class.

Extraction into a shared component is refactor-02 (not opened).

### 5.3 Buttons

| Class                | Use                                        |
|----------------------|--------------------------------------------|
| `.btn.btn-primary`   | Submit a form — "Save Candidate", "Update" |
| `.btn.btn-outline`   | Secondary — "Cancel", "Back", "Details"    |
| `.btn.btn-danger`    | Destructive — "Delete"                     |

### 5.4 Status messages

| Class           | Use                                        |
|-----------------|--------------------------------------------|
| `.status-text`  | "Loading…" and loading-detail text         |
| `.error-text`   | Error band in the dashboard flow           |
| `.empty-state`  | "No candidates found matching your filters"|

## 6. Responsiveness

- Navbar uses `max-width: 1200px` and side padding (`index.css:51-53`).
- `.candidate-grid` is a CSS Grid in `index.css` that wraps responsively
  by `auto-fit`.
- No explicit mobile media queries beyond the grid's intrinsic sizing.
- Not tested at mobile widths. This is current state — a mobile pass is
  not in scope.

## 7. Copy conventions

- **Sentence case** for buttons, headings and placeholders — "Save
  candidate" style is OK; "SAVE CANDIDATE" is not.
- **No trailing punctuation** on buttons or headings.
- **Error messages echo the server's body** on the Add flow's 409 —
  do not rewrite them in the component.
- Confirmation prompt on delete: `window.confirm("Are you sure you want
  to delete {name}?")` (`HomePage.tsx:15`). Keep the name interpolation;
  do not replace with a generic "this candidate".

## 8. Accessibility baseline

What is in place:
- `<label>` next to every form input (`<label>` + `<input>` within one
  `.form-group`), so focusing the label focuses the input.
- `required` on every required input and `type="email"` / `type="date"`
  where applicable.
- Buttons use real `<button>` elements with `type="button"` or
  `type="submit"`.

What is not:
- No ARIA attributes anywhere.
- No focus-outline customisation (default browser focus rings only).
- Keyboard traversal has not been audited.
- `window.alert` / `window.confirm` are not keyboard-trap-safe outside
  the browser's own handling.

Fixing these is out of scope for now.
