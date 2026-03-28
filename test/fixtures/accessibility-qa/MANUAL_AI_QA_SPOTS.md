# Manual and subjective QA spots (accessibility fixes)

Use this list when exercising **preview / apply** flows or reviewing AI output. Automated strict QA (`qa:accessibility:run`) covers **scanner** expectations only unless you enable `QA_FIX_AUTO` / AI flags.

## Double-stage AI (`uses_second_stage_ai` in registry)

Second full-document pass after structured suggestion — highest cost; spot-check wording and structure.

- `color_only_information`
- `sensory_only_instructions`
- `landmark_structure_quality`

## Image rules (vision model in product)

Verify alt suggestions match image meaning; check length and appropriateness.

- `img_missing_alt`
- `img_alt_too_long`
- `img_alt_filename`
- `img_decorative_misuse`
- `img_meaningful_empty_alt`
- `img_text_in_image_warning`

## Text-only AI suggested fixes

Verify link text, labels, and rewrites are sensible in context.

- `link_ambiguous_text`
- `link_empty_name` (registry still marked TODO: heuristic handler)
- `link_split_or_broken`
- `heading_visual_only_style`
- `button_empty_name`
- `form_control_missing_label`

## Language fixes (franc + normalization)

`lang_inline_missing` and `lang_invalid` use **franc** for detection. Short or mixed-language snippets can be wrong — use **~50+ words** of coherent text in fixtures; do not assert a specific language code for ambiguous content.

## Not covered by scanner-only QA

- **`iframe_missing_title`:** suggest fix exists; **scanner does not emit** generic iframe findings yet (`ACCESSIBILITY_CHECKS.md`). When adding fixtures, **use SproutVideo `iframe` URLs first** — this app standardizes on SproutVideo embeds; verify `applyIframeTitleSuggest` titling for that hostname.
- **Broken-link HTTP checks:** depend on network or allowlisted test URLs (see plan §2.5).
- **Dual-option rules** (`aria_hidden_focusable`, `table_layout_heuristic`): each fix option should be exercised manually or via a future runner variant until automated dual-option runs exist.
