# Consolidation Caller Map

## Date Normalization (competing)

- Version A: `DateUtils.normalizeForCanvas` (`public/js/utils.js`)
  - Callers:
    - `public/js/main.js` date column `valueParser`
    - `public/js/main.js` `executeDateShift`
- Version B: `processDateField` (`src/canvas/canvas.service.ts`)
  - Callers:
    - `updateAssignment`
    - `updateQuiz`
    - `cleanContentUpdates` (used by `updateDiscussion`, `updatePage`, `updateModule`)

Functionality loss analysis:
- Removing client normalizer: malformed values can be introduced pre-sync in UI.
- Removing server normalizer: non-UI callers can bypass normalization and write invalid payloads.

## Assignment/Quiz Cleaning (competing)

- Version A: inline cleanup in `updateAssignment`
- Version B: inline cleanup in `updateQuiz`

Functionality loss analysis:
- Removing either without replacement drops resource-specific coercions and nullability behavior.

## New Quiz Text Routing (competing)

- Version A: `updateAssignment` New Quiz branch (detect + patch).
- Version B: `updateNewQuizRow` path for `description/name`.

Functionality loss analysis:
- Removing either without unification causes one entry path to miss New Quiz object updates.

## ADA Preview/Apply Executor (competing behavior)

- Version A: preview synthesis path (`getAccessibilityFixPreview`)
- Version B: apply synthesis path (`applyAccessibilityFixes`)

Functionality loss analysis:
- Removing either without shared executor contract creates preview/apply mismatch regressions.

## Bulk Save Result Interpretation (competing behavior)

- Version A: infer success from HTTP 200 only.
- Version B: parse per-item result body and map failures.

Functionality loss analysis:
- Removing per-item interpretation causes silent failures when bulk endpoint returns mixed results.

