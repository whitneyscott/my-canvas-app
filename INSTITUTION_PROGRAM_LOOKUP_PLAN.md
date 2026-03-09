# Data Source Strategy: Institution & Program Lookup — Phased Implementation Plan

## Overview

Use a two-layer approach for institution and program discovery:

- **Layer 1 (Live API):** College Scorecard API for institution filtering — returns live data with no overhead
- **Layer 2 (AI-resolved):** CIP 2020 taxonomy for 6-digit program specializations — no database, no CSV, no external call

Each phase is additive and independently verifiable. Do not proceed until the current phase works and does not break existing behavior.

---

## Target Filter Flow (in order)

1. **State** → College Scorecard `school.state`
2. **City** → College Scorecard `school.state` + `school.city`
3. **Institution** → College Scorecard state + city + `school.name` (typeahead). Returns: `id` (UNITID), `school.name`, `school.city`, `school.state`
4. **Program (4-digit CIP)** → College Scorecard programs by UNITID. Returns: list of 4-digit CIP codes + titles. Single-select.
5. **Program Focus (6-digit CIP)** → Multi-select. Resolved from CIP 2020 taxonomy given selected 4-digit CIP. No API; embedded or AI-resolved.

---

## Current State (do not break)

- `GET /college-scorecard/cities?state=` ✓
- `GET /college-scorecard/institutions?state=&city=` ✓
- `GET /college-scorecard/programs?schoolId=` → returns `string[]` (program titles)
- Profile saves: `state`, `city`, `institutionId`, `institutionName`, `program` (string)

---

## Phase 1: Backend — Programs as CIP 4-digit + title (additive)

**Goal:** Add a new programs endpoint that returns 4-digit CIP + title. Do not change the existing programs endpoint.

1.1 Add `GET /college-scorecard/programs-cip4?schoolId=` to controller.

1.2 Implement in service: call College Scorecard with `fields: latest.programs.cip_4_digit` (or equivalent per API docs), parse response to `{ cip4: string, title: string }[]`, dedupe by cip4, sort.

1.3 Keep `GET /college-scorecard/programs` unchanged. Frontend continues to use it until Phase 3.

**Verification:** Call `/college-scorecard/programs-cip4?schoolId=<valid_id>` manually; confirm JSON array of objects with cip4 and title. Existing `/programs` and profile save must still work.

---

## Phase 2: Backend — CIP 6-digit options by 4-digit (additive)

**Goal:** Provide 6-digit CIP specializations for a given 4-digit CIP. No College Scorecard call; use CIP 2020 taxonomy.

2.1 Add `GET /college-scorecard/cip6-options?cip4=<code>` to controller.

2.2 Create `cip2020.ts` (or similar) with embedded CIP 2020 hierarchy: 4-digit → array of 6-digit `{ code, title }`. Source: NCES CIP 2020 PDF/XML or static JSON. No database, no CSV file at runtime.

2.3 Endpoint returns `{ options: { code, title }[] }` for the given cip4. Return `[]` if cip4 unknown.

**Verification:** Call `/college-scorecard/cip6-options?cip4=16.16`; confirm 16.1601, 16.1602, 16.1603 (or equivalent) in response. No changes to frontend yet.

---

## Phase 3: Frontend — Switch Program to CIP 4-digit, add Program Focus

**Goal:** Use programs-cip4 for Program dropdown; add Program Focus multi-select driven by cip6-options. Backward-compatible profile load.

3.1 Change `onAccInstitutionChange` to fetch `/college-scorecard/programs-cip4` instead of `/programs`.

3.2 Program dropdown: options as `value=cip4`, `text=title` (e.g. `16.16 - American Sign Language`). Single-select.

3.3 Add Program Focus UI: multi-select or checkbox list, initially empty and disabled.

3.4 On program (4-digit) change: fetch `/college-scorecard/cip6-options?cip4=X`, populate Program Focus, enable it. Clear previous selections.

3.5 Profile load: if `profile.programCip4` exists, set program dropdown and fetch cip6-options; if `profile.programFocusCip6` exists, pre-select those. If only legacy `profile.program` (string) exists, attempt to match by title or show as-is; do not break load.

**Verification:** Full flow State → City → Institution → Program → Program Focus works. Save still uses old profile shape; that’s OK for now.

---

## Phase 4: Backend — Extend profile schema for CIP fields

**Goal:** Persist `programCip4` and `programFocusCip6` in the accreditation profile.

4.1 Extend profile JSON schema (in canvas page body or wherever stored): add `programCip4?: string`, `programFocusCip6?: string[]`.

4.2 Canvas controller/service: on profile PUT, accept and store new fields. On GET, return them.

**Verification:** Save profile with program + focus; reload page; confirm profile contains programCip4 and programFocusCip6. Old profiles without these fields still load.

---

## Phase 5: Frontend — Wire save to new profile fields

**Goal:** Save programCip4 and programFocusCip6 from the form.

5.1 In `saveAccreditationProfileForm`: include `programCip4` from program dropdown value, `programFocusCip6` from selected Program Focus items.

5.2 Keep `program` (string) for backward compatibility if needed, or phase it out per product decision.

**Verification:** Select state, city, institution, program, one or more focuses; save; reload; confirm all values persist and display correctly.

---

## Phase 6 (Optional): Institution typeahead

**Goal:** Replace city-scoped institution list with typeahead search by `school.name` when desired. Additive.

6.1 Add `GET /college-scorecard/institutions-search?state=&city=&q=` (q = search string). Reuse existing fetch logic with `school.name` filter if supported by API.

6.2 Frontend: add typeahead input or debounced search; call new endpoint. Keep existing city-filtered dropdown as fallback.

**Verification:** Typing in search narrows institutions; selection works. Existing flow unchanged if user doesn’t use search.

---

## College Scorecard API Reference

- Base: `https://api.data.gov/ed/collegescorecard/v1/schools`
- API key: `api_key` query param
- Schools endpoint supports: `school.state`, `school.city`, `school.name`, `id` (UNITID)
- Programs: `latest.programs.cip_4_digit`, `latest.programs.cip_6_digit` (confirm exact field names in API docs)

---

## Implementation Order

| Step | Phase | Task |
|------|-------|------|
| 1 | 1 | Backend: programs-cip4 endpoint (additive) |
| 2 | 2 | Backend: cip6-options endpoint + CIP 2020 data |
| 3 | 3 | Frontend: Program CIP4 + Program Focus UI |
| 4 | 4 | Backend: profile schema extension |
| 5 | 5 | Frontend: save programCip4, programFocusCip6 |
| 6 | 6 | (Optional) Institution typeahead |

**Recommended next step:** Phase 1 — add `/college-scorecard/programs-cip4` without changing any existing endpoints or frontend.
