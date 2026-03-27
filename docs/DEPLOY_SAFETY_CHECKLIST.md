# Deploy Safety Checklist

## Before deploy

- Confirm branch tip commit hash is the intended release commit.
- Confirm Render service is tracking the intended branch.

## After deploy

- Verify deployed commit hash matches expected.
- Run targeted smoke checks:
  - announcement/discussion date saves,
  - ADA preview/apply/rescan behavior,
  - bulk sync with mixed success/failure.
- Verify logs do not contain:
  - route mismatch signatures,
  - payload-size rejection spikes,
  - hidden partial failures.

## Rollback triggers

- Previously fixed ADA findings reappear immediately on rescan.
- Numeric-string/date route errors reappear.
- Bulk/apply paths report full success while per-item failures are present.

