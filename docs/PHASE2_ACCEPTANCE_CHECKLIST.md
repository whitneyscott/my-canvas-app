# Phase 2 Acceptance Checklist

## Discussions/Announcements false-positive fixes

- Apply a fix to one known discussion violation.
- Apply a fix to one known announcement violation.
- Run accessibility scan again.
- Verify both fixed findings do not reappear when content did not change.

## Announcement date Numeric String Expected

- Run single-item save for `delayed_post_at` and `lock_at` from announcements.
- Run bulk save with mixed announcement/discussion date fields.
- Verify no ParseInt/route-collision errors and saved values round-trip.

## Auto fixes incorrectly requiring approval

- Generate fix preview for rules with `fix_strategy=auto` or `suggested`.
- Verify manual-only actions are not pre-selected.
- Verify auto/suggested actions are pre-selected and executable in one apply run.

## Apply fixes request size / partial queueing

- Apply more than 10 approved actions.
- Verify batched requests complete and all approved actions are represented in results.
- Verify no request-entity-too-large failure.

## Page refresh behavior

- Apply fixes for a subset of findings in the accessibility grid.
- Verify only fixed rows are removed; entire page is not reloaded.

