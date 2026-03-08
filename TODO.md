# Canvas Bulk Editor - TODO List

## ✅ COMPLETED

1. **Fix Delete Function** - Fixed URL structure bug
2. **Add Mode Selector** - Password-protected Dev/Prod/Demo modes
3. **Fix undo detection false positive** - Fixed timing bug in checkIfRowReturnedToOriginal (commit 4279371)
4. **Simplify Edit Tracking System** - Replace complex two-function approach with unified checkEditStatus()
   - Fixes undo detection issues
   - Fixes manual edit marking issues
   - Simplifies codebase with single source of truth
   - Eliminates timing bugs by always comparing to originalData
5. **LTI 1.3 migration** - User-authorized access only, no hardcoded API key

---

## 🧪 PENDING TESTING

- **Test all edit tracking scenarios** - 17 test cases documented in plan file
- **Test executeMerge() for modules** - Implemented, needs testing with 2+ modules

---

## 🔥 HIGH Priority (Broken or incomplete features)

1. **Implement executeAssignTo()** - Modal exists but no function
2. **Implement executeAccommodations()** - Modal exists but no function

---

## 📋 MEDIUM Priority (Missing UI access)

3. **Add Publish/Unpublish button** to Bulk Actions dropdown
4. **Add Insert/Paste button** to Bulk Actions dropdown
5. **Add Bulk Edit button** to Bulk Actions dropdown
6. **Add Export button** to toolbar
7. **Add Assign To button** to Bulk Actions dropdown (after implementing function)
8. **Add Accommodations button** to Bulk Actions dropdown (after implementing function)

---

## 🧹 LOW Priority (Cleanup/Refactoring)

11. **Integrate useful helpers.js functions**:
    - Use `markRowAsSynced()` to clean up sync code
    - Extract `statusCellRenderer()` and `booleanCellRenderer()` for reusability
    - Consider using `fetchJSON()` to centralize error handling
12. **Remove unused helpers.js functions** - Dead code cleanup

---

## 💡 FUTURE OPTIMIZATION (Parked for later)

- **Selective dual-ledger approach** for editable-only fields to reduce memory usage by 60-80%
  - Only store editable fields in originalData
  - Reduces memory footprint significantly
  - Requires refactoring checkEditStatus to only compare editable fields
