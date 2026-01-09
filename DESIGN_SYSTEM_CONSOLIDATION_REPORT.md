# Design System Consolidation Candidates Report

## 1. BUTTONS

### Current Button Variations

#### Group A: Primary Action Buttons (80%+ similarity)
**Common Properties:**
- `padding: 8px 16px` or `padding: 10px 20px`
- `border: none`
- `border-radius: var(--radius)` (4px)
- `cursor: pointer`
- `font-size: 14px`
- `font-weight: 600`
- `display: flex`
- `align-items: center`
- `gap: 6px`
- `transition: all 0.2s`
- `background: var(--primary)` (#2196F3)
- `color: white`
- Hover: `background: #1976D2`
- Active: `background: #1565C0`
- Focus: `outline: 2px solid var(--primary)`, `outline-offset: 2px`

**Candidates:**
- `.refresh-btn` (padding: 8px 16px)
- `.btn-test-active` (padding: 8px 16px)
- `.btn-primary` (padding: 8px 16px) - **Base class exists**
- `.modal-btn-primary` (padding: 10px 20px) - **Different padding**

**Recommendation:** 
- **Base Class:** `.btn-base` (already exists)
- **Variant:** `.btn-primary` (already exists)
- **Replace:** `.refresh-btn`, `.btn-test-active` → Use `.btn-base .btn-primary`
- **Note:** `.modal-btn-primary` has different padding (10px 20px vs 8px 16px) - consider `.btn-base .btn-primary .btn-lg` variant

---

#### Group B: Secondary Action Buttons (80%+ similarity)
**Common Properties:**
- Same base properties as Group A
- `background: #6c757d` (gray)
- Hover: `background: #5a6268`
- Active: `background: #4e555b`
- Focus: `outline: 2px solid #6c757d`

**Candidates:**
- `.btn-secondary` (padding: 8px 16px) - **Base class exists**
- `.modal-btn-secondary` (padding: 10px 20px) - **Different padding**

**Recommendation:**
- **Base Class:** `.btn-base` (already exists)
- **Variant:** `.btn-secondary` (already exists)
- **Replace:** `.modal-btn-secondary` → Use `.btn-base .btn-secondary` (or create `.btn-lg` variant)

---

#### Group C: Outline/Secondary Style Buttons
**Common Properties:**
- `padding: 10px 16px`
- `border: 1px solid var(--border)`
- `border-radius: var(--radius)`
- `font-size: 14px`
- `font-weight: 500` (lighter than primary)
- `background: white`
- `color: #333`
- `display: flex`
- `align-items: center`
- `gap: 6px`
- `transition: all 0.2s`

**Candidates:**
- `.sidebar-btn` (outline style)
- `.filter-menu-btn` (different: padding: 6px, font-size: 12px, text-align: left)

**Recommendation:**
- **Base Class:** `.btn-outline` (new)
- **Keep separate:** `.filter-menu-btn` (specialized menu item style)

---

#### Group D: Specialized Buttons (Keep Separate)
- `.sync-btn` (green, has `.has-changes` state - different semantic behavior)
- `.toggle-btn` (different interaction model - opacity/transform)
- `.tab-button` (navigation element, no background)
- `.modal-close` (icon-only button, different purpose)
- `.add-criteria-btn` (dashed border, special style)
- `.merge-btn` (minimal styling, used in JS templates)

---

## 2. FORM INPUTS

### Current Input Variations

#### Group A: Standard Form Inputs (90%+ similarity)
**Common Properties:**
- `width: 100%`
- `padding: 8px 12px` or `padding: 10px` or `padding: 12px`
- `border: 1px solid var(--border)` (#ddd)
- `border-radius: var(--radius)` (4px)
- `font-size: 14px`
- Focus: `outline: none`, `border-color: var(--primary)`

**Candidates:**
- `.modal-form-group input` (padding: 8px 12px, font-size: 14px)
- `.modal-form-group select` (padding: 8px 12px, font-size: 14px)
- `.sidebar-dropdown` (padding: 12px, font-size: 14px, cursor: pointer)
- `.input-standard` (padding: 8px 12px, border: 1px solid #ddd, font-size: 14px)
- `.course-selector select` (padding: 10px, font-size: 16px, margin-bottom: 10px)
- `.filter-row select, .filter-row input` (padding: 8px, font-size: 14px)

**Recommendation:**
- **Base Class:** `.input-base` (new)
  - `width: 100%`
  - `padding: 8px 12px`
  - `border: 1px solid var(--border)`
  - `border-radius: var(--radius)`
  - `font-size: 14px`
  - `font-family: inherit`
- **Variants:**
  - `.input-base:focus` (outline: none, border-color: var(--primary))
  - `.input-lg` (padding: 12px, font-size: 16px) for `.course-selector select`
  - `.input-sm` (padding: 4px 8px, font-size: 12px) for `.header-filter`
- **Replace:**
  - `.modal-form-group input`, `.modal-form-group select` → `.input-base`
  - `.sidebar-dropdown` → `.input-base` (add cursor: pointer for selects)
  - `.input-standard` → `.input-base`
  - `.filter-row select, .filter-row input` → `.input-base`

---

#### Group B: Specialized Inputs (Keep Separate)
- `.header-filter` (small, table header context - padding: 4px 8px, font-size: 12px)
- `.filter-menu-input` (small, menu context - padding: 4px, font-size: 12px)
- `.cell-input` (inline editing - border: 2px solid var(--primary), padding: 4px 8px)

---

## 3. CARDS/CONTAINERS

### Current Container Variations

#### Group A: Standard Card/Container (85%+ similarity)
**Common Properties:**
- `padding: 20px`
- `background: white`
- `border-radius: 8px` or `var(--radius)` (4px)
- `border: 1px solid var(--border)` (some have, some don't)
- `box-shadow: 0 2px 4px rgba(0,0,0,0.1)` or `0 4px 16px rgba(0,0,0,0.2)`

**Candidates:**
- `.container` (padding: 20px, border-radius: 8px, box-shadow: 0 2px 4px, max-width: 1400px)
- `.modal` (padding: 0, border-radius: 8px, box-shadow: 0 4px 16px, max-width: 500px)
- `.modal-content` (padding: 20px, no border/shadow - child of modal)
- `.modal-header` (padding: 20px, border-bottom, background: #f8f9fa)
- `.modal-footer` (padding: 20px, border-top)
- `.course-details` (padding: 15px, border: 1px solid, border-radius: var(--radius), background: white)
- `.sidebar-header` (padding: 20px, border-bottom, background: #f8f9fa)
- `.sidebar-content` (padding: 20px)

**Recommendation:**
- **Base Class:** `.card` (new)
  - `background: white`
  - `border-radius: 8px`
  - `box-shadow: 0 2px 4px rgba(0,0,0,0.1)`
- **Variants:**
  - `.card-elevated` (box-shadow: 0 4px 16px rgba(0,0,0,0.2)) for modals
  - `.card-padding` (padding: 20px)
  - `.card-padding-sm` (padding: 15px)
  - `.card-bordered` (border: 1px solid var(--border))
- **Replace:**
  - `.modal` → `.card .card-elevated` (keep modal-specific properties like max-width, z-index)
  - `.modal-content` → `.card-padding`
  - `.modal-header` → `.card-padding` + `.card-header` (border-bottom, background variant)
  - `.modal-footer` → `.card-padding` + `.card-footer` (border-top)
  - `.course-details` → `.card .card-padding-sm .card-bordered`
  - `.sidebar-header` → `.card-padding` + `.card-header`
  - `.sidebar-content` → `.card-padding`

---

#### Group B: Scrollable Containers (90%+ similarity)
**Common Properties:**
- `padding: 10px` or `padding: 12px`
- `border: 1px solid #ddd` or `1px solid var(--border)`
- `border-radius: 4px`
- `background: #f9f9f9`
- `max-height: 200px` or `300px`
- `overflow-y: auto`

**Candidates:**
- `.scrollable-container` (padding: 10px, border: 1px solid #ddd, max-height: 200px, background: #f9f9f9)
- `.file-list-container` (padding: 10px, border: 1px solid #ddd, max-height: 200px, background: #f9f9f9)
- `.progress-log` (padding: 12px, border: 1px solid #ddd, max-height: 300px, background: #f9f9f9, font-family: monospace)

**Recommendation:**
- **Base Class:** `.scrollable-container` (already exists, good name)
- **Variants:**
  - `.scrollable-container-sm` (max-height: 200px)
  - `.scrollable-container-md` (max-height: 300px)
  - `.scrollable-container-monospace` (font-family: monospace)
- **Replace:**
  - `.file-list-container` → `.scrollable-container .scrollable-container-sm`
  - `.progress-log` → `.scrollable-container .scrollable-container-md .scrollable-container-monospace`

---

#### Group C: Section Containers (80%+ similarity)
**Common Properties:**
- `padding: 20px`
- `background: #f9f9f9` or `#f8f9fa`
- `border-radius: 6px` or `var(--radius)`

**Candidates:**
- `.course-selector` (padding: 20px, background: #f9f9f9, border-radius: 6px)
- `.modal-header` (padding: 20px, background: #f8f9fa, border-bottom)
- `.sidebar-header` (padding: 20px, background: #f8f9fa, border-bottom)

**Recommendation:**
- **Base Class:** `.section` (new)
  - `padding: 20px`
  - `background: #f8f9fa`
  - `border-radius: var(--radius)`
- **Variants:**
  - `.section-light` (background: #f9f9f9)
  - `.section-bordered` (border-bottom: 1px solid var(--border))
- **Replace:**
  - `.course-selector` → `.section .section-light` (border-radius: 6px override)
  - `.modal-header`, `.sidebar-header` → `.section .section-bordered`

---

## 4. TYPOGRAPHY

### Current Typography Variations

#### Group A: Headings (80%+ similarity)
**Common Properties:**
- `color: #2d3e50`
- `font-weight: 600` (most)
- `margin-bottom: 10px` to `20px`

**Candidates:**
- `h1` (margin-bottom: 20px, color: #2d3e50)
- `.course-details h2` (margin-bottom: 10px, color: #2d3e50)
- `.sidebar-header h2` (margin: 0, color: #2d3e50, font-size: 20px)
- `.modal-header h2` (margin: 0, color: #2d3e50, font-size: 20px)
- `.modal-section-title` (margin-bottom: 15px, color: #2d3e50, font-size: 16px)
- `.clone-option-title` (margin-bottom: 5px, color: #2d3e50, font-weight: 600)
- `.progress-label` (margin-bottom: 10px, color: #2d3e50, font-weight: 500)

**Recommendation:**
- **Base Class:** `.heading` (new) or use semantic h1-h6 with consistent styling
- **Variants:**
  - `.heading-1` (font-size: 24px, margin-bottom: 20px, color: #2d3e50, font-weight: 600)
  - `.heading-2` (font-size: 20px, margin-bottom: 15px, color: #2d3e50, font-weight: 600)
  - `.heading-3` (font-size: 16px, margin-bottom: 10px, color: #2d3e50, font-weight: 600)
  - `.heading-4` (font-size: 14px, margin-bottom: 8px, color: #2d3e50, font-weight: 600)
- **Replace:**
  - `h1` → Keep, but ensure consistent styling
  - `.course-details h2` → `h2` with consistent styling
  - `.sidebar-header h2`, `.modal-header h2` → `.heading-2` (margin: 0 override)
  - `.modal-section-title` → `.heading-3`
  - `.clone-option-title` → `.heading-4` (margin-bottom: 5px override)
  - `.progress-label` → `.heading-4` (font-weight: 500 override)

---

#### Group B: Body Text Colors (90%+ similarity)
**Common Properties:**
- Multiple classes using same colors with different names

**Color Patterns:**
- `#2d3e50` - Primary dark (headings, important text)
- `#333` - Body text (most common)
- `#555` - Secondary text (labels, muted)
- `#666` - Tertiary text (helper text, less important)
- `#999` - Muted/disabled text

**Candidates:**
- `.text-muted` (color: #555) - **Already exists**
- `.helper-text` (color: #666, display: block, margin-top: 5px)
- `.radio-text` (font-size: 14px, color: #333)
- `.form-label` (color: #555, font-weight: 500)
- `.modal-form-group label` (color: #555, font-size: 14px)
- `.clone-option-description` (font-size: 13px, color: #666)
- `.progress-text` (font-size: 13px, color: #666)
- `.empty-state-text` (color: #999, font-style: italic)

**Recommendation:**
- **Base Classes:** Use semantic color utilities
  - `.text-primary` (color: #2d3e50) - for headings/important
  - `.text-body` (color: #333) - for body text
  - `.text-secondary` (color: #555) - for labels/secondary
  - `.text-tertiary` (color: #666) - for helper text
  - `.text-muted` (color: #999) - for disabled/muted (already exists)
- **Replace:**
  - `.radio-text` → `.text-body` (add font-size: 14px if needed)
  - `.form-label`, `.modal-form-group label` → `.text-secondary` (keep existing font-weight/size)
  - `.helper-text` → `.text-tertiary` (keep display/margin properties)
  - `.clone-option-description`, `.progress-text` → `.text-tertiary` (keep font-size)
  - `.empty-state-text` → `.text-muted` (keep font-style: italic)

---

#### Group C: Font Sizes (Consolidation Opportunities)
**Current Sizes:**
- `12px` - Small text (helper, badges, filters)
- `13px` - Small body (descriptions, tooltips)
- `14px` - Base body (most common)
- `16px` - Large body (section titles, course selector)
- `20px` - Headings (modal/sidebar headers)
- `24px` - Large headings (h1)

**Recommendation:**
- **Base Classes:** Typography scale utilities
  - `.text-xs` (font-size: 12px)
  - `.text-sm` (font-size: 13px)
  - `.text-base` (font-size: 14px) - default
  - `.text-lg` (font-size: 16px)
  - `.text-xl` (font-size: 20px)
  - `.text-2xl` (font-size: 24px)
- **Note:** Many font-size declarations are already on semantic elements. Consider adding these as utilities for inline overrides.

---

## SUMMARY OF CONSOLIDATION OPPORTUNITIES

### High Priority (80%+ similarity, high usage)

1. **Buttons → `.btn-base` + variants**
   - Consolidate: `.refresh-btn`, `.btn-test-active` → `.btn-base .btn-primary`
   - Consider: `.btn-lg` variant for `.modal-btn-*` (different padding)

2. **Form Inputs → `.input-base`**
   - Consolidate: `.modal-form-group input/select`, `.sidebar-dropdown`, `.input-standard` → `.input-base`
   - Variants: `.input-lg`, `.input-sm`

3. **Scrollable Containers → `.scrollable-container`**
   - Consolidate: `.file-list-container` → `.scrollable-container`
   - Variant: `.scrollable-container-md` for `.progress-log`

4. **Typography Colors → Semantic color utilities**
   - Consolidate: Multiple classes using same colors → `.text-primary`, `.text-body`, `.text-secondary`, `.text-tertiary`, `.text-muted`

### Medium Priority (70-80% similarity)

5. **Cards/Containers → `.card` system**
   - Consolidate: `.modal`, `.modal-content`, `.modal-header`, `.course-details` → `.card` variants

6. **Headings → Consistent heading scale**
   - Consolidate: Various h2/h3 styles → `.heading-2`, `.heading-3` variants

### Low Priority (Keep Separate - Different Purpose)

- `.sync-btn` (special semantic behavior)
- `.toggle-btn` (different interaction model)
- `.tab-button` (navigation element)
- `.cell-input` (inline editing, different context)
- `.header-filter` (table-specific, smaller size)

---

## ESTIMATED IMPACT

- **Buttons:** ~8 classes → 3 base classes + variants
- **Form Inputs:** ~6 classes → 1 base class + 2 variants
- **Containers:** ~10 classes → 3 base classes + variants
- **Typography:** ~15 color/size rules → 5-6 utility classes

**Total Reduction:** ~39 fragmented classes → ~12 base classes + variants

