# Candidate Manager — Project Overview

> One-stop orientation for every agent. Always load this first. Deliberately
> short.

## 1. What this is

A local-development HR tool for adding, searching and editing job
candidates and the skills they claim. Two-tier: a Spring Boot / PostgreSQL
backend and a React + Vite frontend. One trusted user on localhost; no
authentication, no deployment, no shared data. The documentation system
was retrofitted on 2026-11-05 from the running codebase at commit
`a58f5ab` — see `docs/Decisions.md` D-001..D-010 for the rules that were
confirmed from the survey.

## 2. Actors

- **HR user** — the single, unauthenticated user of the app. Creates,
  lists, edits, searches and deletes candidates and skills.

## 3. Where to find what — pointer map

| Concern                                | Primary document                       | Secondary                           |
|----------------------------------------|----------------------------------------|-------------------------------------|
| Project orientation, glossary          | `docs/Overview.md` (this file)         | —                                   |
| Product rules, flows, states, statuses | `docs/PRD.md`                          | —                                   |
| Why a rule is what it is               | `docs/Decisions.md`                    | —                                   |
| Backend architecture                   | `docs/Tech-Backend.md`                 | `docs/PRD.md` (security)            |
| Frontend architecture                  | `docs/Tech-Frontend.md`                | —                                   |
| Libraries, DB tooling, deployment      | `docs/Tech.md`                         | —                                   |
| UI screens, copy, responsiveness       | `docs/UI.md`                           | `docs/PRD.md` (screen inventory)    |
| Schema, migrations (none), seed (none) | `docs/DB.md`                           | `docs/PRD.md` (data seeding)        |
| Open tasks                             | `docs/tasks/active/index.md`           | —                                   |
| Archived tasks                         | `docs/tasks/done/YYYY-MM.md`           | —                                   |
| Refactor campaigns                     | `docs/refactors/active/index.md`       | `docs/refactors/done/*.md`          |

Concept → where its rules live:

- **Candidate** → PRD §3.1, DB §2.1
- **Skill** → PRD §3.2, DB §2.2
- **Candidate ↔ Skill link** → PRD §3.3, DB §2.3, §7.2
- **Search by name / by skills** → PRD §4.7
- **Skills picker UI** → UI §5.2
- **Store (Zustand)** → Tech-Frontend §3

## 4. Glossary

- **Candidate** — one of the two core domain objects; a person tracked by
  the HR user. Rules: PRD §3.1.
- **Skill** — a named technical skill shared between candidates. Rules:
  PRD §3.2.
- **Skill name lookup** — every skill lookup is case-insensitive via
  `LOWER(name)`; the row itself stores whatever case was written first.
  Rules: DB §2.2.
- **OR-semantics skill search** — `GET /candidates/search/skills` returns
  candidates with **any** of the requested skills. Rules: PRD §4.7.2,
  DB §7.2.
- **Client-side filter intersection** — when both the name and skills
  filters are active on the Dashboard, the store runs the skills search on
  the server and intersects with the name filter in the browser. Rules:
  Tech-Frontend §3.
- **Zustand store (`useCandidateStore`)** — the single global store for
  the candidate list and the live filters; filters are store-level so they
  survive navigation. Rules: Tech-Frontend §3.
- **Hard delete** — the only delete shape in this system; no soft-delete
  column, no archive. Rules: PRD §4.3 (candidates), §4.6 (skills).
- **`ddl-auto=update`** — Hibernate manages the schema in place, in
  lieu of a versioned migration tool. Rules: Tech.md §3.1, DB §6.

## 5. Hard rules

- **Precedence.** PRD owns product behaviour; UI owns visuals where PRD
  is silent; DB owns schema; Tech owns code structure. A value is defined
  in exactly one document.
- **Never resolve a contradiction by choosing.** Stop, open a Decisions
  entry, report it.
- **A task file is a plan, never a source of truth.**
- `docs/old/**` is never authoritative and is never read unless the user
  names it. There is no `docs/old/` folder today.
- Load documents by section, grepping `^## ` for live line numbers — the
  Section index carries none on purpose.
- Changing behaviour, schema or a screen updates the owning siblings in
  the same commit.
- `node scripts/check-docs.mjs` must pass before a documentation commit.
