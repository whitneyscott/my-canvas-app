# Blueprint courses API — evaluation for accreditation at scale

## Why it matters

Programs that run **one blueprint → many child courses** need the same **standards selection, outcomes, and alignment patterns** everywhere. Accreditation managers should detect **drift** (child diverged from template) and support **controlled sync** of accreditation-related artifacts where policy allows.

## Relevant Canvas API

Official: [Blueprint Courses](https://canvas.instructure.com/doc/api/blueprint_courses.html) (migrating to [Instructure Developer Documentation](https://developerdocs.instructure.com/services/canvas)).

Concepts:

- **BlueprintTemplate** — template bound to a blueprint course.
- **BlueprintMigration** — push/sync runs (states: queued, exporting, imports_queued, completed, failures).
- **BlueprintRestriction** — locks on content, points, dates so instructors cannot edit synced objects.
- **Unsynced changes** — content changed in blueprint not yet migrated.
- **ChangeRecord** — per-asset create/update/delete and exceptions for courses that did not import.

## What this app does not implement yet

No calls to blueprint endpoints in `canvas.service.ts` today. This document is the **evaluation** step from the brainstorm plan.

## Recommended implementation phases

1. **Read-only association** — Given a course id, resolve whether it is a **child** of a blueprint (`GET` blueprint template / associated courses). If not a blueprint feature on the host, no-op.
2. **Drift signals for accreditation** — Compare child vs blueprint for:
   - accreditation profile page body (same JSON comment block shape),
   - outcome group structure / linked outcomes (heuristic: count + titles),
   - count of `outcome_alignments` per mirrored assignment id (if mapping ids stable after sync).
3. **Reporting** — Add a section to the accreditation evidence bundle: `blueprint_course_id`, `is_child`, `last_migration_completed_at`, `unsynced_changes_count` (if API exposes).
4. **Writes** — Only after policy UI: pushing profile or alignment **from blueprint** is dangerous; prefer **restrictions** + normal Canvas sync over app-driven overwrite.

## Risks

- Assignment and quiz **ids differ** per course; alignment compare may need **SIS id**, **migration id**, or **asset name + position** heuristics.
- New Quizzes and LTI shells may not blueprint the same way as classic assignments.
- API permissions often **admin-only**; teacher tokens may not see blueprint metadata.

## Conclusion

Blueprint integration is **institutional** and **admin-scoped**. Defer coding until **course-level** alignment merge and **evidence bundle** (D.2) exist; then add blueprint as a **course metadata** and **drift warning** layer, not as the first alignment source of truth.
