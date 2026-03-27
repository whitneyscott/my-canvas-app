# Consolidation Audit Catalog

This file tracks competing implementations, active callers, and consolidation direction.

## 1) Date Normalization

- Keep: `processDateField` in `src/canvas/canvas.service.ts` as server-side canonical write normalizer.
- Deprecate: ad-hoc date transformation outside `DateUtils`/`processDateField`.
- Callers (client): `public/js/main.js` date `valueParser`, date shift actions.
- Callers (server): `updateAssignment`, `updateQuiz`, `cleanContentUpdates` consumers.
- Risk if removed incorrectly: invalid `_at` values reaching Canvas APIs or route-specific date divergence.

## 2) Assignment vs Quiz Cleaning

- Keep: shared normalizer helper used by both `updateAssignment` and `updateQuiz`.
- Deprecate: duplicated inline cleanup loops.
- Callers: `updateAssignment`, `updateQuiz`, bulk update wrappers.
- Risk if removed incorrectly: quiz-only and assignment-only field coercion regressions.

## 3) New Quiz Text Routing

- Keep: one internal updater that maps assignment `name/description` to New Quiz `title/instructions`.
- Deprecate: duplicated routing logic in multiple paths.
- Callers: `updateAssignment`, `updateNewQuizRow`.
- Risk if removed incorrectly: text edits save to assignment but not New Quiz object.

## 4) ADA Preview/Apply Executor

- Keep: shared deterministic transform executor for preview and apply.
- Deprecate: independent preview and apply mutation rules.
- Callers: `getAccessibilityFixPreview`, `applyAccessibilityFixes`.
- Risk if removed incorrectly: preview says one thing; apply writes another.

## 5) Bulk Save Failure Interpretation

- Keep: frontend parsing of per-item success/failure from bulk 200 responses.
- Deprecate: treating HTTP 200 as universal success.
- Callers: `syncChanges` in `public/js/main.js`.
- Risk if removed incorrectly: silent partial data loss.

## 6) Discussion/Announcement Route Policy

- Keep: single policy for date routing (`date_details` vs topic payload) and canonical `discussion_topics` paths.
- Deprecate: path-specific special-cases spread across unrelated methods.
- Callers: `updateDiscussion`, ADA apply routes for discussions/announcements.
- Risk if removed incorrectly: false positives on rescan, date fields not persisting.

