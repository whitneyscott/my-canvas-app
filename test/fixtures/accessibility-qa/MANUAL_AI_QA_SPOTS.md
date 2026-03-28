# Manual and subjective QA spots (accessibility fixes)

**Fix tier** (auto / suggested / manual_only) per `rule_id` is defined in [`ACCESSIBILITY_CHECKPOINTS.md`](../../ACCESSIBILITY_CHECKPOINTS.md) (aligned with `ACCESSIBILITY_FIXABILITY_MAP` in code). **This file** only lists rules and situations where a human should **spot-check** output or environment-dependent behavior during **preview / apply** — it is not a second definition of those tiers.

Use this list when exercising preview/apply or reviewing AI output. Default `qa:accessibility:run` asserts **scanner** expectations; optional `QA_FIX_AUTO` / `QA_FIX_AUTO_AI` extend automation (see [`RUNBOOK.md`](./RUNBOOK.md)).

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

- **`iframe_missing_title`:** scanner emits when an `<iframe>` has no non-empty `title`. Suggested title comes from **`suggestIframeTitleFromSrc`** (`accessibility-heuristics.ts`): **`SproutVideo embedded content`** for `*.sproutvideo.com`, known YouTube/Vimeo/Google patterns, else **`{hostname} embedded content`**. Strict QA fixtures use SproutVideo-style `src` on pages and assignments.
- **Broken-link HTTP checks:** depend on network or allowlisted test URLs (see plan §2.5).
- **Dual-option rules** (`aria_hidden_focusable`, `table_layout_heuristic`): runner can apply one chosen option per manifest row via `dual_option_choice` and `QA_FIX_AUTO=1`; still spot-check that the **other** option behaves acceptably in the UI when you care about both paths.
