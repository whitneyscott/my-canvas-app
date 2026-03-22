# Canvas Bulk Editor - Next Plan (Post V1 Alpha)

This plan captures remaining audit items after implementing the three high-priority fixes:
- sync UX feedback improvements
- concurrency limiting for sync/revert
- bulk endpoint routing for identical updates

## Medium Priority

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

## Low Priority

1. **Quick Start discoverability**
   - Add direct "Quick Start" link on first-run/token entry flow.

2. **Workflow click reduction**
   - Add "repeat last clone settings" shortcut for frequent clone operations.

## Deferred / Hold

1. **Standards Sync**
   - Held per product direction for V1 alpha focus.

2. **ADA Compliance**
   - Held per product direction for V1 alpha focus.
