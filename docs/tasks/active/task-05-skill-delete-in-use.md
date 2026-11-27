### Task 05 — Pre-check skill deletion against `candidate_skill`

#### Overview

`DELETE /skills/id/{id}` calls `skillRepository.deleteById` without
checking whether any `candidate_skill` row still references the skill.
If one does, the DB raises a foreign-key constraint violation that
surfaces as a 500 (DB §4). The desired behaviour is `409 Conflict` with
a message listing (at least the count of) the candidates still using it.

**The rules for this feature live in `PRD.md` §4.6.**

**Depends on:** nothing · **Blocks:** nothing

---

#### 05.0 — Docs: Define the in-use-skill rule

Rules: none
Not in scope: code.
Docs to update: PRD §4.6, Decisions (a new entry)
Verify: `node scripts/check-docs.mjs`

- [ ] PRD §4.6 skill-delete step 1 reads: if any `candidate_skill`
      references this skill, return `409 Conflict` with the body
      `"Skill is still assigned to N candidate(s); remove from
      candidates before deleting."` and the `N` is the count.
- [ ] A new Decisions entry records: no cascade-delete-and-cleanup, no
      soft delete — the user removes the assignment first, then deletes
      the skill.
- Commit: `docs(prd): skill-in-use returns 409, not 500`

---

#### 05.1 — Backend-service: Pre-check and return 409

Rules: PRD §4.6, Tech-Backend §7
Not in scope: adding cascade behaviour on the entity or at the DB.
Docs to update: none (rules live in PRD §4.6 from 05.0)
Verify: `./mvnw test -Dtest=SkillServiceImplTest`

- [ ] `SkillRepository` gains a count query against
      `candidate_skill` by skill id.
- [ ] `SkillServiceImpl.deleteSkill` returns a tri-state (e.g. an enum
      `NotFound | InUse(count) | Deleted`) and the controller maps
      `InUse(n)` to 409 with the body from 05.0.
- [ ] Unit test covers the InUse path (mocked count > 0) and the
      existing Deleted/NotFound paths stay green.
- Commit: `fix(skills): delete returns 409 when skill is in use`
