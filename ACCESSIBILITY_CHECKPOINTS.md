# Accessibility checkpoints — fix strategy by `rule_id`

Canonical grouping for **Auto** (apply without confirmation), **Suggested** (AI-assisted, preview card), and **Manual only** (human intervention). `ACCESSIBILITY_FIXABILITY_MAP` in `canvas.service.ts` follows this document; see also [`ACCESSIBILITY_CHECKS.md`](./ACCESSIBILITY_CHECKS.md).

---

## Auto — Deterministic, no confirmation needed (12)

| `rule_id` | Behavior |
|-----------|----------|
| `adjacent_duplicate_links` | Merge duplicate links |
| `heading_empty` | Remove empty heading tag |
| `list_empty_item` | Remove empty list item |
| `link_new_tab_no_warning` | Append opens in new tab indicator |
| `font_size_too_small` | Bump inline font size to 12px minimum |
| `media_autoplay` | Remove autoplay attribute |
| `text_justified` | Remove `text-align: justify` from inline styles |
| `lang_missing` | Add `lang="en"` to root element |
| `duplicate_id` | Append numeric suffix to duplicate IDs and update references |
| `form_required_not_programmatic` | Add `required` attribute after Claude confirms |
| `form_error_unassociated` | Add `aria-describedby` association |
| `small_text_contrast` / `large_text_contrast` | Algorithmically adjust foreground color to meet 4.5:1 (small) or 3:1 (large) ratio |

---

## Suggested — AI assisted via Claude API, surfaces in preview card (31)

| `rule_id` | Behavior |
|-----------|----------|
| `img_missing_alt` | Claude generates alt text from image URL and context |
| `img_alt_filename` | Strip filename pattern, Claude refines if needed |
| `img_alt_too_long` | Truncate to 125 chars, Claude suggests better version |
| `img_decorative_misuse` | Claude determines decorative vs informational |
| `img_meaningful_empty_alt` | Claude generates alt text from context |
| `img_text_in_image_warning` | Claude suggests text alternative |
| `link_ambiguous_text` | Claude suggests descriptive link text from context |
| `link_empty_name` | Claude infers link purpose from href and context |
| `link_split_or_broken` | Claude reconstructs clean link from fragments |
| `link_file_missing_type_size_hint` | Claude suggests link text with file type hint |
| `link_broken` | Search course first then Claude suggests replacement URL |
| `heading_too_long` | Claude suggests shortened version under 80 chars |
| `heading_skipped_level` | Structurally correct, Claude confirms if ambiguous |
| `heading_h1_in_body` | Demote to H2, Claude confirms appropriateness |
| `heading_duplicate_h1` | Demote subsequent H1s to H2 |
| `heading_visual_only_style` | Claude suggests appropriate semantic heading level |
| `list_not_semantic` | Claude converts visual list to semantic HTML |
| `table_missing_caption` | Claude generates caption from table content |
| `table_missing_header` | Claude infers header row from table structure |
| `table_header_scope_missing` | Infer scope from position, Claude if ambiguous |
| `iframe_missing_title` | Generate title from src URL, Claude refines |
| `button_empty_name` | Claude infers label from context and icon classes |
| `form_control_missing_label` | Claude suggests label from form context |
| `form_placeholder_as_label` | Promote placeholder to label, Claude confirms |
| `aria_invalid_role` | Claude suggests correct ARIA role from context |
| `aria_hidden_focusable` | Claude determines remove `aria-hidden` or add `tabindex=-1` |
| `lang_invalid` | Claude identifies correct BCP 47 language code |
| `lang_inline_missing` | Claude identifies language and adds inline `lang` attribute |
| `color_only_information` | Claude suggests revised content with non-color indicators |
| `sensory_only_instructions` | Claude rewrites without sensory-only references |
| `landmark_structure_quality` | Claude suggests semantic landmark structure |

---

## Manual only — genuinely requires human intervention (9)

| `rule_id` | Behavior |
|-----------|----------|
| `keyboard_focus_trap_heuristic` | Requires developer interaction testing; tool provides detailed remediation note |
| `video_missing_captions` | Requires caption file creation; tool suggests caption tools and workflow |
| `audio_missing_transcript` | Requires transcript creation; tool suggests transcription tools |
| `motion_gif_warning` | Requires media replacement; tool flags and explains |
| `video_embed_caption_unknown` | Cannot verify external captions; tool flags and explains |
| `doc_pdf_accessibility_unknown` | Requires source file remediation; tool provides specific guidance |
| `doc_office_structure_unknown` | Requires source file remediation; tool provides specific guidance |
| `doc_spreadsheet_headers_unknown` | Requires source file remediation; tool provides specific guidance |
| `session_timeout_no_warning` | Requires code change; tool flags and explains |
