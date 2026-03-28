# Canvas Bulk Editor - TODO List

## 🔥 HIGH Priority (Broken or incomplete features)

---

## 📋 MEDIUM Priority (Missing UI access)

3. **Add Insert/Paste button** to Bulk Actions dropdown
4. **Add Bulk Edit button** to Bulk Actions dropdown
5. **Add Export button** to toolbar
6. **Add Assign To button** to Bulk Actions dropdown (after implementing function)

---

## ♿ ADA / ACCOMMODATIONS (Consolidated)

- **Implement executeAssignTo()** - Modal exists but no function.
- **Implement executeAccommodations()** - Modal exists but no function.
- **Add Accommodations button** to Bulk Actions dropdown (after implementing function).
- **Re-enable ADA Compliance tab flow**:
  - Add `ada_compliance` to `allowedTabs` in `switchTab()`.
  - Implement ADA tab loading flow (`FIELD_DEFINITIONS + loadTabData` or custom panel flow).
- **ADA Compliance QA / implementation**:
  - Tab opens without error.
  - If grid remains empty, complete `ada_compliance` load/config flow.
- **Accommodation workflow details**:
  - LPI tool prompt
  - "Everyone else" workaround
  - FERPA-safe behavior (IDs only, custom column)
- **Backend/API dependency**:
  - Keep/verify `custom_gradebook_columns` path usage for accommodation flow.
- **Checker roadmap**:
  - Use the Canvas Accessibility Checker to guide my custom checker and automatically apply fixes using AI suggestions where needed.
  - Fix tiers: runtime `ACCESSIBILITY_FIXABILITY_MAP` in `canvas.service.ts`; tables in [`ACCESSIBILITY_CHECKPOINTS.md`](./ACCESSIBILITY_CHECKPOINTS.md).

---

## 🧹 LOW Priority (Cleanup/Refactoring)

11. **Prune stale helpers.js functions** - Remove or deprecate helper utilities no longer aligned with current edit-status/undo architecture
12. **Audit duplicate renderer logic** - Keep a single authoritative implementation for status/boolean rendering (only if behavior parity is maintained)
13. **Design a modern fetch wrapper (optional)** - Only if it preserves current detailed error parsing and `credentials: 'include'` behavior

---

## 🔌 DISCONNECTED FUNCTIONS (Wire to endpoints)

### Backend endpoints not used by frontend
| Endpoint | Notes |
|----------|-------|
| GET `courses/:id` (getCourseDetails) | Never called |
| POST `.../content_exports` | No frontend call |
| GET `.../bulk_user_tags` | No frontend call |

---

## 📚 BACKLOG (from To Do)

- Assignment groups: show group name in Quizzes, Discussions, Assignments
- Tabs: Module Items, Course management, Rubrics, Outcomes
- "Adjust ALL dates" feature
- V2: Course audit (alt tags, broken links, standards), duplicate file finder, app settings (themes, API key)

---

## ✅ QA MIGRATION (unchecked items moved from TEACHER_QA_CHECKLIST.md)

- **Standards Sync QA**:
  - Tab shows Accreditation Profile form (state → city → institution → program → focus).
  - Save Profile persists via API.
  - Outcomes & Standards list loads; per-outcome standards Save updates outcome description.
  - Apply-to-course standards checkboxes save `selectedStandards` and refresh.
- **Assign To expected-fail validation**: confirm current known gap behavior while `executeAssignTo` is unimplemented.

## 🗺️ POST V1 ALPHA AUDIT (merged from NEXT_PLAN.md)

### Medium Priority

1. **Token setup safety copy in login overlay**
   - Add inline guidance near token input:
     - treat token like password
     - store in password manager
     - re-enter when revoked/expired

2. **Label consistency and clarity**
   - Align menu/modal language:
     - "Add Rating" vs "Allow Rating"
     - points/position wording consistency
   - Simplify high-density warning text into shorter scan-friendly lines.

3. **Revert scope visibility**
   - Make non-revertable bulk-action limitation more prominent before sync/revert actions.

4. **Delete failure UX**
   - Add copy-friendly failure modal for delete errors (parity with sync error detail quality).

5. **Runtime logging hygiene**
   - Gate non-essential controller/service logs behind a debug flag.

6. **AG Grid Enterprise upgrade ($999)**
   - Upgrade from Community to Enterprise edition.
   - Implement/standardize keyboard productivity actions: `CTRL+D` and `CTRL+DOWN`.

### Low Priority

1. **Quick Start discoverability**
   - Add direct "Quick Start" link on first-run/token entry flow.

2. **Workflow click reduction**
   - Add "repeat last clone settings" shortcut for frequent clone operations.

### Deferred / Hold

1. **Standards Sync**
   - Held per product direction for V1 alpha focus.

---

## 💡 FUTURE OPTIMIZATION (Parked for later)

- **Selective dual-ledger approach** for editable-only fields to reduce memory usage by 60-80%
- Distribution: Git + Heroku/Render + LTI (see merged To Do)

---

## 🔭 DISTANT FUTURE

- **Account-level bulk editing** - Operate across all courses in an account (files, modules, etc.)
