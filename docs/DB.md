# Database

> PostgreSQL schema for the Candidate Manager backend. The schema is managed by
> Hibernate (`spring.jpa.hibernate.ddl-auto=update` in `backend/Candidate_Manager_backend/src/main/resources/application.properties`),
> so there is no versioned migration directory. The column shapes recorded here
> are read from the JPA entity declarations, which Hibernate materialises as
> PostgreSQL DDL on first boot.

## 1. ER overview

Two entities, one join table, M:N.

```
+------------+          +---------------+          +---------+
| candidate  | 1 ---- * | candidate_    | * ---- 1 | skill   |
|            |          | skill         |          |         |
+------------+          +---------------+          +---------+
```

A candidate has zero or more skills; a skill is referenced by zero or more
candidates. A skill is created on demand when it is added to a candidate for
the first time (see PRD §4.5).

## 2. Tables

### 2.1 `candidate`

Source: `backend/Candidate_Manager_backend/src/main/java/candidateManager/models/Candidate.java:10-35`.

| Column            | Type                        | Null | Default         | Notes                                                        |
|-------------------|-----------------------------|------|-----------------|--------------------------------------------------------------|
| `id`              | `integer`                   | no   | identity (auto) | Primary key (`@GeneratedValue(strategy = IDENTITY)`).        |
| `full_name`       | `varchar(255)` (JPA default)| no   | —               | Mapped from `fullName`.                                      |
| `date_of_birth`   | `date`                      | no   | —               | `java.time.LocalDate`.                                       |
| `contact_number`  | `varchar(255)`              | no   | —               | Free-form string; no format rule (per D-001).                |
| `email`           | `varchar(255)`              | no   | —               | Unique index (`@Column(unique = true)`).                     |

No validation annotations are present — length and format rules are not
enforced at the schema or DTO layer today (see D-002 and task-04).

### 2.2 `skill`

Source: `backend/Candidate_Manager_backend/src/main/java/candidateManager/models/Skill.java:10-23`.

| Column | Type           | Null | Default         | Notes                                        |
|--------|----------------|------|-----------------|----------------------------------------------|
| `id`   | `integer`      | no   | identity (auto) | Primary key.                                 |
| `name` | `varchar(255)` | no   | —               | Unique index (`@Column(unique = true)`).     |

Equality is checked case-insensitively (`LOWER(name)`) in the repository
queries at `SkillRepository.java:15` and `SkillRepository.java:18`, so
`"Java"` and `"java"` are treated as the same skill in lookups even though the
column itself is case-sensitive. The case of the first write wins at the row
level.

### 2.3 `candidate_skill` (join table)

Source: `backend/Candidate_Manager_backend/src/main/java/candidateManager/models/Candidate.java:29-35`.

| Column         | Type      | Null | Notes                             |
|----------------|-----------|------|-----------------------------------|
| `candidate_id` | `integer` | no   | FK → `candidate(id)`.             |
| `skill_id`     | `integer` | no   | FK → `skill(id)`.                 |

Hibernate declares both FKs on the join table; the composite PK is
`(candidate_id, skill_id)` implicitly. There are no explicit `ON DELETE`
clauses — Hibernate manages lifecycle through JPA cascade on
`Candidate.skills`, which is unset, so removing a `candidate` row with
associated `candidate_skill` rows left behind would raise a constraint
violation at the database. In practice the delete flow goes through
`candidateService.deleteCandidate` (`CandidateServiceImpl.java:89`) which does
not pre-detach the join rows; the join rows are removed by Hibernate's
orphan-removal pass on the owning side because `candidate.skills` is an eager
`@ManyToMany` and the candidate is loaded before deletion.

## 3. Relationships summary

| From      | To     | Cardinality | Fetch | Delete behaviour                                   |
|-----------|--------|-------------|-------|----------------------------------------------------|
| candidate | skill  | *..*        | EAGER | Hard delete on `candidate` cascades the join rows. |
| skill     | — all candidates (reverse view, `@JsonIgnore`) | *..* | lazy  | A skill is never deleted automatically when a candidate is; `DELETE /skills/id/{id}` deletes a skill unconditionally. |

Notes:
- `Candidate.skills` is `@ManyToMany(fetch = FetchType.EAGER)` at
  `Candidate.java:29` — every candidate read also materialises its skills.
- `Skill.candidates` is `@JsonIgnore` at `Skill.java:20` so the Jackson cycle
  does not blow the stack.

## 4. Delete semantics

Hard delete, always, both sides. No soft-delete column, no archive table, no
tombstoning. See PRD §4.3 and §4.6.

Removing a skill that is still referenced by one or more candidates is
**allowed** by the code path (`DELETE /skills/id/{id}` →
`skillRepository.deleteById`) and will raise a foreign-key constraint
violation at the database because `candidate_skill` still references the row.
This is a current defect tracked by task-05; PRD §4.6 describes the current
500-style failure path.

## 5. Seed data

A root `seed.sql` provides idempotent sample data for local development
(task-13): it `TRUNCATE … RESTART IDENTITY CASCADE`s the three tables and
re-inserts a fixed set of `skill`, `candidate` and `candidate_skill` rows,
so re-running it always produces the same clean result. It is **not** wired
into app startup — there is still no `data.sql` and no `@PostConstruct`
seeder; it is loaded manually (see the README quick-start). Every
environment otherwise starts with empty tables and populates via the API.

## 6. Migrations

**None, by design.** `ddl-auto=update` is doing the work of a migration tool:
when the entity changes, Hibernate issues the DDL on the next boot. This is
documented in Tech.md §3.1 and accepted as current (per D-003). A future move
to Flyway or Liquibase is tracked in refactor-01 (not yet opened).

## 7. Query cheat-sheet

The two non-trivial repository queries. Both are native SQL (`nativeQuery =
true`) because the case-insensitive comparison is more direct in SQL than in
JPQL.

### 7.1 Case-insensitive name substring (`CandidateRepository.java:14`)

```sql
SELECT *
FROM candidate
WHERE LOWER(full_name) LIKE LOWER('%' || :name || '%')
```

| Input `:name` | Rows matched                                                      |
|---------------|-------------------------------------------------------------------|
| `"laz"`       | Every candidate whose `full_name` contains `laz`, any case.       |
| `""`          | **Every candidate** — the `%%` pattern matches everything.        |
| `"'; DROP..."`| Treated literally — `:name` is parameter-bound, not concatenated. |

### 7.2 Candidates by any-of skill list (`CandidateRepository.java:25`)

```sql
SELECT DISTINCT c.*
FROM candidate c
JOIN candidate_skill cs ON c.id = cs.candidate_id
JOIN skill         s ON s.id  = cs.skill_id
WHERE LOWER(s.name) IN :skillNames
```

**OR semantics** — a candidate is returned if they have **at least one** of
the requested skills, not all. The service lower-cases the input list
(`CandidateServiceImpl.java:109-111`) before passing it in. This is the
behaviour confirmed under D-004; the frontend intersects with the name filter
client-side (see `candidateStore.ts:35-46`).

| Input `:skillNames` | Rows matched                                                    |
|---------------------|-----------------------------------------------------------------|
| `["java"]`          | Candidates with Java in their skills.                           |
| `["java", "react"]` | Candidates with Java OR React (dedup'd by `DISTINCT c.*`).      |
| `[]`                | Zero rows — `IN ()` is empty, matches nothing.                  |
