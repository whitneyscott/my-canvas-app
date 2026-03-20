# CHEA Sync Review Flow

When `POST /admin/sync` with `source=chea` detects changes (fingerprint differs), it writes proposed changes to `proposed-chea-changes.json` in the service root. The sync_log is updated with status `PENDING_REVIEW`.

**Inspect:** Open `proposed-chea-changes.json`. It contains `insert`, `update`, and `delete` arrays.

**Apply:** From the service directory, run:
```
npm run apply-proposed-chea
```
This inserts new accreditors, updates changed ones, and deletes accreditors no longer on CHEA's list. Requires `DATABASE_URL` in `.env`.
