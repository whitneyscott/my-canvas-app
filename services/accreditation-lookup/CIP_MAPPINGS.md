# CIP Mappings (Phase 8)

Two-phase mapping: 2-digit (coarse) then 6-digit (specific).

## Phase 1: 2-digit mappings

**Propose** (Claude API): `npm run propose-cip-mappings` — needs `ANTHROPIC_API_KEY`.
**Propose** (static fallback): `npm run propose-cip-mappings-static`
**Apply:** `npm run apply-cip-mappings`

## Phase 2: 6-digit mappings

**Prerequisites:** `cip_6_digit` column (`npm run db:migrate-cip6`), accreditors populated.

**Propose:** `npm run propose-cip6-mappings` — outputs `proposed-cip6-mappings.json`
**Apply:** `npm run apply-cip6-mappings`

API matches on `cip_6_digit` when `cip` is 4-digit (16.16) or 6-digit (16.1601); falls back to `cip_2_digit` for 2-digit.
