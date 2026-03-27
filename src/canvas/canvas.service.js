"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CanvasService = exports.ACCESSIBILITY_IMAGE_RULES = exports.ACCESSIBILITY_AI_SUGGESTED_RULES = exports.ACCESSIBILITY_FIXABILITY_MAP = void 0;
var common_1 = require("@nestjs/common");
var fs_1 = require("fs");
var path = require("path");
var accessibility_heuristics_1 = require("./accessibility-heuristics");
var AccessibilityFixType = {
    merge_duplicate_links: 'merge_duplicate_links',
    remove_empty_li: 'remove_empty_li',
    remove_empty_heading: 'remove_empty_heading',
    append_new_tab_warning: 'append_new_tab_warning',
    font_size_min_12: 'font_size_min_12',
    remove_media_autoplay: 'remove_media_autoplay',
    remove_text_justify: 'remove_text_justify',
    set_html_lang: 'set_html_lang',
    duplicate_id_suffix: 'duplicate_id_suffix',
    form_required_programmatic: 'form_required_programmatic',
    form_error_aria_describedby: 'form_error_aria_describedby',
    fix_inline_text_contrast: 'fix_inline_text_contrast',
    ai_generate_alt_text: 'ai_generate_alt_text',
    img_alt_truncate: 'img_alt_truncate',
    img_alt_filename_suggest: 'img_alt_filename_suggest',
    ai_img_decorative: 'ai_img_decorative',
    ai_img_meaningful_alt: 'ai_img_meaningful_alt',
    ai_img_text_in_image: 'ai_img_text_in_image',
    ai_replace_ambiguous_link_text: 'ai_replace_ambiguous_link_text',
    ai_link_text: 'ai_link_text',
    ai_link_reconstruct: 'ai_link_reconstruct',
    link_broken_teacher_href: 'link_broken_teacher_href',
    list_manual_markers_to_semantic: 'list_manual_markers_to_semantic',
    table_promote_first_row_to_thead: 'table_promote_first_row_to_thead',
    aria_role_normalize: 'aria_role_normalize',
    heading_truncate_120: 'heading_truncate_120',
    heading_scope_fix: 'heading_scope_fix',
    heading_h1_demote: 'heading_h1_demote',
    heading_duplicate_h1_demote: 'heading_duplicate_h1_demote',
    ai_heading_visual: 'ai_heading_visual',
    iframe_title_from_src: 'iframe_title_from_src',
    link_file_hint_append: 'link_file_hint_append',
    table_caption_from_context: 'table_caption_from_context',
    table_scope_fix: 'table_scope_fix',
    aria_hidden_focusable_choice: 'aria_hidden_focusable_choice',
    lang_inline_franc_suggest: 'lang_inline_franc_suggest',
    lang_code_normalize: 'lang_code_normalize',
    table_layout_presentation_or_headers: 'table_layout_presentation_or_headers',
    ai_button_label: 'ai_button_label',
    ai_form_label: 'ai_form_label',
    form_placeholder_to_label: 'form_placeholder_to_label',
    ai_color_only_information: 'ai_color_only_information',
    ai_sensory_only_instructions: 'ai_sensory_only_instructions',
    ai_landmark_structure: 'ai_landmark_structure',
    manual_only: 'manual_only',
};
exports.ACCESSIBILITY_FIXABILITY_MAP = {
    adjacent_duplicate_links: {
        uses_ai: false,
        is_image_rule: false,
        auto_fixable: true,
        fix_strategy: 'auto',
        false_positive_risk: 'low',
        risk: 'low',
        fix_type: AccessibilityFixType.merge_duplicate_links,
        supports_preview: true,
        requires_content_fetch: true,
    },
    list_empty_item: {
        uses_ai: false,
        is_image_rule: false,
        auto_fixable: true,
        fix_strategy: 'auto',
        false_positive_risk: 'low',
        risk: 'low',
        fix_type: AccessibilityFixType.remove_empty_li,
        supports_preview: true,
        requires_content_fetch: true,
    },
    heading_empty: {
        uses_ai: false,
        is_image_rule: false,
        auto_fixable: true,
        fix_strategy: 'auto',
        false_positive_risk: 'medium',
        risk: 'medium',
        fix_type: AccessibilityFixType.remove_empty_heading,
        supports_preview: true,
        requires_content_fetch: true,
    },
    link_new_tab_no_warning: {
        uses_ai: false,
        is_image_rule: false,
        auto_fixable: true,
        fix_strategy: 'auto',
        false_positive_risk: 'low',
        risk: 'low',
        fix_type: AccessibilityFixType.append_new_tab_warning,
        supports_preview: true,
        requires_content_fetch: true,
    },
    font_size_too_small: {
        uses_ai: false,
        is_image_rule: false,
        auto_fixable: true,
        fix_strategy: 'auto',
        false_positive_risk: 'low',
        risk: 'low',
        fix_type: AccessibilityFixType.font_size_min_12,
        supports_preview: true,
        requires_content_fetch: true,
    },
    media_autoplay: {
        uses_ai: false,
        is_image_rule: false,
        auto_fixable: true,
        fix_strategy: 'auto',
        false_positive_risk: 'medium',
        risk: 'medium',
        fix_type: AccessibilityFixType.remove_media_autoplay,
        supports_preview: true,
        requires_content_fetch: true,
    },
    text_justified: {
        uses_ai: false,
        is_image_rule: false,
        auto_fixable: true,
        fix_strategy: 'auto',
        false_positive_risk: 'low',
        risk: 'low',
        fix_type: AccessibilityFixType.remove_text_justify,
        supports_preview: true,
        requires_content_fetch: true,
    },
    lang_missing: {
        uses_ai: false,
        is_image_rule: false,
        auto_fixable: true,
        fix_strategy: 'auto',
        false_positive_risk: 'low',
        risk: 'low',
        fix_type: AccessibilityFixType.set_html_lang,
        supports_preview: true,
        requires_content_fetch: true,
    },
    duplicate_id: {
        uses_ai: false,
        is_image_rule: false,
        auto_fixable: true,
        fix_strategy: 'auto',
        false_positive_risk: 'high',
        risk: 'high',
        fix_type: AccessibilityFixType.duplicate_id_suffix,
        supports_preview: true,
        requires_content_fetch: true,
    },
    form_required_not_programmatic: {
        uses_ai: false,
        is_image_rule: false,
        auto_fixable: true,
        fix_strategy: 'auto',
        false_positive_risk: 'medium',
        risk: 'medium',
        fix_type: AccessibilityFixType.form_required_programmatic,
        supports_preview: true,
        requires_content_fetch: true,
    },
    form_error_unassociated: {
        uses_ai: false,
        is_image_rule: false,
        auto_fixable: true,
        fix_strategy: 'auto',
        false_positive_risk: 'medium',
        risk: 'medium',
        fix_type: AccessibilityFixType.form_error_aria_describedby,
        supports_preview: true,
        requires_content_fetch: true,
    },
    small_text_contrast: {
        uses_ai: false,
        is_image_rule: false,
        auto_fixable: true,
        fix_strategy: 'auto',
        false_positive_risk: 'medium',
        risk: 'medium',
        fix_type: AccessibilityFixType.fix_inline_text_contrast,
        supports_preview: true,
        requires_content_fetch: true,
    },
    large_text_contrast: {
        uses_ai: false,
        is_image_rule: false,
        auto_fixable: true,
        fix_strategy: 'auto',
        false_positive_risk: 'medium',
        risk: 'medium',
        fix_type: AccessibilityFixType.fix_inline_text_contrast,
        supports_preview: true,
        requires_content_fetch: true,
    },
    img_missing_alt: {
        uses_ai: true,
        is_image_rule: true,
        auto_fixable: false,
        fix_strategy: 'suggested',
        false_positive_risk: 'high',
        risk: 'high',
        fix_type: AccessibilityFixType.ai_generate_alt_text,
        supports_preview: true,
        requires_content_fetch: true,
    },
    img_alt_too_long: {
        uses_ai: true,
        is_image_rule: true,
        auto_fixable: false,
        fix_strategy: 'suggested',
        false_positive_risk: 'medium',
        risk: 'medium',
        fix_type: AccessibilityFixType.img_alt_truncate,
        supports_preview: true,
        requires_content_fetch: true,
    },
    img_alt_filename: {
        uses_ai: true,
        is_image_rule: true,
        auto_fixable: false,
        fix_strategy: 'suggested',
        false_positive_risk: 'medium',
        risk: 'medium',
        fix_type: AccessibilityFixType.img_alt_filename_suggest,
        supports_preview: true,
        requires_content_fetch: true,
    },
    img_decorative_misuse: {
        uses_ai: true,
        is_image_rule: true,
        auto_fixable: false,
        fix_strategy: 'suggested',
        false_positive_risk: 'low',
        risk: 'low',
        fix_type: AccessibilityFixType.ai_img_decorative,
        supports_preview: true,
        requires_content_fetch: true,
    },
    img_meaningful_empty_alt: {
        uses_ai: true,
        is_image_rule: true,
        auto_fixable: false,
        fix_strategy: 'suggested',
        false_positive_risk: 'medium',
        risk: 'medium',
        fix_type: AccessibilityFixType.ai_img_meaningful_alt,
        supports_preview: true,
        requires_content_fetch: true,
    },
    img_text_in_image_warning: {
        uses_ai: true,
        is_image_rule: true,
        auto_fixable: false,
        fix_strategy: 'suggested',
        false_positive_risk: 'low',
        risk: 'low',
        fix_type: AccessibilityFixType.ai_img_text_in_image,
        supports_preview: true,
        requires_content_fetch: true,
    },
    link_ambiguous_text: {
        uses_ai: true,
        is_image_rule: false,
        auto_fixable: false,
        fix_strategy: 'suggested',
        false_positive_risk: 'medium',
        risk: 'medium',
        fix_type: AccessibilityFixType.ai_replace_ambiguous_link_text,
        supports_preview: true,
        requires_content_fetch: true,
    },
    link_empty_name: {
        // TODO: replace with heuristic handler — see reclassification plan
        uses_ai: true,
        is_image_rule: false,
        auto_fixable: false,
        fix_strategy: 'suggested',
        false_positive_risk: 'high',
        risk: 'high',
        fix_type: AccessibilityFixType.ai_link_text,
        supports_preview: true,
        requires_content_fetch: true,
    },
    link_split_or_broken: {
        uses_ai: true,
        is_image_rule: false,
        auto_fixable: false,
        fix_strategy: 'suggested',
        false_positive_risk: 'medium',
        risk: 'medium',
        fix_type: AccessibilityFixType.ai_link_reconstruct,
        supports_preview: true,
        requires_content_fetch: true,
    },
    link_file_missing_type_size_hint: {
        uses_ai: false,
        is_image_rule: false,
        auto_fixable: false,
        fix_strategy: 'suggested',
        false_positive_risk: 'low',
        risk: 'low',
        fix_type: AccessibilityFixType.link_file_hint_append,
        supports_preview: true,
        requires_content_fetch: true,
    },
    link_broken: {
        uses_ai: false,
        is_image_rule: false,
        auto_fixable: false,
        fix_strategy: 'suggested',
        false_positive_risk: 'low',
        risk: 'low',
        fix_type: AccessibilityFixType.link_broken_teacher_href,
        supports_preview: true,
        requires_content_fetch: true,
    },
    heading_too_long: {
        uses_ai: false,
        is_image_rule: false,
        auto_fixable: false,
        fix_strategy: 'suggested',
        false_positive_risk: 'low',
        risk: 'low',
        fix_type: AccessibilityFixType.heading_truncate_120,
        supports_preview: true,
        requires_content_fetch: true,
    },
    heading_skipped_level: {
        uses_ai: false,
        is_image_rule: false,
        auto_fixable: false,
        fix_strategy: 'suggested',
        false_positive_risk: 'medium',
        risk: 'medium',
        fix_type: AccessibilityFixType.heading_scope_fix,
        supports_preview: true,
        requires_content_fetch: true,
    },
    heading_h1_in_body: {
        uses_ai: false,
        is_image_rule: false,
        auto_fixable: true,
        fix_strategy: 'auto',
        false_positive_risk: 'medium',
        risk: 'medium',
        fix_type: AccessibilityFixType.heading_h1_demote,
        supports_preview: true,
        requires_content_fetch: true,
    },
    heading_duplicate_h1: {
        uses_ai: false,
        is_image_rule: false,
        auto_fixable: true,
        fix_strategy: 'auto',
        false_positive_risk: 'medium',
        risk: 'medium',
        fix_type: AccessibilityFixType.heading_duplicate_h1_demote,
        supports_preview: true,
        requires_content_fetch: true,
    },
    heading_visual_only_style: {
        uses_ai: true,
        is_image_rule: false,
        auto_fixable: false,
        fix_strategy: 'suggested',
        false_positive_risk: 'low',
        risk: 'low',
        fix_type: AccessibilityFixType.ai_heading_visual,
        supports_preview: true,
        requires_content_fetch: true,
    },
    list_not_semantic: {
        uses_ai: false,
        is_image_rule: false,
        auto_fixable: true,
        fix_strategy: 'auto',
        false_positive_risk: 'medium',
        risk: 'medium',
        fix_type: AccessibilityFixType.list_manual_markers_to_semantic,
        supports_preview: true,
        requires_content_fetch: true,
    },
    table_missing_caption: {
        uses_ai: false,
        is_image_rule: false,
        auto_fixable: false,
        fix_strategy: 'suggested',
        false_positive_risk: 'medium',
        risk: 'medium',
        fix_type: AccessibilityFixType.table_caption_from_context,
        supports_preview: true,
        requires_content_fetch: true,
    },
    table_missing_header: {
        uses_ai: false,
        is_image_rule: false,
        auto_fixable: true,
        fix_strategy: 'auto',
        false_positive_risk: 'high',
        risk: 'high',
        fix_type: AccessibilityFixType.table_promote_first_row_to_thead,
        supports_preview: true,
        requires_content_fetch: true,
    },
    table_header_scope_missing: {
        uses_ai: false,
        is_image_rule: false,
        auto_fixable: true,
        fix_strategy: 'auto',
        false_positive_risk: 'medium',
        risk: 'medium',
        fix_type: AccessibilityFixType.table_scope_fix,
        supports_preview: true,
        requires_content_fetch: true,
    },
    iframe_missing_title: {
        uses_ai: false,
        is_image_rule: false,
        auto_fixable: false,
        fix_strategy: 'suggested',
        false_positive_risk: 'low',
        risk: 'low',
        fix_type: AccessibilityFixType.iframe_title_from_src,
        supports_preview: true,
        requires_content_fetch: true,
    },
    button_empty_name: {
        uses_ai: true,
        is_image_rule: false,
        auto_fixable: false,
        fix_strategy: 'suggested',
        false_positive_risk: 'high',
        risk: 'high',
        fix_type: AccessibilityFixType.ai_button_label,
        supports_preview: true,
        requires_content_fetch: true,
    },
    form_control_missing_label: {
        uses_ai: true,
        is_image_rule: false,
        auto_fixable: false,
        fix_strategy: 'suggested',
        false_positive_risk: 'high',
        risk: 'high',
        fix_type: AccessibilityFixType.ai_form_label,
        supports_preview: true,
        requires_content_fetch: true,
    },
    form_placeholder_as_label: {
        uses_ai: false,
        is_image_rule: false,
        auto_fixable: true,
        fix_strategy: 'auto',
        false_positive_risk: 'medium',
        risk: 'medium',
        fix_type: AccessibilityFixType.form_placeholder_to_label,
        supports_preview: true,
        requires_content_fetch: true,
    },
    aria_invalid_role: {
        uses_ai: false,
        is_image_rule: false,
        auto_fixable: true,
        fix_strategy: 'auto',
        false_positive_risk: 'medium',
        risk: 'medium',
        fix_type: AccessibilityFixType.aria_role_normalize,
        supports_preview: true,
        requires_content_fetch: true,
    },
    aria_hidden_focusable: {
        uses_ai: false,
        is_image_rule: false,
        auto_fixable: false,
        fix_strategy: 'suggested',
        false_positive_risk: 'high',
        risk: 'high',
        fix_type: AccessibilityFixType.aria_hidden_focusable_choice,
        supports_preview: true,
        requires_content_fetch: true,
    },
    lang_invalid: {
        uses_ai: false,
        is_image_rule: false,
        auto_fixable: false,
        fix_strategy: 'suggested',
        false_positive_risk: 'low',
        risk: 'low',
        fix_type: AccessibilityFixType.lang_code_normalize,
        supports_preview: true,
        requires_content_fetch: true,
    },
    lang_inline_missing: {
        uses_ai: false,
        is_image_rule: false,
        auto_fixable: false,
        fix_strategy: 'suggested',
        false_positive_risk: 'high',
        risk: 'high',
        fix_type: AccessibilityFixType.lang_inline_franc_suggest,
        supports_preview: true,
        requires_content_fetch: true,
    },
    color_only_information: {
        uses_ai: true,
        is_image_rule: false,
        uses_second_stage_ai: true,
        auto_fixable: false,
        fix_strategy: 'suggested',
        false_positive_risk: 'high',
        risk: 'high',
        fix_type: AccessibilityFixType.ai_color_only_information,
        supports_preview: true,
        requires_content_fetch: true,
    },
    sensory_only_instructions: {
        uses_ai: true,
        is_image_rule: false,
        uses_second_stage_ai: true,
        auto_fixable: false,
        fix_strategy: 'suggested',
        false_positive_risk: 'medium',
        risk: 'medium',
        fix_type: AccessibilityFixType.ai_sensory_only_instructions,
        supports_preview: true,
        requires_content_fetch: true,
    },
    landmark_structure_quality: {
        uses_ai: true,
        is_image_rule: false,
        uses_second_stage_ai: true,
        auto_fixable: false,
        fix_strategy: 'suggested',
        false_positive_risk: 'low',
        risk: 'low',
        fix_type: AccessibilityFixType.ai_landmark_structure,
        supports_preview: true,
        requires_content_fetch: true,
    },
    table_layout_heuristic: {
        uses_ai: false,
        is_image_rule: false,
        auto_fixable: false,
        fix_strategy: 'suggested',
        false_positive_risk: 'low',
        risk: 'low',
        fix_type: AccessibilityFixType.table_layout_presentation_or_headers,
        supports_preview: true,
        requires_content_fetch: true,
    },
    table_complex_assoc_missing: {
        uses_ai: false,
        is_image_rule: false,
        auto_fixable: false,
        fix_strategy: 'manual_only',
        false_positive_risk: 'medium',
        risk: 'medium',
        fix_type: AccessibilityFixType.manual_only,
        supports_preview: false,
        requires_content_fetch: false,
    },
    video_missing_captions: {
        uses_ai: false,
        is_image_rule: false,
        auto_fixable: false,
        fix_strategy: 'manual_only',
        false_positive_risk: 'high',
        risk: 'high',
        fix_type: AccessibilityFixType.manual_only,
        supports_preview: false,
        requires_content_fetch: false,
    },
    audio_missing_transcript: {
        uses_ai: false,
        is_image_rule: false,
        auto_fixable: false,
        fix_strategy: 'manual_only',
        false_positive_risk: 'high',
        risk: 'high',
        fix_type: AccessibilityFixType.manual_only,
        supports_preview: false,
        requires_content_fetch: false,
    },
    motion_gif_warning: {
        uses_ai: false,
        is_image_rule: false,
        auto_fixable: false,
        fix_strategy: 'manual_only',
        false_positive_risk: 'low',
        risk: 'low',
        fix_type: AccessibilityFixType.manual_only,
        supports_preview: false,
        requires_content_fetch: false,
    },
    video_embed_caption_unknown: {
        uses_ai: false,
        is_image_rule: false,
        auto_fixable: false,
        fix_strategy: 'manual_only',
        false_positive_risk: 'medium',
        risk: 'medium',
        fix_type: AccessibilityFixType.manual_only,
        supports_preview: false,
        requires_content_fetch: false,
    },
    doc_pdf_accessibility_unknown: {
        uses_ai: false,
        is_image_rule: false,
        auto_fixable: false,
        fix_strategy: 'manual_only',
        false_positive_risk: 'low',
        risk: 'low',
        fix_type: AccessibilityFixType.manual_only,
        supports_preview: false,
        requires_content_fetch: false,
    },
    doc_office_structure_unknown: {
        uses_ai: false,
        is_image_rule: false,
        auto_fixable: false,
        fix_strategy: 'manual_only',
        false_positive_risk: 'low',
        risk: 'low',
        fix_type: AccessibilityFixType.manual_only,
        supports_preview: false,
        requires_content_fetch: false,
    },
    doc_spreadsheet_headers_unknown: {
        uses_ai: false,
        is_image_rule: false,
        auto_fixable: false,
        fix_strategy: 'manual_only',
        false_positive_risk: 'low',
        risk: 'low',
        fix_type: AccessibilityFixType.manual_only,
        supports_preview: false,
        requires_content_fetch: false,
    },
    session_timeout_no_warning: {
        uses_ai: false,
        is_image_rule: false,
        auto_fixable: false,
        fix_strategy: 'manual_only',
        false_positive_risk: 'high',
        risk: 'high',
        fix_type: AccessibilityFixType.manual_only,
        supports_preview: false,
        requires_content_fetch: true,
    },
    keyboard_focus_trap_heuristic: {
        uses_ai: false,
        is_image_rule: false,
        auto_fixable: false,
        fix_strategy: 'manual_only',
        false_positive_risk: 'low',
        risk: 'low',
        fix_type: AccessibilityFixType.manual_only,
        supports_preview: false,
        requires_content_fetch: false,
    },
};
exports.ACCESSIBILITY_AI_SUGGESTED_RULES = new Set(Object.entries(exports.ACCESSIBILITY_FIXABILITY_MAP)
    .filter(function (_a) {
    var v = _a[1];
    return v.uses_ai;
})
    .map(function (_a) {
    var k = _a[0];
    return k;
}));
exports.ACCESSIBILITY_IMAGE_RULES = new Set(Object.entries(exports.ACCESSIBILITY_FIXABILITY_MAP)
    .filter(function (_a) {
    var v = _a[1];
    return v.is_image_rule;
})
    .map(function (_a) {
    var k = _a[0];
    return k;
}));
var ANTHROPIC_TEXT_MODEL_DEFAULT = 'claude-haiku-4-5-20251001';
var ANTHROPIC_VISION_MODEL_DEFAULT = 'claude-sonnet-4-6';
var ANTHROPIC_PROMPT_CACHE_BETA = 'prompt-caching-2024-07-31';
var ADA_AI_HTML_CONTEXT_IMAGE = 400;
var ADA_AI_HTML_CONTEXT_TEXT = 900;
var ACCESSIBILITY_TIER1_RULE_IDS = new Set([
    'adjacent_duplicate_links',
    'heading_h1_in_body',
    'heading_skipped_level',
    'heading_too_long',
    'img_alt_filename',
    'img_alt_too_long',
    'img_missing_alt',
    'large_text_contrast',
    'link_split_or_broken',
    'list_not_semantic',
    'small_text_contrast',
    'table_header_scope_missing',
    'table_missing_caption',
    'table_missing_header',
]);
function accessibilityTierForRuleId(ruleId) {
    return ACCESSIBILITY_TIER1_RULE_IDS.has(ruleId) ? 1 : 2;
}
var CLEARABLE_CONTENT_KEYS = new Set([
    'description',
    'message',
    'body',
    'instructions',
]);
var NULLABLE_QUIZ_FIELDS = new Set(['time_limit']);
var DISCUSSION_UPDATE_ALLOWED_KEYS = new Set([
    'title',
    'message',
    'allow_rating',
    'delayed_post_at',
    'lock_at',
    'unlock_at',
    'due_at',
    'published',
    'discussion_type',
    'require_initial_post',
    'anonymous_state',
    'is_anonymous_author',
    'sort_order',
    'sort_order_locked',
    'expanded',
    'expanded_locked',
    'only_graders_can_rate',
    'pinned',
    'lock_comment',
    'podcast_enabled',
    'podcast_has_student_posts',
    'points_possible',
    'assignment_group_id',
]);
var ANNOUNCEMENT_UPDATE_ALLOWED_KEYS = new Set([
    'title',
    'message',
    'allow_rating',
    'delayed_post_at',
    'lock_at',
    'published',
    'discussion_type',
    'require_initial_post',
    'sort_order',
    'sort_order_locked',
    'pinned',
    'lock_comment',
    'podcast_enabled',
    'podcast_has_student_posts',
    'only_graders_can_rate',
]);
function processDateField(key, value) {
    if (!key.endsWith('_at'))
        return undefined;
    if (value === null)
        return null;
    if (value === undefined || value === '')
        return undefined;
    try {
        var d = new Date(value);
        return !isNaN(d.getTime()) ? d.toISOString().slice(0, 19) + 'Z' : undefined;
    }
    catch (_a) {
        return undefined;
    }
}
function validateDateOrder(updates, itemLabel) {
    if (itemLabel === void 0) { itemLabel = 'Item'; }
    var due = updates.due_at != null ? new Date(updates.due_at).getTime() : NaN;
    var unlock = updates.unlock_at != null ? new Date(updates.unlock_at).getTime() : NaN;
    var lock = updates.lock_at != null ? new Date(updates.lock_at).getTime() : NaN;
    var delayed = updates.delayed_post_at != null
        ? new Date(updates.delayed_post_at).getTime()
        : NaN;
    if (!Number.isFinite(due) &&
        !Number.isFinite(unlock) &&
        !Number.isFinite(lock) &&
        !Number.isFinite(delayed))
        return;
    if (Number.isFinite(unlock) && Number.isFinite(due) && unlock >= due) {
        throw new Error("".concat(itemLabel, ": unlock_at must be before due_at (Canvas requirement)"));
    }
    if (Number.isFinite(due) && Number.isFinite(lock) && lock <= due) {
        throw new Error("".concat(itemLabel, ": lock_at must be after due_at (Canvas requirement)"));
    }
    if (Number.isFinite(unlock) &&
        Number.isFinite(lock) &&
        !Number.isFinite(due) &&
        unlock >= lock) {
        throw new Error("".concat(itemLabel, ": unlock_at must be before lock_at (Canvas requirement)"));
    }
    if (Number.isFinite(delayed) && Number.isFinite(lock) && delayed >= lock) {
        throw new Error("".concat(itemLabel, ": delayed_post_at must be before lock_at (Canvas requirement)"));
    }
}
function cleanContentUpdates(updates, options) {
    var cleanedUpdates = {};
    Object.keys(updates).forEach(function (key) {
        var v = updates[key];
        if (v === undefined)
            return;
        var dateVal = processDateField(key, v);
        if (dateVal !== undefined) {
            cleanedUpdates[key] = dateVal;
            return;
        }
        if (options.clearableTextFields &&
            (v === null || v === '') &&
            CLEARABLE_CONTENT_KEYS.has(key)) {
            cleanedUpdates[key] = v === null ? null : '';
        }
        else if (v !== null && v !== undefined && v !== '') {
            cleanedUpdates[key] = v;
        }
    });
    return cleanedUpdates;
}
function normalizeUpdatePayload(updates, options) {
    var cleaned = {};
    Object.keys(updates || {}).forEach(function (key) {
        var _a, _b;
        var value = updates[key];
        if (value === undefined)
            return;
        var dateVal = processDateField(key, value);
        if (dateVal !== undefined) {
            cleaned[key] = dateVal;
            return;
        }
        if ((value === null || value === '') &&
            options.clearableTextFields &&
            CLEARABLE_CONTENT_KEYS.has(key)) {
            cleaned[key] = value === null ? null : '';
            return;
        }
        if (value === null && ((_a = options.nullableKeys) === null || _a === void 0 ? void 0 : _a.has(key))) {
            cleaned[key] = null;
            return;
        }
        if ((_b = options.floorIntegerKeys) === null || _b === void 0 ? void 0 : _b.has(key)) {
            var n = typeof value === 'number' ? value : parseInt(String(value), 10);
            cleaned[key] = isNaN(n) || n < 0 ? null : Math.floor(n);
            return;
        }
        if (value === null || value === '')
            return;
        cleaned[key] = value;
    });
    return cleaned;
}
function splitNewQuizTextUpdates(pending) {
    var assignmentUpdates = __assign({}, (pending || {}));
    var quizUpdates = {};
    if (Object.prototype.hasOwnProperty.call(assignmentUpdates, 'description')) {
        var rawDesc = assignmentUpdates.description;
        quizUpdates.instructions =
            rawDesc === null || rawDesc === undefined ? '' : String(rawDesc);
        delete assignmentUpdates.description;
    }
    if (Object.prototype.hasOwnProperty.call(assignmentUpdates, 'name')) {
        var rawTitle = assignmentUpdates.name;
        quizUpdates.title =
            rawTitle === null || rawTitle === undefined ? '' : String(rawTitle);
        delete assignmentUpdates.name;
    }
    return { assignmentUpdates: assignmentUpdates, quizUpdates: quizUpdates };
}
function getDiscussionDateRoutingPolicy(isAnnouncement) {
    return {
        dateDetailKeys: isAnnouncement ? [] : ['due_at', 'unlock_at', 'lock_at'],
    };
}
var CanvasService = function () {
    var _classDecorators = [(0, common_1.Injectable)({ scope: common_1.Scope.REQUEST })];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var CanvasService = _classThis = /** @class */ (function () {
        function CanvasService_1(req, config) {
            this.req = req;
            this.config = config;
            this.anthropicUsageSession = {
                input: 0,
                output: 0,
                cacheRead: 0,
                cacheWrite: 0,
                calls: 0,
            };
        }
        CanvasService_1.prototype.anthropicHeaders = function (key) {
            return {
                'x-api-key': key,
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json',
                'anthropic-beta': ANTHROPIC_PROMPT_CACHE_BETA,
            };
        };
        CanvasService_1.prototype.recordAnthropicUsage = function (usage, meta) {
            var _a, _b, _c, _d;
            var u = usage;
            var input = Number((_a = u === null || u === void 0 ? void 0 : u.input_tokens) !== null && _a !== void 0 ? _a : 0) || 0;
            var output = Number((_b = u === null || u === void 0 ? void 0 : u.output_tokens) !== null && _b !== void 0 ? _b : 0) || 0;
            var cr = Number((_c = u === null || u === void 0 ? void 0 : u.cache_read_input_tokens) !== null && _c !== void 0 ? _c : 0) || 0;
            var cw = Number((_d = u === null || u === void 0 ? void 0 : u.cache_creation_input_tokens) !== null && _d !== void 0 ? _d : 0) || 0;
            this.anthropicUsageSession.input += input;
            this.anthropicUsageSession.output += output;
            this.anthropicUsageSession.cacheRead += cr;
            this.anthropicUsageSession.cacheWrite += cw;
            this.anthropicUsageSession.calls += 1;
            var s = this.anthropicUsageSession;
            var bits = [
                '[Anthropic]',
                "ctx=".concat(meta.context),
                "model=".concat(meta.model),
                meta.ruleId ? "rule=".concat(meta.ruleId) : '',
                meta.resourceType ? "resource_type=".concat(meta.resourceType) : '',
                "in=".concat(input),
                "out=".concat(output),
                cr ? "cache_read=".concat(cr) : '',
                cw ? "cache_write=".concat(cw) : '',
                "session_in=".concat(s.input),
                "session_out=".concat(s.output),
                "session_calls=".concat(s.calls),
            ].filter(Boolean);
            console.log(bits.join(' '));
        };
        CanvasService_1.prototype.extractAnthropicText = function (payload) {
            return Array.isArray(payload === null || payload === void 0 ? void 0 : payload.content)
                ? payload.content
                    .filter(function (c) { return (c === null || c === void 0 ? void 0 : c.type) === 'text' && (c === null || c === void 0 ? void 0 : c.text); })
                    .map(function (c) { return c.text || ''; })
                    .join('\n')
                : '';
        };
        CanvasService_1.prototype.fetchAnthropicMessage = function (opts) {
            return __awaiter(this, void 0, void 0, function () {
                var key, userContent, res, raw, text, payload;
                var _a, _b;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            key = (this.config.get('ANTHROPIC_API_KEY') || '').trim();
                            if (!key)
                                throw new Error('ANTHROPIC_API_KEY not configured');
                            userContent = [
                                {
                                    type: 'text',
                                    text: opts.staticBlock,
                                    cache_control: { type: 'ephemeral' },
                                },
                                { type: 'text', text: opts.dynamicBlock },
                            ];
                            if (((_a = opts.image) === null || _a === void 0 ? void 0 : _a.base64) && ((_b = opts.image) === null || _b === void 0 ? void 0 : _b.mediaType)) {
                                userContent.push({
                                    type: 'image',
                                    source: {
                                        type: 'base64',
                                        media_type: opts.image.mediaType,
                                        data: opts.image.base64,
                                    },
                                });
                            }
                            return [4 /*yield*/, fetch('https://api.anthropic.com/v1/messages', {
                                    method: 'POST',
                                    headers: this.anthropicHeaders(key),
                                    body: JSON.stringify({
                                        model: opts.model,
                                        max_tokens: opts.maxTokens,
                                        temperature: opts.temperature,
                                        messages: [{ role: 'user', content: userContent }],
                                    }),
                                })];
                        case 1:
                            res = _c.sent();
                            return [4 /*yield*/, res.json().catch(function () { return ({}); })];
                        case 2:
                            raw = _c.sent();
                            if (!res.ok) {
                                text = typeof raw === 'object' && raw && 'error' in raw
                                    ? JSON.stringify(raw)
                                    : String(res.statusText);
                                throw new Error("Claude API failed (".concat(res.status, "): ").concat(String(text).slice(0, 300)));
                            }
                            payload = raw;
                            this.recordAnthropicUsage(payload.usage, __assign({ model: opts.model }, opts.meta));
                            return [2 /*return*/, { text: this.extractAnthropicText(payload), raw: raw }];
                    }
                });
            });
        };
        CanvasService_1.prototype.getCourses = function () {
            return __awaiter(this, void 0, void 0, function () {
                var _a, token, baseUrl, termMap, allCourses, url, response, errBody, chunk, linkHeader, processedCourses, grouped;
                var _this = this;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.getAuthHeaders()];
                        case 1:
                            _a = _b.sent(), token = _a.token, baseUrl = _a.baseUrl;
                            return [4 /*yield*/, this.getTermMap()];
                        case 2:
                            termMap = _b.sent();
                            allCourses = [];
                            url = "".concat(baseUrl, "/users/self/courses?per_page=100&state=all");
                            _b.label = 3;
                        case 3:
                            if (!url) return [3 /*break*/, 8];
                            return [4 /*yield*/, fetch(url, {
                                    headers: { Authorization: "Bearer ".concat(token) },
                                })];
                        case 4:
                            response = _b.sent();
                            if (!!response.ok) return [3 /*break*/, 6];
                            return [4 /*yield*/, response.text().catch(function () { return ''; })];
                        case 5:
                            errBody = _b.sent();
                            throw new Error("Canvas API ".concat(response.status, " ").concat(response.statusText).concat(errBody ? ": ".concat(errBody.slice(0, 500)) : ''));
                        case 6: return [4 /*yield*/, response.json()];
                        case 7:
                            chunk = (_b.sent());
                            if (Array.isArray(chunk)) {
                                allCourses.push.apply(allCourses, chunk);
                            }
                            linkHeader = response.headers.get('link');
                            url = this.getNextUrl(linkHeader);
                            return [3 /*break*/, 3];
                        case 8:
                            processedCourses = allCourses.map(function (course) {
                                var sisId = (course.sis_course_id || '').trim();
                                var termLabel = _this.buildTermLabel(course, termMap, sisId);
                                return {
                                    id: course.id,
                                    name: course.name || course.course_code || "ID: ".concat(course.id),
                                    course_code: course.course_code || 'No Code',
                                    term_label: termLabel,
                                    end_date: course.end_at || null,
                                    created_at: course.created_at || null,
                                };
                            });
                            grouped = processedCourses.reduce(function (acc, course) {
                                var term = course.term_label;
                                if (!acc[term]) {
                                    var termData = Object.values(termMap).find(function (t) { return t.name === term; });
                                    var sortDate = (termData === null || termData === void 0 ? void 0 : termData.end) ||
                                        course.end_date ||
                                        course.created_at ||
                                        '1970-01-01T00:00:00Z';
                                    acc[term] = {
                                        term: term,
                                        sortDate: sortDate,
                                        courses: [],
                                    };
                                }
                                acc[term].courses.push(course);
                                return acc;
                            }, {});
                            return [2 /*return*/, Object.values(grouped)
                                    .sort(function (a, b) {
                                    if (a.term === 'No Term Assigned')
                                        return 1;
                                    if (b.term === 'No Term Assigned')
                                        return -1;
                                    return new Date(b.sortDate).getTime() - new Date(a.sortDate).getTime();
                                })
                                    .map(function (group) { return ({
                                    term: group.term,
                                    courses: group.courses.sort(function (a, b) { return a.name.localeCompare(b.name); }),
                                }); })];
                    }
                });
            });
        };
        CanvasService_1.prototype.buildTermLabel = function (course, termMap, sisId) {
            var match = sisId.match(/(\d{5,6})\s*$/);
            if (match) {
                return this.decodeNumericTerm(match[1]);
            }
            if (course.enrollment_term_id && termMap[course.enrollment_term_id]) {
                return termMap[course.enrollment_term_id].name;
            }
            return 'No Term Assigned';
        };
        CanvasService_1.prototype.decodeNumericTerm = function (numericTerm) {
            var year = parseInt(numericTerm.substring(0, 4), 10);
            var termIndex = parseInt(numericTerm.substring(4), 10);
            var universalMap = {
                1: 'Fall',
                2: 'Spring',
                3: 'Summer I',
                4: 'Summer II',
                5: 'Summer Special',
                10: 'Fall',
                20: 'Spring',
                31: 'Summer I',
                32: 'Summer II',
                40: 'Summer Special',
            };
            var termName = universalMap[termIndex] || "Term ".concat(termIndex);
            var realYear = termIndex === 1 || termIndex === 10 ? year - 1 : year;
            return "".concat(termName, " ").concat(realYear);
        };
        CanvasService_1.prototype.getTermMap = function () {
            return __awaiter(this, void 0, void 0, function () {
                var _a, token, baseUrl, response, data, terms, termMap_1, _b;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            _c.trys.push([0, 4, , 5]);
                            return [4 /*yield*/, this.getAuthHeaders()];
                        case 1:
                            _a = _c.sent(), token = _a.token, baseUrl = _a.baseUrl;
                            return [4 /*yield*/, fetch("".concat(baseUrl, "/accounts/self/terms"), {
                                    headers: { Authorization: "Bearer ".concat(token) },
                                })];
                        case 2:
                            response = _c.sent();
                            if (!response.ok)
                                return [2 /*return*/, {}];
                            return [4 /*yield*/, response.json()];
                        case 3:
                            data = _c.sent();
                            terms = data.enrollment_terms || [];
                            termMap_1 = {};
                            terms.forEach(function (t) {
                                if (t.id != null) {
                                    termMap_1[t.id] = {
                                        name: t.name || '',
                                        end: t.end_at || '1970-01-01T00:00:00Z',
                                    };
                                }
                            });
                            return [2 /*return*/, termMap_1];
                        case 4:
                            _b = _c.sent();
                            return [2 /*return*/, {}];
                        case 5: return [2 /*return*/];
                    }
                });
            });
        };
        CanvasService_1.prototype.getNextUrl = function (linkHeader) {
            var _a;
            if (!linkHeader)
                return null;
            var match = (_a = linkHeader
                .split(',')
                .find(function (l) { return l.includes('rel="next"'); })) === null || _a === void 0 ? void 0 : _a.match(/<([^>]+)>/);
            return match ? match[1] : null;
        };
        CanvasService_1.prototype.getAuthHeaders = function () {
            return __awaiter(this, void 0, void 0, function () {
                var token, baseUrl;
                var _a, _b, _c, _d;
                return __generator(this, function (_e) {
                    token = (_b = (_a = this.req) === null || _a === void 0 ? void 0 : _a.session) === null || _b === void 0 ? void 0 : _b.canvasToken;
                    baseUrl = (_d = (_c = this.req) === null || _c === void 0 ? void 0 : _c.session) === null || _d === void 0 ? void 0 : _d.canvasUrl;
                    if (!token || !baseUrl) {
                        throw new Error('Unauthorized: No Canvas token. Launch via LTI and complete Canvas OAuth.');
                    }
                    return [2 /*return*/, { token: token, baseUrl: baseUrl }];
                });
            });
        };
        CanvasService_1.prototype.quizApiV1Base = function (apiV1BaseUrl) {
            var trimmed = apiV1BaseUrl.replace(/\/$/, '');
            if (trimmed.endsWith('/api/v1')) {
                return "".concat(trimmed.slice(0, -'/api/v1'.length), "/api/quiz/v1");
            }
            return "".concat(trimmed, "/api/quiz/v1");
        };
        CanvasService_1.prototype.isLikelyNewQuizAssignment = function (assignment) {
            if (!assignment || typeof assignment !== 'object')
                return false;
            if (assignment.is_quiz_assignment === true)
                return true;
            if (assignment.quiz_lti === true)
                return true;
            var submissionTypes = Array.isArray(assignment.submission_types)
                ? assignment.submission_types
                : [];
            if (submissionTypes.includes('external_tool') && assignment.quiz_id)
                return true;
            return false;
        };
        CanvasService_1.prototype.isQuizLinkedAssignment = function (assignment) {
            var _a, _b;
            if (!assignment || typeof assignment !== 'object')
                return false;
            if (assignment.is_quiz_assignment === true ||
                assignment.isQuizAssignment === true)
                return true;
            if (assignment.quiz_lti === true || assignment.quizLti === true)
                return true;
            var quizId = (_a = assignment.quiz_id) !== null && _a !== void 0 ? _a : assignment.quizId;
            if (quizId != null)
                return true;
            var st = (_b = assignment.submission_types) !== null && _b !== void 0 ? _b : assignment.submissionTypes;
            var submissionTypes = Array.isArray(st) ? st : [];
            if (submissionTypes.includes('online_quiz'))
                return true;
            if (submissionTypes.includes('external_tool'))
                return true;
            return false;
        };
        CanvasService_1.prototype.extractNewQuizInstructionsFromPayload = function (q) {
            var _this = this;
            var _a;
            if (!q || typeof q !== 'object')
                return '';
            var tryString = function (v) { return _this.nonEmptyBodyString(v); };
            for (var _i = 0, _b = [
                'instructions',
                'instructions_html',
                'description',
                'body',
                'general_instructions',
            ]; _i < _b.length; _i++) {
                var key = _b[_i];
                var s = tryString(q[key]);
                if (s)
                    return s;
            }
            var instr = q.instructions;
            if (instr && typeof instr === 'object') {
                var fromBlocks = this.extractTextFromBlockEditorBlocks(instr);
                if (fromBlocks)
                    return fromBlocks;
            }
            var ed = q.editor_display;
            if (ed && typeof ed === 'object') {
                for (var _c = 0, _d = ['blocks', 'content', 'html']; _c < _d.length; _c++) {
                    var k = _d[_c];
                    if (ed[k] != null) {
                        var s = typeof ed[k] === 'string' ? tryString(ed[k]) : null;
                        if (s)
                            return s;
                        var t = this.extractTextFromBlockEditorBlocks(ed[k]);
                        if (t)
                            return t;
                    }
                }
            }
            var rootBlocks = (_a = q.instructions_blocks) !== null && _a !== void 0 ? _a : q.content_blocks;
            if (rootBlocks != null) {
                var t = this.extractTextFromBlockEditorBlocks(rootBlocks);
                if (t)
                    return t;
            }
            return '';
        };
        CanvasService_1.prototype.normalizeNewQuizListItem = function (q) {
            var _a, _b, _c, _d, _e, _f;
            var assignmentId = (_b = (_a = q.assignment_id) !== null && _a !== void 0 ? _a : q.assignmentId) !== null && _b !== void 0 ? _b : q.id;
            var idNum = assignmentId != null ? Number(assignmentId) : NaN;
            if (!Number.isFinite(idNum))
                return null;
            var title = (_d = (_c = q.title) !== null && _c !== void 0 ? _c : q.name) !== null && _d !== void 0 ? _d : '';
            var description = this.extractNewQuizInstructionsFromPayload(q);
            return {
                id: idNum,
                name: typeof title === 'string' ? title : String(title),
                description: description,
                assignment_group_id: (_e = q.assignment_group_id) !== null && _e !== void 0 ? _e : (_f = q.assignment_group) === null || _f === void 0 ? void 0 : _f.id,
                points_possible: q.points_possible,
                due_at: q.due_at,
                unlock_at: q.unlock_at,
                lock_at: q.lock_at,
                published: q.published,
            };
        };
        CanvasService_1.prototype.fetchPaginatedNewQuizQuizzes = function (courseId, token, canvasApiV1Base) {
            return __awaiter(this, void 0, void 0, function () {
                var quizBase, all, url, res, text, chunk, items;
                var _a, _b, _c;
                return __generator(this, function (_d) {
                    switch (_d.label) {
                        case 0:
                            quizBase = this.quizApiV1Base(canvasApiV1Base);
                            all = [];
                            url = "".concat(quizBase, "/courses/").concat(courseId, "/quizzes?per_page=100");
                            _d.label = 1;
                        case 1:
                            if (!url) return [3 /*break*/, 6];
                            return [4 /*yield*/, fetch(url, {
                                    headers: { Authorization: "Bearer ".concat(token) },
                                })];
                        case 2:
                            res = _d.sent();
                            if (!!res.ok) return [3 /*break*/, 4];
                            return [4 /*yield*/, res.text().catch(function () { return ''; })];
                        case 3:
                            text = _d.sent();
                            throw new Error("New Quizzes API ".concat(res.status, ": ").concat(text.slice(0, 400)));
                        case 4: return [4 /*yield*/, res.json().catch(function () { return null; })];
                        case 5:
                            chunk = _d.sent();
                            items = [];
                            if (Array.isArray(chunk)) {
                                items = chunk;
                            }
                            else if (chunk && typeof chunk === 'object') {
                                items = (_c = (_b = (_a = chunk.quizzes) !== null && _a !== void 0 ? _a : chunk.data) !== null && _b !== void 0 ? _b : chunk.items) !== null && _c !== void 0 ? _c : [];
                                if (!Array.isArray(items) && chunk.quiz) {
                                    items = [chunk.quiz];
                                }
                            }
                            if (Array.isArray(items)) {
                                all.push.apply(all, items);
                            }
                            url = this.getNextUrl(res.headers.get('link'));
                            return [3 /*break*/, 1];
                        case 6: return [2 /*return*/, all];
                    }
                });
            });
        };
        CanvasService_1.prototype.enrichNewQuizRowsFromDetail = function (courseId, rows, token, canvasApiV1Base) {
            return __awaiter(this, void 0, void 0, function () {
                var quizBase, needDetail, batch, i, slice;
                var _this = this;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            quizBase = this.quizApiV1Base(canvasApiV1Base);
                            needDetail = rows.filter(function (r) { return !r.description || String(r.description).trim() === ''; });
                            batch = 10;
                            i = 0;
                            _a.label = 1;
                        case 1:
                            if (!(i < needDetail.length)) return [3 /*break*/, 4];
                            slice = needDetail.slice(i, i + batch);
                            return [4 /*yield*/, Promise.all(slice.map(function (row) { return __awaiter(_this, void 0, void 0, function () {
                                    var url, res, q, d, t;
                                    var _a;
                                    return __generator(this, function (_b) {
                                        switch (_b.label) {
                                            case 0:
                                                url = "".concat(quizBase, "/courses/").concat(courseId, "/quizzes/").concat(row.id);
                                                return [4 /*yield*/, fetch(url, {
                                                        headers: { Authorization: "Bearer ".concat(token) },
                                                    })];
                                            case 1:
                                                res = _b.sent();
                                                if (!res.ok)
                                                    return [2 /*return*/];
                                                return [4 /*yield*/, res.json().catch(function () { return null; })];
                                            case 2:
                                                q = _b.sent();
                                                if (!q || typeof q !== 'object')
                                                    return [2 /*return*/];
                                                d = this.extractNewQuizInstructionsFromPayload(q);
                                                if (d)
                                                    row.description = d;
                                                t = (_a = q.title) !== null && _a !== void 0 ? _a : q.name;
                                                if (t != null && String(t).trim() !== '') {
                                                    row.name = String(t);
                                                }
                                                return [2 /*return*/];
                                        }
                                    });
                                }); }))];
                        case 2:
                            _a.sent();
                            _a.label = 3;
                        case 3:
                            i += batch;
                            return [3 /*break*/, 1];
                        case 4: return [2 /*return*/];
                    }
                });
            });
        };
        CanvasService_1.prototype.getCourseNewQuizzes = function (courseId) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, token, baseUrl, raw, rows, _i, raw_1, q, row, rubricLookup;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.getAuthHeaders()];
                        case 1:
                            _a = _b.sent(), token = _a.token, baseUrl = _a.baseUrl;
                            return [4 /*yield*/, this.fetchPaginatedNewQuizQuizzes(courseId, token, baseUrl)];
                        case 2:
                            raw = _b.sent();
                            rows = [];
                            for (_i = 0, raw_1 = raw; _i < raw_1.length; _i++) {
                                q = raw_1[_i];
                                row = this.normalizeNewQuizListItem(q);
                                if (row)
                                    rows.push(row);
                            }
                            return [4 /*yield*/, this.enrichNewQuizRowsFromDetail(courseId, rows, token, baseUrl)];
                        case 3:
                            _b.sent();
                            return [4 /*yield*/, this.getAssignmentRubricLookup(courseId, token, baseUrl)];
                        case 4:
                            rubricLookup = _b.sent();
                            return [2 /*return*/, rows.map(function (row) {
                                    var _a, _b, _c, _d;
                                    var assignmentId = Number(row === null || row === void 0 ? void 0 : row.id);
                                    var rubric = Number.isFinite(assignmentId)
                                        ? rubricLookup.get(assignmentId)
                                        : null;
                                    return __assign(__assign({}, row), { rubric_id: (_a = rubric === null || rubric === void 0 ? void 0 : rubric.rubric_id) !== null && _a !== void 0 ? _a : null, rubric_summary: (_b = rubric === null || rubric === void 0 ? void 0 : rubric.rubric_summary) !== null && _b !== void 0 ? _b : null, rubric_url: (_c = rubric === null || rubric === void 0 ? void 0 : rubric.rubric_url) !== null && _c !== void 0 ? _c : null, rubric_association_id: (_d = rubric === null || rubric === void 0 ? void 0 : rubric.rubric_association_id) !== null && _d !== void 0 ? _d : null });
                                })];
                    }
                });
            });
        };
        CanvasService_1.prototype.updateNewQuizRow = function (courseId, assignmentId, updates) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, token, baseUrl, split, assignmentUpdates, quizUpdates;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.getAuthHeaders()];
                        case 1:
                            _a = _b.sent(), token = _a.token, baseUrl = _a.baseUrl;
                            split = splitNewQuizTextUpdates(updates);
                            assignmentUpdates = split.assignmentUpdates;
                            quizUpdates = split.quizUpdates;
                            if (!(Object.keys(quizUpdates).length > 0)) return [3 /*break*/, 3];
                            return [4 /*yield*/, this.patchNewQuizByAssignment(courseId, assignmentId, quizUpdates, token, baseUrl)];
                        case 2:
                            _b.sent();
                            _b.label = 3;
                        case 3:
                            if (Object.keys(assignmentUpdates).length > 0) {
                                return [2 /*return*/, this.updateAssignment(courseId, assignmentId, assignmentUpdates)];
                            }
                            return [2 /*return*/, this.getAssignment(courseId, assignmentId)];
                    }
                });
            });
        };
        CanvasService_1.prototype.createNewQuiz = function (courseId, body) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, token, baseUrl, quizBase, url, payload, form, requestAttempts, created, lastErrorText, _i, requestAttempts_1, attempt, res, text, errMsg, j, id;
                var _b, _c, _d, _e;
                return __generator(this, function (_f) {
                    switch (_f.label) {
                        case 0: return [4 /*yield*/, this.getAuthHeaders()];
                        case 1:
                            _a = _f.sent(), token = _a.token, baseUrl = _a.baseUrl;
                            quizBase = this.quizApiV1Base(baseUrl);
                            url = "".concat(quizBase, "/courses/").concat(courseId, "/quizzes");
                            payload = {};
                            if (body.title != null)
                                payload.title = body.title;
                            if (body.name != null)
                                payload.title = (_b = payload.title) !== null && _b !== void 0 ? _b : body.name;
                            if (body.instructions != null)
                                payload.instructions = body.instructions;
                            if (body.description != null)
                                payload.instructions = (_c = payload.instructions) !== null && _c !== void 0 ? _c : body.description;
                            if (body.assignment_group_id != null)
                                payload.assignment_group_id = body.assignment_group_id;
                            if (body.points_possible != null)
                                payload.points_possible = body.points_possible;
                            if (body.due_at != null)
                                payload.due_at = body.due_at;
                            if (body.unlock_at != null)
                                payload.unlock_at = body.unlock_at;
                            if (body.lock_at != null)
                                payload.lock_at = body.lock_at;
                            form = new URLSearchParams();
                            Object.entries(payload).forEach(function (_a) {
                                var k = _a[0], v = _a[1];
                                if (v !== undefined && v !== null)
                                    form.append(k, String(v));
                            });
                            requestAttempts = [
                                { contentType: 'application/json', body: JSON.stringify(payload) },
                                {
                                    contentType: 'application/json',
                                    body: JSON.stringify({ quiz: payload }),
                                },
                                {
                                    contentType: 'application/x-www-form-urlencoded',
                                    body: form.toString(),
                                },
                            ];
                            created = null;
                            lastErrorText = '';
                            _i = 0, requestAttempts_1 = requestAttempts;
                            _f.label = 2;
                        case 2:
                            if (!(_i < requestAttempts_1.length)) return [3 /*break*/, 6];
                            attempt = requestAttempts_1[_i];
                            return [4 /*yield*/, fetch(url, {
                                    method: 'POST',
                                    headers: {
                                        Authorization: "Bearer ".concat(token),
                                        'Content-Type': attempt.contentType,
                                    },
                                    body: attempt.body,
                                })];
                        case 3:
                            res = _f.sent();
                            return [4 /*yield*/, res.text()];
                        case 4:
                            text = _f.sent();
                            if (res.ok) {
                                try {
                                    created = text ? JSON.parse(text) : {};
                                }
                                catch (_g) {
                                    created = {};
                                }
                                return [3 /*break*/, 6];
                            }
                            lastErrorText = text || "".concat(res.status, " ").concat(res.statusText);
                            if (![400, 415, 422].includes(res.status)) {
                                return [3 /*break*/, 6];
                            }
                            _f.label = 5;
                        case 5:
                            _i++;
                            return [3 /*break*/, 2];
                        case 6:
                            if (!created) {
                                errMsg = lastErrorText;
                                try {
                                    j = JSON.parse(lastErrorText);
                                    errMsg = j.message || j.error || errMsg;
                                }
                                catch (_h) {
                                    /* ignore */
                                }
                                throw new Error("New Quizzes API: ".concat(errMsg));
                            }
                            id = (_e = (_d = created.assignment_id) !== null && _d !== void 0 ? _d : created.id) !== null && _e !== void 0 ? _e : created.assignmentId;
                            return [2 /*return*/, __assign(__assign({}, created), { id: id })];
                    }
                });
            });
        };
        CanvasService_1.prototype.patchNewQuizByAssignment = function (courseId, assignmentId, quizUpdates, token, canvasApiV1Base) {
            return __awaiter(this, void 0, void 0, function () {
                var quizBase, url, params, formBody, jsonBody, tryRequest, result, errMsg, j;
                var _this = this;
                var _a, _b;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            quizBase = this.quizApiV1Base(canvasApiV1Base);
                            url = "".concat(quizBase, "/courses/").concat(courseId, "/quizzes/").concat(assignmentId);
                            params = new URLSearchParams();
                            if (Object.prototype.hasOwnProperty.call(quizUpdates, 'instructions')) {
                                params.append('quiz[instructions]', (_a = quizUpdates.instructions) !== null && _a !== void 0 ? _a : '');
                            }
                            if (Object.prototype.hasOwnProperty.call(quizUpdates, 'title')) {
                                params.append('quiz[title]', (_b = quizUpdates.title) !== null && _b !== void 0 ? _b : '');
                            }
                            formBody = params.toString();
                            jsonBody = JSON.stringify({ quiz: quizUpdates });
                            tryRequest = function (contentType, body) { return __awaiter(_this, void 0, void 0, function () {
                                var res, text;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            console.log("[Service][NewQuiz] PATCH ".concat(url));
                                            console.log("[Service][NewQuiz] Request Content-Type: ".concat(contentType));
                                            console.log("[Service][NewQuiz] Request Body: ".concat(body));
                                            return [4 /*yield*/, fetch(url, {
                                                    method: 'PATCH',
                                                    headers: {
                                                        Authorization: "Bearer ".concat(token),
                                                        'Content-Type': contentType,
                                                    },
                                                    body: body,
                                                })];
                                        case 1:
                                            res = _a.sent();
                                            return [4 /*yield*/, res.text()];
                                        case 2:
                                            text = _a.sent();
                                            console.log("[Service][NewQuiz] Response Status: ".concat(res.status, " ").concat(res.statusText));
                                            console.log("[Service][NewQuiz] Response Body: ".concat(text));
                                            return [2 /*return*/, { ok: res.ok, status: res.status, text: text }];
                                    }
                                });
                            }); };
                            return [4 /*yield*/, tryRequest('application/x-www-form-urlencoded', formBody)];
                        case 1:
                            result = _c.sent();
                            if (!(!result.ok &&
                                (result.status === 400 || result.status === 415 || result.status === 422))) return [3 /*break*/, 3];
                            return [4 /*yield*/, tryRequest('application/json', jsonBody)];
                        case 2:
                            result = _c.sent();
                            _c.label = 3;
                        case 3:
                            if (!result.ok) {
                                errMsg = void 0;
                                try {
                                    j = JSON.parse(result.text);
                                    errMsg = j.message || j.error || result.text;
                                }
                                catch (_d) {
                                    errMsg = result.text || "".concat(result.status);
                                }
                                throw new Error("New Quizzes API: ".concat(errMsg));
                            }
                            try {
                                return [2 /*return*/, JSON.parse(result.text)];
                            }
                            catch (_e) {
                                return [2 /*return*/, { ok: true }];
                            }
                            return [2 /*return*/];
                    }
                });
            });
        };
        CanvasService_1.prototype.getCourseDetails = function (courseId) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, token, baseUrl, response;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.getAuthHeaders()];
                        case 1:
                            _a = _b.sent(), token = _a.token, baseUrl = _a.baseUrl;
                            return [4 /*yield*/, fetch("".concat(baseUrl, "/courses/").concat(courseId, "?include[]=syllabus_body&include[]=total_scores"), {
                                    headers: { Authorization: "Bearer ".concat(token) },
                                })];
                        case 2:
                            response = _b.sent();
                            if (!response.ok) {
                                throw new Error("Canvas API Error: ".concat(response.statusText));
                            }
                            return [4 /*yield*/, response.json()];
                        case 3: return [2 /*return*/, _b.sent()];
                    }
                });
            });
        };
        CanvasService_1.prototype.getCourseStudents = function (courseId) {
            return __awaiter(this, void 0, void 0, function () {
                var error_1, _a, token, baseUrl, allStudents, url, response, chunk, linkHeader;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            _b.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, this.ensureAccommodationColumns(courseId)];
                        case 1:
                            _b.sent();
                            return [3 /*break*/, 3];
                        case 2:
                            error_1 = _b.sent();
                            console.warn("[Service] Failed to ensure accommodation columns before fetching students:", error_1.message);
                            return [3 /*break*/, 3];
                        case 3: return [4 /*yield*/, this.getAuthHeaders()];
                        case 4:
                            _a = _b.sent(), token = _a.token, baseUrl = _a.baseUrl;
                            allStudents = [];
                            url = "".concat(baseUrl, "/courses/").concat(courseId, "/enrollments?per_page=100&type[]=StudentEnrollment&include[]=user");
                            _b.label = 5;
                        case 5:
                            if (!url) return [3 /*break*/, 8];
                            return [4 /*yield*/, fetch(url, {
                                    headers: { Authorization: "Bearer ".concat(token) },
                                })];
                        case 6:
                            response = _b.sent();
                            if (!response.ok) {
                                throw new Error("Canvas API Error: ".concat(response.statusText));
                            }
                            return [4 /*yield*/, response.json()];
                        case 7:
                            chunk = _b.sent();
                            if (Array.isArray(chunk)) {
                                allStudents.push.apply(allStudents, chunk);
                            }
                            linkHeader = response.headers.get('link');
                            url = this.getNextUrl(linkHeader);
                            return [3 /*break*/, 5];
                        case 8: 
                        // Extract and format student data
                        return [2 /*return*/, allStudents.map(function (enrollment) {
                                var _a, _b, _c, _d, _e, _f;
                                return ({
                                    id: ((_a = enrollment.user) === null || _a === void 0 ? void 0 : _a.id) || enrollment.user_id,
                                    name: ((_b = enrollment.user) === null || _b === void 0 ? void 0 : _b.name) || ((_c = enrollment.user) === null || _c === void 0 ? void 0 : _c.display_name) || 'Unknown',
                                    email: ((_d = enrollment.user) === null || _d === void 0 ? void 0 : _d.email) || ((_e = enrollment.user) === null || _e === void 0 ? void 0 : _e.login_id) || null,
                                    sis_user_id: ((_f = enrollment.user) === null || _f === void 0 ? void 0 : _f.sis_user_id) || null,
                                    enrollment_id: enrollment.id,
                                    enrollment_type: enrollment.type,
                                    enrollment_state: enrollment.enrollment_state,
                                    created_at: enrollment.created_at,
                                    updated_at: enrollment.updated_at,
                                });
                            })];
                    }
                });
            });
        };
        CanvasService_1.prototype.fetchPaginatedData = function (url, token) {
            return __awaiter(this, void 0, void 0, function () {
                var allData, currentUrl, pageCount, response, errorText, responseText, chunk, linkHeader, error_2;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 7, , 8]);
                            allData = [];
                            currentUrl = url;
                            pageCount = 0;
                            _a.label = 1;
                        case 1:
                            if (!currentUrl) return [3 /*break*/, 6];
                            pageCount++;
                            console.log("[Service] Fetching page ".concat(pageCount, " from: ").concat(currentUrl));
                            return [4 /*yield*/, fetch(currentUrl, {
                                    headers: { Authorization: "Bearer ".concat(token) },
                                })];
                        case 2:
                            response = _a.sent();
                            console.log("[Service] Response status: ".concat(response.status, " ").concat(response.statusText));
                            if (!!response.ok) return [3 /*break*/, 4];
                            return [4 /*yield*/, response.text()];
                        case 3:
                            errorText = _a.sent();
                            console.error("[Service] Canvas API error: ".concat(response.status, " ").concat(response.statusText));
                            console.error("[Service] Error response: ".concat(errorText));
                            throw new Error("Canvas API Error: ".concat(response.status, " ").concat(response.statusText, " - ").concat(errorText));
                        case 4: return [4 /*yield*/, response.text()];
                        case 5:
                            responseText = _a.sent();
                            console.log("[Service] Response body length: ".concat(responseText.length, " characters"));
                            console.log("[Service] Raw response body: ".concat(responseText.substring(0, 500)).concat(responseText.length > 500 ? '...' : ''));
                            chunk = void 0;
                            try {
                                chunk = JSON.parse(responseText);
                            }
                            catch (parseError) {
                                console.error("[Service] Failed to parse JSON: ".concat(parseError.message));
                                console.error("[Service] Response text: ".concat(responseText));
                                throw new Error("Invalid JSON response: ".concat(parseError.message));
                            }
                            console.log("[Service] Parsed chunk type: ".concat(Array.isArray(chunk) ? 'array' : typeof chunk, ", length: ").concat(Array.isArray(chunk) ? chunk.length : 'N/A'));
                            if (Array.isArray(chunk)) {
                                allData.push.apply(allData, chunk);
                                console.log("[Service] Added ".concat(chunk.length, " items, total: ").concat(allData.length));
                            }
                            else if (chunk) {
                                // Some endpoints return objects instead of arrays
                                allData.push(chunk);
                                console.log("[Service] Added 1 object, total: ".concat(allData.length));
                            }
                            else {
                                console.log("[Service] Chunk is null/undefined, skipping");
                            }
                            linkHeader = response.headers.get('link');
                            console.log("[Service] Link header: ".concat(linkHeader || 'none'));
                            currentUrl = this.getNextUrl(linkHeader);
                            if (currentUrl) {
                                console.log("[Service] More pages available, next URL: ".concat(currentUrl));
                            }
                            else {
                                console.log("[Service] No more pages, total items: ".concat(allData.length));
                            }
                            return [3 /*break*/, 1];
                        case 6:
                            console.log("[Service] fetchPaginatedData complete, returning ".concat(allData.length, " items"));
                            return [2 /*return*/, allData];
                        case 7:
                            error_2 = _a.sent();
                            console.error("[Service] Error in fetchPaginatedData:", error_2);
                            console.error("[Service] Error message:", error_2.message);
                            console.error("[Service] Error stack:", error_2.stack);
                            throw error_2;
                        case 8: return [2 /*return*/];
                    }
                });
            });
        };
        CanvasService_1.prototype.getCourseQuizzes = function (courseId) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, token, baseUrl, url, result, rubricLookup_1, enriched, error_3;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            _b.trys.push([0, 4, , 5]);
                            console.log("[Service] Getting quizzes for course ".concat(courseId));
                            return [4 /*yield*/, this.getAuthHeaders()];
                        case 1:
                            _a = _b.sent(), token = _a.token, baseUrl = _a.baseUrl;
                            url = "".concat(baseUrl, "/courses/").concat(courseId, "/quizzes?per_page=100");
                            console.log("[Service] Fetching from: ".concat(url));
                            console.log("[Service] Base URL: ".concat(baseUrl));
                            console.log("[Service] Course ID: ".concat(courseId));
                            console.log("[Service] Full URL: ".concat(url));
                            return [4 /*yield*/, this.fetchPaginatedData(url, token)];
                        case 2:
                            result = _b.sent();
                            return [4 /*yield*/, this.getAssignmentRubricLookup(courseId, token, baseUrl)];
                        case 3:
                            rubricLookup_1 = _b.sent();
                            enriched = result.map(function (quiz) {
                                var _a, _b, _c, _d;
                                var assignmentId = Number(quiz === null || quiz === void 0 ? void 0 : quiz.assignment_id);
                                var rubric = Number.isFinite(assignmentId)
                                    ? rubricLookup_1.get(assignmentId)
                                    : null;
                                return __assign(__assign({}, quiz), { rubric_id: (_a = rubric === null || rubric === void 0 ? void 0 : rubric.rubric_id) !== null && _a !== void 0 ? _a : null, rubric_summary: (_b = rubric === null || rubric === void 0 ? void 0 : rubric.rubric_summary) !== null && _b !== void 0 ? _b : null, rubric_url: (_c = rubric === null || rubric === void 0 ? void 0 : rubric.rubric_url) !== null && _c !== void 0 ? _c : null, rubric_association_id: (_d = rubric === null || rubric === void 0 ? void 0 : rubric.rubric_association_id) !== null && _d !== void 0 ? _d : null });
                            });
                            console.log("[Service] Retrieved ".concat(enriched.length, " quizzes"));
                            return [2 /*return*/, enriched];
                        case 4:
                            error_3 = _b.sent();
                            console.error("[Service] Error in getCourseQuizzes for course ".concat(courseId, ":"), error_3);
                            console.error("[Service] Error message:", error_3.message);
                            console.error("[Service] Error stack:", error_3.stack);
                            throw error_3;
                        case 5: return [2 /*return*/];
                    }
                });
            });
        };
        CanvasService_1.prototype.getCourseAssignments = function (courseId) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, token, baseUrl, url, assignments, pure, rubricLookup;
                var _this = this;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.getAuthHeaders()];
                        case 1:
                            _a = _b.sent(), token = _a.token, baseUrl = _a.baseUrl;
                            url = "".concat(baseUrl, "/courses/").concat(courseId, "/assignments?per_page=100&include[]=submission");
                            return [4 /*yield*/, this.fetchPaginatedData(url, token)];
                        case 2:
                            assignments = _b.sent();
                            pure = assignments.filter(function (a) { return !_this.isQuizLinkedAssignment(a); });
                            return [4 /*yield*/, this.getAssignmentRubricLookup(courseId, token, baseUrl)];
                        case 3:
                            rubricLookup = _b.sent();
                            return [2 /*return*/, pure.map(function (assignment) {
                                    var _a, _b, _c, _d;
                                    var assignmentId = Number(assignment === null || assignment === void 0 ? void 0 : assignment.id);
                                    var rubric = Number.isFinite(assignmentId)
                                        ? rubricLookup.get(assignmentId)
                                        : null;
                                    return __assign(__assign({}, assignment), { rubric_id: (_a = rubric === null || rubric === void 0 ? void 0 : rubric.rubric_id) !== null && _a !== void 0 ? _a : null, rubric_summary: (_b = rubric === null || rubric === void 0 ? void 0 : rubric.rubric_summary) !== null && _b !== void 0 ? _b : null, rubric_url: (_c = rubric === null || rubric === void 0 ? void 0 : rubric.rubric_url) !== null && _c !== void 0 ? _c : null, rubric_association_id: (_d = rubric === null || rubric === void 0 ? void 0 : rubric.rubric_association_id) !== null && _d !== void 0 ? _d : null });
                                })];
                    }
                });
            });
        };
        CanvasService_1.prototype.getCourseAssignmentGroups = function (courseId) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, token, baseUrl, url, groups, error_4;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            _b.trys.push([0, 3, , 4]);
                            return [4 /*yield*/, this.getAuthHeaders()];
                        case 1:
                            _a = _b.sent(), token = _a.token, baseUrl = _a.baseUrl;
                            url = "".concat(baseUrl, "/courses/").concat(courseId, "/assignment_groups?per_page=100");
                            return [4 /*yield*/, this.fetchPaginatedData(url, token)];
                        case 2:
                            groups = _b.sent();
                            console.log("[Service] Retrieved ".concat(groups.length, " assignment groups for course ").concat(courseId));
                            return [2 /*return*/, groups];
                        case 3:
                            error_4 = _b.sent();
                            console.error("[Service] Error in getCourseAssignmentGroups for course ".concat(courseId, ":"), error_4);
                            throw error_4;
                        case 4: return [2 /*return*/];
                    }
                });
            });
        };
        CanvasService_1.prototype.canvasHtmlBase = function (apiV1BaseUrl) {
            var trimmed = apiV1BaseUrl.replace(/\/$/, '');
            return trimmed.endsWith('/api/v1')
                ? trimmed.slice(0, -'/api/v1'.length)
                : trimmed;
        };
        CanvasService_1.prototype.getAssignmentRubricLookup = function (courseId, token, baseUrl) {
            return __awaiter(this, void 0, void 0, function () {
                var rubricsUrl, rubrics, htmlBase, map;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            rubricsUrl = "".concat(baseUrl, "/courses/").concat(courseId, "/rubrics?per_page=100&include[]=associations");
                            return [4 /*yield*/, this.fetchPaginatedData(rubricsUrl, token)];
                        case 1:
                            rubrics = _a.sent();
                            htmlBase = this.canvasHtmlBase(baseUrl);
                            map = new Map();
                            rubrics.forEach(function (rubric) {
                                var rubricId = Number(rubric === null || rubric === void 0 ? void 0 : rubric.id);
                                if (!Number.isFinite(rubricId))
                                    return;
                                var associations = Array.isArray(rubric === null || rubric === void 0 ? void 0 : rubric.associations)
                                    ? rubric.associations
                                    : [];
                                associations.forEach(function (assoc) {
                                    var associationId = Number(assoc === null || assoc === void 0 ? void 0 : assoc.association_id);
                                    if (!Number.isFinite(associationId))
                                        return;
                                    if (String((assoc === null || assoc === void 0 ? void 0 : assoc.association_type) || '') !== 'Assignment')
                                        return;
                                    map.set(associationId, {
                                        rubric_id: rubricId,
                                        rubric_summary: String((rubric === null || rubric === void 0 ? void 0 : rubric.title) || "Rubric ".concat(rubricId)),
                                        rubric_url: "".concat(htmlBase, "/courses/").concat(courseId, "/rubrics/").concat(rubricId),
                                        rubric_association_id: Number.isFinite(Number(assoc === null || assoc === void 0 ? void 0 : assoc.id))
                                            ? Number(assoc.id)
                                            : null,
                                    });
                                });
                            });
                            return [2 /*return*/, map];
                    }
                });
            });
        };
        CanvasService_1.prototype.getCourseRubrics = function (courseId) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, token, baseUrl, htmlBase, rubricsUrl, rubrics;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.getAuthHeaders()];
                        case 1:
                            _a = _b.sent(), token = _a.token, baseUrl = _a.baseUrl;
                            htmlBase = this.canvasHtmlBase(baseUrl);
                            rubricsUrl = "".concat(baseUrl, "/courses/").concat(courseId, "/rubrics?per_page=100");
                            return [4 /*yield*/, this.fetchPaginatedData(rubricsUrl, token)];
                        case 2:
                            rubrics = _b.sent();
                            return [2 /*return*/, rubrics
                                    .map(function (r) {
                                    var id = Number(r === null || r === void 0 ? void 0 : r.id);
                                    if (!Number.isFinite(id))
                                        return null;
                                    return {
                                        id: id,
                                        title: String((r === null || r === void 0 ? void 0 : r.title) || "Rubric ".concat(id)),
                                        url: "".concat(htmlBase, "/courses/").concat(courseId, "/rubrics/").concat(id),
                                    };
                                })
                                    .filter(Boolean)];
                    }
                });
            });
        };
        CanvasService_1.prototype.createCourseRubric = function (courseId, body) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, token, baseUrl, htmlBase, title, associationType, associationId, url, withCriteria, noCriteria, attempts, payload, lastError, _i, attempts_1, params, res, text, rubric, id;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.getAuthHeaders()];
                        case 1:
                            _a = _b.sent(), token = _a.token, baseUrl = _a.baseUrl;
                            htmlBase = this.canvasHtmlBase(baseUrl);
                            title = ((body === null || body === void 0 ? void 0 : body.title) || 'New Rubric').trim() || 'New Rubric';
                            associationType = (body === null || body === void 0 ? void 0 : body.association_type) || 'Assignment';
                            associationId = (body === null || body === void 0 ? void 0 : body.association_id) != null ? Number(body.association_id) : null;
                            url = "".concat(baseUrl, "/courses/").concat(courseId, "/rubrics");
                            withCriteria = new URLSearchParams();
                            withCriteria.append('rubric[title]', title);
                            withCriteria.append('rubric[free_form_criterion_comments]', 'true');
                            withCriteria.append('rubric[criteria][0][description]', 'Criterion 1');
                            withCriteria.append('rubric[criteria][0][points]', '1');
                            withCriteria.append('rubric[criteria][0][ratings][0][description]', 'Not met');
                            withCriteria.append('rubric[criteria][0][ratings][0][points]', '0');
                            withCriteria.append('rubric[criteria][0][ratings][1][description]', 'Met');
                            withCriteria.append('rubric[criteria][0][ratings][1][points]', '1');
                            if (associationId && Number.isFinite(associationId)) {
                                withCriteria.append('rubric_association[association_id]', String(associationId));
                                withCriteria.append('rubric_association[association_type]', associationType);
                                withCriteria.append('rubric_association[purpose]', 'grading');
                                withCriteria.append('rubric_association[use_for_grading]', 'true');
                            }
                            noCriteria = new URLSearchParams(withCriteria.toString());
                            [
                                'rubric[criteria][0][description]',
                                'rubric[criteria][0][points]',
                                'rubric[criteria][0][ratings][0][description]',
                                'rubric[criteria][0][ratings][0][points]',
                                'rubric[criteria][0][ratings][1][description]',
                                'rubric[criteria][0][ratings][1][points]',
                            ].forEach(function (k) { return noCriteria.delete(k); });
                            attempts = [withCriteria, noCriteria];
                            payload = null;
                            lastError = '';
                            _i = 0, attempts_1 = attempts;
                            _b.label = 2;
                        case 2:
                            if (!(_i < attempts_1.length)) return [3 /*break*/, 6];
                            params = attempts_1[_i];
                            return [4 /*yield*/, fetch(url, {
                                    method: 'POST',
                                    headers: {
                                        Authorization: "Bearer ".concat(token),
                                        'Content-Type': 'application/x-www-form-urlencoded',
                                    },
                                    body: params.toString(),
                                })];
                        case 3:
                            res = _b.sent();
                            return [4 /*yield*/, res.text()];
                        case 4:
                            text = _b.sent();
                            if (res.ok) {
                                try {
                                    payload = text ? JSON.parse(text) : {};
                                }
                                catch (_c) {
                                    payload = {};
                                }
                                return [3 /*break*/, 6];
                            }
                            lastError = text || "".concat(res.status, " ").concat(res.statusText);
                            if (![400, 415, 422].includes(res.status))
                                return [3 /*break*/, 6];
                            _b.label = 5;
                        case 5:
                            _i++;
                            return [3 /*break*/, 2];
                        case 6:
                            if (!payload) {
                                throw new Error("Failed to create rubric: ".concat(lastError));
                            }
                            rubric = payload.rubric || payload;
                            id = Number(rubric === null || rubric === void 0 ? void 0 : rubric.id);
                            if (!Number.isFinite(id)) {
                                throw new Error('Rubric created but ID was not returned');
                            }
                            return [2 /*return*/, {
                                    id: id,
                                    title: String((rubric === null || rubric === void 0 ? void 0 : rubric.title) || title),
                                    url: "".concat(htmlBase, "/courses/").concat(courseId, "/rubrics/").concat(id),
                                }];
                    }
                });
            });
        };
        CanvasService_1.prototype.upsertAssignmentRubricAssociation = function (courseId, assignmentId, rubricId, token, baseUrl) {
            return __awaiter(this, void 0, void 0, function () {
                var lookup, current, params, targetUrl, method, res, text;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.getAssignmentRubricLookup(courseId, token, baseUrl)];
                        case 1:
                            lookup = _a.sent();
                            current = lookup.get(assignmentId);
                            if (!(rubricId == null)) return [3 /*break*/, 4];
                            if (!(current === null || current === void 0 ? void 0 : current.rubric_association_id)) return [3 /*break*/, 3];
                            return [4 /*yield*/, fetch("".concat(baseUrl, "/courses/").concat(courseId, "/rubric_associations/").concat(current.rubric_association_id), {
                                    method: 'DELETE',
                                    headers: { Authorization: "Bearer ".concat(token) },
                                })];
                        case 2:
                            _a.sent();
                            _a.label = 3;
                        case 3: return [2 /*return*/];
                        case 4:
                            if ((current === null || current === void 0 ? void 0 : current.rubric_id) === rubricId)
                                return [2 /*return*/];
                            params = new URLSearchParams();
                            params.append('rubric_association[rubric_id]', String(rubricId));
                            params.append('rubric_association[association_id]', String(assignmentId));
                            params.append('rubric_association[association_type]', 'Assignment');
                            params.append('rubric_association[purpose]', 'grading');
                            params.append('rubric_association[use_for_grading]', 'true');
                            targetUrl = (current === null || current === void 0 ? void 0 : current.rubric_association_id)
                                ? "".concat(baseUrl, "/courses/").concat(courseId, "/rubric_associations/").concat(current.rubric_association_id)
                                : "".concat(baseUrl, "/courses/").concat(courseId, "/rubric_associations");
                            method = (current === null || current === void 0 ? void 0 : current.rubric_association_id) ? 'PUT' : 'POST';
                            return [4 /*yield*/, fetch(targetUrl, {
                                    method: method,
                                    headers: {
                                        Authorization: "Bearer ".concat(token),
                                        'Content-Type': 'application/x-www-form-urlencoded',
                                    },
                                    body: params.toString(),
                                })];
                        case 5:
                            res = _a.sent();
                            if (!!res.ok) return [3 /*break*/, 7];
                            return [4 /*yield*/, res.text()];
                        case 6:
                            text = _a.sent();
                            throw new Error("Failed to update rubric association: ".concat(res.status, " ").concat(res.statusText, " - ").concat(text));
                        case 7: return [2 /*return*/];
                    }
                });
            });
        };
        CanvasService_1.prototype.createAssignmentGroup = function (courseId, name, groupWeight) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, token, baseUrl, url, body, response, errorText, result, error_5;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            _b.trys.push([0, 6, , 7]);
                            return [4 /*yield*/, this.getAuthHeaders()];
                        case 1:
                            _a = _b.sent(), token = _a.token, baseUrl = _a.baseUrl;
                            url = "".concat(baseUrl, "/courses/").concat(courseId, "/assignment_groups");
                            body = { name: name };
                            if (groupWeight !== undefined) {
                                body.group_weight = groupWeight;
                            }
                            return [4 /*yield*/, fetch(url, {
                                    method: 'POST',
                                    headers: {
                                        Authorization: "Bearer ".concat(token),
                                        'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify(body),
                                })];
                        case 2:
                            response = _b.sent();
                            if (!!response.ok) return [3 /*break*/, 4];
                            return [4 /*yield*/, response.text()];
                        case 3:
                            errorText = _b.sent();
                            throw new Error("Canvas API error: ".concat(response.status, " ").concat(response.statusText, " - ").concat(errorText));
                        case 4: return [4 /*yield*/, response.json()];
                        case 5:
                            result = _b.sent();
                            console.log("[Service] Created assignment group \"".concat(name, "\" with ID: ").concat(result.id));
                            return [2 /*return*/, result];
                        case 6:
                            error_5 = _b.sent();
                            console.error("[Service] Error creating assignment group:", error_5);
                            throw error_5;
                        case 7: return [2 /*return*/];
                    }
                });
            });
        };
        CanvasService_1.prototype.updateAssignmentGroup = function (courseId, groupId, updates) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, token, baseUrl, url, body, response, errorText, result, error_6;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            _b.trys.push([0, 6, , 7]);
                            return [4 /*yield*/, this.getAuthHeaders()];
                        case 1:
                            _a = _b.sent(), token = _a.token, baseUrl = _a.baseUrl;
                            url = "".concat(baseUrl, "/courses/").concat(courseId, "/assignment_groups/").concat(groupId);
                            body = {};
                            if (updates.name !== undefined) {
                                body.name = updates.name;
                            }
                            if (updates.group_weight !== undefined) {
                                body.group_weight = updates.group_weight;
                            }
                            return [4 /*yield*/, fetch(url, {
                                    method: 'PUT',
                                    headers: {
                                        Authorization: "Bearer ".concat(token),
                                        'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify(body),
                                })];
                        case 2:
                            response = _b.sent();
                            if (!!response.ok) return [3 /*break*/, 4];
                            return [4 /*yield*/, response.text()];
                        case 3:
                            errorText = _b.sent();
                            throw new Error("Canvas API error: ".concat(response.status, " ").concat(response.statusText, " - ").concat(errorText));
                        case 4: return [4 /*yield*/, response.json()];
                        case 5:
                            result = _b.sent();
                            console.log("[Service] Updated assignment group ".concat(groupId));
                            return [2 /*return*/, result];
                        case 6:
                            error_6 = _b.sent();
                            console.error("[Service] Error updating assignment group:", error_6);
                            throw error_6;
                        case 7: return [2 /*return*/];
                    }
                });
            });
        };
        CanvasService_1.prototype.deleteAssignmentGroup = function (courseId, groupId) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, token, baseUrl, url, response, errorText, error_7;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            _b.trys.push([0, 5, , 6]);
                            return [4 /*yield*/, this.getAuthHeaders()];
                        case 1:
                            _a = _b.sent(), token = _a.token, baseUrl = _a.baseUrl;
                            url = "".concat(baseUrl, "/courses/").concat(courseId, "/assignment_groups/").concat(groupId);
                            return [4 /*yield*/, fetch(url, {
                                    method: 'DELETE',
                                    headers: {
                                        Authorization: "Bearer ".concat(token),
                                    },
                                })];
                        case 2:
                            response = _b.sent();
                            if (!!response.ok) return [3 /*break*/, 4];
                            return [4 /*yield*/, response.text()];
                        case 3:
                            errorText = _b.sent();
                            throw new Error("Canvas API error: ".concat(response.status, " ").concat(response.statusText, " - ").concat(errorText));
                        case 4:
                            console.log("[Service] Deleted assignment group ".concat(groupId));
                            return [2 /*return*/, { success: true }];
                        case 5:
                            error_7 = _b.sent();
                            console.error("[Service] Error deleting assignment group:", error_7);
                            throw error_7;
                        case 6: return [2 /*return*/];
                    }
                });
            });
        };
        CanvasService_1.prototype.getCourseDiscussions = function (courseId) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, token, baseUrl, url, discussions, htmlBase, assignmentsUrl, assignments, assignmentById, rubricLookup;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.getAuthHeaders()];
                        case 1:
                            _a = _b.sent(), token = _a.token, baseUrl = _a.baseUrl;
                            url = "".concat(baseUrl, "/courses/").concat(courseId, "/discussion_topics?per_page=100");
                            return [4 /*yield*/, this.fetchPaginatedData(url, token)];
                        case 2:
                            discussions = _b.sent();
                            htmlBase = this.canvasHtmlBase(baseUrl);
                            assignmentsUrl = "".concat(baseUrl, "/courses/").concat(courseId, "/assignments?per_page=100");
                            return [4 /*yield*/, this.fetchPaginatedData(assignmentsUrl, token)];
                        case 3:
                            assignments = _b.sent();
                            assignmentById = new Map();
                            assignments.forEach(function (a) {
                                var id = Number(a === null || a === void 0 ? void 0 : a.id);
                                if (Number.isFinite(id))
                                    assignmentById.set(id, a);
                            });
                            return [4 /*yield*/, this.getAssignmentRubricLookup(courseId, token, baseUrl)];
                        case 4:
                            rubricLookup = _b.sent();
                            return [2 /*return*/, discussions.map(function (topic) {
                                    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s;
                                    var assignmentId = Number(topic === null || topic === void 0 ? void 0 : topic.assignment_id);
                                    var assignment = Number.isFinite(assignmentId)
                                        ? assignmentById.get(assignmentId)
                                        : null;
                                    var rubric = Number.isFinite(assignmentId)
                                        ? rubricLookup.get(assignmentId)
                                        : null;
                                    var assignmentRubricId = Number((_b = (_a = assignment === null || assignment === void 0 ? void 0 : assignment.rubric_settings) === null || _a === void 0 ? void 0 : _a.id) !== null && _b !== void 0 ? _b : assignment === null || assignment === void 0 ? void 0 : assignment.rubric_id);
                                    var rubricId = (_c = rubric === null || rubric === void 0 ? void 0 : rubric.rubric_id) !== null && _c !== void 0 ? _c : (Number.isFinite(assignmentRubricId) ? assignmentRubricId : null);
                                    var rubricSummary = (_f = (_d = rubric === null || rubric === void 0 ? void 0 : rubric.rubric_summary) !== null && _d !== void 0 ? _d : (_e = assignment === null || assignment === void 0 ? void 0 : assignment.rubric_settings) === null || _e === void 0 ? void 0 : _e.title) !== null && _f !== void 0 ? _f : (rubricId != null ? "Rubric ".concat(rubricId) : null);
                                    var rubricUrl = (_g = rubric === null || rubric === void 0 ? void 0 : rubric.rubric_url) !== null && _g !== void 0 ? _g : (rubricId != null
                                        ? "".concat(htmlBase, "/courses/").concat(courseId, "/rubrics/").concat(rubricId)
                                        : null);
                                    return __assign(__assign({}, topic), { graded: Boolean(assignment), points_possible: (_h = assignment === null || assignment === void 0 ? void 0 : assignment.points_possible) !== null && _h !== void 0 ? _h : null, assignment_group_id: (_k = (_j = assignment === null || assignment === void 0 ? void 0 : assignment.assignment_group_id) !== null && _j !== void 0 ? _j : topic === null || topic === void 0 ? void 0 : topic.assignment_group_id) !== null && _k !== void 0 ? _k : null, due_at: (_m = (_l = assignment === null || assignment === void 0 ? void 0 : assignment.due_at) !== null && _l !== void 0 ? _l : topic === null || topic === void 0 ? void 0 : topic.due_at) !== null && _m !== void 0 ? _m : null, unlock_at: (_p = (_o = assignment === null || assignment === void 0 ? void 0 : assignment.unlock_at) !== null && _o !== void 0 ? _o : topic === null || topic === void 0 ? void 0 : topic.unlock_at) !== null && _p !== void 0 ? _p : null, lock_at: (_r = (_q = topic === null || topic === void 0 ? void 0 : topic.lock_at) !== null && _q !== void 0 ? _q : assignment === null || assignment === void 0 ? void 0 : assignment.lock_at) !== null && _r !== void 0 ? _r : null, rubric_id: rubricId, rubric_summary: rubricSummary, rubric_url: rubricUrl, rubric_association_id: (_s = rubric === null || rubric === void 0 ? void 0 : rubric.rubric_association_id) !== null && _s !== void 0 ? _s : null });
                                })];
                    }
                });
            });
        };
        CanvasService_1.prototype.extractTextFromBlockEditorBlocks = function (blocks) {
            var _this = this;
            if (blocks == null)
                return '';
            if (typeof blocks === 'string') {
                var t = blocks.trim();
                if (!t)
                    return '';
                try {
                    return this.extractTextFromBlockEditorBlocks(JSON.parse(blocks));
                }
                catch (_a) {
                    return t;
                }
            }
            if (typeof blocks === 'number' || typeof blocks === 'boolean') {
                return String(blocks);
            }
            if (Array.isArray(blocks)) {
                return blocks
                    .map(function (x) { return _this.extractTextFromBlockEditorBlocks(x); })
                    .filter(function (s) { return s.length > 0; })
                    .join(' ');
            }
            if (typeof blocks === 'object') {
                var o = blocks;
                if (typeof o.text === 'string' && o.text.trim())
                    return o.text.trim();
                var nestedKeys = ['content', 'children', 'blocks', 'nodes', 'items'];
                var parts = [];
                for (var _i = 0, nestedKeys_1 = nestedKeys; _i < nestedKeys_1.length; _i++) {
                    var k = nestedKeys_1[_i];
                    if (o[k] != null) {
                        var p = this.extractTextFromBlockEditorBlocks(o[k]);
                        if (p)
                            parts.push(p);
                    }
                }
                return parts.join(' ');
            }
            return '';
        };
        CanvasService_1.prototype.nonEmptyBodyString = function (value) {
            if (value == null)
                return null;
            var s = typeof value === 'string' ? value : String(value);
            return s.trim() === '' ? null : s;
        };
        CanvasService_1.prototype.resolveWikiPageBodyForGrid = function (courseId, pageUrlSlug, pageDetails, token, baseUrl) {
            return __awaiter(this, void 0, void 0, function () {
                var fromTop, fromWiki, fromBlocks, revUrl, revRes, rev, fromRev, _a;
                var _b, _c, _d, _e;
                return __generator(this, function (_f) {
                    switch (_f.label) {
                        case 0:
                            fromTop = this.nonEmptyBodyString(pageDetails.body);
                            if (fromTop)
                                return [2 /*return*/, fromTop];
                            fromWiki = this.nonEmptyBodyString((_c = (_b = pageDetails.wiki_page) === null || _b === void 0 ? void 0 : _b.body) !== null && _c !== void 0 ? _c : (_d = pageDetails.wiki_page) === null || _d === void 0 ? void 0 : _d['body']);
                            if (fromWiki)
                                return [2 /*return*/, fromWiki];
                            fromBlocks = this.extractTextFromBlockEditorBlocks((_e = pageDetails.block_editor_attributes) === null || _e === void 0 ? void 0 : _e.blocks).trim();
                            if (fromBlocks)
                                return [2 /*return*/, fromBlocks];
                            _f.label = 1;
                        case 1:
                            _f.trys.push([1, 5, , 6]);
                            revUrl = "".concat(baseUrl, "/courses/").concat(courseId, "/pages/").concat(encodeURIComponent(pageUrlSlug), "/revisions/latest");
                            return [4 /*yield*/, fetch(revUrl, {
                                    headers: { Authorization: "Bearer ".concat(token) },
                                })];
                        case 2:
                            revRes = _f.sent();
                            if (!revRes.ok) return [3 /*break*/, 4];
                            return [4 /*yield*/, revRes.json()];
                        case 3:
                            rev = _f.sent();
                            fromRev = this.nonEmptyBodyString(rev.body);
                            if (fromRev)
                                return [2 /*return*/, fromRev];
                            _f.label = 4;
                        case 4: return [3 /*break*/, 6];
                        case 5:
                            _a = _f.sent();
                            void 0;
                            return [3 /*break*/, 6];
                        case 6: return [2 /*return*/, typeof pageDetails.body === 'string' ? pageDetails.body : null];
                    }
                });
            });
        };
        CanvasService_1.prototype.getCoursePages = function (courseId) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, token, baseUrl, url, pages, pagesWithBody;
                var _this = this;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.getAuthHeaders()];
                        case 1:
                            _a = _b.sent(), token = _a.token, baseUrl = _a.baseUrl;
                            url = "".concat(baseUrl, "/courses/").concat(courseId, "/pages?per_page=100");
                            return [4 /*yield*/, this.fetchPaginatedData(url, token)];
                        case 2:
                            pages = _b.sent();
                            return [4 /*yield*/, Promise.all(pages.map(function (page) { return __awaiter(_this, void 0, void 0, function () {
                                    var pageUrl, pageResponse, pageDetails, body, error_8;
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0:
                                                if (!page.url) return [3 /*break*/, 7];
                                                _a.label = 1;
                                            case 1:
                                                _a.trys.push([1, 6, , 7]);
                                                pageUrl = "".concat(baseUrl, "/courses/").concat(courseId, "/pages/").concat(encodeURIComponent(page.url)) +
                                                    '?include[]=body&include[]=block_editor_attributes';
                                                return [4 /*yield*/, fetch(pageUrl, {
                                                        headers: { Authorization: "Bearer ".concat(token) },
                                                    })];
                                            case 2:
                                                pageResponse = _a.sent();
                                                if (!pageResponse.ok) return [3 /*break*/, 5];
                                                return [4 /*yield*/, pageResponse.json()];
                                            case 3:
                                                pageDetails = _a.sent();
                                                return [4 /*yield*/, this.resolveWikiPageBodyForGrid(courseId, page.url, pageDetails, token, baseUrl)];
                                            case 4:
                                                body = _a.sent();
                                                return [2 /*return*/, __assign(__assign({}, page), { body: body !== null && body !== void 0 ? body : null, html_url: pageDetails.html_url || page.html_url || null })];
                                            case 5: return [3 /*break*/, 7];
                                            case 6:
                                                error_8 = _a.sent();
                                                console.warn("[Service] Failed to fetch body for page ".concat(page.url, ":"), error_8);
                                                return [3 /*break*/, 7];
                                            case 7: return [2 /*return*/, page];
                                        }
                                    });
                                }); }))];
                        case 3:
                            pagesWithBody = _b.sent();
                            return [2 /*return*/, pagesWithBody];
                    }
                });
            });
        };
        CanvasService_1.prototype.getCourseAnnouncements = function (courseId) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, token, baseUrl, url, announcements, withMessage;
                var _this = this;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.getAuthHeaders()];
                        case 1:
                            _a = _b.sent(), token = _a.token, baseUrl = _a.baseUrl;
                            url = "".concat(baseUrl, "/courses/").concat(courseId, "/discussion_topics?only_announcements=true&per_page=100");
                            return [4 /*yield*/, this.fetchPaginatedData(url, token)];
                        case 2:
                            announcements = _b.sent();
                            return [4 /*yield*/, Promise.all(announcements.map(function (row) { return __awaiter(_this, void 0, void 0, function () {
                                    var full, _a;
                                    var _b, _c, _d, _e, _f, _g, _h, _j;
                                    return __generator(this, function (_k) {
                                        switch (_k.label) {
                                            case 0:
                                                if (!(row === null || row === void 0 ? void 0 : row.id))
                                                    return [2 /*return*/, row];
                                                _k.label = 1;
                                            case 1:
                                                _k.trys.push([1, 3, , 4]);
                                                return [4 /*yield*/, this.getDiscussion(courseId, row.id)];
                                            case 2:
                                                full = _k.sent();
                                                return [2 /*return*/, __assign(__assign(__assign({}, row), full), { message: (_b = full.message) !== null && _b !== void 0 ? _b : row.message, title: (_c = full.title) !== null && _c !== void 0 ? _c : row.title, delayed_post_at: (_e = (_d = full.delayed_post_at) !== null && _d !== void 0 ? _d : row.delayed_post_at) !== null && _e !== void 0 ? _e : null, lock_at: (_g = (_f = full.lock_at) !== null && _f !== void 0 ? _f : row.lock_at) !== null && _g !== void 0 ? _g : null, posted_at: (_j = (_h = full.posted_at) !== null && _h !== void 0 ? _h : row.posted_at) !== null && _j !== void 0 ? _j : null })];
                                            case 3:
                                                _a = _k.sent();
                                                return [2 /*return*/, row];
                                            case 4: return [2 /*return*/];
                                        }
                                    });
                                }); }))];
                        case 3:
                            withMessage = _b.sent();
                            return [2 /*return*/, withMessage];
                    }
                });
            });
        };
        CanvasService_1.prototype.getCourseModules = function (courseId) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, token, baseUrl, url;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.getAuthHeaders()];
                        case 1:
                            _a = _b.sent(), token = _a.token, baseUrl = _a.baseUrl;
                            url = "".concat(baseUrl, "/courses/").concat(courseId, "/modules?per_page=100&include[]=items");
                            return [4 /*yield*/, this.fetchPaginatedData(url, token)];
                        case 2: return [2 /*return*/, _b.sent()];
                    }
                });
            });
        };
        CanvasService_1.prototype.getCourseFiles = function (courseId) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, token, baseUrl, filesUrl, files, foldersUrl, folders, folderMap, filesWithMeta, foldersWithCounts;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.getAuthHeaders()];
                        case 1:
                            _a = _b.sent(), token = _a.token, baseUrl = _a.baseUrl;
                            filesUrl = "".concat(baseUrl, "/courses/").concat(courseId, "/files?per_page=100");
                            return [4 /*yield*/, this.fetchPaginatedData(filesUrl, token)];
                        case 2:
                            files = _b.sent();
                            foldersUrl = "".concat(baseUrl, "/courses/").concat(courseId, "/folders?per_page=100");
                            return [4 /*yield*/, this.fetchPaginatedData(foldersUrl, token)];
                        case 3:
                            folders = _b.sent();
                            folderMap = new Map();
                            folders.forEach(function (folder) {
                                if (folder.id && folder.full_name) {
                                    folderMap.set(folder.id, folder.full_name);
                                }
                            });
                            filesWithMeta = files.map(function (file) {
                                var folderPath = file.folder_id
                                    ? folderMap.get(file.folder_id) || 'Unknown'
                                    : 'Root';
                                return __assign(__assign({}, file), { usage: [], folder_path: folderPath, is_folder: false });
                            });
                            foldersWithCounts = folders.map(function (folder) {
                                var _a;
                                var fileCount = folder.files_count || 0;
                                var folderCount = (_a = folder.folders_count) !== null && _a !== void 0 ? _a : 0;
                                var folderPath = folder.parent_folder_id
                                    ? folderMap.get(folder.parent_folder_id) || 'Unknown'
                                    : 'Root';
                                return {
                                    id: folder.id,
                                    display_name: folder.name,
                                    filename: folder.name,
                                    folder: true,
                                    is_folder: true,
                                    content_type: 'folder',
                                    size: null,
                                    modified_at: folder.updated_at || folder.created_at,
                                    folder_path: folderPath,
                                    folder_id: folder.parent_folder_id,
                                    usage: [],
                                    item_count: fileCount + folderCount,
                                    file_count: fileCount,
                                    folder_count: folderCount,
                                };
                            });
                            return [2 /*return*/, __spreadArray(__spreadArray([], filesWithMeta, true), foldersWithCounts, true)];
                    }
                });
            });
        };
        CanvasService_1.prototype.getCourseRootFolderId = function (courseId, token, baseUrl) {
            return __awaiter(this, void 0, void 0, function () {
                var res, t, folder, id;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, fetch("".concat(baseUrl, "/courses/").concat(courseId, "/folders/root"), {
                                headers: { Authorization: "Bearer ".concat(token) },
                            })];
                        case 1:
                            res = _a.sent();
                            if (!!res.ok) return [3 /*break*/, 3];
                            return [4 /*yield*/, res.text().catch(function () { return ''; })];
                        case 2:
                            t = _a.sent();
                            throw new Error("Failed to resolve root folder: ".concat(res.status, " ").concat(res.statusText).concat(t ? " - ".concat(t) : ''));
                        case 3: return [4 /*yield*/, res.json()];
                        case 4:
                            folder = _a.sent();
                            id = Number(folder === null || folder === void 0 ? void 0 : folder.id);
                            if (!Number.isFinite(id))
                                throw new Error('Invalid root folder id returned by Canvas');
                            return [2 /*return*/, id];
                    }
                });
            });
        };
        CanvasService_1.prototype.copyFileToFolder = function (courseId, sourceFileId, destFolderId, displayName) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, token, baseUrl, targetFolderId, _b, body, copyRes, copyText, copied, desiredName, currentName;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0: return [4 /*yield*/, this.getAuthHeaders()];
                        case 1:
                            _a = _c.sent(), token = _a.token, baseUrl = _a.baseUrl;
                            if (!Number.isFinite(Number(destFolderId))) return [3 /*break*/, 2];
                            _b = Number(destFolderId);
                            return [3 /*break*/, 4];
                        case 2: return [4 /*yield*/, this.getCourseRootFolderId(courseId, token, baseUrl)];
                        case 3:
                            _b = _c.sent();
                            _c.label = 4;
                        case 4:
                            targetFolderId = _b;
                            body = new URLSearchParams();
                            body.set('source_file_id', String(sourceFileId));
                            body.set('on_duplicate', 'rename');
                            return [4 /*yield*/, fetch("".concat(baseUrl, "/folders/").concat(targetFolderId, "/copy_file"), {
                                    method: 'POST',
                                    headers: {
                                        Authorization: "Bearer ".concat(token),
                                        'Content-Type': 'application/x-www-form-urlencoded',
                                    },
                                    body: body.toString(),
                                })];
                        case 5:
                            copyRes = _c.sent();
                            return [4 /*yield*/, copyRes.text()];
                        case 6:
                            copyText = _c.sent();
                            if (!copyRes.ok) {
                                throw new Error("Canvas API error: ".concat(copyRes.status, " ").concat(copyRes.statusText, " - ").concat(copyText));
                            }
                            copied = {};
                            if (copyText) {
                                try {
                                    copied = JSON.parse(copyText);
                                }
                                catch (_d) {
                                    copied = {};
                                }
                            }
                            desiredName = (displayName || '').trim();
                            currentName = String((copied === null || copied === void 0 ? void 0 : copied.display_name) || (copied === null || copied === void 0 ? void 0 : copied.filename) || (copied === null || copied === void 0 ? void 0 : copied.name) || '').trim();
                            if (desiredName && (copied === null || copied === void 0 ? void 0 : copied.id) && desiredName !== currentName) {
                                return [2 /*return*/, this.updateFile(courseId, Number(copied.id), {
                                        name: desiredName,
                                    })];
                            }
                            return [2 /*return*/, copied];
                    }
                });
            });
        };
        CanvasService_1.prototype.createFolder = function (courseId, name, parentFolderId) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, token, baseUrl, body, res, text;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.getAuthHeaders()];
                        case 1:
                            _a = _b.sent(), token = _a.token, baseUrl = _a.baseUrl;
                            body = new URLSearchParams();
                            body.set('name', name);
                            if (parentFolderId != null && Number.isFinite(Number(parentFolderId))) {
                                body.set('parent_folder_id', String(parentFolderId));
                            }
                            return [4 /*yield*/, fetch("".concat(baseUrl, "/courses/").concat(courseId, "/folders"), {
                                    method: 'POST',
                                    headers: {
                                        Authorization: "Bearer ".concat(token),
                                        'Content-Type': 'application/x-www-form-urlencoded',
                                    },
                                    body: body.toString(),
                                })];
                        case 2:
                            res = _b.sent();
                            return [4 /*yield*/, res.text()];
                        case 3:
                            text = _b.sent();
                            if (!res.ok)
                                throw new Error("Canvas API error: ".concat(res.status, " ").concat(res.statusText, " - ").concat(text));
                            try {
                                return [2 /*return*/, JSON.parse(text)];
                            }
                            catch (_c) {
                                return [2 /*return*/, {}];
                            }
                            return [2 /*return*/];
                    }
                });
            });
        };
        CanvasService_1.prototype.copyFolderToFolder = function (courseId, sourceFolderId, destFolderId, name) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, token, baseUrl, targetFolderId, _b, body, copyRes, copyText, copied, desiredName, currentName;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0: return [4 /*yield*/, this.getAuthHeaders()];
                        case 1:
                            _a = _c.sent(), token = _a.token, baseUrl = _a.baseUrl;
                            if (!Number.isFinite(Number(destFolderId))) return [3 /*break*/, 2];
                            _b = Number(destFolderId);
                            return [3 /*break*/, 4];
                        case 2: return [4 /*yield*/, this.getCourseRootFolderId(courseId, token, baseUrl)];
                        case 3:
                            _b = _c.sent();
                            _c.label = 4;
                        case 4:
                            targetFolderId = _b;
                            body = new URLSearchParams();
                            body.set('source_folder_id', String(sourceFolderId));
                            return [4 /*yield*/, fetch("".concat(baseUrl, "/folders/").concat(targetFolderId, "/copy_folder"), {
                                    method: 'POST',
                                    headers: {
                                        Authorization: "Bearer ".concat(token),
                                        'Content-Type': 'application/x-www-form-urlencoded',
                                    },
                                    body: body.toString(),
                                })];
                        case 5:
                            copyRes = _c.sent();
                            return [4 /*yield*/, copyRes.text()];
                        case 6:
                            copyText = _c.sent();
                            if (!copyRes.ok) {
                                throw new Error("Canvas API error: ".concat(copyRes.status, " ").concat(copyRes.statusText, " - ").concat(copyText));
                            }
                            copied = {};
                            if (copyText) {
                                try {
                                    copied = JSON.parse(copyText);
                                }
                                catch (_d) {
                                    copied = {};
                                }
                            }
                            desiredName = (name || '').trim();
                            currentName = String((copied === null || copied === void 0 ? void 0 : copied.name) || (copied === null || copied === void 0 ? void 0 : copied.full_name) || '').trim();
                            if (desiredName && (copied === null || copied === void 0 ? void 0 : copied.id) && desiredName !== currentName) {
                                return [2 /*return*/, this.updateFolder(Number(copied.id), { name: desiredName })];
                            }
                            return [2 /*return*/, copied];
                    }
                });
            });
        };
        CanvasService_1.prototype.getFileUsage = function (courseId, fileId) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, token, baseUrl, usage, fileUrl, fileResponse, fileData, fileUrlPattern_1, fileIdPattern_1, _b, assignments, quizzes, pages, discussions, error_9;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0: return [4 /*yield*/, this.getAuthHeaders()];
                        case 1:
                            _a = _c.sent(), token = _a.token, baseUrl = _a.baseUrl;
                            usage = [];
                            _c.label = 2;
                        case 2:
                            _c.trys.push([2, 6, , 7]);
                            fileUrl = "".concat(baseUrl, "/files/").concat(fileId);
                            return [4 /*yield*/, fetch(fileUrl, {
                                    headers: { Authorization: "Bearer ".concat(token) },
                                })];
                        case 3:
                            fileResponse = _c.sent();
                            if (!fileResponse.ok)
                                return [2 /*return*/, usage];
                            return [4 /*yield*/, fileResponse.json()];
                        case 4:
                            fileData = _c.sent();
                            fileUrlPattern_1 = fileData.url
                                ? new RegExp(fileData.url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
                                : null;
                            fileIdPattern_1 = new RegExp("/files/".concat(fileId), 'gi');
                            return [4 /*yield*/, Promise.all([
                                    this.fetchPaginatedData("".concat(baseUrl, "/courses/").concat(courseId, "/assignments?per_page=100"), token).catch(function () { return []; }),
                                    this.fetchPaginatedData("".concat(baseUrl, "/courses/").concat(courseId, "/quizzes?per_page=100"), token).catch(function () { return []; }),
                                    this.fetchPaginatedData("".concat(baseUrl, "/courses/").concat(courseId, "/pages?per_page=100"), token).catch(function () { return []; }),
                                    this.fetchPaginatedData("".concat(baseUrl, "/courses/").concat(courseId, "/discussion_topics?per_page=100"), token).catch(function () { return []; }),
                                ])];
                        case 5:
                            _b = _c.sent(), assignments = _b[0], quizzes = _b[1], pages = _b[2], discussions = _b[3];
                            assignments.forEach(function (assignment) {
                                var content = (assignment.description ||
                                    assignment.instructions ||
                                    '').toLowerCase();
                                var matchesUrl = fileUrlPattern_1
                                    ? fileUrlPattern_1.test(content)
                                    : false;
                                if (matchesUrl || fileIdPattern_1.test(content)) {
                                    usage.push({
                                        type: 'Assignment',
                                        id: assignment.id,
                                        title: assignment.name || assignment.title || 'Untitled',
                                    });
                                }
                            });
                            quizzes.forEach(function (quiz) {
                                var content = (quiz.description || '').toLowerCase();
                                var matchesUrl = fileUrlPattern_1
                                    ? fileUrlPattern_1.test(content)
                                    : false;
                                if (matchesUrl || fileIdPattern_1.test(content)) {
                                    usage.push({
                                        type: 'Quiz',
                                        id: quiz.id,
                                        title: quiz.title || 'Untitled',
                                    });
                                }
                            });
                            pages.forEach(function (page) {
                                var content = (page.body || '').toLowerCase();
                                var matchesUrl = fileUrlPattern_1
                                    ? fileUrlPattern_1.test(content)
                                    : false;
                                if (matchesUrl || fileIdPattern_1.test(content)) {
                                    usage.push({
                                        type: 'Page',
                                        id: page.page_id,
                                        title: page.title || page.url || 'Untitled',
                                    });
                                }
                            });
                            discussions.forEach(function (discussion) {
                                var content = (discussion.message || '').toLowerCase();
                                var matchesUrl = fileUrlPattern_1
                                    ? fileUrlPattern_1.test(content)
                                    : false;
                                if (matchesUrl || fileIdPattern_1.test(content)) {
                                    usage.push({
                                        type: 'Discussion',
                                        id: discussion.id,
                                        title: discussion.title || 'Untitled',
                                    });
                                }
                            });
                            return [3 /*break*/, 7];
                        case 6:
                            error_9 = _c.sent();
                            console.error("[Service] Error checking file usage for file ".concat(fileId, ":"), error_9);
                            return [3 /*break*/, 7];
                        case 7: return [2 /*return*/, usage];
                    }
                });
            });
        };
        CanvasService_1.prototype.bulkDeleteFiles = function (courseId_1, fileIds_1) {
            return __awaiter(this, arguments, void 0, function (courseId, fileIds, isFolders) {
                var _a, token, baseUrl, results, i, fileId, isFolder, url, response, errorText, error_10;
                if (isFolders === void 0) { isFolders = []; }
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.getAuthHeaders()];
                        case 1:
                            _a = _b.sent(), token = _a.token, baseUrl = _a.baseUrl;
                            results = [];
                            i = 0;
                            _b.label = 2;
                        case 2:
                            if (!(i < fileIds.length)) return [3 /*break*/, 9];
                            fileId = fileIds[i];
                            isFolder = isFolders[i] || false;
                            _b.label = 3;
                        case 3:
                            _b.trys.push([3, 7, , 8]);
                            url = isFolder
                                ? "".concat(baseUrl, "/folders/").concat(fileId)
                                : "".concat(baseUrl, "/files/").concat(fileId);
                            return [4 /*yield*/, fetch(url, {
                                    method: 'DELETE',
                                    headers: { Authorization: "Bearer ".concat(token) },
                                })];
                        case 4:
                            response = _b.sent();
                            if (!!response.ok) return [3 /*break*/, 6];
                            return [4 /*yield*/, response.text()];
                        case 5:
                            errorText = _b.sent();
                            throw new Error("Failed to delete ".concat(isFolder ? 'folder' : 'file', " ").concat(fileId, ": ").concat(response.status, " ").concat(response.statusText, " - ").concat(errorText));
                        case 6:
                            results.push({ fileId: fileId, success: true });
                            return [3 /*break*/, 8];
                        case 7:
                            error_10 = _b.sent();
                            console.error("[Service] Error deleting ".concat(isFolder ? 'folder' : 'file', " ").concat(fileId, ":"), error_10);
                            results.push({ fileId: fileId, success: false, error: error_10.message });
                            return [3 /*break*/, 8];
                        case 8:
                            i++;
                            return [3 /*break*/, 2];
                        case 9: return [2 /*return*/, results];
                    }
                });
            });
        };
        CanvasService_1.prototype.updateFile = function (courseId, fileId, updates) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, token, baseUrl, payload, url, response, errorText, _b;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0: return [4 /*yield*/, this.getAuthHeaders()];
                        case 1:
                            _a = _c.sent(), token = _a.token, baseUrl = _a.baseUrl;
                            payload = {};
                            if (updates.name != null)
                                payload.name = updates.name;
                            if (updates.display_name != null)
                                payload.name = updates.display_name;
                            if (updates.locked != null)
                                payload.locked = !!updates.locked;
                            if (updates.lock_at != null)
                                payload.lock_at = updates.lock_at;
                            if (updates.unlock_at != null)
                                payload.unlock_at = updates.unlock_at;
                            if (updates.hidden != null)
                                payload.hidden = !!updates.hidden;
                            if (Object.keys(payload).length === 0)
                                throw new Error('No valid file updates provided');
                            url = "".concat(baseUrl, "/files/").concat(fileId);
                            return [4 /*yield*/, fetch(url, {
                                    method: 'PUT',
                                    headers: {
                                        Authorization: "Bearer ".concat(token),
                                        'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify(payload),
                                })];
                        case 2:
                            response = _c.sent();
                            if (!!response.ok) return [3 /*break*/, 4];
                            return [4 /*yield*/, response.text()];
                        case 3:
                            errorText = _c.sent();
                            throw new Error("Canvas API error: ".concat(response.status, " ").concat(response.statusText, " - ").concat(errorText));
                        case 4:
                            _c.trys.push([4, 6, , 7]);
                            return [4 /*yield*/, response.json()];
                        case 5: return [2 /*return*/, _c.sent()];
                        case 6:
                            _b = _c.sent();
                            return [2 /*return*/, { id: fileId }];
                        case 7: return [2 /*return*/];
                    }
                });
            });
        };
        CanvasService_1.prototype.updateFolder = function (folderId, updates) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, token, baseUrl, payload, url, response, errorText, _b;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0: return [4 /*yield*/, this.getAuthHeaders()];
                        case 1:
                            _a = _c.sent(), token = _a.token, baseUrl = _a.baseUrl;
                            payload = {};
                            if (updates.name != null)
                                payload.name = updates.name;
                            if (updates.display_name != null)
                                payload.name = updates.display_name;
                            if (updates.locked != null)
                                payload.locked = !!updates.locked;
                            if (updates.lock_at != null)
                                payload.lock_at = updates.lock_at;
                            if (updates.unlock_at != null)
                                payload.unlock_at = updates.unlock_at;
                            if (updates.hidden != null)
                                payload.hidden = !!updates.hidden;
                            if (Object.keys(payload).length === 0)
                                throw new Error('No valid folder updates provided');
                            url = "".concat(baseUrl, "/folders/").concat(folderId);
                            return [4 /*yield*/, fetch(url, {
                                    method: 'PUT',
                                    headers: {
                                        Authorization: "Bearer ".concat(token),
                                        'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify(payload),
                                })];
                        case 2:
                            response = _c.sent();
                            if (!!response.ok) return [3 /*break*/, 4];
                            return [4 /*yield*/, response.text()];
                        case 3:
                            errorText = _c.sent();
                            throw new Error("Canvas API error: ".concat(response.status, " ").concat(response.statusText, " - ").concat(errorText));
                        case 4:
                            _c.trys.push([4, 6, , 7]);
                            return [4 /*yield*/, response.json()];
                        case 5: return [2 /*return*/, _c.sent()];
                        case 6:
                            _b = _c.sent();
                            return [2 /*return*/, { id: folderId }];
                        case 7: return [2 /*return*/];
                    }
                });
            });
        };
        CanvasService_1.prototype.renameFile = function (courseId, fileId, newName) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.updateFile(courseId, fileId, { name: newName })];
                });
            });
        };
        CanvasService_1.prototype.renameFolder = function (folderId, newName) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.updateFolder(folderId, { name: newName })];
                });
            });
        };
        CanvasService_1.prototype.getCourseAccommodations = function (courseId) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, token, baseUrl, assignUrl, assignments, allOverrides, _loop_1, this_1, _i, assignments_1, assignment, quizzes, _loop_2, this_2, _b, quizzes_1, quiz;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0: return [4 /*yield*/, this.getAuthHeaders()];
                        case 1:
                            _a = _c.sent(), token = _a.token, baseUrl = _a.baseUrl;
                            assignUrl = "".concat(baseUrl, "/courses/").concat(courseId, "/assignments?per_page=100&include[]=submission");
                            return [4 /*yield*/, this.fetchPaginatedData(assignUrl, token)];
                        case 2:
                            assignments = _c.sent();
                            allOverrides = [];
                            _loop_1 = function (assignment) {
                                var url, overrides, _d;
                                return __generator(this, function (_e) {
                                    switch (_e.label) {
                                        case 0:
                                            _e.trys.push([0, 2, , 3]);
                                            url = "".concat(baseUrl, "/courses/").concat(courseId, "/assignments/").concat(assignment.id, "/overrides?per_page=100");
                                            return [4 /*yield*/, this_1.fetchPaginatedData(url, token)];
                                        case 1:
                                            overrides = _e.sent();
                                            allOverrides.push.apply(allOverrides, overrides.map(function (override) { return (__assign(__assign({}, override), { assignment_id: assignment.id, assignment_name: assignment.name })); }));
                                            return [3 /*break*/, 3];
                                        case 2:
                                            _d = _e.sent();
                                            // Some assignments may not have overrides, continue
                                            console.warn("Could not fetch overrides for assignment ".concat(assignment.id));
                                            return [3 /*break*/, 3];
                                        case 3: return [2 /*return*/];
                                    }
                                });
                            };
                            this_1 = this;
                            _i = 0, assignments_1 = assignments;
                            _c.label = 3;
                        case 3:
                            if (!(_i < assignments_1.length)) return [3 /*break*/, 6];
                            assignment = assignments_1[_i];
                            return [5 /*yield**/, _loop_1(assignment)];
                        case 4:
                            _c.sent();
                            _c.label = 5;
                        case 5:
                            _i++;
                            return [3 /*break*/, 3];
                        case 6: return [4 /*yield*/, this.getCourseQuizzes(courseId)];
                        case 7:
                            quizzes = _c.sent();
                            _loop_2 = function (quiz) {
                                var url, extensions, _f;
                                return __generator(this, function (_g) {
                                    switch (_g.label) {
                                        case 0:
                                            _g.trys.push([0, 2, , 3]);
                                            url = "".concat(baseUrl, "/courses/").concat(courseId, "/quizzes/").concat(quiz.id, "/extensions?per_page=100");
                                            return [4 /*yield*/, this_2.fetchPaginatedData(url, token)];
                                        case 1:
                                            extensions = _g.sent();
                                            allOverrides.push.apply(allOverrides, extensions.map(function (ext) { return (__assign(__assign({}, ext), { quiz_id: quiz.id, quiz_name: quiz.title, type: 'quiz_extension' })); }));
                                            return [3 /*break*/, 3];
                                        case 2:
                                            _f = _g.sent();
                                            // Some quizzes may not have extensions, continue
                                            console.warn("Could not fetch extensions for quiz ".concat(quiz.id));
                                            return [3 /*break*/, 3];
                                        case 3: return [2 /*return*/];
                                    }
                                });
                            };
                            this_2 = this;
                            _b = 0, quizzes_1 = quizzes;
                            _c.label = 8;
                        case 8:
                            if (!(_b < quizzes_1.length)) return [3 /*break*/, 11];
                            quiz = quizzes_1[_b];
                            return [5 /*yield**/, _loop_2(quiz)];
                        case 9:
                            _c.sent();
                            _c.label = 10;
                        case 10:
                            _b++;
                            return [3 /*break*/, 8];
                        case 11: return [2 /*return*/, allOverrides];
                    }
                });
            });
        };
        // Individual GET methods (for fetching full item data)
        CanvasService_1.prototype.getAssignment = function (courseId, assignmentId) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, token, baseUrl, response, errorText;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.getAuthHeaders()];
                        case 1:
                            _a = _b.sent(), token = _a.token, baseUrl = _a.baseUrl;
                            return [4 /*yield*/, fetch("".concat(baseUrl, "/courses/").concat(courseId, "/assignments/").concat(assignmentId), {
                                    headers: { Authorization: "Bearer ".concat(token) },
                                })];
                        case 2:
                            response = _b.sent();
                            if (!!response.ok) return [3 /*break*/, 4];
                            return [4 /*yield*/, response.text()];
                        case 3:
                            errorText = _b.sent();
                            throw new Error("Failed to get assignment: ".concat(response.status, " ").concat(response.statusText, " - ").concat(errorText));
                        case 4: return [4 /*yield*/, response.json()];
                        case 5: return [2 /*return*/, _b.sent()];
                    }
                });
            });
        };
        CanvasService_1.prototype.getQuiz = function (courseId, quizId) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, token, baseUrl, response, errorText;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.getAuthHeaders()];
                        case 1:
                            _a = _b.sent(), token = _a.token, baseUrl = _a.baseUrl;
                            return [4 /*yield*/, fetch("".concat(baseUrl, "/courses/").concat(courseId, "/quizzes/").concat(quizId), {
                                    headers: { Authorization: "Bearer ".concat(token) },
                                })];
                        case 2:
                            response = _b.sent();
                            if (!!response.ok) return [3 /*break*/, 4];
                            return [4 /*yield*/, response.text()];
                        case 3:
                            errorText = _b.sent();
                            throw new Error("Failed to get quiz: ".concat(response.status, " ").concat(response.statusText, " - ").concat(errorText));
                        case 4: return [4 /*yield*/, response.json()];
                        case 5: return [2 /*return*/, _b.sent()];
                    }
                });
            });
        };
        CanvasService_1.prototype.getDiscussion = function (courseId, discussionId) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, token, baseUrl, response, errorText;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.getAuthHeaders()];
                        case 1:
                            _a = _b.sent(), token = _a.token, baseUrl = _a.baseUrl;
                            return [4 /*yield*/, fetch("".concat(baseUrl, "/courses/").concat(courseId, "/discussion_topics/").concat(discussionId), {
                                    headers: { Authorization: "Bearer ".concat(token) },
                                })];
                        case 2:
                            response = _b.sent();
                            if (!!response.ok) return [3 /*break*/, 4];
                            return [4 /*yield*/, response.text()];
                        case 3:
                            errorText = _b.sent();
                            throw new Error("Failed to get discussion: ".concat(response.status, " ").concat(response.statusText, " - ").concat(errorText));
                        case 4: return [4 /*yield*/, response.json()];
                        case 5: return [2 /*return*/, _b.sent()];
                    }
                });
            });
        };
        CanvasService_1.prototype.getPage = function (courseId, pageUrl) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, token, baseUrl, lastError, attempt, response, errorText;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.getAuthHeaders()];
                        case 1:
                            _a = _b.sent(), token = _a.token, baseUrl = _a.baseUrl;
                            lastError = null;
                            attempt = 0;
                            _b.label = 2;
                        case 2:
                            if (!(attempt < 3)) return [3 /*break*/, 10];
                            if (!(attempt > 0)) return [3 /*break*/, 4];
                            // Wait 500ms before retry
                            return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 500); })];
                        case 3:
                            // Wait 500ms before retry
                            _b.sent();
                            _b.label = 4;
                        case 4: return [4 /*yield*/, fetch("".concat(baseUrl, "/courses/").concat(courseId, "/pages/").concat(encodeURIComponent(pageUrl)), {
                                headers: { Authorization: "Bearer ".concat(token) },
                            })];
                        case 5:
                            response = _b.sent();
                            if (!response.ok) return [3 /*break*/, 7];
                            return [4 /*yield*/, response.json()];
                        case 6: return [2 /*return*/, _b.sent()];
                        case 7:
                            if (!(response.status !== 404 || attempt === 2)) return [3 /*break*/, 9];
                            return [4 /*yield*/, response.text()];
                        case 8:
                            errorText = _b.sent();
                            lastError = new Error("Failed to get page: ".concat(response.status, " ").concat(response.statusText, " - ").concat(errorText));
                            if (response.status !== 404) {
                                throw lastError;
                            }
                            _b.label = 9;
                        case 9:
                            attempt++;
                            return [3 /*break*/, 2];
                        case 10: 
                        // If we get here, all retries failed with 404
                        throw (lastError ||
                            new Error("Failed to get page: Resource not found after retries"));
                    }
                });
            });
        };
        CanvasService_1.prototype.tryGetPageByUrl = function (courseId, pageUrl) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, token, baseUrl, response, errorText;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.getAuthHeaders()];
                        case 1:
                            _a = _b.sent(), token = _a.token, baseUrl = _a.baseUrl;
                            return [4 /*yield*/, fetch("".concat(baseUrl, "/courses/").concat(courseId, "/pages/").concat(encodeURIComponent(pageUrl), "?include[]=body"), { headers: { Authorization: "Bearer ".concat(token) } })];
                        case 2:
                            response = _b.sent();
                            if (!response.ok) return [3 /*break*/, 4];
                            return [4 /*yield*/, response.json()];
                        case 3: return [2 /*return*/, (_b.sent())];
                        case 4:
                            if (response.status === 404) {
                                return [2 /*return*/, null];
                            }
                            return [4 /*yield*/, response.text()];
                        case 5:
                            errorText = _b.sent();
                            throw new Error("Failed to get page: ".concat(response.status, " ").concat(response.statusText, " - ").concat(errorText));
                    }
                });
            });
        };
        CanvasService_1.prototype.getAnnouncement = function (courseId, announcementId) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    // Announcements are discussions, so use the same endpoint
                    return [2 /*return*/, this.getDiscussion(courseId, announcementId)];
                });
            });
        };
        // Individual update methods (for inline editing)
        CanvasService_1.prototype.updateAssignment = function (courseId, assignmentId, updates) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, token, baseUrl, pending_1, rubricSelection, rawRubric, parsedRubricId, needsNewQuizRoute, snapshot, isNewQuiz, split, quizUpdates, cleanedUpdates, requestBody, response, responseText, errorMessage, result, error_11;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            _b.trys.push([0, 14, , 15]);
                            console.log("[Service] updateAssignment called for assignment ".concat(assignmentId, " in course ").concat(courseId));
                            console.log("[Service] Raw updates:", JSON.stringify(updates, null, 2));
                            return [4 /*yield*/, this.getAuthHeaders()];
                        case 1:
                            _a = _b.sent(), token = _a.token, baseUrl = _a.baseUrl;
                            pending_1 = __assign({}, updates);
                            rubricSelection = undefined;
                            if (Object.prototype.hasOwnProperty.call(pending_1, 'rubric_id')) {
                                rawRubric = pending_1.rubric_id;
                                if (rawRubric === null || rawRubric === '' || rawRubric === undefined) {
                                    rubricSelection = null;
                                }
                                else {
                                    parsedRubricId = Number(rawRubric);
                                    rubricSelection = Number.isFinite(parsedRubricId)
                                        ? parsedRubricId
                                        : null;
                                }
                                delete pending_1.rubric_id;
                            }
                            delete pending_1.rubric_summary;
                            delete pending_1.rubric_url;
                            delete pending_1.rubric_association_id;
                            needsNewQuizRoute = Object.prototype.hasOwnProperty.call(pending_1, 'description') ||
                                Object.prototype.hasOwnProperty.call(pending_1, 'name');
                            if (!needsNewQuizRoute) return [3 /*break*/, 4];
                            return [4 /*yield*/, this.getAssignment(courseId, assignmentId)];
                        case 2:
                            snapshot = _b.sent();
                            isNewQuiz = this.isLikelyNewQuizAssignment(snapshot);
                            console.log("[Service][NewQuiz] Assignment ".concat(assignmentId, " detection:"), {
                                isNewQuizAssignment: snapshot === null || snapshot === void 0 ? void 0 : snapshot.is_quiz_assignment,
                                quizLti: snapshot === null || snapshot === void 0 ? void 0 : snapshot.quiz_lti,
                                quizId: snapshot === null || snapshot === void 0 ? void 0 : snapshot.quiz_id,
                                submissionTypes: snapshot === null || snapshot === void 0 ? void 0 : snapshot.submission_types,
                                resolvedAsNewQuiz: isNewQuiz,
                            });
                            if (!isNewQuiz) return [3 /*break*/, 4];
                            split = splitNewQuizTextUpdates(pending_1);
                            quizUpdates = split.quizUpdates;
                            Object.keys(pending_1).forEach(function (k) { return delete pending_1[k]; });
                            Object.assign(pending_1, split.assignmentUpdates);
                            if (!(Object.keys(quizUpdates).length > 0)) return [3 /*break*/, 4];
                            return [4 /*yield*/, this.patchNewQuizByAssignment(courseId, assignmentId, quizUpdates, token, baseUrl)];
                        case 3:
                            _b.sent();
                            _b.label = 4;
                        case 4:
                            cleanedUpdates = normalizeUpdatePayload(pending_1, {
                                clearableTextFields: true,
                            });
                            if (!(Object.keys(cleanedUpdates).length === 0)) return [3 /*break*/, 8];
                            if (!(rubricSelection !== undefined)) return [3 /*break*/, 6];
                            return [4 /*yield*/, this.upsertAssignmentRubricAssociation(courseId, assignmentId, rubricSelection, token, baseUrl)];
                        case 5:
                            _b.sent();
                            _b.label = 6;
                        case 6: return [4 /*yield*/, this.getAssignment(courseId, assignmentId)];
                        case 7: return [2 /*return*/, _b.sent()];
                        case 8:
                            validateDateOrder(cleanedUpdates, "Assignment ".concat(assignmentId));
                            console.log("[Service] Updating assignment ".concat(assignmentId, " in course ").concat(courseId));
                            console.log("[Service] Cleaned updates:", JSON.stringify(cleanedUpdates, null, 2));
                            console.log("[Service] Canvas API URL: ".concat(baseUrl, "/courses/").concat(courseId, "/assignments/").concat(assignmentId));
                            requestBody = JSON.stringify({ assignment: cleanedUpdates });
                            console.log("[Service] Request body (wrapped):", requestBody);
                            return [4 /*yield*/, fetch("".concat(baseUrl, "/courses/").concat(courseId, "/assignments/").concat(assignmentId), {
                                    method: 'PUT',
                                    headers: {
                                        Authorization: "Bearer ".concat(token),
                                        'Content-Type': 'application/json',
                                    },
                                    body: requestBody,
                                })];
                        case 9:
                            response = _b.sent();
                            console.log("[Service] Response status: ".concat(response.status, " ").concat(response.statusText));
                            return [4 /*yield*/, response.text()];
                        case 10:
                            responseText = _b.sent();
                            console.log("[Service] Raw response body:", responseText);
                            console.log("[Service] Response body length: ".concat(responseText.length, " characters"));
                            if (!response.ok) {
                                console.error("[Service] Canvas API error: ".concat(response.status, " ").concat(response.statusText));
                                console.error("[Service] Error response body:", responseText);
                                // Provide more helpful error messages for common issues
                                if (response.status === 403) {
                                    errorMessage = "Canvas API returned 403 Forbidden. Common causes:\n";
                                    errorMessage += "1. The course has ended - Canvas restricts write operations on ended courses\n";
                                    errorMessage += "2. The API token doesn't have write permissions\n";
                                    errorMessage += "3. The user associated with the token doesn't have permission to modify assignments in this course\n";
                                    errorMessage += "4. The token may need to be regenerated with proper scopes\n\n";
                                    errorMessage += "Canvas API response: ".concat(responseText);
                                    throw new Error(errorMessage);
                                }
                                throw new Error("Canvas API error: ".concat(response.status, " ").concat(response.statusText, " - ").concat(responseText));
                            }
                            result = void 0;
                            try {
                                result = JSON.parse(responseText);
                                console.log("[Service] Parsed JSON response successfully");
                            }
                            catch (parseError) {
                                console.error("[Service] Failed to parse JSON response:", parseError);
                                console.error("[Service] Response text that failed to parse:", responseText);
                                throw new Error("Canvas API returned invalid JSON: ".concat(responseText));
                            }
                            console.log("[Service] Assignment ".concat(assignmentId, " updated successfully"));
                            console.log("[Service] Canvas API response (formatted):", JSON.stringify(result, null, 2));
                            if (!(rubricSelection !== undefined)) return [3 /*break*/, 13];
                            return [4 /*yield*/, this.upsertAssignmentRubricAssociation(courseId, assignmentId, rubricSelection, token, baseUrl)];
                        case 11:
                            _b.sent();
                            return [4 /*yield*/, this.getAssignment(courseId, assignmentId)];
                        case 12: return [2 /*return*/, _b.sent()];
                        case 13: return [2 /*return*/, result];
                        case 14:
                            error_11 = _b.sent();
                            console.error("[Service] Error in updateAssignment for assignment ".concat(assignmentId, ":"), error_11);
                            console.error("[Service] Error message:", error_11.message);
                            console.error("[Service] Error stack:", error_11.stack);
                            // Ensure we throw a proper error that NestJS can handle
                            if (error_11 instanceof Error) {
                                throw error_11;
                            }
                            else {
                                throw new Error("Failed to update assignment ".concat(assignmentId, ": ").concat(String(error_11)));
                            }
                            return [3 /*break*/, 15];
                        case 15: return [2 /*return*/];
                    }
                });
            });
        };
        CanvasService_1.prototype.updateQuiz = function (courseId, quizId, updates) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, token, baseUrl, courseInfo, endDate, now, errorMessage, courseCheckError_1, pending_2, rubricSelection, rawRubric, parsedRubricId, cleanedUpdates_1, showAt, hideAt, d, quizSnapshot, assignmentId, requestBody, response, responseText, errorMessage, result_1, assignmentResult, assignmentError_1, assignmentId, error_12;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            _b.trys.push([0, 21, , 22]);
                            console.log("[Service] updateQuiz called for quiz ".concat(quizId, " in course ").concat(courseId));
                            console.log("[Service] Raw updates:", JSON.stringify(updates, null, 2));
                            return [4 /*yield*/, this.getAuthHeaders()];
                        case 1:
                            _a = _b.sent(), token = _a.token, baseUrl = _a.baseUrl;
                            _b.label = 2;
                        case 2:
                            _b.trys.push([2, 4, , 5]);
                            return [4 /*yield*/, this.getCourseDetails(courseId)];
                        case 3:
                            courseInfo = _b.sent();
                            endDate = courseInfo.end_at ? new Date(courseInfo.end_at) : null;
                            now = new Date();
                            if (endDate && endDate < now) {
                                errorMessage = "Cannot update quiz: Course has ended (ended on ".concat(endDate.toLocaleDateString(), "). ") +
                                    "Canvas restricts write operations on ended courses to preserve historical data.";
                                console.warn("[Service] ".concat(errorMessage));
                                throw new Error(errorMessage);
                            }
                            return [3 /*break*/, 5];
                        case 4:
                            courseCheckError_1 = _b.sent();
                            // If the error is about course ending, re-throw it
                            if (courseCheckError_1.message.includes('Course has ended')) {
                                throw courseCheckError_1;
                            }
                            // Otherwise, log but continue (course check is not critical)
                            console.warn("[Service] Could not verify course end date:", courseCheckError_1.message);
                            return [3 /*break*/, 5];
                        case 5:
                            console.log("[Service] Got auth headers, baseUrl: ".concat(baseUrl));
                            pending_2 = __assign({}, updates);
                            rubricSelection = undefined;
                            if (Object.prototype.hasOwnProperty.call(pending_2, 'rubric_id')) {
                                rawRubric = pending_2.rubric_id;
                                if (rawRubric === null || rawRubric === '' || rawRubric === undefined) {
                                    rubricSelection = null;
                                }
                                else {
                                    parsedRubricId = Number(rawRubric);
                                    rubricSelection = Number.isFinite(parsedRubricId)
                                        ? parsedRubricId
                                        : null;
                                }
                                delete pending_2.rubric_id;
                            }
                            delete pending_2.rubric_summary;
                            delete pending_2.rubric_url;
                            delete pending_2.rubric_association_id;
                            cleanedUpdates_1 = normalizeUpdatePayload(pending_2, {
                                clearableTextFields: true,
                                nullableKeys: NULLABLE_QUIZ_FIELDS,
                                floorIntegerKeys: new Set(['time_limit']),
                            });
                            delete cleanedUpdates_1.points_possible;
                            showAt = cleanedUpdates_1.show_correct_answers_at;
                            hideAt = cleanedUpdates_1.hide_correct_answers_at;
                            if (showAt && hideAt && showAt === hideAt) {
                                d = new Date(showAt);
                                d.setDate(d.getDate() + 1);
                                cleanedUpdates_1.hide_correct_answers_at =
                                    d.toISOString().slice(0, 19) + 'Z';
                            }
                            if (!(Object.keys(cleanedUpdates_1).length === 0)) return [3 /*break*/, 9];
                            if (rubricSelection === undefined) {
                                throw new Error('No valid updates to send to Canvas API');
                            }
                            return [4 /*yield*/, this.getQuiz(courseId, quizId)];
                        case 6:
                            quizSnapshot = _b.sent();
                            assignmentId = Number(quizSnapshot === null || quizSnapshot === void 0 ? void 0 : quizSnapshot.assignment_id);
                            if (!Number.isFinite(assignmentId)) {
                                throw new Error('Cannot set rubric: quiz does not have an assignment_id');
                            }
                            return [4 /*yield*/, this.upsertAssignmentRubricAssociation(courseId, assignmentId, rubricSelection, token, baseUrl)];
                        case 7:
                            _b.sent();
                            return [4 /*yield*/, this.getQuiz(courseId, quizId)];
                        case 8: return [2 /*return*/, _b.sent()];
                        case 9:
                            validateDateOrder(cleanedUpdates_1, "Quiz ".concat(quizId));
                            console.log("[Service] Updating quiz ".concat(quizId, " in course ").concat(courseId));
                            console.log("[Service] Cleaned updates:", JSON.stringify(cleanedUpdates_1, null, 2));
                            console.log("[Service] Canvas API URL: ".concat(baseUrl, "/courses/").concat(courseId, "/quizzes/").concat(quizId));
                            requestBody = JSON.stringify({ quiz: cleanedUpdates_1 });
                            console.log("[Service] Request body (wrapped):", requestBody);
                            return [4 /*yield*/, fetch("".concat(baseUrl, "/courses/").concat(courseId, "/quizzes/").concat(quizId), {
                                    method: 'PUT',
                                    headers: {
                                        Authorization: "Bearer ".concat(token),
                                        'Content-Type': 'application/json',
                                    },
                                    body: requestBody,
                                })];
                        case 10:
                            response = _b.sent();
                            console.log("[Service] Response status: ".concat(response.status, " ").concat(response.statusText));
                            console.log("[Service] Response headers:", JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2));
                            return [4 /*yield*/, response.text()];
                        case 11:
                            responseText = _b.sent();
                            console.log("[Service] Raw response body:", responseText);
                            console.log("[Service] Response body length: ".concat(responseText.length, " characters"));
                            if (!response.ok) {
                                console.error("[Service] Canvas API error: ".concat(response.status, " ").concat(response.statusText));
                                console.error("[Service] Error response body:", responseText);
                                // Provide more helpful error messages for common issues
                                if (response.status === 403) {
                                    errorMessage = "Canvas API returned 403 Forbidden. Common causes:\n";
                                    errorMessage += "1. The course has ended - Canvas restricts write operations on ended courses to preserve historical data\n";
                                    errorMessage += "2. The API token doesn't have write permissions\n";
                                    errorMessage += "3. The user associated with the token doesn't have permission to modify quizzes in this course\n";
                                    errorMessage += "4. The token may need to be regenerated with proper scopes\n\n";
                                    errorMessage += "Canvas API response: ".concat(responseText);
                                    throw new Error(errorMessage);
                                }
                                throw new Error("Canvas API error: ".concat(response.status, " ").concat(response.statusText, " - ").concat(responseText));
                            }
                            try {
                                result_1 = JSON.parse(responseText);
                                console.log("[Service] Parsed JSON response successfully");
                            }
                            catch (parseError) {
                                console.error("[Service] Failed to parse JSON response:", parseError);
                                console.error("[Service] Response text that failed to parse:", responseText);
                                throw new Error("Canvas API returned invalid JSON: ".concat(responseText));
                            }
                            console.log("[Service] Quiz ".concat(quizId, " updated successfully"));
                            console.log("[Service] Canvas API response (formatted):", JSON.stringify(result_1, null, 2));
                            // Log specific fields we care about
                            console.log("[Service] Response quiz ID: ".concat(result_1.id));
                            console.log("[Service] Response quiz title: ".concat(result_1.title));
                            console.log("[Service] Response due_at: ".concat(result_1.due_at || 'null/undefined'));
                            console.log("[Service] Response assignment_id: ".concat(result_1.assignment_id || 'null/undefined'));
                            console.log("[Service] Response lock_at: ".concat(result_1.lock_at || 'null/undefined'));
                            console.log("[Service] Response unlock_at: ".concat(result_1.unlock_at || 'null/undefined'));
                            console.log("[Service] Response published: ".concat(result_1.published));
                            // Compare what we sent vs what we got back
                            console.log("[Service] === UPDATE COMPARISON ===");
                            console.log("[Service] Fields we sent:", Object.keys(cleanedUpdates_1));
                            console.log("[Service] Fields in response:", Object.keys(result_1));
                            // Check each field we updated
                            Object.keys(cleanedUpdates_1).forEach(function (key) {
                                var sentValue = cleanedUpdates_1[key];
                                var receivedValue = result_1[key];
                                if (sentValue !== receivedValue) {
                                    console.warn("[Service] \u26A0\uFE0F  FIELD MISMATCH for ".concat(key, ":"));
                                    console.warn("[Service]    Sent: ".concat(sentValue));
                                    console.warn("[Service]    Received: ".concat(receivedValue));
                                }
                                else {
                                    console.log("[Service] \u2713 Field ".concat(key, " matches: ").concat(sentValue));
                                }
                            });
                            if (!(Object.prototype.hasOwnProperty.call(cleanedUpdates_1, 'due_at') &&
                                result_1.assignment_id)) return [3 /*break*/, 16];
                            console.log("[Service] Quiz has assignment_id ".concat(result_1.assignment_id, ", updating assignment due date as well"));
                            console.log("[Service] Updating assignment ".concat(result_1.assignment_id, " with due_at: ").concat(cleanedUpdates_1.due_at));
                            _b.label = 12;
                        case 12:
                            _b.trys.push([12, 14, , 15]);
                            return [4 /*yield*/, this.updateAssignment(courseId, result_1.assignment_id, { due_at: cleanedUpdates_1.due_at })];
                        case 13:
                            assignmentResult = _b.sent();
                            console.log("[Service] \u2713 Successfully updated assignment ".concat(result_1.assignment_id, " due date"));
                            console.log("[Service] Assignment response due_at: ".concat(assignmentResult.due_at || 'null/undefined'));
                            return [3 /*break*/, 15];
                        case 14:
                            assignmentError_1 = _b.sent();
                            console.error("[Service] \u2717 Failed to update assignment due date:", assignmentError_1.message);
                            console.error("[Service] Assignment error stack:", assignmentError_1.stack);
                            // Don't throw - the quiz update succeeded, this is just a warning
                            console.warn("[Service] \u26A0\uFE0F  Quiz due date updated, but assignment due date update failed. The quiz due date may not display correctly in Canvas.");
                            return [3 /*break*/, 15];
                        case 15: return [3 /*break*/, 17];
                        case 16:
                            if (Object.prototype.hasOwnProperty.call(cleanedUpdates_1, 'due_at') &&
                                !result_1.assignment_id) {
                                console.log("[Service] Quiz does not have an assignment_id (likely a practice quiz or ungraded survey)");
                            }
                            _b.label = 17;
                        case 17:
                            if (Object.prototype.hasOwnProperty.call(cleanedUpdates_1, 'due_at') &&
                                cleanedUpdates_1.due_at) {
                                if (result_1.due_at) {
                                    console.log("[Service] Due date comparison:");
                                    console.log("[Service]   Request: ".concat(cleanedUpdates_1.due_at));
                                    console.log("[Service]   Response: ".concat(result_1.due_at));
                                    if (cleanedUpdates_1.due_at !== result_1.due_at) {
                                        console.warn("[Service] \u26A0\uFE0F  WARNING: Due date mismatch!");
                                        console.warn("[Service]   Request: ".concat(cleanedUpdates_1.due_at));
                                        console.warn("[Service]   Response: ".concat(result_1.due_at));
                                    }
                                    else {
                                        console.log("[Service] \u2713 Due date matches in response");
                                    }
                                }
                                else {
                                    console.warn("[Service] \u26A0\uFE0F  WARNING: Sent due_at but it's not in the response!");
                                    console.warn("[Service]   This is normal for graded quizzes - the due date is stored on the assignment.");
                                }
                            }
                            if (!(rubricSelection !== undefined)) return [3 /*break*/, 20];
                            assignmentId = Number(result_1 === null || result_1 === void 0 ? void 0 : result_1.assignment_id);
                            if (!Number.isFinite(assignmentId)) {
                                throw new Error('Cannot set rubric: quiz does not have an assignment_id');
                            }
                            return [4 /*yield*/, this.upsertAssignmentRubricAssociation(courseId, assignmentId, rubricSelection, token, baseUrl)];
                        case 18:
                            _b.sent();
                            return [4 /*yield*/, this.getQuiz(courseId, quizId)];
                        case 19: return [2 /*return*/, _b.sent()];
                        case 20: return [2 /*return*/, result_1];
                        case 21:
                            error_12 = _b.sent();
                            console.error("[Service] Error in updateQuiz for quiz ".concat(quizId, ":"), error_12);
                            console.error("[Service] Error message:", error_12.message);
                            console.error("[Service] Error stack:", error_12.stack);
                            // Ensure we throw a proper error that NestJS can handle
                            if (error_12 instanceof Error) {
                                throw error_12;
                            }
                            else {
                                throw new Error("Failed to update quiz ".concat(quizId, ": ").concat(String(error_12)));
                            }
                            return [3 /*break*/, 22];
                        case 22: return [2 /*return*/];
                    }
                });
            });
        };
        CanvasService_1.prototype.updateDiscussion = function (courseId, discussionId, updates) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, token, baseUrl, pending, gradedSelection, rubricSelection, rawRubric, parsedRubricId, topicUrl, assignmentId, isAnnouncement, topic, _b, sendDiscussionUpdate, sendDiscussionDateDetailsUpdate, topicResult, pointsSeedRaw, pointsSeedNum, assignmentPayload, refreshed, cleanedUpdates, unsupportedAnnouncementInputs, allowedKeys, rejectedKeys, filteredUpdates, podcastRequested, expectedPodcastEnabled, expectedPodcastStudentPosts, discussionUpdates, assignmentUpdates, dateDetailsUpdates, dateDetailKeys, mergedDates, finalTopic, podcastUrl, actualPodcastEnabledByUrl, hasPodcastEnabled, hasPodcastStudentPosts, actualPodcastEnabled, actualPodcastStudentPosts;
                var _this = this;
                var _c, _d;
                return __generator(this, function (_e) {
                    switch (_e.label) {
                        case 0: return [4 /*yield*/, this.getAuthHeaders()];
                        case 1:
                            _a = _e.sent(), token = _a.token, baseUrl = _a.baseUrl;
                            pending = __assign({}, updates);
                            if (Object.prototype.hasOwnProperty.call(pending, 'expand')) {
                                pending.expanded = pending.expand;
                                delete pending.expand;
                            }
                            if (Object.prototype.hasOwnProperty.call(pending, 'expand_locked')) {
                                pending.expanded_locked = pending.expand_locked;
                                delete pending.expand_locked;
                            }
                            gradedSelection = undefined;
                            if (Object.prototype.hasOwnProperty.call(pending, 'graded')) {
                                gradedSelection = Boolean(pending.graded);
                                delete pending.graded;
                            }
                            rubricSelection = undefined;
                            if (Object.prototype.hasOwnProperty.call(pending, 'rubric_id')) {
                                rawRubric = pending.rubric_id;
                                if (rawRubric === null || rawRubric === '' || rawRubric === undefined) {
                                    rubricSelection = null;
                                }
                                else {
                                    parsedRubricId = Number(rawRubric);
                                    rubricSelection = Number.isFinite(parsedRubricId)
                                        ? parsedRubricId
                                        : null;
                                }
                                delete pending.rubric_id;
                            }
                            delete pending.rubric_summary;
                            delete pending.rubric_url;
                            delete pending.rubric_association_id;
                            topicUrl = "".concat(baseUrl, "/courses/").concat(courseId, "/discussion_topics/").concat(discussionId);
                            assignmentId = null;
                            isAnnouncement = false;
                            _e.label = 2;
                        case 2:
                            _e.trys.push([2, 4, , 5]);
                            return [4 /*yield*/, this.getDiscussion(courseId, discussionId)];
                        case 3:
                            topic = _e.sent();
                            assignmentId = (_c = topic === null || topic === void 0 ? void 0 : topic.assignment_id) !== null && _c !== void 0 ? _c : null;
                            isAnnouncement = Boolean(topic === null || topic === void 0 ? void 0 : topic.is_announcement);
                            return [3 /*break*/, 5];
                        case 4:
                            _b = _e.sent();
                            assignmentId = null;
                            isAnnouncement = false;
                            return [3 /*break*/, 5];
                        case 5:
                            console.log("[Discussion Update] course=".concat(courseId, " id=").concat(discussionId, " announcement=").concat(isAnnouncement, " input_keys=").concat(Object.keys(pending).join(',')));
                            sendDiscussionUpdate = function (payload) { return __awaiter(_this, void 0, void 0, function () {
                                var toFormValue, form, wrappedForm, attempts, lastStatus, lastText, lastAttempt, out, _i, attempts_2, attempt, response, text, expected, actual;
                                var _a, _b;
                                return __generator(this, function (_c) {
                                    switch (_c.label) {
                                        case 0:
                                            if (!payload || Object.keys(payload).length === 0)
                                                return [2 /*return*/, null];
                                            console.log("[Discussion Update] topic_endpoint course=".concat(courseId, " id=").concat(discussionId, " keys=").concat(Object.keys(payload).join(','), " payload=").concat(JSON.stringify(payload).slice(0, 1200)));
                                            toFormValue = function (value) {
                                                if (typeof value === 'boolean')
                                                    return value ? '1' : '0';
                                                return String(value);
                                            };
                                            form = new URLSearchParams();
                                            wrappedForm = new URLSearchParams();
                                            Object.entries(payload).forEach(function (_a) {
                                                var k = _a[0], v = _a[1];
                                                if (v === undefined || v === null)
                                                    return;
                                                if (typeof v === 'object' && !Array.isArray(v)) {
                                                    Object.entries(v).forEach(function (_a) {
                                                        var subK = _a[0], subV = _a[1];
                                                        if (subV !== undefined && subV !== null) {
                                                            form.append("".concat(k, "[").concat(subK, "]"), toFormValue(subV));
                                                            wrappedForm.append("discussion_topic[".concat(k, "][").concat(subK, "]"), toFormValue(subV));
                                                        }
                                                    });
                                                }
                                                else {
                                                    form.append(k, toFormValue(v));
                                                    wrappedForm.append("discussion_topic[".concat(k, "]"), toFormValue(v));
                                                }
                                            });
                                            attempts = [
                                                {
                                                    name: 'form_urlencoded',
                                                    contentType: 'application/x-www-form-urlencoded',
                                                    body: form.toString(),
                                                },
                                                {
                                                    name: 'json_raw',
                                                    contentType: 'application/json',
                                                    body: JSON.stringify(payload),
                                                },
                                                {
                                                    name: 'json_wrapped',
                                                    contentType: 'application/json',
                                                    body: JSON.stringify({ discussion_topic: payload }),
                                                },
                                                {
                                                    name: 'form_urlencoded_wrapped',
                                                    contentType: 'application/x-www-form-urlencoded',
                                                    body: wrappedForm.toString(),
                                                },
                                            ];
                                            lastStatus = 0;
                                            lastText = '';
                                            lastAttempt = null;
                                            out = null;
                                            _i = 0, attempts_2 = attempts;
                                            _c.label = 1;
                                        case 1:
                                            if (!(_i < attempts_2.length)) return [3 /*break*/, 5];
                                            attempt = attempts_2[_i];
                                            return [4 /*yield*/, fetch(topicUrl, {
                                                    method: 'PUT',
                                                    headers: {
                                                        Authorization: "Bearer ".concat(token),
                                                        'Content-Type': attempt.contentType,
                                                    },
                                                    body: attempt.body,
                                                })];
                                        case 2:
                                            response = _c.sent();
                                            return [4 /*yield*/, response.text()];
                                        case 3:
                                            text = _c.sent();
                                            if (response.ok) {
                                                if (text) {
                                                    try {
                                                        out = JSON.parse(text);
                                                    }
                                                    catch (_d) {
                                                        out = {};
                                                    }
                                                }
                                                else {
                                                    out = {};
                                                }
                                                lastStatus = 0;
                                                lastText = '';
                                                return [3 /*break*/, 5];
                                            }
                                            lastStatus = response.status;
                                            lastText = text || response.statusText;
                                            lastAttempt = attempt;
                                            if (![400, 415, 422].includes(response.status))
                                                return [3 /*break*/, 5];
                                            _c.label = 4;
                                        case 4:
                                            _i++;
                                            return [3 /*break*/, 1];
                                        case 5:
                                            if (lastStatus) {
                                                throw new Error("Failed to update discussion ".concat(discussionId, ": ").concat(lastStatus, " - ").concat(lastText, ". Endpoint: ").concat(topicUrl, ". ") +
                                                    "Format: ".concat((lastAttempt === null || lastAttempt === void 0 ? void 0 : lastAttempt.name) || 'unknown', ". Payload: ").concat(((lastAttempt === null || lastAttempt === void 0 ? void 0 : lastAttempt.body) || '').slice(0, 1000)));
                                            }
                                            if (Object.prototype.hasOwnProperty.call(payload, 'message') &&
                                                out &&
                                                Object.prototype.hasOwnProperty.call(out, 'message')) {
                                                expected = String((_a = payload.message) !== null && _a !== void 0 ? _a : '');
                                                actual = String((_b = out.message) !== null && _b !== void 0 ? _b : '');
                                                if (expected.trim() && !actual.trim()) {
                                                    throw new Error("Discussion update returned success but message did not persist. Endpoint: ".concat(topicUrl, ". ") +
                                                        "Payload: ".concat(JSON.stringify(payload).slice(0, 500)));
                                                }
                                            }
                                            return [2 /*return*/, out];
                                    }
                                });
                            }); };
                            sendDiscussionDateDetailsUpdate = function (payload) { return __awaiter(_this, void 0, void 0, function () {
                                var dateDetailsUrl, response, text;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            if (!payload || Object.keys(payload).length === 0)
                                                return [2 /*return*/];
                                            dateDetailsUrl = "".concat(baseUrl, "/courses/").concat(courseId, "/discussion_topics/").concat(discussionId, "/date_details");
                                            console.log("[Discussion Update] date_details_endpoint course=".concat(courseId, " id=").concat(discussionId, " keys=").concat(Object.keys(payload).join(','), " payload=").concat(JSON.stringify(payload).slice(0, 1200)));
                                            return [4 /*yield*/, fetch(dateDetailsUrl, {
                                                    method: 'PUT',
                                                    headers: {
                                                        Authorization: "Bearer ".concat(token),
                                                        'Content-Type': 'application/json',
                                                    },
                                                    body: JSON.stringify(payload),
                                                })];
                                        case 1:
                                            response = _a.sent();
                                            return [4 /*yield*/, response.text()];
                                        case 2:
                                            text = _a.sent();
                                            if (!response.ok) {
                                                throw new Error("Failed to update discussion date_details ".concat(discussionId, ": ").concat(response.status, " - ").concat(text || response.statusText, ". ") +
                                                    "Endpoint: ".concat(dateDetailsUrl, ". Payload: ").concat(JSON.stringify(payload).slice(0, 1000)));
                                            }
                                            return [2 /*return*/];
                                    }
                                });
                            }); };
                            topicResult = null;
                            if (!(gradedSelection !== undefined)) return [3 /*break*/, 10];
                            if (!(gradedSelection && !assignmentId)) return [3 /*break*/, 8];
                            pointsSeedRaw = pending.points_possible;
                            pointsSeedNum = Number(pointsSeedRaw);
                            assignmentPayload = {};
                            if (pointsSeedRaw !== undefined &&
                                pointsSeedRaw !== null &&
                                pointsSeedRaw !== '' &&
                                Number.isFinite(pointsSeedNum)) {
                                assignmentPayload.points_possible = pointsSeedNum;
                            }
                            return [4 /*yield*/, sendDiscussionUpdate({
                                    assignment: assignmentPayload,
                                })];
                        case 6:
                            topicResult = _e.sent();
                            return [4 /*yield*/, this.getDiscussion(courseId, discussionId)];
                        case 7:
                            refreshed = _e.sent();
                            assignmentId = (_d = refreshed === null || refreshed === void 0 ? void 0 : refreshed.assignment_id) !== null && _d !== void 0 ? _d : null;
                            _e.label = 8;
                        case 8:
                            if (!(!gradedSelection && assignmentId)) return [3 /*break*/, 10];
                            return [4 /*yield*/, sendDiscussionUpdate({
                                    assignment: { set_assignment: false },
                                })];
                        case 9:
                            topicResult = _e.sent();
                            assignmentId = null;
                            _e.label = 10;
                        case 10:
                            cleanedUpdates = cleanContentUpdates(pending, {
                                clearableTextFields: true,
                            });
                            unsupportedAnnouncementInputs = [
                                'due_at',
                                'unlock_at',
                                'points_possible',
                                'assignment_group_id',
                            ].filter(function (k) { return Object.prototype.hasOwnProperty.call(cleanedUpdates, k); });
                            if (isAnnouncement && unsupportedAnnouncementInputs.length) {
                                throw new Error("Unsupported announcement field(s): ".concat(unsupportedAnnouncementInputs.join(', '), ". ") +
                                    "Announcements support delayed_post_at and lock_at for date updates.");
                            }
                            if (isAnnouncement && gradedSelection !== undefined) {
                                throw new Error('Unsupported announcement field: graded');
                            }
                            if (isAnnouncement && rubricSelection !== undefined) {
                                throw new Error('Unsupported announcement field: rubric_id');
                            }
                            allowedKeys = isAnnouncement
                                ? ANNOUNCEMENT_UPDATE_ALLOWED_KEYS
                                : DISCUSSION_UPDATE_ALLOWED_KEYS;
                            rejectedKeys = Object.keys(cleanedUpdates).filter(function (k) { return !allowedKeys.has(k); });
                            if (rejectedKeys.length) {
                                console.warn("[Discussion Update] dropped_unsupported_keys course=".concat(courseId, " id=").concat(discussionId, " announcement=").concat(isAnnouncement, " keys=").concat(rejectedKeys.join(',')));
                            }
                            filteredUpdates = {};
                            Object.keys(cleanedUpdates).forEach(function (k) {
                                if (allowedKeys.has(k))
                                    filteredUpdates[k] = cleanedUpdates[k];
                            });
                            if (Object.prototype.hasOwnProperty.call(cleanedUpdates, 'podcast_enabled') &&
                                cleanedUpdates.podcast_enabled === true &&
                                !Object.prototype.hasOwnProperty.call(cleanedUpdates, 'podcast_has_student_posts')) {
                                cleanedUpdates.podcast_has_student_posts = false;
                            }
                            podcastRequested = Object.prototype.hasOwnProperty.call(cleanedUpdates, 'podcast_enabled') ||
                                Object.prototype.hasOwnProperty.call(cleanedUpdates, 'podcast_has_student_posts');
                            expectedPodcastEnabled = Object.prototype.hasOwnProperty.call(cleanedUpdates, 'podcast_enabled')
                                ? Boolean(cleanedUpdates.podcast_enabled)
                                : undefined;
                            expectedPodcastStudentPosts = Object.prototype.hasOwnProperty.call(cleanedUpdates, 'podcast_has_student_posts')
                                ? Boolean(cleanedUpdates.podcast_has_student_posts)
                                : undefined;
                            discussionUpdates = __assign({}, filteredUpdates);
                            assignmentUpdates = {};
                            ['due_at', 'unlock_at', 'points_possible', 'assignment_group_id'].forEach(function (k) {
                                if (Object.prototype.hasOwnProperty.call(discussionUpdates, k)) {
                                    assignmentUpdates[k] = discussionUpdates[k];
                                    delete discussionUpdates[k];
                                }
                            });
                            dateDetailsUpdates = {};
                            dateDetailKeys = getDiscussionDateRoutingPolicy(isAnnouncement).dateDetailKeys;
                            dateDetailKeys.forEach(function (k) {
                                if (Object.prototype.hasOwnProperty.call(discussionUpdates, k)) {
                                    dateDetailsUpdates[k] = discussionUpdates[k];
                                    delete discussionUpdates[k];
                                }
                                if (Object.prototype.hasOwnProperty.call(assignmentUpdates, k)) {
                                    dateDetailsUpdates[k] = assignmentUpdates[k];
                                    delete assignmentUpdates[k];
                                }
                            });
                            mergedDates = isAnnouncement
                                ? {
                                    delayed_post_at: discussionUpdates.delayed_post_at,
                                    lock_at: discussionUpdates.lock_at,
                                }
                                : __assign({}, dateDetailsUpdates);
                            if (Object.keys(mergedDates).length > 0) {
                                validateDateOrder(mergedDates, "Discussion ".concat(discussionId));
                            }
                            if (Object.prototype.hasOwnProperty.call(dateDetailsUpdates, 'due_at') &&
                                !assignmentId) {
                                throw new Error('Cannot set due_at on an ungraded discussion. Enable Graded first.');
                            }
                            if (!(Object.keys(dateDetailsUpdates).length > 0)) return [3 /*break*/, 12];
                            return [4 /*yield*/, sendDiscussionDateDetailsUpdate(dateDetailsUpdates)];
                        case 11:
                            _e.sent();
                            _e.label = 12;
                        case 12:
                            if (!(Object.keys(discussionUpdates).length > 0)) return [3 /*break*/, 14];
                            return [4 /*yield*/, sendDiscussionUpdate(discussionUpdates)];
                        case 13:
                            topicResult = _e.sent();
                            _e.label = 14;
                        case 14:
                            if (!(Object.keys(assignmentUpdates).length > 0)) return [3 /*break*/, 16];
                            if (!assignmentId) {
                                throw new Error('Cannot set grading fields on an ungraded discussion. Enable Graded first.');
                            }
                            return [4 /*yield*/, this.updateAssignment(courseId, assignmentId, assignmentUpdates)];
                        case 15:
                            _e.sent();
                            _e.label = 16;
                        case 16:
                            if (!(rubricSelection !== undefined)) return [3 /*break*/, 18];
                            if (!assignmentId) {
                                throw new Error('Cannot set rubric: discussion does not have an assignment_id');
                            }
                            return [4 /*yield*/, this.upsertAssignmentRubricAssociation(courseId, assignmentId, rubricSelection, token, baseUrl)];
                        case 17:
                            _e.sent();
                            _e.label = 18;
                        case 18: return [4 /*yield*/, this.getDiscussion(courseId, discussionId)];
                        case 19:
                            finalTopic = _e.sent();
                            if (podcastRequested) {
                                podcastUrl = typeof (finalTopic === null || finalTopic === void 0 ? void 0 : finalTopic.podcast_url) === 'string'
                                    ? finalTopic.podcast_url.trim()
                                    : '';
                                actualPodcastEnabledByUrl = podcastUrl.length > 0;
                                hasPodcastEnabled = Object.prototype.hasOwnProperty.call(finalTopic || {}, 'podcast_enabled');
                                hasPodcastStudentPosts = Object.prototype.hasOwnProperty.call(finalTopic || {}, 'podcast_has_student_posts');
                                actualPodcastEnabled = hasPodcastEnabled
                                    ? Boolean(finalTopic === null || finalTopic === void 0 ? void 0 : finalTopic.podcast_enabled)
                                    : undefined;
                                actualPodcastStudentPosts = hasPodcastStudentPosts
                                    ? Boolean(finalTopic === null || finalTopic === void 0 ? void 0 : finalTopic.podcast_has_student_posts)
                                    : undefined;
                                if ((expectedPodcastEnabled !== undefined &&
                                    actualPodcastEnabledByUrl !== expectedPodcastEnabled) ||
                                    (expectedPodcastStudentPosts !== undefined &&
                                        hasPodcastStudentPosts &&
                                        actualPodcastStudentPosts !== expectedPodcastStudentPosts)) {
                                    throw new Error("Podcast setting did not persist on discussion ".concat(discussionId, ". Requested podcast_enabled=").concat(expectedPodcastEnabled, ", ") +
                                        "podcast_has_student_posts=".concat(expectedPodcastStudentPosts, "; Canvas returned podcast_url=").concat(podcastUrl || 'null', ", ") +
                                        "podcast_enabled=".concat(actualPodcastEnabled, ", podcast_has_student_posts=").concat(actualPodcastStudentPosts, "."));
                                }
                            }
                            return [2 /*return*/, topicResult || finalTopic];
                    }
                });
            });
        };
        CanvasService_1.prototype.updatePage = function (courseId, pageUrl, updates) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, token, baseUrl, cleanedUpdates, requestBody, response, errorText;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.getAuthHeaders()];
                        case 1:
                            _a = _b.sent(), token = _a.token, baseUrl = _a.baseUrl;
                            cleanedUpdates = cleanContentUpdates(updates, {
                                clearableTextFields: true,
                            });
                            validateDateOrder(cleanedUpdates, "Page ".concat(pageUrl));
                            requestBody = cleanedUpdates.wiki_page
                                ? cleanedUpdates
                                : { wiki_page: cleanedUpdates };
                            console.log("Updating page ".concat(pageUrl, " with:"), requestBody);
                            return [4 /*yield*/, fetch("".concat(baseUrl, "/courses/").concat(courseId, "/pages/").concat(encodeURIComponent(pageUrl)), {
                                    method: 'PUT',
                                    headers: {
                                        Authorization: "Bearer ".concat(token),
                                        'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify(requestBody),
                                })];
                        case 2:
                            response = _b.sent();
                            if (!!response.ok) return [3 /*break*/, 4];
                            return [4 /*yield*/, response.text()];
                        case 3:
                            errorText = _b.sent();
                            console.error("Page update failed: ".concat(response.status, " ").concat(response.statusText), errorText);
                            throw new Error("Failed to update page: ".concat(response.status, " ").concat(response.statusText, " - ").concat(errorText));
                        case 4: return [4 /*yield*/, response.json()];
                        case 5: return [2 /*return*/, _b.sent()];
                    }
                });
            });
        };
        CanvasService_1.prototype.updateAnnouncement = function (courseId, announcementId, updates) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.updateDiscussion(courseId, announcementId, updates)];
                });
            });
        };
        CanvasService_1.prototype.updateModule = function (courseId, moduleId, updates) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, token, baseUrl, cleanedUpdates, requestBody, response, errorText;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.getAuthHeaders()];
                        case 1:
                            _a = _b.sent(), token = _a.token, baseUrl = _a.baseUrl;
                            cleanedUpdates = cleanContentUpdates(updates, {
                                clearableTextFields: false,
                            });
                            console.log("Updating module ".concat(moduleId, " with:"), cleanedUpdates);
                            requestBody = { module: cleanedUpdates };
                            return [4 /*yield*/, fetch("".concat(baseUrl, "/courses/").concat(courseId, "/modules/").concat(moduleId), {
                                    method: 'PUT',
                                    headers: {
                                        Authorization: "Bearer ".concat(token),
                                        'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify(requestBody),
                                })];
                        case 2:
                            response = _b.sent();
                            if (!!response.ok) return [3 /*break*/, 4];
                            return [4 /*yield*/, response.text()];
                        case 3:
                            errorText = _b.sent();
                            console.error("Module update failed: ".concat(response.status, " ").concat(response.statusText), errorText);
                            throw new Error("Failed to update module: ".concat(response.status, " ").concat(response.statusText, " - ").concat(errorText));
                        case 4: return [4 /*yield*/, response.json()];
                        case 5: return [2 /*return*/, _b.sent()];
                    }
                });
            });
        };
        CanvasService_1.prototype.bulkUpdateAssignments = function (courseId, itemIds, updates) {
            return __awaiter(this, void 0, void 0, function () {
                var results, _i, itemIds_1, assignmentId, data, error_13;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            results = [];
                            _i = 0, itemIds_1 = itemIds;
                            _a.label = 1;
                        case 1:
                            if (!(_i < itemIds_1.length)) return [3 /*break*/, 6];
                            assignmentId = itemIds_1[_i];
                            _a.label = 2;
                        case 2:
                            _a.trys.push([2, 4, , 5]);
                            return [4 /*yield*/, this.updateAssignment(courseId, assignmentId, __assign({}, updates))];
                        case 3:
                            data = _a.sent();
                            results.push({ id: assignmentId, success: true, data: data });
                            return [3 /*break*/, 5];
                        case 4:
                            error_13 = _a.sent();
                            results.push({
                                id: assignmentId,
                                success: false,
                                error: error_13.message,
                            });
                            return [3 /*break*/, 5];
                        case 5:
                            _i++;
                            return [3 /*break*/, 1];
                        case 6: return [2 /*return*/, results];
                    }
                });
            });
        };
        CanvasService_1.prototype.bulkUpdateQuizzes = function (courseId, itemIds, updates) {
            return __awaiter(this, void 0, void 0, function () {
                var results, _i, itemIds_2, quizId, data, error_14;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            results = [];
                            _i = 0, itemIds_2 = itemIds;
                            _a.label = 1;
                        case 1:
                            if (!(_i < itemIds_2.length)) return [3 /*break*/, 6];
                            quizId = itemIds_2[_i];
                            _a.label = 2;
                        case 2:
                            _a.trys.push([2, 4, , 5]);
                            return [4 /*yield*/, this.updateQuiz(courseId, quizId, __assign({}, updates))];
                        case 3:
                            data = _a.sent();
                            results.push({ id: quizId, success: true, data: data });
                            return [3 /*break*/, 5];
                        case 4:
                            error_14 = _a.sent();
                            results.push({ id: quizId, success: false, error: error_14.message });
                            return [3 /*break*/, 5];
                        case 5:
                            _i++;
                            return [3 /*break*/, 1];
                        case 6: return [2 /*return*/, results];
                    }
                });
            });
        };
        CanvasService_1.prototype.bulkUpdateDiscussions = function (courseId, itemIds, updates) {
            return __awaiter(this, void 0, void 0, function () {
                var results, _i, itemIds_3, discussionId, data, error_15;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            results = [];
                            _i = 0, itemIds_3 = itemIds;
                            _a.label = 1;
                        case 1:
                            if (!(_i < itemIds_3.length)) return [3 /*break*/, 6];
                            discussionId = itemIds_3[_i];
                            _a.label = 2;
                        case 2:
                            _a.trys.push([2, 4, , 5]);
                            console.log("[Bulk Discussion Update] course=".concat(courseId, " id=").concat(discussionId, " keys=").concat(Object.keys(updates || {}).join(','), " payload=").concat(JSON.stringify(updates || {}).slice(0, 1200)));
                            return [4 /*yield*/, this.updateDiscussion(courseId, discussionId, __assign({}, updates))];
                        case 3:
                            data = _a.sent();
                            results.push({ id: discussionId, success: true, data: data });
                            return [3 /*break*/, 5];
                        case 4:
                            error_15 = _a.sent();
                            console.error("[Bulk Discussion Update] failed course=".concat(courseId, " id=").concat(discussionId, " keys=").concat(Object.keys(updates || {}).join(','), " error=").concat((error_15 === null || error_15 === void 0 ? void 0 : error_15.message) || String(error_15)));
                            results.push({
                                id: discussionId,
                                success: false,
                                error: error_15.message,
                            });
                            return [3 /*break*/, 5];
                        case 5:
                            _i++;
                            return [3 /*break*/, 1];
                        case 6: return [2 /*return*/, results];
                    }
                });
            });
        };
        CanvasService_1.prototype.bulkUpdatePages = function (courseId, itemIds, updates) {
            return __awaiter(this, void 0, void 0, function () {
                var results, _i, itemIds_4, pageUrl, updated, error_16;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            results = [];
                            _i = 0, itemIds_4 = itemIds;
                            _a.label = 1;
                        case 1:
                            if (!(_i < itemIds_4.length)) return [3 /*break*/, 6];
                            pageUrl = itemIds_4[_i];
                            _a.label = 2;
                        case 2:
                            _a.trys.push([2, 4, , 5]);
                            return [4 /*yield*/, this.updatePage(courseId, pageUrl, updates)];
                        case 3:
                            updated = _a.sent();
                            results.push({ id: pageUrl, success: true, data: updated });
                            return [3 /*break*/, 5];
                        case 4:
                            error_16 = _a.sent();
                            results.push({ id: pageUrl, success: false, error: error_16.message });
                            return [3 /*break*/, 5];
                        case 5:
                            _i++;
                            return [3 /*break*/, 1];
                        case 6: return [2 /*return*/, results];
                    }
                });
            });
        };
        CanvasService_1.prototype.bulkUpdateAnnouncements = function (courseId, itemIds, updates) {
            return __awaiter(this, void 0, void 0, function () {
                var results, _i, itemIds_5, announcementId, updated, error_17;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            results = [];
                            _i = 0, itemIds_5 = itemIds;
                            _a.label = 1;
                        case 1:
                            if (!(_i < itemIds_5.length)) return [3 /*break*/, 6];
                            announcementId = itemIds_5[_i];
                            _a.label = 2;
                        case 2:
                            _a.trys.push([2, 4, , 5]);
                            console.log("[Bulk Announcement Update] course=".concat(courseId, " id=").concat(announcementId, " keys=").concat(Object.keys(updates || {}).join(','), " payload=").concat(JSON.stringify(updates || {}).slice(0, 1200)));
                            return [4 /*yield*/, this.updateDiscussion(courseId, announcementId, updates)];
                        case 3:
                            updated = _a.sent();
                            results.push({ id: announcementId, success: true, data: updated });
                            return [3 /*break*/, 5];
                        case 4:
                            error_17 = _a.sent();
                            console.error("[Bulk Announcement Update] failed course=".concat(courseId, " id=").concat(announcementId, " keys=").concat(Object.keys(updates || {}).join(','), " error=").concat((error_17 === null || error_17 === void 0 ? void 0 : error_17.message) || String(error_17)));
                            results.push({
                                id: announcementId,
                                success: false,
                                error: error_17.message,
                            });
                            return [3 /*break*/, 5];
                        case 5:
                            _i++;
                            return [3 /*break*/, 1];
                        case 6: return [2 /*return*/, results];
                    }
                });
            });
        };
        CanvasService_1.prototype.bulkUpdateModules = function (courseId, itemIds, updates) {
            return __awaiter(this, void 0, void 0, function () {
                var results, _i, itemIds_6, moduleId, data, error_18;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            results = [];
                            _i = 0, itemIds_6 = itemIds;
                            _a.label = 1;
                        case 1:
                            if (!(_i < itemIds_6.length)) return [3 /*break*/, 6];
                            moduleId = itemIds_6[_i];
                            _a.label = 2;
                        case 2:
                            _a.trys.push([2, 4, , 5]);
                            return [4 /*yield*/, this.updateModule(courseId, moduleId, __assign({}, updates))];
                        case 3:
                            data = _a.sent();
                            results.push({ id: moduleId, success: true, data: data });
                            return [3 /*break*/, 5];
                        case 4:
                            error_18 = _a.sent();
                            results.push({ id: moduleId, success: false, error: error_18.message });
                            return [3 /*break*/, 5];
                        case 5:
                            _i++;
                            return [3 /*break*/, 1];
                        case 6: return [2 /*return*/, results];
                    }
                });
            });
        };
        CanvasService_1.prototype.getBulkUserTags = function (courseId) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, token, baseUrl, bulkTagsUrl, response, errorText;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.getAuthHeaders()];
                        case 1:
                            _a = _b.sent(), token = _a.token, baseUrl = _a.baseUrl;
                            bulkTagsUrl = "".concat(baseUrl, "/courses/").concat(courseId, "/bulk_user_tags");
                            return [4 /*yield*/, fetch(bulkTagsUrl, {
                                    headers: { Authorization: "Bearer ".concat(token) },
                                })];
                        case 2:
                            response = _b.sent();
                            if (!!response.ok) return [3 /*break*/, 4];
                            return [4 /*yield*/, response.text()];
                        case 3:
                            errorText = _b.sent();
                            throw new Error("Canvas API Error: ".concat(response.status, " ").concat(response.statusText, " - ").concat(errorText));
                        case 4: return [4 /*yield*/, response.json()];
                        case 5: return [2 /*return*/, _b.sent()];
                    }
                });
            });
        };
        CanvasService_1.prototype.ensureAccommodationColumns = function (courseId) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, token, baseUrl, columnTitle, columnsUrl, existingColumns, existingColumn, updateUrl, updateResponse, errorText, updatedColumn, createUrl, response, errorText, newColumn, error_19;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            console.log("[COLUMN_CREATE] ===== Starting ensureAccommodationColumns for course ".concat(courseId, " ====="));
                            return [4 /*yield*/, this.getAuthHeaders()];
                        case 1:
                            _a = _b.sent(), token = _a.token, baseUrl = _a.baseUrl;
                            columnTitle = 'Accommodations';
                            _b.label = 2;
                        case 2:
                            _b.trys.push([2, 14, , 15]);
                            console.log("[COLUMN_CREATE] Fetching existing columns from: ".concat(baseUrl, "/courses/").concat(courseId, "/custom_gradebook_columns"));
                            columnsUrl = "".concat(baseUrl, "/courses/").concat(courseId, "/custom_gradebook_columns?per_page=100&include_hidden=true");
                            return [4 /*yield*/, this.fetchPaginatedData(columnsUrl, token)];
                        case 3:
                            existingColumns = _b.sent();
                            console.log("[COLUMN_CREATE] Found ".concat(existingColumns.length, " existing columns"));
                            existingColumn = existingColumns.find(function (col) { return col.title === columnTitle; });
                            if (!existingColumn) return [3 /*break*/, 9];
                            console.log("[COLUMN_CREATE] Column \"".concat(columnTitle, "\" already exists (ID: ").concat(existingColumn.id, ")"));
                            console.log("[COLUMN_CREATE] Current state - hidden: ".concat(existingColumn.hidden, ", position: ").concat(existingColumn.position));
                            if (!existingColumn.hidden) return [3 /*break*/, 8];
                            console.log("[COLUMN_CREATE] Updating existing column \"".concat(columnTitle, "\" to hidden=false"));
                            updateUrl = "".concat(baseUrl, "/courses/").concat(courseId, "/custom_gradebook_columns/").concat(existingColumn.id);
                            console.log("[COLUMN_CREATE] Update URL: ".concat(updateUrl));
                            return [4 /*yield*/, fetch(updateUrl, {
                                    method: 'PUT',
                                    headers: {
                                        Authorization: "Bearer ".concat(token),
                                        'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify({
                                        column: {
                                            title: columnTitle,
                                            position: 1,
                                            hidden: false,
                                        },
                                    }),
                                })];
                        case 4:
                            updateResponse = _b.sent();
                            if (!!updateResponse.ok) return [3 /*break*/, 6];
                            return [4 /*yield*/, updateResponse.text()];
                        case 5:
                            errorText = _b.sent();
                            console.error("[COLUMN_CREATE] Failed to update column \"".concat(columnTitle, "\": ").concat(updateResponse.status, " ").concat(updateResponse.statusText, " - ").concat(errorText));
                            throw new Error("Failed to update column \"".concat(columnTitle, "\": ").concat(updateResponse.status, " ").concat(updateResponse.statusText, " - ").concat(errorText));
                        case 6: return [4 /*yield*/, updateResponse.json()];
                        case 7:
                            updatedColumn = _b.sent();
                            console.log("[COLUMN_CREATE] Successfully updated column \"".concat(columnTitle, "\" (ID: ").concat(updatedColumn.id, ", hidden: ").concat(updatedColumn.hidden, ")"));
                            console.log("[COLUMN_CREATE] ===== Completed ensureAccommodationColumns for course ".concat(courseId, " ====="));
                            return [2 /*return*/, { column: updatedColumn }];
                        case 8:
                            console.log("[COLUMN_CREATE] Column \"".concat(columnTitle, "\" already has hidden=false, no update needed"));
                            console.log("[COLUMN_CREATE] ===== Completed ensureAccommodationColumns for course ".concat(courseId, " ====="));
                            return [2 /*return*/, { column: existingColumn }];
                        case 9:
                            console.log("[COLUMN_CREATE] Column \"".concat(columnTitle, "\" does not exist, creating new column"));
                            createUrl = "".concat(baseUrl, "/courses/").concat(courseId, "/custom_gradebook_columns");
                            console.log("[COLUMN_CREATE] Create URL: ".concat(createUrl));
                            console.log("[COLUMN_CREATE] Request body:", JSON.stringify({
                                column: {
                                    title: columnTitle,
                                    position: 1,
                                    hidden: false,
                                },
                            }, null, 2));
                            return [4 /*yield*/, fetch(createUrl, {
                                    method: 'POST',
                                    headers: {
                                        Authorization: "Bearer ".concat(token),
                                        'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify({
                                        column: {
                                            title: columnTitle,
                                            position: 1,
                                            hidden: false,
                                        },
                                    }),
                                })];
                        case 10:
                            response = _b.sent();
                            console.log("[COLUMN_CREATE] Create response status: ".concat(response.status, " ").concat(response.statusText));
                            if (!!response.ok) return [3 /*break*/, 12];
                            return [4 /*yield*/, response.text()];
                        case 11:
                            errorText = _b.sent();
                            console.error("[COLUMN_CREATE] Failed to create column \"".concat(columnTitle, "\": ").concat(response.status, " ").concat(response.statusText, " - ").concat(errorText));
                            throw new Error("Failed to create column \"".concat(columnTitle, "\": ").concat(response.status, " ").concat(response.statusText, " - ").concat(errorText));
                        case 12: return [4 /*yield*/, response.json()];
                        case 13:
                            newColumn = _b.sent();
                            console.log("[COLUMN_CREATE] Successfully created column \"".concat(columnTitle, "\" (ID: ").concat(newColumn.id, ", hidden: ").concat(newColumn.hidden, ", position: ").concat(newColumn.position, ")"));
                            console.log("[COLUMN_CREATE] ===== Completed ensureAccommodationColumns for course ".concat(courseId, " ====="));
                            return [2 /*return*/, { column: newColumn }];
                        case 14:
                            error_19 = _b.sent();
                            console.error("[COLUMN_CREATE] Error ensuring accommodation columns:", error_19);
                            throw new Error("Failed to ensure accommodation columns: ".concat(error_19.message));
                        case 15: return [2 /*return*/];
                    }
                });
            });
        };
        CanvasService_1.prototype.saveAccommodationValue = function (courseId, columnId, userId, content) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, token, baseUrl, url, response, errorText;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.getAuthHeaders()];
                        case 1:
                            _a = _b.sent(), token = _a.token, baseUrl = _a.baseUrl;
                            url = "".concat(baseUrl, "/courses/").concat(courseId, "/custom_gradebook_columns/").concat(columnId, "/data/").concat(userId);
                            return [4 /*yield*/, fetch(url, {
                                    method: 'PUT',
                                    headers: {
                                        Authorization: "Bearer ".concat(token),
                                        'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify({
                                        column_data: {
                                            content: content,
                                        },
                                    }),
                                })];
                        case 2:
                            response = _b.sent();
                            if (!!response.ok) return [3 /*break*/, 4];
                            return [4 /*yield*/, response.text()];
                        case 3:
                            errorText = _b.sent();
                            throw new Error("Failed to save accommodation value: ".concat(response.status, " ").concat(response.statusText, " - ").concat(errorText));
                        case 4: return [4 /*yield*/, response.json()];
                        case 5: return [2 /*return*/, _b.sent()];
                    }
                });
            });
        };
        CanvasService_1.prototype.getAccommodationData = function (courseId) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, token, baseUrl, column, _b, studentToken, studentBaseUrl, allStudents, url, response, chunk, linkHeader, studentMap_1, accommodationData_1, dataUrl, currentUrl, response, chunk, linkHeader, error_20;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0: return [4 /*yield*/, this.getAuthHeaders()];
                        case 1:
                            _a = _c.sent(), token = _a.token, baseUrl = _a.baseUrl;
                            _c.label = 2;
                        case 2:
                            _c.trys.push([2, 13, , 14]);
                            return [4 /*yield*/, this.ensureAccommodationColumns(courseId)];
                        case 3:
                            column = (_c.sent()).column;
                            return [4 /*yield*/, this.getAuthHeaders()];
                        case 4:
                            _b = _c.sent(), studentToken = _b.token, studentBaseUrl = _b.baseUrl;
                            allStudents = [];
                            url = "".concat(studentBaseUrl, "/courses/").concat(courseId, "/enrollments?per_page=100&type[]=StudentEnrollment&include[]=user");
                            _c.label = 5;
                        case 5:
                            if (!url) return [3 /*break*/, 8];
                            return [4 /*yield*/, fetch(url, {
                                    headers: { Authorization: "Bearer ".concat(studentToken) },
                                })];
                        case 6:
                            response = _c.sent();
                            if (!response.ok) {
                                throw new Error("Failed to fetch students: ".concat(response.status, " ").concat(response.statusText));
                            }
                            return [4 /*yield*/, response.json()];
                        case 7:
                            chunk = _c.sent();
                            if (Array.isArray(chunk)) {
                                allStudents.push.apply(allStudents, chunk);
                            }
                            linkHeader = response.headers.get('link');
                            url = this.getNextUrl(linkHeader);
                            return [3 /*break*/, 5];
                        case 8:
                            studentMap_1 = new Map();
                            allStudents.forEach(function (enrollment) {
                                var _a, _b, _c;
                                var userId = ((_a = enrollment.user) === null || _a === void 0 ? void 0 : _a.id) || enrollment.user_id;
                                if (userId) {
                                    var userName = ((_b = enrollment.user) === null || _b === void 0 ? void 0 : _b.name) || ((_c = enrollment.user) === null || _c === void 0 ? void 0 : _c.display_name) || 'Unknown';
                                    studentMap_1.set(userId, userName);
                                }
                            });
                            accommodationData_1 = {};
                            dataUrl = "".concat(baseUrl, "/courses/").concat(courseId, "/custom_gradebook_columns/").concat(column.id, "/data");
                            currentUrl = "".concat(dataUrl, "?per_page=100");
                            _c.label = 9;
                        case 9:
                            if (!currentUrl) return [3 /*break*/, 12];
                            return [4 /*yield*/, fetch(currentUrl, {
                                    headers: { Authorization: "Bearer ".concat(token) },
                                })];
                        case 10:
                            response = _c.sent();
                            if (!response.ok) {
                                if (response.status === 404) {
                                    return [3 /*break*/, 12];
                                }
                                throw new Error("Failed to fetch column data: ".concat(response.status, " ").concat(response.statusText));
                            }
                            return [4 /*yield*/, response.json()];
                        case 11:
                            chunk = _c.sent();
                            if (Array.isArray(chunk)) {
                                chunk.forEach(function (item) {
                                    if (item.user_id && item.content && item.content.trim()) {
                                        var userId = String(item.user_id);
                                        accommodationData_1[userId] = item.content.trim();
                                        var userName = studentMap_1.get(item.user_id) || 'Unknown';
                                        console.log("[Request] ".concat(userName, ": \"").concat(item.content.trim(), "\""));
                                    }
                                });
                            }
                            linkHeader = response.headers.get('link');
                            currentUrl = this.getNextUrl(linkHeader);
                            return [3 /*break*/, 9];
                        case 12:
                            studentMap_1.forEach(function (userName, userId) {
                                if (!accommodationData_1[String(userId)]) {
                                    console.log("[Request] ".concat(userName, ": No accommodation"));
                                }
                            });
                            return [2 /*return*/, accommodationData_1];
                        case 13:
                            error_20 = _c.sent();
                            console.error("[getAccommodationData] Error:", error_20);
                            throw new Error("Failed to fetch accommodation data: ".concat(error_20.message));
                        case 14: return [2 /*return*/];
                    }
                });
            });
        };
        CanvasService_1.prototype.getCustomGradebookColumns = function (courseId) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, token, baseUrl, columnsUrl, columns;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.getAuthHeaders()];
                        case 1:
                            _a = _b.sent(), token = _a.token, baseUrl = _a.baseUrl;
                            console.log("[TEST] Fetching all custom gradebook columns for course ".concat(courseId));
                            columnsUrl = "".concat(baseUrl, "/courses/").concat(courseId, "/custom_gradebook_columns?per_page=100&include_hidden=true");
                            return [4 /*yield*/, this.fetchPaginatedData(columnsUrl, token)];
                        case 2:
                            columns = _b.sent();
                            console.log("[TEST] Found ".concat(columns.length, " custom gradebook columns"));
                            columns.forEach(function (col) {
                                console.log("[TEST] Column: \"".concat(col.title, "\" (ID: ").concat(col.id, ", hidden: ").concat(col.hidden, ", position: ").concat(col.position, ", teacher_notes: ").concat(col.teacher_notes, ")"));
                            });
                            return [2 /*return*/, columns];
                    }
                });
            });
        };
        // Delete methods
        CanvasService_1.prototype.deleteAssignment = function (courseId, assignmentId) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, token, baseUrl, response, errorText, _b;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0: return [4 /*yield*/, this.getAuthHeaders()];
                        case 1:
                            _a = _c.sent(), token = _a.token, baseUrl = _a.baseUrl;
                            return [4 /*yield*/, fetch("".concat(baseUrl, "/courses/").concat(courseId, "/assignments/").concat(assignmentId), {
                                    method: 'DELETE',
                                    headers: {
                                        Authorization: "Bearer ".concat(token),
                                    },
                                })];
                        case 2:
                            response = _c.sent();
                            if (!!response.ok) return [3 /*break*/, 4];
                            return [4 /*yield*/, response.text()];
                        case 3:
                            errorText = _c.sent();
                            throw new Error("Failed to delete assignment: ".concat(response.status, " ").concat(response.statusText, " - ").concat(errorText));
                        case 4:
                            // DELETE endpoints typically return 200 OK with the deleted object, or 204 No Content
                            if (response.status === 204) {
                                return [2 /*return*/, { success: true }];
                            }
                            _c.label = 5;
                        case 5:
                            _c.trys.push([5, 7, , 8]);
                            return [4 /*yield*/, response.json()];
                        case 6: return [2 /*return*/, _c.sent()];
                        case 7:
                            _b = _c.sent();
                            return [2 /*return*/, { success: true }];
                        case 8: return [2 /*return*/];
                    }
                });
            });
        };
        CanvasService_1.prototype.deleteQuiz = function (courseId, quizId) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, token, baseUrl, response, errorText, _b;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0: return [4 /*yield*/, this.getAuthHeaders()];
                        case 1:
                            _a = _c.sent(), token = _a.token, baseUrl = _a.baseUrl;
                            return [4 /*yield*/, fetch("".concat(baseUrl, "/courses/").concat(courseId, "/quizzes/").concat(quizId), {
                                    method: 'DELETE',
                                    headers: {
                                        Authorization: "Bearer ".concat(token),
                                    },
                                })];
                        case 2:
                            response = _c.sent();
                            if (!!response.ok) return [3 /*break*/, 4];
                            return [4 /*yield*/, response.text()];
                        case 3:
                            errorText = _c.sent();
                            throw new Error("Failed to delete quiz: ".concat(response.status, " ").concat(response.statusText, " - ").concat(errorText));
                        case 4:
                            if (response.status === 204) {
                                return [2 /*return*/, { success: true }];
                            }
                            _c.label = 5;
                        case 5:
                            _c.trys.push([5, 7, , 8]);
                            return [4 /*yield*/, response.json()];
                        case 6: return [2 /*return*/, _c.sent()];
                        case 7:
                            _b = _c.sent();
                            return [2 /*return*/, { success: true }];
                        case 8: return [2 /*return*/];
                    }
                });
            });
        };
        CanvasService_1.prototype.deleteDiscussion = function (courseId, discussionId) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, token, baseUrl, response, errorText, _b;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0: return [4 /*yield*/, this.getAuthHeaders()];
                        case 1:
                            _a = _c.sent(), token = _a.token, baseUrl = _a.baseUrl;
                            return [4 /*yield*/, fetch("".concat(baseUrl, "/courses/").concat(courseId, "/discussion_topics/").concat(discussionId), {
                                    method: 'DELETE',
                                    headers: {
                                        Authorization: "Bearer ".concat(token),
                                    },
                                })];
                        case 2:
                            response = _c.sent();
                            if (!!response.ok) return [3 /*break*/, 4];
                            return [4 /*yield*/, response.text()];
                        case 3:
                            errorText = _c.sent();
                            throw new Error("Failed to delete discussion: ".concat(response.status, " ").concat(response.statusText, " - ").concat(errorText));
                        case 4:
                            if (response.status === 204) {
                                return [2 /*return*/, { success: true }];
                            }
                            _c.label = 5;
                        case 5:
                            _c.trys.push([5, 7, , 8]);
                            return [4 /*yield*/, response.json()];
                        case 6: return [2 /*return*/, _c.sent()];
                        case 7:
                            _b = _c.sent();
                            return [2 /*return*/, { success: true }];
                        case 8: return [2 /*return*/];
                    }
                });
            });
        };
        CanvasService_1.prototype.deletePage = function (courseId, pageUrl) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, token, baseUrl, response, errorText, _b;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0: return [4 /*yield*/, this.getAuthHeaders()];
                        case 1:
                            _a = _c.sent(), token = _a.token, baseUrl = _a.baseUrl;
                            return [4 /*yield*/, fetch("".concat(baseUrl, "/courses/").concat(courseId, "/pages/").concat(encodeURIComponent(pageUrl)), {
                                    method: 'DELETE',
                                    headers: {
                                        Authorization: "Bearer ".concat(token),
                                    },
                                })];
                        case 2:
                            response = _c.sent();
                            if (!!response.ok) return [3 /*break*/, 4];
                            return [4 /*yield*/, response.text()];
                        case 3:
                            errorText = _c.sent();
                            throw new Error("Failed to delete page: ".concat(response.status, " ").concat(response.statusText, " - ").concat(errorText));
                        case 4:
                            if (response.status === 204) {
                                return [2 /*return*/, { success: true }];
                            }
                            _c.label = 5;
                        case 5:
                            _c.trys.push([5, 7, , 8]);
                            return [4 /*yield*/, response.json()];
                        case 6: return [2 /*return*/, _c.sent()];
                        case 7:
                            _b = _c.sent();
                            return [2 /*return*/, { success: true }];
                        case 8: return [2 /*return*/];
                    }
                });
            });
        };
        CanvasService_1.prototype.deleteAnnouncement = function (courseId, announcementId) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    // Announcements are discussions, so use the same endpoint
                    return [2 /*return*/, this.deleteDiscussion(courseId, announcementId)];
                });
            });
        };
        // Content Export
        CanvasService_1.prototype.createContentExport = function (courseId_1) {
            return __awaiter(this, arguments, void 0, function (courseId, exportType) {
                var _a, token, baseUrl, response, errorText;
                if (exportType === void 0) { exportType = 'common_cartridge'; }
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.getAuthHeaders()];
                        case 1:
                            _a = _b.sent(), token = _a.token, baseUrl = _a.baseUrl;
                            return [4 /*yield*/, fetch("".concat(baseUrl, "/courses/").concat(courseId, "/content_exports"), {
                                    method: 'POST',
                                    headers: {
                                        Authorization: "Bearer ".concat(token),
                                        'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify({
                                        export_type: exportType,
                                    }),
                                })];
                        case 2:
                            response = _b.sent();
                            if (!!response.ok) return [3 /*break*/, 4];
                            return [4 /*yield*/, response.text()];
                        case 3:
                            errorText = _b.sent();
                            throw new Error("Failed to create content export: ".concat(response.status, " ").concat(response.statusText, " - ").concat(errorText));
                        case 4: return [4 /*yield*/, response.json()];
                        case 5: return [2 /*return*/, _b.sent()];
                    }
                });
            });
        };
        // Create methods (for duplication)
        CanvasService_1.prototype.createAssignment = function (courseId, body) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, token, baseUrl, requestBody, response, errorText;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.getAuthHeaders()];
                        case 1:
                            _a = _b.sent(), token = _a.token, baseUrl = _a.baseUrl;
                            requestBody = body.assignment ? body : { assignment: body };
                            return [4 /*yield*/, fetch("".concat(baseUrl, "/courses/").concat(courseId, "/assignments"), {
                                    method: 'POST',
                                    headers: {
                                        Authorization: "Bearer ".concat(token),
                                        'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify(requestBody),
                                })];
                        case 2:
                            response = _b.sent();
                            if (!!response.ok) return [3 /*break*/, 4];
                            return [4 /*yield*/, response.text()];
                        case 3:
                            errorText = _b.sent();
                            throw new Error("Failed to create assignment: ".concat(response.status, " ").concat(response.statusText, " - ").concat(errorText));
                        case 4: return [4 /*yield*/, response.json()];
                        case 5: return [2 /*return*/, _b.sent()];
                    }
                });
            });
        };
        CanvasService_1.prototype.createQuiz = function (courseId, body) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, token, baseUrl, requestBody, response, errorText;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.getAuthHeaders()];
                        case 1:
                            _a = _b.sent(), token = _a.token, baseUrl = _a.baseUrl;
                            requestBody = body.quiz ? body : { quiz: body };
                            return [4 /*yield*/, fetch("".concat(baseUrl, "/courses/").concat(courseId, "/quizzes"), {
                                    method: 'POST',
                                    headers: {
                                        Authorization: "Bearer ".concat(token),
                                        'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify(requestBody),
                                })];
                        case 2:
                            response = _b.sent();
                            if (!!response.ok) return [3 /*break*/, 4];
                            return [4 /*yield*/, response.text()];
                        case 3:
                            errorText = _b.sent();
                            throw new Error("Failed to create quiz: ".concat(response.status, " ").concat(response.statusText, " - ").concat(errorText));
                        case 4: return [4 /*yield*/, response.json()];
                        case 5: return [2 /*return*/, _b.sent()];
                    }
                });
            });
        };
        CanvasService_1.prototype.createDiscussion = function (courseId, body) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, token, baseUrl, response, errorText;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.getAuthHeaders()];
                        case 1:
                            _a = _b.sent(), token = _a.token, baseUrl = _a.baseUrl;
                            return [4 /*yield*/, fetch("".concat(baseUrl, "/courses/").concat(courseId, "/discussion_topics"), {
                                    method: 'POST',
                                    headers: {
                                        Authorization: "Bearer ".concat(token),
                                        'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify(body),
                                })];
                        case 2:
                            response = _b.sent();
                            if (!!response.ok) return [3 /*break*/, 4];
                            return [4 /*yield*/, response.text()];
                        case 3:
                            errorText = _b.sent();
                            throw new Error("Failed to create discussion: ".concat(response.status, " ").concat(response.statusText, " - ").concat(errorText));
                        case 4: return [4 /*yield*/, response.json()];
                        case 5: return [2 /*return*/, _b.sent()];
                    }
                });
            });
        };
        CanvasService_1.prototype.createPage = function (courseId, body) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, token, baseUrl, requestBody, response, errorText;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.getAuthHeaders()];
                        case 1:
                            _a = _b.sent(), token = _a.token, baseUrl = _a.baseUrl;
                            requestBody = body.wiki_page ? body : { wiki_page: body };
                            return [4 /*yield*/, fetch("".concat(baseUrl, "/courses/").concat(courseId, "/pages"), {
                                    method: 'POST',
                                    headers: {
                                        Authorization: "Bearer ".concat(token),
                                        'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify(requestBody),
                                })];
                        case 2:
                            response = _b.sent();
                            if (!!response.ok) return [3 /*break*/, 4];
                            return [4 /*yield*/, response.text()];
                        case 3:
                            errorText = _b.sent();
                            throw new Error("Failed to create page: ".concat(response.status, " ").concat(response.statusText, " - ").concat(errorText));
                        case 4: return [4 /*yield*/, response.json()];
                        case 5: return [2 /*return*/, _b.sent()];
                    }
                });
            });
        };
        CanvasService_1.prototype.createAnnouncement = function (courseId, body) {
            return __awaiter(this, void 0, void 0, function () {
                var announcementBody;
                return __generator(this, function (_a) {
                    announcementBody = __assign(__assign({}, body), { is_announcement: true });
                    return [2 /*return*/, this.createDiscussion(courseId, announcementBody)];
                });
            });
        };
        CanvasService_1.prototype.createQuizExtensions = function (courseId, quizId, extensions) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, token, baseUrl, url, response, errorText;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.getAuthHeaders()];
                        case 1:
                            _a = _b.sent(), token = _a.token, baseUrl = _a.baseUrl;
                            url = "".concat(baseUrl, "/courses/").concat(courseId, "/quizzes/").concat(quizId, "/extensions");
                            return [4 /*yield*/, fetch(url, {
                                    method: 'POST',
                                    headers: {
                                        Authorization: "Bearer ".concat(token),
                                        'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify({ quiz_extensions: extensions }),
                                })];
                        case 2:
                            response = _b.sent();
                            if (!!response.ok) return [3 /*break*/, 4];
                            return [4 /*yield*/, response.text()];
                        case 3:
                            errorText = _b.sent();
                            throw new Error("Canvas API error: ".concat(response.status, " ").concat(response.statusText, " - ").concat(errorText));
                        case 4: return [4 /*yield*/, response.json()];
                        case 5: return [2 /*return*/, _b.sent()];
                    }
                });
            });
        };
        CanvasService_1.prototype.getAssignmentOverrides = function (courseId, assignmentId) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, token, baseUrl, url, response, errorText;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.getAuthHeaders()];
                        case 1:
                            _a = _b.sent(), token = _a.token, baseUrl = _a.baseUrl;
                            url = "".concat(baseUrl, "/courses/").concat(courseId, "/assignments/").concat(assignmentId, "/overrides");
                            return [4 /*yield*/, fetch(url, {
                                    method: 'GET',
                                    headers: {
                                        Authorization: "Bearer ".concat(token),
                                    },
                                })];
                        case 2:
                            response = _b.sent();
                            if (!!response.ok) return [3 /*break*/, 4];
                            return [4 /*yield*/, response.text()];
                        case 3:
                            errorText = _b.sent();
                            throw new Error("Canvas API error: ".concat(response.status, " ").concat(response.statusText, " - ").concat(errorText));
                        case 4: return [4 /*yield*/, response.json()];
                        case 5: return [2 /*return*/, _b.sent()];
                    }
                });
            });
        };
        CanvasService_1.prototype.deleteAssignmentOverride = function (courseId, assignmentId, overrideId) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, token, baseUrl, url, response, errorText;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.getAuthHeaders()];
                        case 1:
                            _a = _b.sent(), token = _a.token, baseUrl = _a.baseUrl;
                            url = "".concat(baseUrl, "/courses/").concat(courseId, "/assignments/").concat(assignmentId, "/overrides/").concat(overrideId);
                            return [4 /*yield*/, fetch(url, {
                                    method: 'DELETE',
                                    headers: {
                                        Authorization: "Bearer ".concat(token),
                                    },
                                })];
                        case 2:
                            response = _b.sent();
                            if (!!response.ok) return [3 /*break*/, 4];
                            return [4 /*yield*/, response.text()];
                        case 3:
                            errorText = _b.sent();
                            throw new Error("Canvas API error: ".concat(response.status, " ").concat(response.statusText, " - ").concat(errorText));
                        case 4: return [4 /*yield*/, response.json()];
                        case 5: return [2 /*return*/, _b.sent()];
                    }
                });
            });
        };
        CanvasService_1.prototype.createAssignmentOverride = function (courseId, assignmentId, override) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, token, baseUrl, url, response, errorText;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.getAuthHeaders()];
                        case 1:
                            _a = _b.sent(), token = _a.token, baseUrl = _a.baseUrl;
                            url = "".concat(baseUrl, "/courses/").concat(courseId, "/assignments/").concat(assignmentId, "/overrides");
                            return [4 /*yield*/, fetch(url, {
                                    method: 'POST',
                                    headers: {
                                        Authorization: "Bearer ".concat(token),
                                        'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify({ assignment_override: override }),
                                })];
                        case 2:
                            response = _b.sent();
                            if (!!response.ok) return [3 /*break*/, 4];
                            return [4 /*yield*/, response.text()];
                        case 3:
                            errorText = _b.sent();
                            throw new Error("Canvas API error: ".concat(response.status, " ").concat(response.statusText, " - ").concat(errorText));
                        case 4: return [4 /*yield*/, response.json()];
                        case 5: return [2 /*return*/, _b.sent()];
                    }
                });
            });
        };
        CanvasService_1.prototype.getModule = function (courseId, moduleId) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, token, baseUrl, lastError, attempt, response, errorText;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.getAuthHeaders()];
                        case 1:
                            _a = _b.sent(), token = _a.token, baseUrl = _a.baseUrl;
                            lastError = null;
                            attempt = 0;
                            _b.label = 2;
                        case 2:
                            if (!(attempt < 3)) return [3 /*break*/, 10];
                            if (!(attempt > 0)) return [3 /*break*/, 4];
                            // Wait 500ms before retry
                            return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 500); })];
                        case 3:
                            // Wait 500ms before retry
                            _b.sent();
                            _b.label = 4;
                        case 4: return [4 /*yield*/, fetch("".concat(baseUrl, "/courses/").concat(courseId, "/modules/").concat(moduleId, "?include[]=items"), {
                                headers: { Authorization: "Bearer ".concat(token) },
                            })];
                        case 5:
                            response = _b.sent();
                            if (!response.ok) return [3 /*break*/, 7];
                            return [4 /*yield*/, response.json()];
                        case 6: return [2 /*return*/, _b.sent()];
                        case 7:
                            if (!(response.status !== 404 || attempt === 2)) return [3 /*break*/, 9];
                            return [4 /*yield*/, response.text()];
                        case 8:
                            errorText = _b.sent();
                            lastError = new Error("Failed to get module: ".concat(response.status, " ").concat(response.statusText, " - ").concat(errorText));
                            if (response.status !== 404) {
                                throw lastError;
                            }
                            _b.label = 9;
                        case 9:
                            attempt++;
                            return [3 /*break*/, 2];
                        case 10: 
                        // If we get here, all retries failed with 404
                        throw (lastError ||
                            new Error("Failed to get module: Resource not found after retries"));
                    }
                });
            });
        };
        CanvasService_1.prototype.createModule = function (courseId, body) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, token, baseUrl, cleanedBody, requestBody, response, errorText;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.getAuthHeaders()];
                        case 1:
                            _a = _b.sent(), token = _a.token, baseUrl = _a.baseUrl;
                            cleanedBody = {};
                            Object.keys(body).forEach(function (key) {
                                var value = body[key];
                                if (value !== null && value !== undefined && value !== '') {
                                    cleanedBody[key] = value;
                                }
                            });
                            console.log("Creating module in course ".concat(courseId, " with:"), cleanedBody);
                            requestBody = body.module ? body : { module: cleanedBody };
                            return [4 /*yield*/, fetch("".concat(baseUrl, "/courses/").concat(courseId, "/modules"), {
                                    method: 'POST',
                                    headers: {
                                        Authorization: "Bearer ".concat(token),
                                        'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify(requestBody),
                                })];
                        case 2:
                            response = _b.sent();
                            if (!!response.ok) return [3 /*break*/, 4];
                            return [4 /*yield*/, response.text()];
                        case 3:
                            errorText = _b.sent();
                            console.error("Module creation failed: ".concat(response.status, " ").concat(response.statusText), errorText);
                            throw new Error("Failed to create module: ".concat(response.status, " ").concat(response.statusText, " - ").concat(errorText));
                        case 4: return [4 /*yield*/, response.json()];
                        case 5: return [2 /*return*/, _b.sent()];
                    }
                });
            });
        };
        CanvasService_1.prototype.deleteModule = function (courseId, moduleId) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, token, baseUrl, response, errorText, _b;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0: return [4 /*yield*/, this.getAuthHeaders()];
                        case 1:
                            _a = _c.sent(), token = _a.token, baseUrl = _a.baseUrl;
                            return [4 /*yield*/, fetch("".concat(baseUrl, "/courses/").concat(courseId, "/modules/").concat(moduleId), {
                                    method: 'DELETE',
                                    headers: {
                                        Authorization: "Bearer ".concat(token),
                                    },
                                })];
                        case 2:
                            response = _c.sent();
                            if (!!response.ok) return [3 /*break*/, 4];
                            return [4 /*yield*/, response.text()];
                        case 3:
                            errorText = _c.sent();
                            throw new Error("Failed to delete module: ".concat(response.status, " ").concat(response.statusText, " - ").concat(errorText));
                        case 4:
                            if (response.status === 204) {
                                return [2 /*return*/, { success: true }];
                            }
                            _c.label = 5;
                        case 5:
                            _c.trys.push([5, 7, , 8]);
                            return [4 /*yield*/, response.json()];
                        case 6: return [2 /*return*/, _c.sent()];
                        case 7:
                            _b = _c.sent();
                            return [2 /*return*/, { success: true }];
                        case 8: return [2 /*return*/];
                    }
                });
            });
        };
        CanvasService_1.prototype.createModuleItem = function (courseId, moduleId, body) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, token, baseUrl, requestBody, response, errorText;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.getAuthHeaders()];
                        case 1:
                            _a = _b.sent(), token = _a.token, baseUrl = _a.baseUrl;
                            requestBody = body.module_item ? body : { module_item: body };
                            return [4 /*yield*/, fetch("".concat(baseUrl, "/courses/").concat(courseId, "/modules/").concat(moduleId, "/items"), {
                                    method: 'POST',
                                    headers: {
                                        Authorization: "Bearer ".concat(token),
                                        'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify(requestBody),
                                })];
                        case 2:
                            response = _b.sent();
                            if (!!response.ok) return [3 /*break*/, 4];
                            return [4 /*yield*/, response.text()];
                        case 3:
                            errorText = _b.sent();
                            throw new Error("Failed to create module item: ".concat(response.status, " ").concat(response.statusText, " - ").concat(errorText));
                        case 4: return [4 /*yield*/, response.json()];
                        case 5: return [2 /*return*/, _b.sent()];
                    }
                });
            });
        };
        CanvasService_1.prototype.getModuleItems = function (courseId, moduleId) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, token, baseUrl, url, items, error_21;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.getAuthHeaders()];
                        case 1:
                            _a = _b.sent(), token = _a.token, baseUrl = _a.baseUrl;
                            url = "".concat(baseUrl, "/courses/").concat(courseId, "/modules/").concat(moduleId, "/items?per_page=100");
                            _b.label = 2;
                        case 2:
                            _b.trys.push([2, 4, , 5]);
                            return [4 /*yield*/, this.fetchPaginatedData(url, token)];
                        case 3:
                            items = _b.sent();
                            console.log("[Service] Retrieved ".concat(items.length, " items for module ").concat(moduleId, " in course ").concat(courseId));
                            return [2 /*return*/, items];
                        case 4:
                            error_21 = _b.sent();
                            console.error("[Service] Error in getModuleItems for module ".concat(moduleId, " in course ").concat(courseId, ":"), error_21);
                            throw error_21;
                        case 5: return [2 /*return*/];
                    }
                });
            });
        };
        CanvasService_1.prototype.deleteModuleItem = function (courseId, item) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, token, baseUrl, deleteUrl, response, errorText, result, _b, error_22;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0: return [4 /*yield*/, this.getAuthHeaders()];
                        case 1:
                            _a = _c.sent(), token = _a.token, baseUrl = _a.baseUrl;
                            _c.label = 2;
                        case 2:
                            _c.trys.push([2, 10, , 11]);
                            deleteUrl = void 0;
                            if (item.type === 'Assignment') {
                                deleteUrl = "".concat(baseUrl, "/courses/").concat(courseId, "/assignments/").concat(item.content_id);
                            }
                            else if (item.type === 'Quiz') {
                                deleteUrl = "".concat(baseUrl, "/courses/").concat(courseId, "/quizzes/").concat(item.content_id);
                            }
                            else if (item.type === 'Page') {
                                deleteUrl = "".concat(baseUrl, "/courses/").concat(courseId, "/pages/").concat(encodeURIComponent(item.content_id));
                            }
                            else if (item.type === 'Discussion') {
                                deleteUrl = "".concat(baseUrl, "/courses/").concat(courseId, "/discussion_topics/").concat(item.content_id);
                            }
                            else if (item.type === 'File' || item.type === 'Attachment') {
                                deleteUrl = "".concat(baseUrl, "/courses/").concat(courseId, "/files/").concat(item.content_id);
                            }
                            else {
                                throw new Error("Unsupported module item type: ".concat(item.type));
                            }
                            return [4 /*yield*/, fetch(deleteUrl, {
                                    method: 'DELETE',
                                    headers: {
                                        Authorization: "Bearer ".concat(token),
                                    },
                                })];
                        case 3:
                            response = _c.sent();
                            if (!!response.ok) return [3 /*break*/, 5];
                            return [4 /*yield*/, response.text()];
                        case 4:
                            errorText = _c.sent();
                            throw new Error("Failed to delete ".concat(item.type, " ").concat(item.content_id, ": ").concat(response.status, " ").concat(response.statusText, " - ").concat(errorText));
                        case 5:
                            if (response.status === 204) {
                                return [2 /*return*/, { success: true, type: item.type, content_id: item.content_id }];
                            }
                            _c.label = 6;
                        case 6:
                            _c.trys.push([6, 8, , 9]);
                            return [4 /*yield*/, response.json()];
                        case 7:
                            result = _c.sent();
                            return [2 /*return*/, {
                                    success: true,
                                    type: item.type,
                                    content_id: item.content_id,
                                    result: result,
                                }];
                        case 8:
                            _b = _c.sent();
                            return [2 /*return*/, { success: true, type: item.type, content_id: item.content_id }];
                        case 9: return [3 /*break*/, 11];
                        case 10:
                            error_22 = _c.sent();
                            console.error("[Service] Error deleting module item ".concat(item.type, " ").concat(item.content_id, ":"), error_22);
                            throw error_22;
                        case 11: return [2 /*return*/];
                    }
                });
            });
        };
        CanvasService_1.parseAccreditationBlock = function (body) {
            var _a, _b, _c;
            var raw = body !== null && body !== void 0 ? body : '';
            var preRegex = new RegExp("<pre[^>]*class=[\"'][^\"']*".concat(CanvasService.ACCREDITATION_PRE_CLASS, "[^\"']*[\"'][^>]*>([\\s\\S]*?)</pre>"), 'i');
            var text = (_c = (_b = (_a = raw.match(preRegex)) === null || _a === void 0 ? void 0 : _a[1]) === null || _b === void 0 ? void 0 : _b.trim()) !== null && _c !== void 0 ? _c : '';
            if (!text) {
                text = raw
                    .replace(/<br\s*\/?>/gi, '\n')
                    .replace(/<\/p>\s*<p[^>]*>/gi, '\n')
                    .replace(/<[^>]+>/g, '');
                if (!text) {
                    var legacyMatch = raw.match(/<!--\s*accreditation:(.+?)\s*-->/s);
                    if (legacyMatch) {
                        try {
                            var parsed = JSON.parse(legacyMatch[1].trim());
                            return typeof parsed === 'object' && parsed !== null
                                ? parsed
                                : null;
                        }
                        catch (_d) {
                            /* fall through */
                        }
                    }
                    return null;
                }
            }
            var profile = { v: 1 };
            var _loop_3 = function (line) {
                var m = line.match(/^([^:]+):\s*(.*)$/);
                if (!m)
                    return "continue";
                var label = m[1].trim();
                var value = m[2].trim();
                var def = CanvasService.PROFILE_KEYS.find(function (d) { return d.label === label; });
                if (!def || !value)
                    return "continue";
                if (def.key === 'institutionId')
                    profile[def.key] = parseInt(value, 10) || value;
                else if (def.key === 'programFocusCip6' ||
                    def.key === 'selectedStandards')
                    profile[def.key] = value
                        .split(',')
                        .map(function (s) { return s.trim(); })
                        .filter(Boolean);
                else if ((def.key === 'aiSuggestedAccepted' ||
                    def.key === 'aiSuggestedRejected' ||
                    def.key === 'aiSuggestedReviewLater') &&
                    value) {
                    try {
                        var parsed = JSON.parse(value);
                        if (Array.isArray(parsed))
                            profile[def.key] = parsed;
                    }
                    catch (_f) {
                        /* skip */
                    }
                }
                else if (def.key === 'stages' || def.key === 'operationLog') {
                    try {
                        var parsed = JSON.parse(value);
                        if (def.key === 'stages' &&
                            typeof parsed === 'object' &&
                            parsed !== null)
                            profile[def.key] = parsed;
                        else if (def.key === 'operationLog' && Array.isArray(parsed))
                            profile[def.key] = parsed;
                    }
                    catch (_g) {
                        /* skip invalid JSON */
                    }
                }
                else
                    profile[def.key] = value;
            };
            for (var _i = 0, _e = text.split(/\r?\n/); _i < _e.length; _i++) {
                var line = _e[_i];
                _loop_3(line);
            }
            return profile;
        };
        CanvasService_1.buildAccreditationBlock = function (profile) {
            var lines = CanvasService.PROFILE_KEYS.map(function (d) {
                var v = profile[d.key];
                if (v == null)
                    return null;
                if ((d.key === 'programFocusCip6' || d.key === 'selectedStandards') &&
                    Array.isArray(v))
                    return v.length ? "".concat(d.label, ": ").concat(v.join(',')) : null;
                if ((d.key === 'aiSuggestedAccepted' ||
                    d.key === 'aiSuggestedRejected' ||
                    d.key === 'aiSuggestedReviewLater') &&
                    Array.isArray(v))
                    return v.length ? "".concat(d.label, ": ").concat(JSON.stringify(v)) : null;
                if (d.key === 'stages' && typeof v === 'object' && v !== null)
                    return "".concat(d.label, ": ").concat(JSON.stringify(v));
                if (d.key === 'operationLog' && Array.isArray(v))
                    return v.length ? "".concat(d.label, ": ").concat(JSON.stringify(v)) : null;
                var s = String(v).trim();
                return s ? "".concat(d.label, ": ").concat(s) : null;
            }).filter(Boolean);
            var inner = lines.length
                ? lines.join('\n')
                : 'No profile data yet. Use the Standards Sync tab to set State, City, Institution, and Program.';
            return "<pre class=\"".concat(CanvasService.ACCREDITATION_PRE_CLASS, "\">").concat(inner, "</pre>");
        };
        CanvasService_1.mergeAccreditationBlockInBody = function (body, profile) {
            var block = CanvasService.buildAccreditationBlock(profile);
            var preRegex = new RegExp("<pre[^>]*class=[\"'][^\"']*".concat(CanvasService.ACCREDITATION_PRE_CLASS, "[^\"']*[\"'][^>]*>[\\s\\S]*?</pre>"), 'gi');
            var legacyRegex = /<!--\s*accreditation:.+?\s*-->/s;
            var out = body !== null && body !== void 0 ? body : '';
            if (preRegex.test(out)) {
                out = out.replace(preRegex, block);
            }
            else if (legacyRegex.test(out)) {
                out = out.replace(legacyRegex, block);
            }
            else {
                out = out.trim() ? "".concat(block, "\n\n").concat(out) : block;
            }
            return out.trim();
        };
        CanvasService_1.prototype.ensureStartHereModule = function (courseId) {
            return __awaiter(this, void 0, void 0, function () {
                var modules, existing;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.getCourseModules(courseId)];
                        case 1:
                            modules = _a.sent();
                            existing = modules.find(function (m) {
                                var _a;
                                return ((_a = m.name) !== null && _a !== void 0 ? _a : '').trim().toLowerCase() ===
                                    CanvasService.START_HERE_MODULE_NAME.toLowerCase();
                            });
                            if (existing)
                                return [2 /*return*/, existing];
                            return [2 /*return*/, this.createModule(courseId, {
                                    name: CanvasService.START_HERE_MODULE_NAME,
                                })];
                    }
                });
            });
        };
        CanvasService_1.prototype.getOrCreateAccreditationProfilePage = function (courseId) {
            return __awaiter(this, void 0, void 0, function () {
                var startHere, slug, existing, initialBody, created, pageUrl, items, inModule;
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.ensureStartHereModule(courseId)];
                        case 1:
                            startHere = _b.sent();
                            slug = CanvasService.ACCREDITATION_PROFILE_PAGE_URL;
                            return [4 /*yield*/, this.tryGetPageByUrl(courseId, slug)];
                        case 2:
                            existing = _b.sent();
                            if (!!existing) return [3 /*break*/, 5];
                            initialBody = CanvasService.buildAccreditationBlock({ v: 1 });
                            return [4 /*yield*/, this.createPage(courseId, {
                                    wiki_page: {
                                        title: 'Accreditation Profile',
                                        body: initialBody,
                                        url: slug,
                                    },
                                })];
                        case 3:
                            created = _b.sent();
                            pageUrl = (_a = created.url) !== null && _a !== void 0 ? _a : slug;
                            return [4 /*yield*/, this.createModuleItem(courseId, startHere.id, {
                                    type: 'Page',
                                    page_url: pageUrl,
                                })];
                        case 4:
                            _b.sent();
                            return [2 /*return*/, { page: created, module: startHere }];
                        case 5: return [4 /*yield*/, this.getModuleItems(courseId, startHere.id)];
                        case 6:
                            items = _b.sent();
                            inModule = items.some(function (i) {
                                var _a;
                                return i.type === 'Page' &&
                                    ((_a = i.page_url) !== null && _a !== void 0 ? _a : '').toLowerCase() === slug.toLowerCase();
                            });
                            if (!!inModule) return [3 /*break*/, 8];
                            return [4 /*yield*/, this.createModuleItem(courseId, startHere.id, {
                                    type: 'Page',
                                    page_url: existing.url || slug,
                                })];
                        case 7:
                            _b.sent();
                            _b.label = 8;
                        case 8: return [2 /*return*/, { page: existing, module: startHere }];
                    }
                });
            });
        };
        CanvasService_1.prototype.getAccreditationProfile = function (courseId) {
            return __awaiter(this, void 0, void 0, function () {
                var page, body, profile;
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.getOrCreateAccreditationProfilePage(courseId)];
                        case 1:
                            page = (_b.sent()).page;
                            body = (_a = page === null || page === void 0 ? void 0 : page.body) !== null && _a !== void 0 ? _a : '';
                            profile = CanvasService.parseAccreditationBlock(body);
                            return [2 /*return*/, profile !== null && profile !== void 0 ? profile : { v: 1 }];
                    }
                });
            });
        };
        CanvasService_1.prototype.saveAccreditationProfile = function (courseId, profile) {
            return __awaiter(this, void 0, void 0, function () {
                var page, current, merged, _i, _a, _b, k, v, pageUrl, body;
                var _c, _d, _e;
                return __generator(this, function (_f) {
                    switch (_f.label) {
                        case 0: return [4 /*yield*/, this.getOrCreateAccreditationProfilePage(courseId)];
                        case 1:
                            page = (_f.sent()).page;
                            current = (_d = CanvasService.parseAccreditationBlock((_c = page === null || page === void 0 ? void 0 : page.body) !== null && _c !== void 0 ? _c : '')) !== null && _d !== void 0 ? _d : { v: 1 };
                            merged = __assign({}, current);
                            for (_i = 0, _a = Object.entries(profile); _i < _a.length; _i++) {
                                _b = _a[_i], k = _b[0], v = _b[1];
                                if (v !== undefined)
                                    merged[k] = v;
                            }
                            pageUrl = CanvasService.ACCREDITATION_PROFILE_PAGE_URL;
                            body = CanvasService.mergeAccreditationBlockInBody((_e = page === null || page === void 0 ? void 0 : page.body) !== null && _e !== void 0 ? _e : '', merged);
                            return [2 /*return*/, this.updatePage(courseId, pageUrl, { wiki_page: { body: body } })];
                    }
                });
            });
        };
        CanvasService_1.prototype.logAccreditationOperation = function (courseId, operation, stage, details) {
            return __awaiter(this, void 0, void 0, function () {
                var profile, p, log, capped;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.getAccreditationProfile(courseId)];
                        case 1:
                            profile = _a.sent();
                            p = profile;
                            log = Array.isArray(p === null || p === void 0 ? void 0 : p.operationLog) ? __spreadArray([], p.operationLog, true) : [];
                            log.unshift({
                                timestamp: new Date().toISOString(),
                                operation: operation,
                                stage: stage,
                                details: details,
                            });
                            capped = log.slice(0, CanvasService.OPERATION_LOG_CAP);
                            return [4 /*yield*/, this.saveAccreditationProfile(courseId, __assign(__assign({}, p), { operationLog: capped }))];
                        case 2:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            });
        };
        CanvasService_1.prototype.setAccreditationStageState = function (courseId, stageId, state) {
            return __awaiter(this, void 0, void 0, function () {
                var profile, p, stages;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.getAccreditationProfile(courseId)];
                        case 1:
                            profile = _a.sent();
                            p = profile;
                            stages = typeof (p === null || p === void 0 ? void 0 : p.stages) === 'object' && p.stages !== null
                                ? __assign({}, p.stages) : {};
                            if (CanvasService.ACCREDITATION_STAGE_STATES.includes(state)) {
                                stages[stageId] = state;
                            }
                            return [4 /*yield*/, this.saveAccreditationProfile(courseId, __assign(__assign({}, p), { stages: stages }))];
                        case 2:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            });
        };
        CanvasService_1.isStageUnlocked = function (stages, stageId, requiredPrior) {
            if (!requiredPrior.length)
                return true;
            for (var _i = 0, requiredPrior_1 = requiredPrior; _i < requiredPrior_1.length; _i++) {
                var prior = requiredPrior_1[_i];
                var s = stages === null || stages === void 0 ? void 0 : stages[prior];
                if (s !== 'approved' && s !== 'applied')
                    return false;
            }
            return true;
        };
        CanvasService_1.prototype.getAccreditationWorkflow = function (courseId) {
            return __awaiter(this, void 0, void 0, function () {
                var profile, p, stages, operationLog, lockInfo;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.getAccreditationProfile(courseId)];
                        case 1:
                            profile = _a.sent();
                            p = profile;
                            stages = (typeof (p === null || p === void 0 ? void 0 : p.stages) === 'object' && p.stages !== null ? p.stages : {});
                            operationLog = Array.isArray(p === null || p === void 0 ? void 0 : p.operationLog) ? p.operationLog : [];
                            lockInfo = this.getAccreditationStageLockInfo(stages);
                            return [2 /*return*/, { stages: stages, operationLog: operationLog, lockInfo: lockInfo }];
                    }
                });
            });
        };
        CanvasService_1.prototype.getAccreditationStageLockInfo = function (stages) {
            var STAGE_DEPS = {
                '1': [],
                '2': ['1'],
                '3': ['2'],
                '3b': ['2'],
                '4': ['3', '3b'],
                '5': ['4'],
            };
            var result = {};
            for (var _i = 0, _a = CanvasService.ACCREDITATION_STAGE_IDS; _i < _a.length; _i++) {
                var sid = _a[_i];
                if (sid === '0') {
                    result[sid] = { locked: false };
                    continue;
                }
                var deps = STAGE_DEPS[sid] || [];
                var unlocked = CanvasService.isStageUnlocked(stages || null, sid, deps);
                result[sid] = unlocked
                    ? { locked: false }
                    : { locked: true, reason: "Complete prior stages: ".concat(deps.join(', ')) };
            }
            return result;
        };
        CanvasService_1.mergeWithGeneralAccreditors = function (list) {
            var ids = new Set(list.map(function (a) { return a.id; }));
            var general = CanvasService.GENERAL_ACCREDITORS.filter(function (a) { return !ids.has(a.id); });
            return __spreadArray(__spreadArray([], general, true), list, true);
        };
        CanvasService_1.prototype.getAccreditationLookupBase = function () {
            var raw = (this.config.get('ACCREDITATION_LOOKUP_URL') || '').replace(/\/$/, '');
            if (!raw)
                return '';
            return /^https?:\/\//i.test(raw) ? raw : "http://".concat(raw);
        };
        CanvasService_1.prototype.getAccreditorsForCourse = function (courseId, cip, degreeLevel) {
            return __awaiter(this, void 0, void 0, function () {
                var cipParam, profile, p, general, cipKey, base, params, deg, url, res, data, list, merged_1, e_1, cip4Key, stub, merged;
                var _a, _b;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            cipParam = (cip || '').trim();
                            if (!!cipParam) return [3 /*break*/, 2];
                            return [4 /*yield*/, this.getAccreditationProfile(courseId)];
                        case 1:
                            profile = _c.sent();
                            p = profile;
                            cipParam = (p === null || p === void 0 ? void 0 : p.programCip4) || (p === null || p === void 0 ? void 0 : p.program) || '';
                            console.log('[Accreditation] cip from profile fallback:', {
                                cipParam: cipParam,
                                programCip4: p === null || p === void 0 ? void 0 : p.programCip4,
                                program: p === null || p === void 0 ? void 0 : p.program,
                                programFocusCip6: p === null || p === void 0 ? void 0 : p.programFocusCip6,
                            });
                            return [3 /*break*/, 3];
                        case 2:
                            console.log('[Accreditation] cip from query param:', cipParam);
                            _c.label = 3;
                        case 3:
                            if (!cipParam) {
                                general = CanvasService.mergeWithGeneralAccreditors([]);
                                return [2 /*return*/, { accreditors: general, source: 'stub' }];
                            }
                            cipKey = cipParam.includes('.')
                                ? cipParam
                                : cipParam.replace(/^(\d{2})(\d{2})$/, '$1.$2');
                            base = this.getAccreditationLookupBase();
                            console.log('[Accreditation] Lookup config:', {
                                base: base ? base + ' (set)' : '(not set)',
                                cipParam: cipParam,
                                cipKey: cipKey,
                            });
                            if (!base) return [3 /*break*/, 9];
                            params = new URLSearchParams({ cip: cipParam });
                            deg = (degreeLevel || '').trim();
                            if (deg)
                                params.set('degree_level', deg);
                            url = "".concat(base, "/accreditors?").concat(params);
                            _c.label = 4;
                        case 4:
                            _c.trys.push([4, 7, , 8]);
                            console.log('[Accreditation] Fetching lookup service:', url);
                            return [4 /*yield*/, fetch(url)];
                        case 5:
                            res = _c.sent();
                            return [4 /*yield*/, res.json()];
                        case 6:
                            data = (_c.sent());
                            list = Array.isArray(data === null || data === void 0 ? void 0 : data.accreditors) ? data.accreditors : [];
                            console.log('[Accreditation] Lookup response:', {
                                status: res.status,
                                ok: res.ok,
                                count: list.length,
                                accreditors: list,
                            });
                            if (res.ok && list.length) {
                                merged_1 = CanvasService.mergeWithGeneralAccreditors(list);
                                return [2 /*return*/, { accreditors: merged_1, source: 'lookup_service' }];
                            }
                            if (res.ok && list.length === 0) {
                                console.log('[Accreditation] Lookup returned empty, falling back to stub');
                            }
                            return [3 /*break*/, 8];
                        case 7:
                            e_1 = _c.sent();
                            console.warn('[Accreditation] Lookup service fetch failed:', e_1);
                            return [3 /*break*/, 8];
                        case 8: return [3 /*break*/, 10];
                        case 9:
                            console.log('[Accreditation] ACCREDITATION_LOOKUP_URL not set, using stub');
                            _c.label = 10;
                        case 10:
                            cip4Key = cipKey.includes('.') ? cipKey.slice(0, 5) : cipKey;
                            stub = (_b = (_a = CanvasService.STUB_ACCREDITORS_BY_CIP[cipKey]) !== null && _a !== void 0 ? _a : CanvasService.STUB_ACCREDITORS_BY_CIP[cip4Key]) !== null && _b !== void 0 ? _b : [];
                            merged = CanvasService.mergeWithGeneralAccreditors(stub);
                            console.log('[Accreditation] Using stub:', {
                                cipKey: cipKey,
                                cip4Key: cip4Key,
                                stubCount: stub.length,
                            });
                            return [2 /*return*/, { accreditors: merged, source: 'stub' }];
                    }
                });
            });
        };
        CanvasService_1.normalizeOrgId = function (orgId) {
            return String(orgId || '')
                .trim()
                .toUpperCase()
                .replace(/[^A-Z0-9._-]/g, '');
        };
        CanvasService_1.prototype.getEffectiveCip = function (courseId, cip) {
            return __awaiter(this, void 0, void 0, function () {
                var requested, profile, p;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            requested = (cip || '').trim();
                            if (requested)
                                return [2 /*return*/, requested];
                            return [4 /*yield*/, this.getAccreditationProfile(courseId)];
                        case 1:
                            profile = _a.sent();
                            p = profile;
                            return [2 /*return*/, ((p === null || p === void 0 ? void 0 : p.programCip4) || (p === null || p === void 0 ? void 0 : p.program) || '').trim()];
                    }
                });
            });
        };
        CanvasService_1.normalizeStandardsNodes = function (raw, sourceType, sourceUri, defaultConfidence) {
            var _a, _b, _c, _d, _e, _f;
            if (defaultConfidence === void 0) { defaultConfidence = 0.9; }
            var now = new Date().toISOString();
            var out = [];
            for (var _i = 0, _g = raw || []; _i < _g.length; _i++) {
                var item = _g[_i];
                var id = String((_c = (_b = (_a = item === null || item === void 0 ? void 0 : item.id) !== null && _a !== void 0 ? _a : item === null || item === void 0 ? void 0 : item.standardId) !== null && _b !== void 0 ? _b : item === null || item === void 0 ? void 0 : item.code) !== null && _c !== void 0 ? _c : '').trim();
                var title = String((_f = (_e = (_d = item === null || item === void 0 ? void 0 : item.title) !== null && _d !== void 0 ? _d : item === null || item === void 0 ? void 0 : item.name) !== null && _e !== void 0 ? _e : item === null || item === void 0 ? void 0 : item.label) !== null && _f !== void 0 ? _f : '').trim();
                if (!id || !title)
                    continue;
                out.push({
                    id: id,
                    title: title,
                    description: (item === null || item === void 0 ? void 0 : item.description) ? String(item.description) : null,
                    version: (item === null || item === void 0 ? void 0 : item.version) ? String(item.version) : null,
                    effectiveDate: (item === null || item === void 0 ? void 0 : item.effectiveDate) ? String(item.effectiveDate) : null,
                    parentId: (item === null || item === void 0 ? void 0 : item.parentId) ? String(item.parentId) : null,
                    kind: (item === null || item === void 0 ? void 0 : item.kind) != null && item.kind !== ''
                        ? String(item.kind)
                        : undefined,
                    groupCode: (item === null || item === void 0 ? void 0 : item.groupCode) != null && item.groupCode !== ''
                        ? String(item.groupCode)
                        : null,
                    sortOrder: typeof (item === null || item === void 0 ? void 0 : item.sortOrder) === 'number' ? item.sortOrder : undefined,
                    sourceType: sourceType,
                    sourceUri: sourceUri !== null && sourceUri !== void 0 ? sourceUri : null,
                    confidence: typeof (item === null || item === void 0 ? void 0 : item.confidence) === 'number'
                        ? item.confidence
                        : defaultConfidence,
                    retrievedAt: now,
                });
            }
            return out;
        };
        CanvasService_1.prototype.resolveStandardsFromLookupDb = function (orgId, cip, degreeLevel) {
            return __awaiter(this, void 0, void 0, function () {
                var base, params, url, res, payload, arr;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            base = this.getAccreditationLookupBase();
                            if (!base)
                                return [2 /*return*/, { standards: [] }];
                            params = new URLSearchParams({ org: orgId });
                            if (cip)
                                params.set('cip', cip);
                            if (degreeLevel)
                                params.set('degree_level', degreeLevel);
                            url = "".concat(base, "/standards?").concat(params.toString());
                            return [4 /*yield*/, fetch(url)];
                        case 1:
                            res = _a.sent();
                            if (!res.ok)
                                return [2 /*return*/, { standards: [] }];
                            return [4 /*yield*/, res.json()];
                        case 2:
                            payload = _a.sent();
                            arr = Array.isArray(payload === null || payload === void 0 ? void 0 : payload.standards)
                                ? payload.standards
                                : Array.isArray(payload)
                                    ? payload
                                    : [];
                            return [2 /*return*/, {
                                    standards: CanvasService.normalizeStandardsNodes(arr, 'db', url, 0.95),
                                    sourceUri: url,
                                }];
                    }
                });
            });
        };
        CanvasService_1.prototype.resolveStandardsFromApi = function (orgId, cip, degreeLevel) {
            return __awaiter(this, void 0, void 0, function () {
                var template, url, res, payload, arr;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            template = (this.config.get('ACCREDITATION_STANDARDS_API_TEMPLATE') || '').trim();
                            if (!template)
                                return [2 /*return*/, { standards: [] }];
                            url = template
                                .replace(/\{org\}/g, encodeURIComponent(orgId))
                                .replace(/\{cip\}/g, encodeURIComponent(cip || ''))
                                .replace(/\{degree_level\}/g, encodeURIComponent(degreeLevel || ''));
                            return [4 /*yield*/, fetch(url)];
                        case 1:
                            res = _a.sent();
                            if (!res.ok)
                                return [2 /*return*/, { standards: [] }];
                            return [4 /*yield*/, res.json()];
                        case 2:
                            payload = _a.sent();
                            arr = Array.isArray(payload === null || payload === void 0 ? void 0 : payload.standards)
                                ? payload.standards
                                : Array.isArray(payload)
                                    ? payload
                                    : [];
                            return [2 /*return*/, {
                                    standards: CanvasService.normalizeStandardsNodes(arr, 'api', url, 0.9),
                                    sourceUri: url,
                                }];
                    }
                });
            });
        };
        CanvasService_1.prototype.resolveStandardsFromFile = function (orgId) {
            return __awaiter(this, void 0, void 0, function () {
                var configured, candidatePaths, _i, candidatePaths_1, filePath, content, payload, arr, standards, _a;
                var _b;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            configured = (this.config.get('ACCREDITATION_STANDARDS_FILE') || '').trim();
                            candidatePaths = [
                                configured,
                                path.join(process.cwd(), 'data', 'accreditation-standards.json'),
                                path.join(process.cwd(), 'services', 'accreditation-lookup', 'data', 'standards.json'),
                                path.join(process.cwd(), 'services', 'accreditation-lookup', 'data', 'standards', "".concat(orgId.toLowerCase(), ".json")),
                            ].filter(Boolean);
                            _i = 0, candidatePaths_1 = candidatePaths;
                            _c.label = 1;
                        case 1:
                            if (!(_i < candidatePaths_1.length)) return [3 /*break*/, 6];
                            filePath = candidatePaths_1[_i];
                            _c.label = 2;
                        case 2:
                            _c.trys.push([2, 4, , 5]);
                            return [4 /*yield*/, fs_1.promises.readFile(filePath, 'utf-8')];
                        case 3:
                            content = _c.sent();
                            payload = JSON.parse(content);
                            arr = [];
                            if (Array.isArray(payload === null || payload === void 0 ? void 0 : payload.standards)) {
                                arr = payload.standards.filter(function (x) {
                                    return CanvasService.normalizeOrgId((x === null || x === void 0 ? void 0 : x.orgId) || (x === null || x === void 0 ? void 0 : x.organization) || '') === orgId;
                                });
                            }
                            else if ((payload === null || payload === void 0 ? void 0 : payload.organizations) &&
                                Array.isArray((_b = payload.organizations) === null || _b === void 0 ? void 0 : _b[orgId])) {
                                arr = payload.organizations[orgId];
                            }
                            else if (Array.isArray(payload === null || payload === void 0 ? void 0 : payload[orgId])) {
                                arr = payload[orgId];
                            }
                            else if ((payload === null || payload === void 0 ? void 0 : payload.org_key) &&
                                CanvasService.normalizeOrgId(String(payload.org_key)) === orgId &&
                                Array.isArray(payload === null || payload === void 0 ? void 0 : payload.nodes)) {
                                arr = payload.nodes.map(function (n) { return ({
                                    id: n.public_id,
                                    parentId: n.parent_public_id,
                                    title: n.title,
                                    description: n.description,
                                    groupCode: n.group_code,
                                    kind: n.kind,
                                    sortOrder: n.sort_order,
                                }); });
                            }
                            standards = CanvasService.normalizeStandardsNodes(arr, 'file', filePath, 0.85);
                            if (standards.length)
                                return [2 /*return*/, { standards: standards, sourceUri: filePath }];
                            return [3 /*break*/, 5];
                        case 4:
                            _a = _c.sent();
                            void 0;
                            return [3 /*break*/, 5];
                        case 5:
                            _i++;
                            return [3 /*break*/, 1];
                        case 6: return [2 /*return*/, { standards: [] }];
                    }
                });
            });
        };
        CanvasService_1.extractStandardsFromText = function (orgId, text, sourceType, sourceUri) {
            var lines = String(text || '')
                .split(/\r?\n/)
                .map(function (x) { return x.trim(); })
                .filter(Boolean);
            var out = [];
            for (var _i = 0, lines_1 = lines; _i < lines_1.length; _i++) {
                var line = lines_1[_i];
                var m = line.match(/^([A-Z]{2,}[A-Z0-9._-]*\d*[A-Z0-9._-]*)\s*[-:]\s*(.+)$/);
                if (m) {
                    out.push({
                        id: m[1].trim(),
                        title: m[2].trim(),
                        sourceType: sourceType,
                        sourceUri: sourceUri !== null && sourceUri !== void 0 ? sourceUri : null,
                        confidence: sourceType === 'ai' ? 0.5 : 0.7,
                        retrievedAt: new Date().toISOString(),
                    });
                }
            }
            if (out.length)
                return out;
            // Fallback: treat sentence-like bullets as titles and synthesize IDs
            var bullets = lines
                .filter(function (x) { return /^[-*•]\s+/.test(x); })
                .slice(0, 20)
                .map(function (x) { return x.replace(/^[-*•]\s+/, '').trim(); });
            return bullets.map(function (title, idx) { return ({
                id: "".concat(orgId, "-").concat(idx + 1),
                title: title.slice(0, 200),
                sourceType: sourceType,
                sourceUri: sourceUri !== null && sourceUri !== void 0 ? sourceUri : null,
                confidence: sourceType === 'ai' ? 0.45 : 0.6,
                retrievedAt: new Date().toISOString(),
            }); });
        };
        CanvasService_1.prototype.resolveStandardsFromScrape = function (orgId) {
            return __awaiter(this, void 0, void 0, function () {
                var template, url, res, html, text, standards;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            template = (this.config.get('ACCREDITATION_STANDARDS_SCRAPE_TEMPLATE') || '').trim();
                            if (!template)
                                return [2 /*return*/, { standards: [] }];
                            url = template.replace(/\{org\}/g, encodeURIComponent(orgId));
                            return [4 /*yield*/, fetch(url)];
                        case 1:
                            res = _a.sent();
                            if (!res.ok)
                                return [2 /*return*/, { standards: [] }];
                            return [4 /*yield*/, res.text()];
                        case 2:
                            html = _a.sent();
                            text = html
                                .replace(/<script[\s\S]*?<\/script>/gi, ' ')
                                .replace(/<style[\s\S]*?<\/style>/gi, ' ')
                                .replace(/<[^>]+>/g, '\n')
                                .replace(/\n{2,}/g, '\n');
                            standards = CanvasService.extractStandardsFromText(orgId, text, 'scrape', url);
                            return [2 /*return*/, { standards: standards, sourceUri: url, rawText: text }];
                    }
                });
            });
        };
        CanvasService_1.extractJsonBlock = function (text) {
            var trimmed = String(text || '').trim();
            if (!trimmed)
                return null;
            var fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
            if (fence === null || fence === void 0 ? void 0 : fence[1])
                return fence[1].trim();
            var arr = trimmed.match(/\[[\s\S]*\]/);
            if (arr === null || arr === void 0 ? void 0 : arr[0])
                return arr[0];
            var obj = trimmed.match(/\{[\s\S]*\}/);
            if (obj === null || obj === void 0 ? void 0 : obj[0])
                return obj[0];
            return null;
        };
        CanvasService_1.prototype.resolveStandardsWithAiFallback = function (orgId, orgName, cip, contextText) {
            return __awaiter(this, void 0, void 0, function () {
                var key, model, staticBlock, dynamicBlock, text, t, _a, jsonBlock, parsed, arr;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            key = (this.config.get('ANTHROPIC_API_KEY') || '').trim();
                            if (!key)
                                return [2 /*return*/, []];
                            model = (this.config.get('CLAUDE_MODEL') || ANTHROPIC_TEXT_MODEL_DEFAULT).trim();
                            staticBlock = [
                                'Return JSON only.',
                                'Task: infer a minimal standards list for an accrediting body.',
                                'Output schema: [{ "id": "ORG-1", "title": "Standard title", "description": "optional" }]',
                            ].join('\n');
                            dynamicBlock = [
                                "Organization ID: ".concat(orgId),
                                "Organization Name: ".concat(orgName),
                                "CIP (if known): ".concat(cip || '(unknown)'),
                                "Context:\n".concat((contextText || '').slice(0, 12000) || '(none)'),
                            ].join('\n');
                            text = '';
                            _b.label = 1;
                        case 1:
                            _b.trys.push([1, 3, , 4]);
                            return [4 /*yield*/, this.fetchAnthropicMessage({
                                    model: model,
                                    maxTokens: 1200,
                                    temperature: 0.1,
                                    staticBlock: staticBlock,
                                    dynamicBlock: dynamicBlock,
                                    meta: {
                                        context: 'accreditation_standards_fallback',
                                        resourceType: 'org',
                                    },
                                })];
                        case 2:
                            t = (_b.sent()).text;
                            text = t;
                            return [3 /*break*/, 4];
                        case 3:
                            _a = _b.sent();
                            return [2 /*return*/, []];
                        case 4:
                            jsonBlock = CanvasService.extractJsonBlock(text);
                            if (!jsonBlock)
                                return [2 /*return*/, []];
                            try {
                                parsed = JSON.parse(jsonBlock);
                                arr = Array.isArray(parsed)
                                    ? parsed
                                    : Array.isArray(parsed === null || parsed === void 0 ? void 0 : parsed.standards)
                                        ? parsed.standards
                                        : [];
                                return [2 /*return*/, CanvasService.normalizeStandardsNodes(arr, 'ai', null, 0.5)];
                            }
                            catch (_c) {
                                return [2 /*return*/, []];
                            }
                            return [2 /*return*/];
                    }
                });
            });
        };
        CanvasService_1.prototype.resolveStandardsForOrganization = function (org, cip, degreeLevel) {
            return __awaiter(this, void 0, void 0, function () {
                var orgId, warnings, db, e_2, api, e_3, file, e_4, scrapeRawText, scrape, e_5, ai, e_6, stub, standards;
                var _a, _b, _c, _d;
                return __generator(this, function (_e) {
                    switch (_e.label) {
                        case 0:
                            orgId = CanvasService.normalizeOrgId(org.abbreviation || org.id || org.name);
                            warnings = [];
                            _e.label = 1;
                        case 1:
                            _e.trys.push([1, 3, , 4]);
                            return [4 /*yield*/, this.resolveStandardsFromLookupDb(orgId, cip, degreeLevel)];
                        case 2:
                            db = _e.sent();
                            if (db.standards.length) {
                                return [2 /*return*/, {
                                        sourceType: 'db',
                                        standards: db.standards,
                                        sourceUri: (_a = db.sourceUri) !== null && _a !== void 0 ? _a : null,
                                        confidence: 0.95,
                                        usedAiFallback: false,
                                        warnings: warnings,
                                    }];
                            }
                            return [3 /*break*/, 4];
                        case 3:
                            e_2 = _e.sent();
                            warnings.push("db lookup failed: ".concat((e_2 === null || e_2 === void 0 ? void 0 : e_2.message) || 'unknown error'));
                            return [3 /*break*/, 4];
                        case 4:
                            _e.trys.push([4, 6, , 7]);
                            return [4 /*yield*/, this.resolveStandardsFromApi(orgId, cip, degreeLevel)];
                        case 5:
                            api = _e.sent();
                            if (api.standards.length) {
                                return [2 /*return*/, {
                                        sourceType: 'api',
                                        standards: api.standards,
                                        sourceUri: (_b = api.sourceUri) !== null && _b !== void 0 ? _b : null,
                                        confidence: 0.9,
                                        usedAiFallback: false,
                                        warnings: warnings,
                                    }];
                            }
                            return [3 /*break*/, 7];
                        case 6:
                            e_3 = _e.sent();
                            warnings.push("api lookup failed: ".concat((e_3 === null || e_3 === void 0 ? void 0 : e_3.message) || 'unknown error'));
                            return [3 /*break*/, 7];
                        case 7:
                            _e.trys.push([7, 9, , 10]);
                            return [4 /*yield*/, this.resolveStandardsFromFile(orgId)];
                        case 8:
                            file = _e.sent();
                            if (file.standards.length) {
                                return [2 /*return*/, {
                                        sourceType: 'file',
                                        standards: file.standards,
                                        sourceUri: (_c = file.sourceUri) !== null && _c !== void 0 ? _c : null,
                                        confidence: 0.85,
                                        usedAiFallback: false,
                                        warnings: warnings,
                                    }];
                            }
                            return [3 /*break*/, 10];
                        case 9:
                            e_4 = _e.sent();
                            warnings.push("file lookup failed: ".concat((e_4 === null || e_4 === void 0 ? void 0 : e_4.message) || 'unknown error'));
                            return [3 /*break*/, 10];
                        case 10:
                            scrapeRawText = '';
                            _e.label = 11;
                        case 11:
                            _e.trys.push([11, 13, , 14]);
                            return [4 /*yield*/, this.resolveStandardsFromScrape(orgId)];
                        case 12:
                            scrape = _e.sent();
                            if (scrape.standards.length) {
                                return [2 /*return*/, {
                                        sourceType: 'scrape',
                                        standards: scrape.standards,
                                        sourceUri: (_d = scrape.sourceUri) !== null && _d !== void 0 ? _d : null,
                                        confidence: 0.7,
                                        usedAiFallback: false,
                                        warnings: warnings,
                                    }];
                            }
                            scrapeRawText = scrape.rawText || '';
                            return [3 /*break*/, 14];
                        case 13:
                            e_5 = _e.sent();
                            warnings.push("scrape lookup failed: ".concat((e_5 === null || e_5 === void 0 ? void 0 : e_5.message) || 'unknown error'));
                            return [3 /*break*/, 14];
                        case 14:
                            _e.trys.push([14, 16, , 17]);
                            return [4 /*yield*/, this.resolveStandardsWithAiFallback(orgId, org.name, cip, scrapeRawText)];
                        case 15:
                            ai = _e.sent();
                            if (ai.length) {
                                warnings.push('ai fallback used');
                                return [2 /*return*/, {
                                        sourceType: 'ai',
                                        standards: ai,
                                        sourceUri: null,
                                        confidence: 0.5,
                                        usedAiFallback: true,
                                        warnings: warnings,
                                    }];
                            }
                            return [3 /*break*/, 17];
                        case 16:
                            e_6 = _e.sent();
                            warnings.push("ai fallback failed: ".concat((e_6 === null || e_6 === void 0 ? void 0 : e_6.message) || 'unknown error'));
                            return [3 /*break*/, 17];
                        case 17:
                            stub = CanvasService.STUB_STANDARDS_BY_ORG[orgId] || [];
                            if (stub.length) {
                                standards = CanvasService.normalizeStandardsNodes(stub, 'file', 'stub', 0.4);
                                return [2 /*return*/, {
                                        sourceType: 'stub',
                                        standards: standards,
                                        sourceUri: 'stub',
                                        confidence: 0.4,
                                        usedAiFallback: false,
                                        warnings: warnings,
                                    }];
                            }
                            return [2 /*return*/, {
                                    sourceType: 'none',
                                    standards: [],
                                    sourceUri: null,
                                    confidence: 0,
                                    usedAiFallback: false,
                                    warnings: warnings,
                                }];
                    }
                });
            });
        };
        CanvasService_1.prototype.suggestAdditionalStandardsForCourse = function (courseId_1) {
            return __awaiter(this, arguments, void 0, function (courseId, n) {
                var key, profile, p, cip, selectedIds, standardsPayload, allStandards, availableIds, candidates, courseContext, details, _a, model, staticBlock, dynamicBlock, text, t, _b, jsonBlock, parsed, arr;
                if (n === void 0) { n = 5; }
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            key = (this.config.get('ANTHROPIC_API_KEY') || '').trim();
                            if (!key)
                                return [2 /*return*/, []];
                            return [4 /*yield*/, this.getAccreditationProfile(courseId)];
                        case 1:
                            profile = _c.sent();
                            p = profile;
                            cip = ((Array.isArray(p === null || p === void 0 ? void 0 : p.programFocusCip6) &&
                                p.programFocusCip6[0]) ||
                                (p === null || p === void 0 ? void 0 : p.programCip4) ||
                                (p === null || p === void 0 ? void 0 : p.program) ||
                                '').trim();
                            selectedIds = Array.isArray(p === null || p === void 0 ? void 0 : p.selectedStandards)
                                ? p.selectedStandards
                                    .map(function (x) { return String(x).trim(); })
                                    .filter(Boolean)
                                : [];
                            if (!selectedIds.length)
                                return [2 /*return*/, []];
                            return [4 /*yield*/, this.getAccreditationStandardsForCourse(courseId, cip || undefined, undefined)];
                        case 2:
                            standardsPayload = _c.sent();
                            allStandards = (Array.isArray(standardsPayload === null || standardsPayload === void 0 ? void 0 : standardsPayload.organizations)
                                ? standardsPayload.organizations
                                : [])
                                .flatMap(function (o) { return (Array.isArray(o === null || o === void 0 ? void 0 : o.standards) ? o.standards : []); })
                                .map(function (s) { return ({
                                id: String((s === null || s === void 0 ? void 0 : s.id) || '').trim(),
                                title: String((s === null || s === void 0 ? void 0 : s.title) || (s === null || s === void 0 ? void 0 : s.id) || '').trim(),
                            }); })
                                .filter(function (s) { return s.id; });
                            availableIds = new Set(allStandards.map(function (s) { return s.id; }));
                            candidates = allStandards
                                .filter(function (s) { return !selectedIds.includes(s.id); })
                                .slice(0, 80);
                            if (!candidates.length)
                                return [2 /*return*/, []];
                            courseContext = '';
                            _c.label = 3;
                        case 3:
                            _c.trys.push([3, 5, , 6]);
                            return [4 /*yield*/, this.getCourseDetails(courseId)];
                        case 4:
                            details = _c.sent();
                            courseContext = [details === null || details === void 0 ? void 0 : details.name, details === null || details === void 0 ? void 0 : details.description]
                                .filter(Boolean)
                                .join('\n')
                                .slice(0, 2000);
                            return [3 /*break*/, 6];
                        case 5:
                            _a = _c.sent();
                            return [3 /*break*/, 6];
                        case 6:
                            model = (this.config.get('CLAUDE_MODEL') || ANTHROPIC_TEXT_MODEL_DEFAULT).trim();
                            staticBlock = [
                                'Return JSON only.',
                                'Task: suggest additional accreditation standards that may apply to this course.',
                                'Output schema: [{ "id": "STD-1", "title": "...", "reason": "brief reason" }]. Only use IDs from the candidate list provided in the dynamic section. Obey the max count given there.',
                            ].join('\n');
                            dynamicBlock = [
                                "Max suggestions: ".concat(n),
                                'Already selected: ' + selectedIds.join(', '),
                                'Course context: ' + (courseContext || '(none)'),
                                'Candidates (id - title): ' +
                                    candidates
                                        .map(function (s) { return s.id + ' - ' + s.title; })
                                        .join(' | '),
                            ].join('\n');
                            text = '';
                            _c.label = 7;
                        case 7:
                            _c.trys.push([7, 9, , 10]);
                            return [4 /*yield*/, this.fetchAnthropicMessage({
                                    model: model,
                                    maxTokens: 800,
                                    temperature: 0.2,
                                    staticBlock: staticBlock,
                                    dynamicBlock: dynamicBlock,
                                    meta: {
                                        context: 'suggest_additional_standards',
                                        resourceType: 'course',
                                    },
                                })];
                        case 8:
                            t = (_c.sent()).text;
                            text = t;
                            return [3 /*break*/, 10];
                        case 9:
                            _b = _c.sent();
                            return [2 /*return*/, []];
                        case 10:
                            jsonBlock = CanvasService.extractJsonBlock(text);
                            if (!jsonBlock)
                                return [2 /*return*/, []];
                            try {
                                parsed = JSON.parse(jsonBlock);
                                arr = Array.isArray(parsed) ? parsed : [];
                                return [2 /*return*/, arr
                                        .filter(function (x) { return (x === null || x === void 0 ? void 0 : x.id) && availableIds.has(String(x.id)); })
                                        .slice(0, n)
                                        .map(function (x) { return ({
                                        id: String(x.id).trim(),
                                        title: String(x.title || x.id).trim(),
                                        reason: String(x.reason || '').trim() || 'AI suggested',
                                    }); })];
                            }
                            catch (_d) {
                                return [2 /*return*/, []];
                            }
                            return [2 /*return*/];
                    }
                });
            });
        };
        CanvasService_1.prototype.applyAiSuggestionAction = function (courseId, standardId, action) {
            return __awaiter(this, void 0, void 0, function () {
                var sid, profile, p, accepted, rejected, reviewLater, selected;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            sid = String(standardId || '').trim();
                            if (!sid)
                                return [2 /*return*/, { success: false }];
                            return [4 /*yield*/, this.getAccreditationProfile(courseId)];
                        case 1:
                            profile = _a.sent();
                            p = profile;
                            accepted = Array.isArray(p === null || p === void 0 ? void 0 : p.aiSuggestedAccepted)
                                ? __spreadArray([], p.aiSuggestedAccepted, true) : [];
                            rejected = Array.isArray(p === null || p === void 0 ? void 0 : p.aiSuggestedRejected)
                                ? __spreadArray([], p.aiSuggestedRejected, true) : [];
                            reviewLater = Array.isArray(p === null || p === void 0 ? void 0 : p.aiSuggestedReviewLater)
                                ? __spreadArray([], p.aiSuggestedReviewLater, true) : [];
                            selected = Array.isArray(p === null || p === void 0 ? void 0 : p.selectedStandards)
                                ? __spreadArray([], p.selectedStandards, true) : [];
                            if (action === 'accept') {
                                if (!selected.includes(sid))
                                    selected.push(sid);
                                if (!accepted.includes(sid))
                                    accepted.push(sid);
                                rejected.splice(rejected.indexOf(sid), 1);
                                reviewLater.splice(reviewLater.indexOf(sid), 1);
                            }
                            else if (action === 'reject') {
                                if (!rejected.includes(sid))
                                    rejected.push(sid);
                                selected.splice(selected.indexOf(sid), 1);
                                accepted.splice(accepted.indexOf(sid), 1);
                                reviewLater.splice(reviewLater.indexOf(sid), 1);
                            }
                            else {
                                if (!reviewLater.includes(sid))
                                    reviewLater.push(sid);
                                rejected.splice(rejected.indexOf(sid), 1);
                            }
                            return [4 /*yield*/, this.saveAccreditationProfile(courseId, __assign(__assign({}, p), { selectedStandards: selected, aiSuggestedAccepted: accepted, aiSuggestedRejected: rejected, aiSuggestedReviewLater: reviewLater }))];
                        case 2:
                            _a.sent();
                            return [2 /*return*/, { success: true }];
                    }
                });
            });
        };
        CanvasService_1.prototype.getAccreditationStandardsForCourse = function (courseId, cip, degreeLevel) {
            return __awaiter(this, void 0, void 0, function () {
                var effectiveCip, accreditorsPayload, organizations, totalStandards, firstOrg, firstStd, _debug;
                var _this = this;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.getEffectiveCip(courseId, cip)];
                        case 1:
                            effectiveCip = _a.sent();
                            return [4 /*yield*/, this.getAccreditorsForCourse(courseId, effectiveCip || undefined, degreeLevel)];
                        case 2:
                            accreditorsPayload = _a.sent();
                            return [4 /*yield*/, Promise.all((accreditorsPayload.accreditors || []).map(function (org) { return __awaiter(_this, void 0, void 0, function () {
                                    var resolved;
                                    var _a, _b;
                                    return __generator(this, function (_c) {
                                        switch (_c.label) {
                                            case 0: return [4 /*yield*/, this.resolveStandardsForOrganization(org, effectiveCip || undefined, degreeLevel)];
                                            case 1:
                                                resolved = _c.sent();
                                                return [2 /*return*/, {
                                                        id: org.id,
                                                        name: org.name,
                                                        abbreviation: (_a = org.abbreviation) !== null && _a !== void 0 ? _a : null,
                                                        standards_source: resolved.sourceType,
                                                        standards_source_uri: (_b = resolved.sourceUri) !== null && _b !== void 0 ? _b : null,
                                                        standards_confidence: resolved.confidence,
                                                        used_ai_fallback: resolved.usedAiFallback,
                                                        warnings: resolved.warnings,
                                                        standards: resolved.standards,
                                                    }];
                                        }
                                    });
                                }); }))];
                        case 3:
                            organizations = _a.sent();
                            totalStandards = organizations.reduce(function (sum, org) {
                                return sum + (Array.isArray(org.standards) ? org.standards.length : 0);
                            }, 0);
                            firstOrg = organizations[0];
                            firstStd = Array.isArray(firstOrg === null || firstOrg === void 0 ? void 0 : firstOrg.standards)
                                ? firstOrg.standards[0]
                                : null;
                            _debug = {
                                effectiveCip: effectiveCip !== null && effectiveCip !== void 0 ? effectiveCip : null,
                                accreditors_source: accreditorsPayload.source,
                                org_sources: organizations.map(function (o) {
                                    var _a;
                                    return ({
                                        id: (_a = o.abbreviation) !== null && _a !== void 0 ? _a : o.id,
                                        source: o.standards_source,
                                        count: Array.isArray(o.standards) ? o.standards.length : 0,
                                        has_parent_ids: Array.isArray(o.standards)
                                            ? o.standards.some(function (s) {
                                                var _a;
                                                return ((_a = s.parentId) !== null && _a !== void 0 ? _a : s.parent_id) != null;
                                            })
                                            : false,
                                    });
                                }),
                                first_standard_keys: firstStd ? Object.keys(firstStd) : [],
                            };
                            return [2 /*return*/, {
                                    cip: effectiveCip || null,
                                    accreditors_source: accreditorsPayload.source,
                                    organizations: organizations,
                                    total_standards: totalStandards,
                                    _debug: _debug,
                                }];
                    }
                });
            });
        };
        CanvasService_1.parseStandardsFromDescription = function (description) {
            if (!description || typeof description !== 'string')
                return null;
            var match = description.match(CanvasService.STANDARDS_PREFIX_REGEX);
            if (!match)
                return null;
            return match[1]
                .split(',')
                .map(function (s) { return s.trim(); })
                .filter(Boolean);
        };
        CanvasService_1.mergeStandardsIntoDescription = function (description, standards) {
            var base = (description !== null && description !== void 0 ? description : '').trim();
            var block = standards.length ? "|STANDARDS:".concat(standards.join(','), "|") : '';
            if (!block) {
                return base.replace(CanvasService.STANDARDS_PREFIX_REGEX, '').trim();
            }
            if (CanvasService.STANDARDS_PREFIX_REGEX.test(base)) {
                return base.replace(CanvasService.STANDARDS_PREFIX_REGEX, block).trim();
            }
            return base ? "".concat(block, " ").concat(base) : block;
        };
        CanvasService_1.prototype.getCourseOutcomeLinks = function (courseId) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, token, baseUrl, url, links;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.getAuthHeaders()];
                        case 1:
                            _a = _b.sent(), token = _a.token, baseUrl = _a.baseUrl;
                            url = "".concat(baseUrl, "/courses/").concat(courseId, "/outcome_group_links?outcome_style=full&per_page=100");
                            return [4 /*yield*/, this.fetchPaginatedData(url, token)];
                        case 2:
                            links = _b.sent();
                            return [2 /*return*/, links.map(function (link) {
                                    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
                                    return ({
                                        id: (_a = link.outcome) === null || _a === void 0 ? void 0 : _a.id,
                                        title: (_c = (_b = link.outcome) === null || _b === void 0 ? void 0 : _b.title) !== null && _c !== void 0 ? _c : '',
                                        description: (_e = (_d = link.outcome) === null || _d === void 0 ? void 0 : _d.description) !== null && _e !== void 0 ? _e : '',
                                        groupTitle: (_g = (_f = link.outcome_group) === null || _f === void 0 ? void 0 : _f.title) !== null && _g !== void 0 ? _g : null,
                                        standards: (_j = CanvasService.parseStandardsFromDescription((_h = link.outcome) === null || _h === void 0 ? void 0 : _h.description)) !== null && _j !== void 0 ? _j : [],
                                    });
                                })];
                    }
                });
            });
        };
        CanvasService_1.prototype.updateOutcomeStandards = function (outcomeId, standards) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, token, baseUrl, getRes, outcome, merged, putRes;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.getAuthHeaders()];
                        case 1:
                            _a = _b.sent(), token = _a.token, baseUrl = _a.baseUrl;
                            return [4 /*yield*/, fetch("".concat(baseUrl, "/outcomes/").concat(outcomeId), {
                                    headers: { Authorization: "Bearer ".concat(token) },
                                })];
                        case 2:
                            getRes = _b.sent();
                            if (!getRes.ok)
                                throw new Error("Failed to fetch outcome: ".concat(getRes.statusText));
                            return [4 /*yield*/, getRes.json()];
                        case 3:
                            outcome = _b.sent();
                            merged = CanvasService.mergeStandardsIntoDescription(outcome.description, standards);
                            return [4 /*yield*/, fetch("".concat(baseUrl, "/outcomes/").concat(outcomeId), {
                                    method: 'PUT',
                                    headers: {
                                        Authorization: "Bearer ".concat(token),
                                        'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify({ description: merged }),
                                })];
                        case 4:
                            putRes = _b.sent();
                            if (!putRes.ok)
                                throw new Error("Failed to update outcome: ".concat(putRes.statusText));
                            return [2 /*return*/, putRes.json()];
                    }
                });
            });
        };
        CanvasService_1.prototype.buildSelectedStandardsOutcomeSet = function (organizations, selectedIds, includeGroups) {
            var nodes = organizations
                .flatMap(function (o) { return (Array.isArray(o === null || o === void 0 ? void 0 : o.standards) ? o.standards : []); })
                .map(function (s) { return ({
                id: String((s === null || s === void 0 ? void 0 : s.id) || '').trim(),
                title: String((s === null || s === void 0 ? void 0 : s.title) || (s === null || s === void 0 ? void 0 : s.id) || '').trim(),
                description: (s === null || s === void 0 ? void 0 : s.description) ? String(s.description) : null,
                parentId: (s === null || s === void 0 ? void 0 : s.parentId) != null
                    ? String(s.parentId)
                    : (s === null || s === void 0 ? void 0 : s.parent_id) != null
                        ? String(s.parent_id)
                        : null,
                kind: (s === null || s === void 0 ? void 0 : s.kind) ? String(s.kind) : undefined,
            }); })
                .filter(function (s) { return s.id && s.title; });
            var byId = new Map();
            var children = new Map();
            nodes.forEach(function (n) {
                if (!byId.has(n.id))
                    byId.set(n.id, n);
                var pid = String(n.parentId || '').trim();
                if (pid) {
                    if (!children.has(pid))
                        children.set(pid, []);
                    children.get(pid).push(n.id);
                }
            });
            var selected = new Set(selectedIds.map(function (x) { return String(x || '').trim(); }).filter(Boolean));
            var expanded = new Set();
            var queue = Array.from(selected);
            while (queue.length) {
                var id = queue.shift();
                if (!id || expanded.has(id))
                    continue;
                expanded.add(id);
                var kids = children.get(id) || [];
                kids.forEach(function (k) {
                    if (!expanded.has(k))
                        queue.push(k);
                });
            }
            var hasChildren = function (id) { return (children.get(id) || []).length > 0; };
            var isGroup = function (n) {
                return String(n.kind || '').toLowerCase() === 'group' || hasChildren(n.id);
            };
            var targets = Array.from(expanded)
                .map(function (id) { return byId.get(id); })
                .filter(function (n) { return Boolean(n); })
                .filter(function (n) { return includeGroups || !isGroup(n); });
            var dedup = new Map();
            targets.forEach(function (n) { return dedup.set(n.id, n); });
            return Array.from(dedup.values());
        };
        CanvasService_1.prototype.buildStandardsByOrg = function (organizations, selectedIds, includeGroups) {
            var result = new Map();
            var orgs = organizations.map(function (o) { return ({
                id: String((o === null || o === void 0 ? void 0 : o.id) || '').trim(),
                name: String((o === null || o === void 0 ? void 0 : o.name) || (o === null || o === void 0 ? void 0 : o.id) || '').trim(),
                abbreviation: String((o === null || o === void 0 ? void 0 : o.abbreviation) || (o === null || o === void 0 ? void 0 : o.id) || '').trim(),
                standards: Array.isArray(o === null || o === void 0 ? void 0 : o.standards) ? o.standards : [],
            }); });
            var stdToOrg = new Map();
            orgs.forEach(function (org) {
                (org.standards || []).forEach(function (s) {
                    var sid = String((s === null || s === void 0 ? void 0 : s.id) || '').trim();
                    if (sid)
                        stdToOrg.set(sid, {
                            id: org.id,
                            name: org.name,
                            abbreviation: org.abbreviation,
                        });
                });
            });
            var allOrgs = organizations;
            var targets = this.buildSelectedStandardsOutcomeSet(allOrgs, selectedIds, includeGroups);
            targets.forEach(function (std) {
                var sid = String((std === null || std === void 0 ? void 0 : std.id) || '').trim();
                var org = stdToOrg.get(sid);
                if (!org)
                    return;
                var key = org.abbreviation || org.id;
                if (!result.has(key))
                    result.set(key, { org: org, standards: [] });
                result.get(key).standards.push(std);
            });
            return result;
        };
        CanvasService_1.prototype.ensureOutcomeGroupForOrg = function (courseId, orgAbbrev, orgName, token, baseUrl) {
            return __awaiter(this, void 0, void 0, function () {
                var title, groups, groupRows, existing, existingId, rootGroupId, rootLookupError, rootEndpoints, _i, rootEndpoints_1, endpoint, rootRes, text, payload, id, e_7, form, createRes, createText, createdPayload, createdId;
                var _a, _b, _c, _d;
                return __generator(this, function (_e) {
                    switch (_e.label) {
                        case 0:
                            title = "".concat(orgAbbrev || orgName, " Standards");
                            return [4 /*yield*/, this.fetchPaginatedData("".concat(baseUrl, "/courses/").concat(courseId, "/outcome_groups?per_page=100"), token)];
                        case 1:
                            groups = _e.sent();
                            groupRows = Array.isArray(groups) ? groups : [];
                            existing = groupRows.find(function (g) {
                                return String((g === null || g === void 0 ? void 0 : g.title) || '')
                                    .trim()
                                    .toLowerCase() === title.toLowerCase();
                            });
                            existingId = Number(existing === null || existing === void 0 ? void 0 : existing.id);
                            if (Number.isFinite(existingId))
                                return [2 /*return*/, existingId];
                            rootGroupId = null;
                            rootLookupError = '';
                            rootEndpoints = [
                                "".concat(baseUrl, "/courses/").concat(courseId, "/root_outcome_group"),
                                "".concat(baseUrl, "/accounts/self/root_outcome_group"),
                            ];
                            _i = 0, rootEndpoints_1 = rootEndpoints;
                            _e.label = 2;
                        case 2:
                            if (!(_i < rootEndpoints_1.length)) return [3 /*break*/, 8];
                            endpoint = rootEndpoints_1[_i];
                            _e.label = 3;
                        case 3:
                            _e.trys.push([3, 6, , 7]);
                            return [4 /*yield*/, fetch(endpoint, {
                                    headers: { Authorization: "Bearer ".concat(token) },
                                    redirect: 'follow',
                                })];
                        case 4:
                            rootRes = _e.sent();
                            return [4 /*yield*/, rootRes.text()];
                        case 5:
                            text = _e.sent();
                            if (!rootRes.ok) {
                                rootLookupError =
                                    "lookup ".concat(endpoint, " failed (").concat(rootRes.status, " ").concat(rootRes.statusText, ") ").concat(text || '').trim();
                                return [3 /*break*/, 7];
                            }
                            payload = {};
                            try {
                                payload = text ? JSON.parse(text) : {};
                            }
                            catch (_f) {
                                payload = {};
                            }
                            id = Number((_a = payload === null || payload === void 0 ? void 0 : payload.id) !== null && _a !== void 0 ? _a : (_b = payload === null || payload === void 0 ? void 0 : payload.outcome_group) === null || _b === void 0 ? void 0 : _b.id);
                            if (Number.isFinite(id)) {
                                rootGroupId = id;
                                return [3 /*break*/, 8];
                            }
                            rootLookupError = "lookup ".concat(endpoint, " returned no valid id");
                            return [3 /*break*/, 7];
                        case 6:
                            e_7 = _e.sent();
                            rootLookupError = "lookup ".concat(endpoint, " threw ").concat((e_7 === null || e_7 === void 0 ? void 0 : e_7.message) || String(e_7));
                            return [3 /*break*/, 7];
                        case 7:
                            _i++;
                            return [3 /*break*/, 2];
                        case 8:
                            if (!Number.isFinite(rootGroupId)) {
                                throw new Error("Failed to resolve root outcome group for org \"".concat(orgAbbrev || orgName, "\" in course ").concat(courseId, ". ").concat(rootLookupError || '').trim());
                            }
                            form = new URLSearchParams();
                            form.append('title', title);
                            return [4 /*yield*/, fetch("".concat(baseUrl, "/courses/").concat(courseId, "/outcome_groups/").concat(rootGroupId, "/subgroups"), {
                                    method: 'POST',
                                    headers: {
                                        Authorization: "Bearer ".concat(token),
                                        'Content-Type': 'application/x-www-form-urlencoded',
                                    },
                                    body: form.toString(),
                                    redirect: 'follow',
                                })];
                        case 9:
                            createRes = _e.sent();
                            return [4 /*yield*/, createRes.text()];
                        case 10:
                            createText = _e.sent();
                            if (!createRes.ok) {
                                throw new Error("Failed to create outcome group \"".concat(title, "\" for org \"").concat(orgAbbrev || orgName, "\" in course ").concat(courseId, ". Canvas returned ").concat(createRes.status, " ").concat(createRes.statusText, ". ").concat(createText || '').trim());
                            }
                            createdPayload = {};
                            try {
                                createdPayload = createText ? JSON.parse(createText) : {};
                            }
                            catch (_g) {
                                createdPayload = {};
                            }
                            createdId = Number((_c = createdPayload === null || createdPayload === void 0 ? void 0 : createdPayload.id) !== null && _c !== void 0 ? _c : (_d = createdPayload === null || createdPayload === void 0 ? void 0 : createdPayload.outcome_group) === null || _d === void 0 ? void 0 : _d.id);
                            if (!Number.isFinite(createdId)) {
                                throw new Error("Outcome group create call succeeded but returned no outcome group id for \"".concat(title, "\" in course ").concat(courseId, "."));
                            }
                            return [2 /*return*/, createdId];
                    }
                });
            });
        };
        CanvasService_1.prototype.getOutcomesPreviewByOrg = function (courseId, cip, degreeLevel) {
            return __awaiter(this, void 0, void 0, function () {
                var profile, p, selectedIds, standardsPayload, organizations, byOrg, orgRawByKey, existingOutcomes, existingByStd, orgs;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.getAccreditationProfile(courseId)];
                        case 1:
                            profile = _a.sent();
                            p = profile;
                            selectedIds = Array.isArray(p === null || p === void 0 ? void 0 : p.selectedStandards)
                                ? p.selectedStandards
                                    .map(function (x) { return String(x || '').trim(); })
                                    .filter(Boolean)
                                : [];
                            if (!selectedIds.length)
                                return [2 /*return*/, { orgs: [], message: 'No selected standards.' }];
                            return [4 /*yield*/, this.getAccreditationStandardsForCourse(courseId, cip || undefined, degreeLevel)];
                        case 2:
                            standardsPayload = _a.sent();
                            organizations = Array.isArray(standardsPayload === null || standardsPayload === void 0 ? void 0 : standardsPayload.organizations)
                                ? standardsPayload.organizations
                                : [];
                            byOrg = this.buildStandardsByOrg(organizations, selectedIds, false);
                            orgRawByKey = new Map();
                            organizations.forEach(function (o) {
                                var id = String((o === null || o === void 0 ? void 0 : o.id) || '').trim();
                                var abbr = String((o === null || o === void 0 ? void 0 : o.abbreviation) || '').trim();
                                if (id)
                                    orgRawByKey.set(id.toLowerCase(), o);
                                if (abbr)
                                    orgRawByKey.set(abbr.toLowerCase(), o);
                            });
                            return [4 /*yield*/, this.getCourseOutcomeLinks(courseId)];
                        case 3:
                            existingOutcomes = _a.sent();
                            existingByStd = new Map();
                            (existingOutcomes || []).forEach(function (o) {
                                (Array.isArray(o === null || o === void 0 ? void 0 : o.standards) ? o.standards : []).forEach(function (sid) {
                                    var key = String(sid || '').trim();
                                    if (key)
                                        existingByStd.set(key, o);
                                });
                            });
                            orgs = Array.from(byOrg.entries()).map(function (_a) {
                                var key = _a[0], _b = _a[1], org = _b.org, standards = _b.standards;
                                var toCreate = standards.filter(function (s) { return !existingByStd.has(String(s.id)); });
                                var existing = standards.filter(function (s) {
                                    return existingByStd.has(String(s.id));
                                });
                                var rawOrg = orgRawByKey.get(String(key || '')
                                    .trim()
                                    .toLowerCase()) ||
                                    orgRawByKey.get(String((org === null || org === void 0 ? void 0 : org.abbreviation) || '')
                                        .trim()
                                        .toLowerCase()) ||
                                    orgRawByKey.get(String((org === null || org === void 0 ? void 0 : org.id) || '')
                                        .trim()
                                        .toLowerCase());
                                var orgStandards = Array.isArray(rawOrg === null || rawOrg === void 0 ? void 0 : rawOrg.standards)
                                    ? rawOrg.standards
                                    : [];
                                var nodeById = new Map();
                                orgStandards.forEach(function (s) {
                                    var id = String((s === null || s === void 0 ? void 0 : s.id) || '').trim();
                                    if (!id)
                                        return;
                                    nodeById.set(id, {
                                        id: id,
                                        title: String((s === null || s === void 0 ? void 0 : s.title) || (s === null || s === void 0 ? void 0 : s.id) || '').trim() || id,
                                        parentId: (s === null || s === void 0 ? void 0 : s.parentId) != null
                                            ? String(s.parentId)
                                            : (s === null || s === void 0 ? void 0 : s.parent_id) != null
                                                ? String(s.parent_id)
                                                : null,
                                        kind: (s === null || s === void 0 ? void 0 : s.kind) ? String(s.kind) : undefined,
                                    });
                                });
                                var toCreateIds = new Set(toCreate.map(function (s) { return String(s.id || '').trim(); }).filter(Boolean));
                                var includeIds = new Set(Array.from(toCreateIds));
                                toCreate.forEach(function (s) {
                                    var pid = String((s === null || s === void 0 ? void 0 : s.parentId) || '').trim();
                                    var seen = new Set();
                                    while (pid && nodeById.has(pid) && !seen.has(pid)) {
                                        includeIds.add(pid);
                                        seen.add(pid);
                                        var p_1 = nodeById.get(pid);
                                        pid = String((p_1 === null || p_1 === void 0 ? void 0 : p_1.parentId) || '').trim();
                                    }
                                });
                                var toCreateTree = Array.from(includeIds).map(function (id) {
                                    var n = nodeById.get(id);
                                    return {
                                        id: id,
                                        title: (n === null || n === void 0 ? void 0 : n.title) || id,
                                        parentId: (n === null || n === void 0 ? void 0 : n.parentId) || null,
                                        kind: n === null || n === void 0 ? void 0 : n.kind,
                                        isLeaf: toCreateIds.has(id),
                                    };
                                });
                                return {
                                    orgId: org.id,
                                    orgAbbrev: org.abbreviation,
                                    orgName: org.name,
                                    toCreateCount: toCreate.length,
                                    existingCount: existing.length,
                                    toCreate: toCreate.map(function (s) {
                                        var _a, _b;
                                        return ({
                                            id: s.id,
                                            title: s.title,
                                            parentId: (_a = s.parentId) !== null && _a !== void 0 ? _a : null,
                                            kind: (_b = s.kind) !== null && _b !== void 0 ? _b : null,
                                        });
                                    }),
                                    toCreateTree: toCreateTree,
                                };
                            });
                            return [2 /*return*/, { orgs: orgs }];
                    }
                });
            });
        };
        CanvasService_1.prototype.syncOutcomesForOrg = function (courseId, orgId, orgAbbrev, orgName, cip, degreeLevel, selectedStandardIds) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, token, baseUrl, profile, p, selectedIds, standardsPayload, organizations, byOrg, orgKey, entry, standards, wantSet_1, existingOutcomes, e_8, existingByStd, existingTitles, groupId, e_9, created, skipped, failed, _i, standards_1, std, sid, stitle, outcomeTitle, descParts, outcomeDescription, out, e_10;
                var _b;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            console.log('[syncOutcomesForOrg] start', {
                                courseId: courseId,
                                orgId: orgId,
                                orgAbbrev: orgAbbrev,
                                orgName: orgName,
                                cip: cip,
                                selectedStandardIds: selectedStandardIds === null || selectedStandardIds === void 0 ? void 0 : selectedStandardIds.length,
                            });
                            return [4 /*yield*/, this.getAuthHeaders()];
                        case 1:
                            _a = _c.sent(), token = _a.token, baseUrl = _a.baseUrl;
                            return [4 /*yield*/, this.getAccreditationProfile(courseId)];
                        case 2:
                            profile = _c.sent();
                            p = profile;
                            selectedIds = Array.isArray(p === null || p === void 0 ? void 0 : p.selectedStandards)
                                ? p.selectedStandards
                                    .map(function (x) { return String(x || '').trim(); })
                                    .filter(Boolean)
                                : [];
                            return [4 /*yield*/, this.getAccreditationStandardsForCourse(courseId, cip || undefined, degreeLevel)];
                        case 3:
                            standardsPayload = _c.sent();
                            organizations = Array.isArray(standardsPayload === null || standardsPayload === void 0 ? void 0 : standardsPayload.organizations)
                                ? standardsPayload.organizations
                                : [];
                            byOrg = this.buildStandardsByOrg(organizations, selectedIds, false);
                            orgKey = orgAbbrev || orgId;
                            entry = byOrg.get(orgKey) ||
                                byOrg.get(String(orgId || '').trim()) ||
                                ((_b = Array.from(byOrg.entries()).find(function (_a) {
                                    var k = _a[0];
                                    return String(k || '')
                                        .trim()
                                        .toLowerCase() ===
                                        String(orgKey || '')
                                            .trim()
                                            .toLowerCase();
                                })) === null || _b === void 0 ? void 0 : _b[1]);
                            if (!entry) {
                                console.error('[syncOutcomesForOrg] No entry for orgKey', orgKey, 'keys:', Array.from(byOrg.keys()));
                                return [2 /*return*/, {
                                        summary: { created: 0, skipped: 0, failed: 0 },
                                        created: [],
                                        skipped: [],
                                        failed: [],
                                        message: 'No standards for this org.',
                                    }];
                            }
                            standards = entry.standards;
                            if (Array.isArray(selectedStandardIds) && selectedStandardIds.length) {
                                wantSet_1 = new Set(selectedStandardIds.map(function (s) { return String(s || '').trim(); }).filter(Boolean));
                                standards = standards.filter(function (s) {
                                    return wantSet_1.has(String((s === null || s === void 0 ? void 0 : s.id) || '').trim());
                                });
                            }
                            if (!standards.length) {
                                console.warn('[syncOutcomesForOrg] zero standards after filtering', {
                                    orgKey: orgKey,
                                    selectedStandardIds: (selectedStandardIds === null || selectedStandardIds === void 0 ? void 0 : selectedStandardIds.length) || 0,
                                });
                                return [2 /*return*/, {
                                        summary: { created: 0, skipped: 0, failed: 0 },
                                        created: [],
                                        skipped: [],
                                        failed: [],
                                        message: 'No selected leaf standards to create for this org.',
                                    }];
                            }
                            _c.label = 4;
                        case 4:
                            _c.trys.push([4, 6, , 7]);
                            return [4 /*yield*/, this.getCourseOutcomeLinks(courseId)];
                        case 5:
                            existingOutcomes = _c.sent();
                            return [3 /*break*/, 7];
                        case 6:
                            e_8 = _c.sent();
                            console.error('[syncOutcomesForOrg] getCourseOutcomeLinks failed', e_8 === null || e_8 === void 0 ? void 0 : e_8.message, e_8 === null || e_8 === void 0 ? void 0 : e_8.stack);
                            throw e_8;
                        case 7:
                            existingByStd = new Map();
                            existingTitles = new Set();
                            (existingOutcomes || []).forEach(function (o) {
                                existingTitles.add(String((o === null || o === void 0 ? void 0 : o.title) || '')
                                    .trim()
                                    .toLowerCase());
                                (Array.isArray(o === null || o === void 0 ? void 0 : o.standards) ? o.standards : []).forEach(function (sid) {
                                    var key = String(sid || '').trim();
                                    if (key)
                                        existingByStd.set(key, o);
                                });
                            });
                            _c.label = 8;
                        case 8:
                            _c.trys.push([8, 10, , 11]);
                            return [4 /*yield*/, this.ensureOutcomeGroupForOrg(courseId, orgAbbrev, orgName, token, baseUrl)];
                        case 9:
                            groupId = _c.sent();
                            console.log('[syncOutcomesForOrg] groupId', groupId, 'orgKey', orgKey);
                            return [3 /*break*/, 11];
                        case 10:
                            e_9 = _c.sent();
                            console.error('[syncOutcomesForOrg] ensureOutcomeGroupForOrg failed', orgKey, e_9 === null || e_9 === void 0 ? void 0 : e_9.message, e_9 === null || e_9 === void 0 ? void 0 : e_9.stack);
                            throw e_9;
                        case 11:
                            created = [];
                            skipped = [];
                            failed = [];
                            _i = 0, standards_1 = standards;
                            _c.label = 12;
                        case 12:
                            if (!(_i < standards_1.length)) return [3 /*break*/, 17];
                            std = standards_1[_i];
                            sid = String(std.id || '').trim();
                            stitle = String(std.title || sid).trim();
                            if (!sid || !stitle)
                                return [3 /*break*/, 16];
                            if (existingByStd.get(sid)) {
                                skipped.push({ standard_id: sid, reason: 'already_linked' });
                                return [3 /*break*/, 16];
                            }
                            outcomeTitle = "".concat(sid, " \u2014 ").concat(stitle);
                            if (existingTitles.has(outcomeTitle.toLowerCase())) {
                                skipped.push({ standard_id: sid, reason: 'title_exists' });
                                return [3 /*break*/, 16];
                            }
                            descParts = [
                                std.description ? String(std.description).trim() : '',
                                "Source standard: ".concat(sid),
                            ].filter(Boolean);
                            outcomeDescription = CanvasService.mergeStandardsIntoDescription(descParts.join('\n\n'), [sid]);
                            _c.label = 13;
                        case 13:
                            _c.trys.push([13, 15, , 16]);
                            return [4 /*yield*/, this.createOutcomeInGroup(courseId, groupId, outcomeTitle, outcomeDescription, token, baseUrl)];
                        case 14:
                            out = _c.sent();
                            created.push({
                                standard_id: sid,
                                outcome_id: out.id,
                                title: out.title,
                            });
                            existingTitles.add(outcomeTitle.toLowerCase());
                            return [3 /*break*/, 16];
                        case 15:
                            e_10 = _c.sent();
                            failed.push({ standard_id: sid, error: (e_10 === null || e_10 === void 0 ? void 0 : e_10.message) || 'failed' });
                            return [3 /*break*/, 16];
                        case 16:
                            _i++;
                            return [3 /*break*/, 12];
                        case 17:
                            if (!(created.length > 0)) return [3 /*break*/, 20];
                            return [4 /*yield*/, this.logAccreditationOperation(courseId, 'outcomes_sync_org', '2', {
                                    org: orgKey,
                                    created: created.length,
                                    skipped: skipped.length,
                                    failed: failed.length,
                                })];
                        case 18:
                            _c.sent();
                            return [4 /*yield*/, this.setAccreditationStageState(courseId, '2', 'applied')];
                        case 19:
                            _c.sent();
                            _c.label = 20;
                        case 20: return [2 /*return*/, {
                                created: created,
                                skipped: skipped,
                                failed: failed,
                                summary: {
                                    created: created.length,
                                    skipped: skipped.length,
                                    failed: failed.length,
                                },
                            }];
                    }
                });
            });
        };
        CanvasService_1.prototype.ensureCourseAccreditationOutcomeGroup = function (courseId, token, baseUrl) {
            return __awaiter(this, void 0, void 0, function () {
                var title, groups, existing, existingId, form, attempts, _i, attempts_3, a, res, text, payload, groupId;
                var _a, _b;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            title = 'Accreditation Standards';
                            return [4 /*yield*/, this.fetchPaginatedData("".concat(baseUrl, "/courses/").concat(courseId, "/outcome_groups?per_page=100"), token)];
                        case 1:
                            groups = _c.sent();
                            existing = (Array.isArray(groups) ? groups : []).find(function (g) {
                                return String((g === null || g === void 0 ? void 0 : g.title) || '')
                                    .trim()
                                    .toLowerCase() === title.toLowerCase();
                            });
                            existingId = Number(existing === null || existing === void 0 ? void 0 : existing.id);
                            if (Number.isFinite(existingId))
                                return [2 /*return*/, existingId];
                            form = new URLSearchParams();
                            form.append('title', title);
                            attempts = [
                                {
                                    contentType: 'application/x-www-form-urlencoded',
                                    body: form.toString(),
                                },
                                { contentType: 'application/json', body: JSON.stringify({ title: title }) },
                            ];
                            _i = 0, attempts_3 = attempts;
                            _c.label = 2;
                        case 2:
                            if (!(_i < attempts_3.length)) return [3 /*break*/, 6];
                            a = attempts_3[_i];
                            return [4 /*yield*/, fetch("".concat(baseUrl, "/courses/").concat(courseId, "/outcome_groups"), {
                                    method: 'POST',
                                    headers: {
                                        Authorization: "Bearer ".concat(token),
                                        'Content-Type': a.contentType,
                                    },
                                    body: a.body,
                                })];
                        case 3:
                            res = _c.sent();
                            return [4 /*yield*/, res.text()];
                        case 4:
                            text = _c.sent();
                            if (!res.ok)
                                return [3 /*break*/, 5];
                            try {
                                payload = text ? JSON.parse(text) : {};
                                groupId = Number((_a = payload === null || payload === void 0 ? void 0 : payload.id) !== null && _a !== void 0 ? _a : (_b = payload === null || payload === void 0 ? void 0 : payload.outcome_group) === null || _b === void 0 ? void 0 : _b.id);
                                if (Number.isFinite(groupId))
                                    return [2 /*return*/, groupId];
                            }
                            catch (_d) {
                                /* ignore parse error and try fallback */
                            }
                            _c.label = 5;
                        case 5:
                            _i++;
                            return [3 /*break*/, 2];
                        case 6: throw new Error('Failed to create or resolve Accreditation Standards outcome group');
                    }
                });
            });
        };
        CanvasService_1.prototype.createOutcomeInGroup = function (courseId, groupId, title, description, token, baseUrl) {
            return __awaiter(this, void 0, void 0, function () {
                var form, attempts, lastError, _i, attempts_4, a, res, text, payload, id;
                var _a, _b, _c, _d;
                return __generator(this, function (_e) {
                    switch (_e.label) {
                        case 0:
                            form = new URLSearchParams();
                            form.append('outcome[title]', title);
                            form.append('outcome[description]', description);
                            attempts = [
                                {
                                    contentType: 'application/x-www-form-urlencoded',
                                    body: form.toString(),
                                },
                                {
                                    contentType: 'application/json',
                                    body: JSON.stringify({ outcome: { title: title, description: description } }),
                                },
                                {
                                    contentType: 'application/json',
                                    body: JSON.stringify({ title: title, description: description }),
                                },
                            ];
                            lastError = '';
                            _i = 0, attempts_4 = attempts;
                            _e.label = 1;
                        case 1:
                            if (!(_i < attempts_4.length)) return [3 /*break*/, 5];
                            a = attempts_4[_i];
                            return [4 /*yield*/, fetch("".concat(baseUrl, "/courses/").concat(courseId, "/outcome_groups/").concat(groupId, "/outcomes"), {
                                    method: 'POST',
                                    headers: {
                                        Authorization: "Bearer ".concat(token),
                                        'Content-Type': a.contentType,
                                    },
                                    body: a.body,
                                })];
                        case 2:
                            res = _e.sent();
                            return [4 /*yield*/, res.text()];
                        case 3:
                            text = _e.sent();
                            if (!res.ok) {
                                lastError = text || "".concat(res.status, " ").concat(res.statusText);
                                return [3 /*break*/, 4];
                            }
                            try {
                                payload = text ? JSON.parse(text) : {};
                                id = Number((_c = (_a = payload === null || payload === void 0 ? void 0 : payload.id) !== null && _a !== void 0 ? _a : (_b = payload === null || payload === void 0 ? void 0 : payload.outcome) === null || _b === void 0 ? void 0 : _b.id) !== null && _c !== void 0 ? _c : payload === null || payload === void 0 ? void 0 : payload.outcome_id);
                                return [2 /*return*/, {
                                        id: Number.isFinite(id) ? id : null,
                                        title: String((payload === null || payload === void 0 ? void 0 : payload.title) || ((_d = payload === null || payload === void 0 ? void 0 : payload.outcome) === null || _d === void 0 ? void 0 : _d.title) || title),
                                    }];
                            }
                            catch (_f) {
                                return [2 /*return*/, { id: null, title: title }];
                            }
                            _e.label = 4;
                        case 4:
                            _i++;
                            return [3 /*break*/, 1];
                        case 5: throw new Error("Failed to create outcome \"".concat(title, "\": ").concat(lastError || 'unknown error'));
                    }
                });
            });
        };
        CanvasService_1.prototype.syncCourseOutcomesFromSelectedStandards = function (courseId_1, cip_1, degreeLevel_1) {
            return __awaiter(this, arguments, void 0, function (courseId, cip, degreeLevel, includeGroups) {
                var _a, token, baseUrl, profile, p, profileCip, effectiveCip, _b, selectedIds, standardsPayload, organizations, targetStandards, existingOutcomes, existingByStd, existingTitles, groupId, created, skipped, failed, _i, targetStandards_1, std, sid, stitle, existing, outcomeTitle, descParts, outcomeDescription, out, e_11;
                if (includeGroups === void 0) { includeGroups = false; }
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0: return [4 /*yield*/, this.getAuthHeaders()];
                        case 1:
                            _a = _c.sent(), token = _a.token, baseUrl = _a.baseUrl;
                            return [4 /*yield*/, this.getAccreditationProfile(courseId)];
                        case 2:
                            profile = _c.sent();
                            p = profile;
                            profileCip = ((Array.isArray(p === null || p === void 0 ? void 0 : p.programFocusCip6) &&
                                p.programFocusCip6[0]) ||
                                (p === null || p === void 0 ? void 0 : p.programCip4) ||
                                (p === null || p === void 0 ? void 0 : p.program) ||
                                '').trim();
                            _b = (cip || '').trim() ||
                                profileCip;
                            if (_b) return [3 /*break*/, 4];
                            return [4 /*yield*/, this.getEffectiveCip(courseId)];
                        case 3:
                            _b = (_c.sent());
                            _c.label = 4;
                        case 4:
                            effectiveCip = _b;
                            selectedIds = Array.isArray(p === null || p === void 0 ? void 0 : p.selectedStandards)
                                ? p.selectedStandards
                                    .map(function (x) { return String(x || '').trim(); })
                                    .filter(Boolean)
                                : [];
                            if (!selectedIds.length) {
                                return [2 /*return*/, {
                                        created: [],
                                        skipped: [],
                                        failed: [],
                                        message: 'No selected standards found. Select standards and apply profile first.',
                                    }];
                            }
                            return [4 /*yield*/, this.getAccreditationStandardsForCourse(courseId, effectiveCip || undefined, degreeLevel)];
                        case 5:
                            standardsPayload = _c.sent();
                            organizations = Array.isArray(standardsPayload === null || standardsPayload === void 0 ? void 0 : standardsPayload.organizations)
                                ? standardsPayload.organizations
                                : [];
                            targetStandards = this.buildSelectedStandardsOutcomeSet(organizations, selectedIds, includeGroups);
                            if (!targetStandards.length) {
                                return [2 /*return*/, {
                                        created: [],
                                        skipped: [],
                                        failed: [],
                                        message: 'Selected standards resolved to no outcome targets.',
                                    }];
                            }
                            return [4 /*yield*/, this.getCourseOutcomeLinks(courseId)];
                        case 6:
                            existingOutcomes = _c.sent();
                            existingByStd = new Map();
                            existingTitles = new Set();
                            (existingOutcomes || []).forEach(function (o) {
                                existingTitles.add(String((o === null || o === void 0 ? void 0 : o.title) || '')
                                    .trim()
                                    .toLowerCase());
                                var stds = Array.isArray(o === null || o === void 0 ? void 0 : o.standards) ? o.standards : [];
                                stds.forEach(function (sid) {
                                    var key = String(sid || '').trim();
                                    if (key)
                                        existingByStd.set(key, o);
                                });
                            });
                            return [4 /*yield*/, this.ensureCourseAccreditationOutcomeGroup(courseId, token, baseUrl)];
                        case 7:
                            groupId = _c.sent();
                            created = [];
                            skipped = [];
                            failed = [];
                            _i = 0, targetStandards_1 = targetStandards;
                            _c.label = 8;
                        case 8:
                            if (!(_i < targetStandards_1.length)) return [3 /*break*/, 13];
                            std = targetStandards_1[_i];
                            sid = String(std.id || '').trim();
                            stitle = String(std.title || sid).trim();
                            if (!sid || !stitle)
                                return [3 /*break*/, 12];
                            existing = existingByStd.get(sid);
                            if (existing) {
                                skipped.push({
                                    standard_id: sid,
                                    reason: 'already_linked',
                                    outcome_id: Number(existing === null || existing === void 0 ? void 0 : existing.id) || undefined,
                                });
                                return [3 /*break*/, 12];
                            }
                            outcomeTitle = "".concat(sid, " \u2014 ").concat(stitle);
                            if (existingTitles.has(outcomeTitle.toLowerCase())) {
                                skipped.push({ standard_id: sid, reason: 'title_exists' });
                                return [3 /*break*/, 12];
                            }
                            descParts = [
                                std.description ? String(std.description).trim() : '',
                                "Source standard: ".concat(sid),
                            ].filter(Boolean);
                            outcomeDescription = CanvasService.mergeStandardsIntoDescription(descParts.join('\n\n'), [sid]);
                            _c.label = 9;
                        case 9:
                            _c.trys.push([9, 11, , 12]);
                            return [4 /*yield*/, this.createOutcomeInGroup(courseId, groupId, outcomeTitle, outcomeDescription, token, baseUrl)];
                        case 10:
                            out = _c.sent();
                            created.push({
                                standard_id: sid,
                                outcome_id: out.id,
                                title: out.title,
                            });
                            existingTitles.add(outcomeTitle.toLowerCase());
                            return [3 /*break*/, 12];
                        case 11:
                            e_11 = _c.sent();
                            failed.push({
                                standard_id: sid,
                                error: (e_11 === null || e_11 === void 0 ? void 0 : e_11.message) || 'failed to create outcome',
                            });
                            return [3 /*break*/, 12];
                        case 12:
                            _i++;
                            return [3 /*break*/, 8];
                        case 13:
                            if (!(created.length > 0)) return [3 /*break*/, 16];
                            return [4 /*yield*/, this.logAccreditationOperation(courseId, 'outcomes_sync', '2', {
                                    created: created.length,
                                    skipped: skipped.length,
                                    failed: failed.length,
                                    created_ids: created.map(function (c) { return c.standard_id; }),
                                })];
                        case 14:
                            _c.sent();
                            return [4 /*yield*/, this.setAccreditationStageState(courseId, '2', 'applied')];
                        case 15:
                            _c.sent();
                            _c.label = 16;
                        case 16: return [2 /*return*/, {
                                cip: effectiveCip || null,
                                selected_count: selectedIds.length,
                                target_standard_count: targetStandards.length,
                                created: created,
                                skipped: skipped,
                                failed: failed,
                                summary: {
                                    created: created.length,
                                    skipped: skipped.length,
                                    failed: failed.length,
                                },
                            }];
                    }
                });
            });
        };
        CanvasService_1.normalizeAlignmentText = function (input) {
            return String(input !== null && input !== void 0 ? input : '')
                .replace(CanvasService.STANDARDS_PREFIX_REGEX, ' ')
                .replace(/<[^>]+>/g, ' ')
                .replace(/&nbsp;/gi, ' ')
                .replace(/&amp;/gi, '&')
                .replace(/&lt;/gi, '<')
                .replace(/&gt;/gi, '>')
                .replace(/\s+/g, ' ')
                .trim();
        };
        CanvasService_1.tokenizeAlignmentText = function (input) {
            var text = CanvasService.normalizeAlignmentText(input).toLowerCase();
            if (!text)
                return [];
            return text
                .split(/[^a-z0-9]+/g)
                .map(function (x) { return x.trim(); })
                .filter(function (x) { return x.length >= 3 && !/^\d+$/.test(x); });
        };
        CanvasService_1.suggestStandardsForText = function (input, standards, topN) {
            if (topN === void 0) { topN = 3; }
            var text = CanvasService.normalizeAlignmentText(input);
            var lower = text.toLowerCase();
            if (!text)
                return [];
            var tokenSet = new Set(CanvasService.tokenizeAlignmentText(text));
            var scored = standards
                .map(function (std) {
                var id = String((std === null || std === void 0 ? void 0 : std.id) || '').trim();
                if (!id)
                    return null;
                var title = String((std === null || std === void 0 ? void 0 : std.title) || id).trim();
                var idMentioned = new RegExp("\\b".concat(id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').toLowerCase(), "\\b"), 'i').test(lower);
                var standardTokens = Array.from(new Set(CanvasService.tokenizeAlignmentText("".concat(id, " ").concat(title, " ").concat((std === null || std === void 0 ? void 0 : std.description) || ''))));
                var overlaps = standardTokens.filter(function (t) { return tokenSet.has(t); });
                var overlapScore = standardTokens.length
                    ? overlaps.length / Math.max(4, Math.min(16, standardTokens.length))
                    : 0;
                var titleMatch = title && lower.includes(title.toLowerCase()) ? 0.25 : 0;
                var score = Math.min(1, (idMentioned ? 0.75 : 0.15) + overlapScore + titleMatch);
                if (!idMentioned && score < 0.22)
                    return null;
                return {
                    id: id,
                    title: title,
                    score: Number(score.toFixed(3)),
                    matched_terms: overlaps.slice(0, 6),
                    reason: idMentioned
                        ? "Direct standard ID mention (".concat(id, ")")
                        : "Matched terms: ".concat(overlaps.slice(0, 6).join(', ') || 'semantic overlap'),
                };
            })
                .filter(function (x) { return Boolean(x); })
                .sort(function (a, b) { return b.score - a.score || a.id.localeCompare(b.id); });
            return scored.slice(0, topN);
        };
        CanvasService_1.prototype.extractRubricCriteriaText = function (rubric) {
            var rawCriteria = Array.isArray(rubric === null || rubric === void 0 ? void 0 : rubric.data)
                ? rubric.data
                : Array.isArray(rubric === null || rubric === void 0 ? void 0 : rubric.criteria)
                    ? rubric.criteria
                    : [];
            return rawCriteria
                .map(function (c, idx) {
                var cid = String((c === null || c === void 0 ? void 0 : c.id) || (c === null || c === void 0 ? void 0 : c.criterion_id) || "criterion_".concat(idx + 1));
                var text = String((c === null || c === void 0 ? void 0 : c.long_description) || (c === null || c === void 0 ? void 0 : c.description) || (c === null || c === void 0 ? void 0 : c.title) || '').trim();
                if (!text)
                    return null;
                return { id: cid, text: text };
            })
                .filter(Boolean);
        };
        CanvasService_1.prototype.getCourseRubricAlignmentRows = function (courseId) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, token, baseUrl, htmlBase, rows;
                var _this = this;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.getAuthHeaders()];
                        case 1:
                            _a = _b.sent(), token = _a.token, baseUrl = _a.baseUrl;
                            htmlBase = this.canvasHtmlBase(baseUrl);
                            return [4 /*yield*/, this.fetchPaginatedData("".concat(baseUrl, "/courses/").concat(courseId, "/rubrics?per_page=100&include[]=associations"), token)];
                        case 2:
                            rows = _b.sent();
                            return [2 /*return*/, rows
                                    .map(function (r) {
                                    var id = Number(r === null || r === void 0 ? void 0 : r.id);
                                    if (!Number.isFinite(id))
                                        return null;
                                    var title = String((r === null || r === void 0 ? void 0 : r.title) || "Rubric ".concat(id));
                                    var criteria = _this.extractRubricCriteriaText(r);
                                    var associations = (Array.isArray(r === null || r === void 0 ? void 0 : r.associations) ? r.associations : [])
                                        .filter(function (a) { return String((a === null || a === void 0 ? void 0 : a.association_type) || '') === 'Assignment'; })
                                        .map(function (a) { return Number(a === null || a === void 0 ? void 0 : a.association_id); })
                                        .filter(function (n) { return Number.isFinite(n); });
                                    return {
                                        id: id,
                                        title: title,
                                        url: "".concat(htmlBase, "/courses/").concat(courseId, "/rubrics/").concat(id),
                                        criteria: criteria,
                                        assignment_ids: associations,
                                    };
                                })
                                    .filter(Boolean)];
                    }
                });
            });
        };
        CanvasService_1.prototype.getCourseAlignmentResources = function (courseId) {
            return __awaiter(this, void 0, void 0, function () {
                var baseUrl, htmlBase, _a, assignments, pages, discussions, announcements, modules, files, resources;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.getAuthHeaders()];
                        case 1:
                            baseUrl = (_b.sent()).baseUrl;
                            htmlBase = this.canvasHtmlBase(baseUrl);
                            return [4 /*yield*/, Promise.all([
                                    this.getCourseAssignments(courseId),
                                    this.getCoursePages(courseId),
                                    this.getCourseDiscussions(courseId),
                                    this.getCourseAnnouncements(courseId),
                                    this.getCourseModules(courseId),
                                    this.getCourseFiles(courseId),
                                ])];
                        case 2:
                            _a = _b.sent(), assignments = _a[0], pages = _a[1], discussions = _a[2], announcements = _a[3], modules = _a[4], files = _a[5];
                            resources = [];
                            (assignments || []).forEach(function (a) {
                                var id = Number(a === null || a === void 0 ? void 0 : a.id);
                                if (!Number.isFinite(id))
                                    return;
                                var title = String((a === null || a === void 0 ? void 0 : a.name) || "Assignment ".concat(id));
                                var desc = String((a === null || a === void 0 ? void 0 : a.description) || '');
                                resources.push({
                                    resource_type: 'assignment',
                                    resource_id: String(id),
                                    title: title,
                                    text: "".concat(title, " ").concat(desc).trim(),
                                    url: "".concat(htmlBase, "/courses/").concat(courseId, "/assignments/").concat(id),
                                });
                            });
                            (pages || []).forEach(function (p) {
                                var slug = String((p === null || p === void 0 ? void 0 : p.url) || (p === null || p === void 0 ? void 0 : p.page_id) || '').trim();
                                if (!slug)
                                    return;
                                var title = String((p === null || p === void 0 ? void 0 : p.title) || slug);
                                var body = String((p === null || p === void 0 ? void 0 : p.body) || '');
                                resources.push({
                                    resource_type: 'page',
                                    resource_id: slug,
                                    title: title,
                                    text: "".concat(title, " ").concat(body).trim(),
                                    url: (p === null || p === void 0 ? void 0 : p.html_url)
                                        ? String(p.html_url)
                                        : "".concat(htmlBase, "/courses/").concat(courseId, "/pages/").concat(encodeURIComponent(slug)),
                                });
                            });
                            (discussions || []).forEach(function (d) {
                                var id = Number(d === null || d === void 0 ? void 0 : d.id);
                                if (!Number.isFinite(id))
                                    return;
                                var title = String((d === null || d === void 0 ? void 0 : d.title) || "Discussion ".concat(id));
                                var body = String((d === null || d === void 0 ? void 0 : d.message) || '');
                                resources.push({
                                    resource_type: 'discussion',
                                    resource_id: String(id),
                                    title: title,
                                    text: "".concat(title, " ").concat(body).trim(),
                                    url: "".concat(htmlBase, "/courses/").concat(courseId, "/discussion_topics/").concat(id),
                                });
                            });
                            (announcements || []).forEach(function (a) {
                                var id = Number(a === null || a === void 0 ? void 0 : a.id);
                                if (!Number.isFinite(id))
                                    return;
                                var title = String((a === null || a === void 0 ? void 0 : a.title) || "Announcement ".concat(id));
                                var body = String((a === null || a === void 0 ? void 0 : a.message) || '');
                                resources.push({
                                    resource_type: 'announcement',
                                    resource_id: String(id),
                                    title: title,
                                    text: "".concat(title, " ").concat(body).trim(),
                                    url: "".concat(htmlBase, "/courses/").concat(courseId, "/discussion_topics/").concat(id),
                                });
                            });
                            (modules || []).forEach(function (m) {
                                var id = Number(m === null || m === void 0 ? void 0 : m.id);
                                if (!Number.isFinite(id))
                                    return;
                                var title = String((m === null || m === void 0 ? void 0 : m.name) || "Module ".concat(id));
                                var items = Array.isArray(m === null || m === void 0 ? void 0 : m.items)
                                    ? m.items
                                        .map(function (i) { return String((i === null || i === void 0 ? void 0 : i.title) || (i === null || i === void 0 ? void 0 : i.type) || ''); })
                                        .filter(Boolean)
                                        .join(' ')
                                    : '';
                                resources.push({
                                    resource_type: 'module',
                                    resource_id: String(id),
                                    title: title,
                                    text: "".concat(title, " ").concat(items).trim(),
                                    url: "".concat(htmlBase, "/courses/").concat(courseId, "/modules/").concat(id),
                                });
                            });
                            (files || []).forEach(function (f) {
                                if (f === null || f === void 0 ? void 0 : f.is_folder)
                                    return;
                                var id = Number(f === null || f === void 0 ? void 0 : f.id);
                                if (!Number.isFinite(id))
                                    return;
                                var title = String((f === null || f === void 0 ? void 0 : f.display_name) || (f === null || f === void 0 ? void 0 : f.filename) || "File ".concat(id));
                                var text = "".concat(title, " ").concat(String((f === null || f === void 0 ? void 0 : f.content_type) || ''), " ").concat(String((f === null || f === void 0 ? void 0 : f.folder_path) || '')).trim();
                                resources.push({
                                    resource_type: 'file',
                                    resource_id: String(id),
                                    title: title,
                                    text: text,
                                    url: (f === null || f === void 0 ? void 0 : f.url) ? String(f.url) : null,
                                });
                            });
                            return [2 /*return*/, resources];
                    }
                });
            });
        };
        CanvasService_1.prototype.getAccreditationAlignment = function (courseId, cip, degreeLevel) {
            return __awaiter(this, void 0, void 0, function () {
                var profile, p, profileCip, effectiveCip, _a, standardsPayload, selectedStandardIds, allStandards, byId, standards, outcomes, outcome_mappings, rubrics, rubric_mappings, _b, quizzes, newQuizzes, quiz_mappings, new_quiz_mappings, resources, resource_mappings, rubricRows, assignmentIdsWithRubrics, assignmentsOnly, discussionsOnly, assignmentsWithoutRubrics, discussionsWithoutRubrics, rubric_suggestions;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0: return [4 /*yield*/, this.getAccreditationProfile(courseId)];
                        case 1:
                            profile = _c.sent();
                            p = profile;
                            profileCip = ((Array.isArray(p === null || p === void 0 ? void 0 : p.programFocusCip6) &&
                                p.programFocusCip6[0]) ||
                                (p === null || p === void 0 ? void 0 : p.programCip4) ||
                                (p === null || p === void 0 ? void 0 : p.program) ||
                                '').trim();
                            _a = (cip || '').trim() ||
                                profileCip;
                            if (_a) return [3 /*break*/, 3];
                            return [4 /*yield*/, this.getEffectiveCip(courseId)];
                        case 2:
                            _a = (_c.sent());
                            _c.label = 3;
                        case 3:
                            effectiveCip = _a;
                            return [4 /*yield*/, this.getAccreditationStandardsForCourse(courseId, effectiveCip || undefined, degreeLevel)];
                        case 4:
                            standardsPayload = _c.sent();
                            selectedStandardIds = new Set(Array.isArray(p === null || p === void 0 ? void 0 : p.selectedStandards)
                                ? p.selectedStandards
                                    .map(function (x) { return String(x || '').trim(); })
                                    .filter(Boolean)
                                : []);
                            allStandards = (Array.isArray(standardsPayload === null || standardsPayload === void 0 ? void 0 : standardsPayload.organizations)
                                ? standardsPayload.organizations
                                : [])
                                .flatMap(function (o) { return (Array.isArray(o === null || o === void 0 ? void 0 : o.standards) ? o.standards : []); })
                                .map(function (s) { return ({
                                id: String((s === null || s === void 0 ? void 0 : s.id) || '').trim(),
                                title: String((s === null || s === void 0 ? void 0 : s.title) || (s === null || s === void 0 ? void 0 : s.id) || '').trim(),
                                description: (s === null || s === void 0 ? void 0 : s.description) ? String(s.description) : null,
                                kind: (s === null || s === void 0 ? void 0 : s.kind) ? String(s.kind) : undefined,
                            }); })
                                .filter(function (s) { return s.id && s.title; });
                            byId = new Map();
                            allStandards.forEach(function (s) {
                                if (!byId.has(s.id))
                                    byId.set(s.id, s);
                            });
                            standards = (selectedStandardIds.size
                                ? Array.from(selectedStandardIds)
                                    .map(function (id) { return byId.get(id); })
                                    .filter(Boolean)
                                : Array.from(byId.values())).slice(0, 800);
                            return [4 /*yield*/, this.getCourseOutcomeLinks(courseId)];
                        case 5:
                            outcomes = _c.sent();
                            outcome_mappings = outcomes.map(function (o) {
                                var existing = Array.isArray(o === null || o === void 0 ? void 0 : o.standards)
                                    ? o.standards
                                        .map(function (x) { return String(x || '').trim(); })
                                        .filter(Boolean)
                                    : [];
                                var suggestions = CanvasService.suggestStandardsForText("".concat((o === null || o === void 0 ? void 0 : o.title) || '', " ").concat((o === null || o === void 0 ? void 0 : o.description) || ''), standards, 4).filter(function (s) { return !existing.includes(s.id); });
                                return {
                                    outcome_id: Number(o === null || o === void 0 ? void 0 : o.id),
                                    title: String((o === null || o === void 0 ? void 0 : o.title) || ''),
                                    existing_standards: existing,
                                    suggested_standards: suggestions,
                                };
                            });
                            return [4 /*yield*/, this.getCourseRubricAlignmentRows(courseId)];
                        case 6:
                            rubrics = _c.sent();
                            rubric_mappings = rubrics.map(function (r) {
                                var criteria = Array.isArray(r === null || r === void 0 ? void 0 : r.criteria) ? r.criteria : [];
                                var criterion_mappings = criteria.map(function (c) { return ({
                                    criterion_id: String((c === null || c === void 0 ? void 0 : c.id) || ''),
                                    text: String((c === null || c === void 0 ? void 0 : c.text) || ''),
                                    suggested_standards: CanvasService.suggestStandardsForText((c === null || c === void 0 ? void 0 : c.text) || '', standards, 3),
                                }); });
                                var summaryText = "".concat(String((r === null || r === void 0 ? void 0 : r.title) || ''), " ").concat(criteria.map(function (c) { return String((c === null || c === void 0 ? void 0 : c.text) || ''); }).join(' '));
                                return {
                                    rubric_id: Number(r === null || r === void 0 ? void 0 : r.id),
                                    title: String((r === null || r === void 0 ? void 0 : r.title) || ''),
                                    url: (r === null || r === void 0 ? void 0 : r.url) ? String(r.url) : null,
                                    assignment_ids: Array.isArray(r === null || r === void 0 ? void 0 : r.assignment_ids)
                                        ? r.assignment_ids
                                        : [],
                                    suggested_standards: CanvasService.suggestStandardsForText(summaryText, standards, 4),
                                    criteria: criterion_mappings,
                                };
                            });
                            return [4 /*yield*/, Promise.all([
                                    this.getCourseQuizzes(courseId),
                                    this.getCourseNewQuizzes(courseId),
                                ])];
                        case 7:
                            _b = _c.sent(), quizzes = _b[0], newQuizzes = _b[1];
                            quiz_mappings = (quizzes || [])
                                .map(function (q) {
                                var id = Number(q === null || q === void 0 ? void 0 : q.id);
                                if (!Number.isFinite(id))
                                    return null;
                                var text = "".concat((q === null || q === void 0 ? void 0 : q.title) || '', " ").concat((q === null || q === void 0 ? void 0 : q.description) || '', " ").concat((q === null || q === void 0 ? void 0 : q.instructions) || '').trim();
                                var suggested = CanvasService.suggestStandardsForText(text, standards, 3);
                                if (!suggested.length)
                                    return null;
                                return {
                                    resource_type: 'quiz',
                                    resource_id: String(id),
                                    title: String((q === null || q === void 0 ? void 0 : q.title) || "Quiz ".concat(id)),
                                    url: null,
                                    suggested_standards: suggested,
                                };
                            })
                                .filter(Boolean)
                                .slice(0, 50);
                            new_quiz_mappings = (newQuizzes || [])
                                .map(function (q) {
                                var _a;
                                var id = Number((_a = q === null || q === void 0 ? void 0 : q.id) !== null && _a !== void 0 ? _a : q === null || q === void 0 ? void 0 : q.assignment_id);
                                if (!Number.isFinite(id))
                                    return null;
                                var text = "".concat((q === null || q === void 0 ? void 0 : q.title) || '', " ").concat((q === null || q === void 0 ? void 0 : q.description) || '').trim();
                                var suggested = CanvasService.suggestStandardsForText(text, standards, 3);
                                if (!suggested.length)
                                    return null;
                                return {
                                    resource_type: 'new_quiz',
                                    resource_id: String(id),
                                    title: String((q === null || q === void 0 ? void 0 : q.title) || "New Quiz ".concat(id)),
                                    url: null,
                                    suggested_standards: suggested,
                                };
                            })
                                .filter(Boolean)
                                .slice(0, 50);
                            return [4 /*yield*/, this.getCourseAlignmentResources(courseId)];
                        case 8:
                            resources = _c.sent();
                            resource_mappings = resources
                                .map(function (r) {
                                var suggested = CanvasService.suggestStandardsForText(r.text, standards, 3);
                                if (!suggested.length)
                                    return null;
                                return {
                                    resource_type: r.resource_type,
                                    resource_id: r.resource_id,
                                    title: r.title,
                                    url: r.url,
                                    suggested_standards: suggested,
                                };
                            })
                                .filter(Boolean)
                                .sort(function (a, b) {
                                var _a, _b, _c, _d;
                                return (((_b = (_a = b === null || b === void 0 ? void 0 : b.suggested_standards) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.score) || 0) -
                                    (((_d = (_c = a === null || a === void 0 ? void 0 : a.suggested_standards) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.score) || 0);
                            })
                                .slice(0, 120);
                            return [4 /*yield*/, this.getCourseRubricAlignmentRows(courseId)];
                        case 9:
                            rubricRows = _c.sent();
                            assignmentIdsWithRubrics = new Set(rubricRows.flatMap(function (r) {
                                return Array.isArray(r === null || r === void 0 ? void 0 : r.assignment_ids) ? r.assignment_ids : [];
                            }));
                            assignmentsOnly = resources.filter(function (r) { return r.resource_type === 'assignment'; });
                            discussionsOnly = resources.filter(function (r) { return r.resource_type === 'discussion'; });
                            assignmentsWithoutRubrics = assignmentsOnly.filter(function (r) { return !assignmentIdsWithRubrics.has(Number(r.resource_id)); });
                            discussionsWithoutRubrics = discussionsOnly;
                            rubric_suggestions = {
                                existing: rubric_mappings,
                                without_rubrics: __spreadArray(__spreadArray([], assignmentsWithoutRubrics, true), discussionsWithoutRubrics, true).map(function (r) {
                                    var suggested = CanvasService.suggestStandardsForText(r.text, standards, 3);
                                    return {
                                        resource_type: r.resource_type,
                                        resource_id: r.resource_id,
                                        title: r.title,
                                        url: r.url,
                                        suggested_standards: suggested,
                                    };
                                })
                                    .filter(function (x) {
                                    return Array.isArray(x.suggested_standards) &&
                                        x.suggested_standards.length;
                                }),
                            };
                            return [2 /*return*/, {
                                    cip: effectiveCip || null,
                                    standards_considered: standards.length,
                                    selected_standards: Array.from(selectedStandardIds),
                                    outcome_mappings: outcome_mappings,
                                    rubric_mappings: rubric_mappings,
                                    resource_mappings: resource_mappings,
                                    rubric_suggestions: rubric_suggestions,
                                    quiz_mappings: quiz_mappings || [],
                                    new_quiz_mappings: new_quiz_mappings || [],
                                    summary: {
                                        outcomes: outcome_mappings.length,
                                        outcomes_with_suggestions: outcome_mappings.filter(function (x) {
                                            return Array.isArray(x.suggested_standards) &&
                                                x.suggested_standards.length > 0;
                                        }).length,
                                        rubrics: rubric_mappings.length,
                                        rubric_criteria: rubric_mappings.reduce(function (n, r) {
                                            return n + (Array.isArray(r.criteria) ? r.criteria.length : 0);
                                        }, 0),
                                        resources_scanned: resources.length,
                                        resources_with_suggestions: resource_mappings.length,
                                    },
                                }];
                    }
                });
            });
        };
        CanvasService_1.buildAccreditationTagBlock = function (standards) {
            if (!standards.length)
                return '';
            var lines = standards.map(function (s) { return "\u2022 ".concat(s.id, " \u2014 ").concat(s.title).concat(s.org ? " (".concat(s.org, ")") : ''); });
            var visible = '\n\n--- Accreditation Alignment ---\nThis activity addresses the following standards:\n' +
                lines.join('\n');
            var machine = "<!-- accreditation:".concat(JSON.stringify({ standards: standards.map(function (s) { return s.id; }) }), " -->");
            return visible + '\n' + machine;
        };
        CanvasService_1.prototype.applyResourceTagging = function (courseId, resourceType, resourceId, standards) {
            return __awaiter(this, void 0, void 0, function () {
                var block, a, desc, d, msg, p, body, a, msg;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!['assignment', 'discussion', 'page', 'announcement'].includes(resourceType) ||
                                !standards.length) {
                                throw new Error('Invalid resource type or empty standards');
                            }
                            block = CanvasService.buildAccreditationTagBlock(standards);
                            if (!(resourceType === 'assignment')) return [3 /*break*/, 3];
                            return [4 /*yield*/, this.getAssignment(courseId, Number(resourceId))];
                        case 1:
                            a = _a.sent();
                            desc = String((a === null || a === void 0 ? void 0 : a.description) || '');
                            if (desc.includes('--- Accreditation Alignment ---'))
                                throw new Error('Tagging already applied');
                            return [4 /*yield*/, this.updateAssignment(courseId, Number(resourceId), {
                                    description: desc + block,
                                })];
                        case 2:
                            _a.sent();
                            return [3 /*break*/, 12];
                        case 3:
                            if (!(resourceType === 'discussion')) return [3 /*break*/, 6];
                            return [4 /*yield*/, this.getDiscussion(courseId, Number(resourceId))];
                        case 4:
                            d = _a.sent();
                            msg = String((d === null || d === void 0 ? void 0 : d.message) || '');
                            if (msg.includes('--- Accreditation Alignment ---'))
                                throw new Error('Tagging already applied');
                            return [4 /*yield*/, this.updateDiscussion(courseId, Number(resourceId), {
                                    message: msg + block,
                                })];
                        case 5:
                            _a.sent();
                            return [3 /*break*/, 12];
                        case 6:
                            if (!(resourceType === 'page')) return [3 /*break*/, 9];
                            return [4 /*yield*/, this.getPage(courseId, resourceId)];
                        case 7:
                            p = _a.sent();
                            body = String((p === null || p === void 0 ? void 0 : p.body) || '');
                            if (body.includes('--- Accreditation Alignment ---'))
                                throw new Error('Tagging already applied');
                            return [4 /*yield*/, this.updatePage(courseId, resourceId, {
                                    wiki_page: { body: body + block },
                                })];
                        case 8:
                            _a.sent();
                            return [3 /*break*/, 12];
                        case 9:
                            if (!(resourceType === 'announcement')) return [3 /*break*/, 12];
                            return [4 /*yield*/, this.getAnnouncement(courseId, Number(resourceId))];
                        case 10:
                            a = _a.sent();
                            msg = String((a === null || a === void 0 ? void 0 : a.message) || '');
                            if (msg.includes('--- Accreditation Alignment ---'))
                                throw new Error('Tagging already applied');
                            return [4 /*yield*/, this.updateAnnouncement(courseId, Number(resourceId), {
                                    message: msg + block,
                                })];
                        case 11:
                            _a.sent();
                            _a.label = 12;
                        case 12: return [4 /*yield*/, this.logAccreditationOperation(courseId, 'resource_tagging', '4', {
                                resource_type: resourceType,
                                resource_id: resourceId,
                            })];
                        case 13:
                            _a.sent();
                            return [2 /*return*/, { success: true }];
                    }
                });
            });
        };
        CanvasService_1.prototype.applyQuizTagging = function (courseId, quizId, standards) {
            return __awaiter(this, void 0, void 0, function () {
                var q, desc, block;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!standards.length)
                                throw new Error('Empty standards');
                            return [4 /*yield*/, this.getQuiz(courseId, quizId)];
                        case 1:
                            q = _a.sent();
                            desc = String((q === null || q === void 0 ? void 0 : q.description) || (q === null || q === void 0 ? void 0 : q.instructions) || '');
                            if (desc.includes('--- Accreditation Alignment ---'))
                                throw new Error('Tagging already applied');
                            block = CanvasService.buildAccreditationTagBlock(standards);
                            return [4 /*yield*/, this.updateQuiz(courseId, quizId, { description: desc + block })];
                        case 2:
                            _a.sent();
                            return [4 /*yield*/, this.logAccreditationOperation(courseId, 'quiz_tagging', '5', {
                                    quiz_id: quizId,
                                })];
                        case 3:
                            _a.sent();
                            return [2 /*return*/, { success: true }];
                    }
                });
            });
        };
        CanvasService_1.prototype.createRubricForResource = function (courseId, resourceType, resourceId, criteria) {
            return __awaiter(this, void 0, void 0, function () {
                var assocType, assocId, title, _a, token, baseUrl, htmlBase, params, res, _b, _c, payload, rubric, id;
                return __generator(this, function (_d) {
                    switch (_d.label) {
                        case 0:
                            if (!['assignment', 'discussion'].includes(resourceType) ||
                                !criteria.length) {
                                throw new Error('Invalid resource type or empty criteria');
                            }
                            assocType = resourceType === 'discussion' ? 'DiscussionTopic' : 'Assignment';
                            assocId = Number(resourceId);
                            if (!Number.isFinite(assocId))
                                throw new Error('Invalid resource id');
                            title = resourceType === 'assignment'
                                ? "Assignment ".concat(assocId, " Rubric")
                                : "Discussion ".concat(assocId, " Rubric");
                            return [4 /*yield*/, this.getAuthHeaders()];
                        case 1:
                            _a = _d.sent(), token = _a.token, baseUrl = _a.baseUrl;
                            htmlBase = this.canvasHtmlBase(baseUrl);
                            params = new URLSearchParams();
                            params.append('rubric[title]', title);
                            params.append('rubric[free_form_criterion_comments]', 'true');
                            params.append('rubric_association[association_id]', String(assocId));
                            params.append('rubric_association[association_type]', assocType);
                            params.append('rubric_association[purpose]', 'grading');
                            params.append('rubric_association[use_for_grading]', 'true');
                            criteria.forEach(function (c, i) {
                                var pts = Number(c.points) || 1;
                                params.append("rubric[criteria][".concat(i, "][description]"), c.description || "Criterion ".concat(i + 1));
                                params.append("rubric[criteria][".concat(i, "][points]"), String(pts));
                                if (c.outcome_id && Number.isFinite(c.outcome_id)) {
                                    params.append("rubric[criteria][".concat(i, "][learning_outcome_id]"), String(c.outcome_id));
                                }
                                params.append("rubric[criteria][".concat(i, "][ratings][0][description]"), 'Not met');
                                params.append("rubric[criteria][".concat(i, "][ratings][0][points]"), '0');
                                params.append("rubric[criteria][".concat(i, "][ratings][1][description]"), 'Met');
                                params.append("rubric[criteria][".concat(i, "][ratings][1][points]"), String(pts));
                            });
                            return [4 /*yield*/, fetch("".concat(baseUrl, "/courses/").concat(courseId, "/rubrics"), {
                                    method: 'POST',
                                    headers: {
                                        Authorization: "Bearer ".concat(token),
                                        'Content-Type': 'application/x-www-form-urlencoded',
                                    },
                                    body: params.toString(),
                                })];
                        case 2:
                            res = _d.sent();
                            if (!!res.ok) return [3 /*break*/, 4];
                            _b = Error.bind;
                            _c = "Failed to create rubric: ".concat;
                            return [4 /*yield*/, res.text()];
                        case 3: throw new (_b.apply(Error, [void 0, _c.apply("Failed to create rubric: ", [_d.sent()])]))();
                        case 4: return [4 /*yield*/, res.json()];
                        case 5:
                            payload = _d.sent();
                            rubric = (payload === null || payload === void 0 ? void 0 : payload.rubric) || payload;
                            id = Number(rubric === null || rubric === void 0 ? void 0 : rubric.id);
                            if (!Number.isFinite(id))
                                throw new Error('Rubric created but ID not returned');
                            return [4 /*yield*/, this.logAccreditationOperation(courseId, 'rubric_created', '3', {
                                    resource_type: resourceType,
                                    resource_id: resourceId,
                                    rubric_id: id,
                                })];
                        case 6:
                            _d.sent();
                            return [2 /*return*/, {
                                    id: id,
                                    title: String((rubric === null || rubric === void 0 ? void 0 : rubric.title) || title),
                                    url: "".concat(htmlBase, "/courses/").concat(courseId, "/rubrics/").concat(id),
                                }];
                    }
                });
            });
        };
        CanvasService_1.prototype.getInstructionAlignmentSuggestions = function (courseId, cip) {
            return __awaiter(this, void 0, void 0, function () {
                var alignment, outcomes, resources, assignAndDisc;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.getAccreditationAlignment(courseId, cip, undefined)];
                        case 1:
                            alignment = _a.sent();
                            outcomes = ((alignment === null || alignment === void 0 ? void 0 : alignment.outcome_mappings) || []).map(function (o) { return ({
                                id: o.outcome_id,
                                title: o.title,
                                description: '',
                            }); });
                            return [4 /*yield*/, this.getCourseAlignmentResources(courseId)];
                        case 2:
                            resources = _a.sent();
                            assignAndDisc = resources.filter(function (r) {
                                return r.resource_type === 'assignment' || r.resource_type === 'discussion';
                            });
                            return [2 /*return*/, {
                                    resources: assignAndDisc.slice(0, 30).map(function (r) { return ({
                                        resource_type: r.resource_type,
                                        resource_id: r.resource_id,
                                        title: r.title,
                                        url: r.url,
                                        option_a: null,
                                        option_b: null,
                                    }); }),
                                    outcomes: outcomes,
                                }];
                    }
                });
            });
        };
        CanvasService_1.prototype.applyNewQuizTagging = function (courseId, assignmentId, standards) {
            return __awaiter(this, void 0, void 0, function () {
                var rows, row, desc, block;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!standards.length)
                                throw new Error('Empty standards');
                            return [4 /*yield*/, this.getCourseNewQuizzes(courseId)];
                        case 1:
                            rows = _a.sent();
                            row = (rows || []).find(function (r) { return Number((r === null || r === void 0 ? void 0 : r.id) || (r === null || r === void 0 ? void 0 : r.assignment_id)) === assignmentId; });
                            if (!row)
                                throw new Error('New Quiz not found');
                            desc = String((row === null || row === void 0 ? void 0 : row.description) || (row === null || row === void 0 ? void 0 : row.instructions) || '');
                            if (desc.includes('--- Accreditation Alignment ---'))
                                throw new Error('Tagging already applied');
                            block = CanvasService.buildAccreditationTagBlock(standards);
                            return [4 /*yield*/, this.updateNewQuizRow(courseId, assignmentId, {
                                    description: desc + block,
                                })];
                        case 2:
                            _a.sent();
                            return [4 /*yield*/, this.logAccreditationOperation(courseId, 'new_quiz_tagging', '5', {
                                    assignment_id: assignmentId,
                                })];
                        case 3:
                            _a.sent();
                            return [2 /*return*/, { success: true }];
                    }
                });
            });
        };
        CanvasService_1.prototype.resolveAccessibilityResourceTypes = function (resourceTypes) {
            var allowed = new Set(CanvasService.ACCESSIBILITY_SUPPORTED_TYPES);
            var requested = Array.isArray(resourceTypes)
                ? resourceTypes
                    .map(function (x) {
                    return String(x || '')
                        .trim()
                        .toLowerCase();
                })
                    .filter(Boolean)
                : [];
            if (!requested.length)
                return Array.from(allowed);
            return requested.filter(function (x) { return allowed.has(x); });
        };
        CanvasService_1.prototype.escapeCsvCell = function (value) {
            var s = String(value !== null && value !== void 0 ? value : '');
            if (/[",\r\n]/.test(s))
                return "\"".concat(s.replace(/"/g, '""'), "\"");
            return s;
        };
        CanvasService_1.prototype.snippet = function (text, max) {
            if (max === void 0) { max = 220; }
            var t = String(text || '')
                .replace(/\s+/g, ' ')
                .trim();
            return t.length <= max ? t : "".concat(t.slice(0, max - 1), "\u2026");
        };
        CanvasService_1.prototype.addFinding = function (findings, base, rule_id, severity, message, snippet) {
            findings.push(__assign(__assign({}, base), { rule_id: rule_id, tier: accessibilityTierForRuleId(rule_id), severity: severity, message: message, snippet: snippet ? this.snippet(snippet) : null }));
        };
        CanvasService_1.prototype.parseCssColor = function (input) {
            var s = String(input || '')
                .trim()
                .toLowerCase();
            if (!s)
                return null;
            var hex = s.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
            if (hex) {
                var raw = hex[1];
                var full = raw.length === 3
                    ? raw
                        .split('')
                        .map(function (c) { return c + c; })
                        .join('')
                    : raw;
                return {
                    r: parseInt(full.slice(0, 2), 16),
                    g: parseInt(full.slice(2, 4), 16),
                    b: parseInt(full.slice(4, 6), 16),
                };
            }
            var rgb = s.match(/^rgba?\(([^)]+)\)$/);
            if (rgb) {
                var parts = rgb[1].split(',').map(function (x) { return Number(x.trim()); });
                if (parts.length >= 3 &&
                    parts.slice(0, 3).every(function (n) { return Number.isFinite(n); })) {
                    return {
                        r: Math.max(0, Math.min(255, parts[0])),
                        g: Math.max(0, Math.min(255, parts[1])),
                        b: Math.max(0, Math.min(255, parts[2])),
                    };
                }
            }
            return null;
        };
        CanvasService_1.prototype.contrastRatio = function (fg, bg) {
            var lum = function (c) {
                var channel = function (v) {
                    var x = v / 255;
                    return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
                };
                return (0.2126 * channel(c.r) + 0.7152 * channel(c.g) + 0.0722 * channel(c.b));
            };
            var l1 = lum(fg);
            var l2 = lum(bg);
            var lighter = Math.max(l1, l2);
            var darker = Math.min(l1, l2);
            return (lighter + 0.05) / (darker + 0.05);
        };
        CanvasService_1.prototype.evaluateAccessibilityTier1ForHtml = function (base, html) {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
            var findings = [];
            var content = String(html || '');
            if (!content.trim())
                return findings;
            // Images: missing alt / long alt / filename alt
            var imgTagRegex = /<img\b[^>]*>/gi;
            var imgMatch;
            while ((imgMatch = imgTagRegex.exec(content))) {
                var tag = imgMatch[0];
                var altMatch = tag.match(/\balt\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
                var srcMatch = tag.match(/\bsrc\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
                var alt = ((_c = (_b = (_a = altMatch === null || altMatch === void 0 ? void 0 : altMatch[2]) !== null && _a !== void 0 ? _a : altMatch === null || altMatch === void 0 ? void 0 : altMatch[3]) !== null && _b !== void 0 ? _b : altMatch === null || altMatch === void 0 ? void 0 : altMatch[4]) !== null && _c !== void 0 ? _c : '').trim();
                var src = ((_f = (_e = (_d = srcMatch === null || srcMatch === void 0 ? void 0 : srcMatch[2]) !== null && _d !== void 0 ? _d : srcMatch === null || srcMatch === void 0 ? void 0 : srcMatch[3]) !== null && _e !== void 0 ? _e : srcMatch === null || srcMatch === void 0 ? void 0 : srcMatch[4]) !== null && _f !== void 0 ? _f : '').trim();
                if (!altMatch || !alt) {
                    this.addFinding(findings, base, 'img_missing_alt', 'high', 'Image is missing descriptive alt text.', tag);
                }
                else {
                    if (alt.length > 200)
                        this.addFinding(findings, base, 'img_alt_too_long', 'medium', 'Image alt text exceeds 200 characters.', alt);
                    if (/\.(png|jpe?g|gif|webp|svg|bmp|tiff?)$/i.test(alt) ||
                        (src && alt.toLowerCase() === ((_g = src.split('/').pop()) === null || _g === void 0 ? void 0 : _g.toLowerCase()))) {
                        this.addFinding(findings, base, 'img_alt_filename', 'medium', 'Image alt text appears to be a filename.', alt);
                    }
                }
            }
            // Tables: header/caption/scope
            var tableRegex = /<table\b[\s\S]*?<\/table>/gi;
            var tableMatch;
            while ((tableMatch = tableRegex.exec(content))) {
                var tableHtml = tableMatch[0];
                if (!/<th\b/i.test(tableHtml))
                    this.addFinding(findings, base, 'table_missing_header', 'high', 'Table does not include at least one header cell.', tableHtml);
                if (!/<caption\b[\s\S]*?<\/caption>/i.test(tableHtml))
                    this.addFinding(findings, base, 'table_missing_caption', 'medium', 'Table does not include a caption.', tableHtml);
                var thRegex = /<th\b[^>]*>/gi;
                var thMatch = void 0;
                while ((thMatch = thRegex.exec(tableHtml))) {
                    if (!/\bscope\s*=\s*("row"|"col"|'row'|'col'|row|col)/i.test(thMatch[0])) {
                        this.addFinding(findings, base, 'table_header_scope_missing', 'medium', 'Table header is missing scope (row/col).', thMatch[0]);
                    }
                }
            }
            // Headings: H1 in content, overlong heading, skipped levels
            var headingRegex = /<(h[1-6])\b[^>]*>([\s\S]*?)<\/\1>/gi;
            var levels = [];
            var headingMatch;
            while ((headingMatch = headingRegex.exec(content))) {
                var tag = headingMatch[1].toLowerCase();
                var level = Number(tag.slice(1));
                var text = headingMatch[2]
                    .replace(/<[^>]+>/g, '')
                    .replace(/\s+/g, ' ')
                    .trim();
                levels.push(level);
                if (level === 1)
                    this.addFinding(findings, base, 'heading_h1_in_body', 'medium', 'H1 heading appears in body content.', text || headingMatch[0]);
                if (text.length > 120)
                    this.addFinding(findings, base, 'heading_too_long', 'low', 'Heading exceeds 120 characters.', text);
            }
            for (var i = 1; i < levels.length; i++) {
                if (levels[i] > levels[i - 1] + 1) {
                    this.addFinding(findings, base, 'heading_skipped_level', 'medium', "Heading levels are skipped (h".concat(levels[i - 1], " to h").concat(levels[i], ")."));
                }
            }
            // Lists: visual bullets without semantic list
            if (!/<(?:ul|ol)\b/i.test(content) &&
                /(?:^|<br[^>]*>|<\/p>)\s*(?:[-*•]|&bull;)\s+\S/i.test(content)) {
                this.addFinding(findings, base, 'list_not_semantic', 'medium', 'Content appears to be a list but is not marked up as ul/ol/li.');
            }
            // Links: adjacent duplicates / split links
            var adjacentAnchorRegex = /<a\b[^>]*href\s*=\s*("([^"]*)"|'([^']*)')[^>]*>[\s\S]*?<\/a>\s*(?:&nbsp;|\s|<span[^>]*>\s*<\/span>|<br[^>]*>)*<a\b[^>]*href\s*=\s*("([^"]*)"|'([^']*)')[^>]*>[\s\S]*?<\/a>/gi;
            var anchorMatch;
            while ((anchorMatch = adjacentAnchorRegex.exec(content))) {
                var h1 = ((_j = (_h = anchorMatch[2]) !== null && _h !== void 0 ? _h : anchorMatch[3]) !== null && _j !== void 0 ? _j : '').trim();
                var h2 = ((_l = (_k = anchorMatch[5]) !== null && _k !== void 0 ? _k : anchorMatch[6]) !== null && _l !== void 0 ? _l : '').trim();
                if (h1 && h2 && h1 === h2) {
                    this.addFinding(findings, base, 'adjacent_duplicate_links', 'low', 'Adjacent links point to the same URL and should be merged.', anchorMatch[0]);
                }
            }
            // Links: broken/split URLs rendered as plain text fragments
            var plainText = content
                .replace(/<a\b[\s\S]*?<\/a>/gi, ' ')
                .replace(/<[^>]+>/g, ' ')
                .replace(/&nbsp;/gi, ' ')
                .replace(/\s+/g, ' ')
                .trim();
            var splitUrlRegex = /\b(?:https?:\s*\/\s*\/\s*[\w.-]+(?:\s*\/\s*[\w\-./?%&=+#:]*)?|www\.\s*[\w.-]+\s*\.\s*[a-z]{2,}(?:\s*\/\s*[\w\-./?%&=+#:]*)?)\b/gi;
            var splitMatch;
            while ((splitMatch = splitUrlRegex.exec(plainText))) {
                var token = splitMatch[0];
                if (/\s/.test(token)) {
                    this.addFinding(findings, base, 'link_split_or_broken', 'medium', 'URL appears split/fractured in content and may not be clickable.', token);
                }
            }
            // Contrast (inline style only)
            var styleTagRegex = /<([a-z0-9]+)\b[^>]*style\s*=\s*("([^"]*)"|'([^']*)')[^>]*>/gi;
            var styleMatch;
            while ((styleMatch = styleTagRegex.exec(content))) {
                var style = (_o = (_m = styleMatch[3]) !== null && _m !== void 0 ? _m : styleMatch[4]) !== null && _o !== void 0 ? _o : '';
                var colorMatch = style.match(/(?:^|;)\s*color\s*:\s*([^;]+)/i);
                var bgMatch = style.match(/(?:^|;)\s*background(?:-color)?\s*:\s*([^;]+)/i);
                if (!colorMatch || !bgMatch)
                    continue;
                var fg = this.parseCssColor(colorMatch[1]);
                var bg = this.parseCssColor(bgMatch[1]);
                if (!fg || !bg)
                    continue;
                var ratio = this.contrastRatio(fg, bg);
                var fsMatch = style.match(/(?:^|;)\s*font-size\s*:\s*([0-9.]+)px/i);
                var fwMatch = style.match(/(?:^|;)\s*font-weight\s*:\s*([^;]+)/i);
                var fontSizePx = fsMatch ? Number(fsMatch[1]) : 16;
                var fontWeightRaw = ((fwMatch === null || fwMatch === void 0 ? void 0 : fwMatch[1]) || '').trim().toLowerCase();
                var isBold = fontWeightRaw === 'bold' || Number(fontWeightRaw) >= 700;
                var isLarge = fontSizePx >= 24 || (isBold && fontSizePx >= 18.67);
                if (isLarge && ratio < 3) {
                    this.addFinding(findings, base, 'large_text_contrast', 'medium', "Large text contrast ratio ".concat(ratio.toFixed(2), " is below 3:1."), styleMatch[0]);
                }
                else if (!isLarge && ratio < 4.5) {
                    this.addFinding(findings, base, 'small_text_contrast', 'high', "Small text contrast ratio ".concat(ratio.toFixed(2), " is below 4.5:1."), styleMatch[0]);
                }
            }
            return findings;
        };
        CanvasService_1.prototype.evaluateAccessibilityTier2ForHtml = function (base, html) {
            var _this = this;
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t;
            var findings = [];
            var content = String(html || '');
            if (!content.trim())
                return findings;
            var contentLower = content.toLowerCase();
            var stripTags = function (s) {
                return s
                    .replace(/<[^>]+>/g, ' ')
                    .replace(/&nbsp;/gi, ' ')
                    .replace(/\s+/g, ' ')
                    .trim();
            };
            var plainText = stripTags(content);
            var hasTranscriptWord = /\btranscript\b/i.test(plainText);
            var anchorRegex = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
            var aMatch;
            while ((aMatch = anchorRegex.exec(content))) {
                var attrs = aMatch[1] || '';
                var text = stripTags(aMatch[2] || '');
                var hrefMatch = attrs.match(/\bhref\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
                var href = ((_c = (_b = (_a = hrefMatch === null || hrefMatch === void 0 ? void 0 : hrefMatch[2]) !== null && _a !== void 0 ? _a : hrefMatch === null || hrefMatch === void 0 ? void 0 : hrefMatch[3]) !== null && _b !== void 0 ? _b : hrefMatch === null || hrefMatch === void 0 ? void 0 : hrefMatch[4]) !== null && _c !== void 0 ? _c : '').trim();
                if (!text && !/\baria-label\s*=\s*["'][^"']+["']/i.test(attrs)) {
                    this.addFinding(findings, base, 'link_empty_name', 'high', 'Link has no accessible name.', aMatch[0]);
                }
                if (/^(click here|read more|learn more|more|here)$/i.test(text)) {
                    this.addFinding(findings, base, 'link_ambiguous_text', 'medium', 'Link text is ambiguous without context.', text);
                }
                if (/\btarget\s*=\s*["']_blank["']/i.test(attrs) &&
                    !/\b(new tab|opens in new tab)\b/i.test(text)) {
                    this.addFinding(findings, base, 'link_new_tab_no_warning', 'low', 'Link opens in a new tab without warning text.', aMatch[0]);
                }
                if (/\.(pdf|docx?|pptx?|xlsx?|csv)(?:[?#].*)?$/i.test(href)) {
                    if (!/\b(pdf|doc|word|ppt|powerpoint|xls|excel|csv)\b/i.test(text) ||
                        !/\b\d+\s?(kb|mb|gb)\b/i.test(text)) {
                        this.addFinding(findings, base, 'link_file_missing_type_size_hint', 'low', 'File link is missing type and/or size hint.', "".concat(text, " ").concat(href).trim());
                    }
                    if (/\.pdf(?:[?#].*)?$/i.test(href)) {
                        this.addFinding(findings, base, 'doc_pdf_accessibility_unknown', 'low', 'Linked PDF accessibility (tags/text layer/title/lang) is unknown and should be verified.', href);
                    }
                    else if (/\.(docx?|pptx?)(?:[?#].*)?$/i.test(href)) {
                        this.addFinding(findings, base, 'doc_office_structure_unknown', 'low', 'Linked Office file accessibility structure should be verified.', href);
                    }
                    else if (/\.(xlsx?|csv)(?:[?#].*)?$/i.test(href)) {
                        this.addFinding(findings, base, 'doc_spreadsheet_headers_unknown', 'low', 'Linked spreadsheet should be checked for header/merge accessibility risks.', href);
                    }
                }
            }
            var buttonRegex = /<button\b([^>]*)>([\s\S]*?)<\/button>/gi;
            var bMatch;
            while ((bMatch = buttonRegex.exec(content))) {
                var attrs = bMatch[1] || '';
                var text = stripTags(bMatch[2] || '');
                if (!text &&
                    !/\baria-label\s*=\s*["'][^"']+["']/i.test(attrs) &&
                    !/\btitle\s*=\s*["'][^"']+["']/i.test(attrs)) {
                    this.addFinding(findings, base, 'button_empty_name', 'high', 'Button has no accessible name.', bMatch[0]);
                }
            }
            var headingRegex = /<(h[1-6])\b[^>]*>([\s\S]*?)<\/\1>/gi;
            var h1Count = 0;
            var hMatch;
            while ((hMatch = headingRegex.exec(content))) {
                var tag = (hMatch[1] || '').toLowerCase();
                var text = stripTags(hMatch[2] || '');
                if (tag === 'h1')
                    h1Count++;
                if (!text)
                    this.addFinding(findings, base, 'heading_empty', 'medium', 'Heading is empty.', hMatch[0]);
            }
            if (h1Count > 1)
                this.addFinding(findings, base, 'heading_duplicate_h1', 'medium', "Multiple H1 headings detected (".concat(h1Count, ")."));
            if (!/<h[1-6]\b/i.test(content) &&
                /<(?:p|div|span)\b[^>]*style\s*=\s*["'][^"']*(?:font-size\s*:\s*(?:2[4-9]|[3-9]\d)px|font-weight\s*:\s*(?:700|800|900|bold))[^"']*["'][^>]*>/i.test(content)) {
                this.addFinding(findings, base, 'heading_visual_only_style', 'low', 'Visual heading style detected without semantic heading tags.');
            }
            if (plainText.length > 2500) {
                var hasMain = /<(main\b|[^>]+\brole\s*=\s*["']main["'])/i.test(content);
                var hasNav = /<(nav\b|[^>]+\brole\s*=\s*["']navigation["'])/i.test(content);
                var hasRegion = /\brole\s*=\s*["']region["']/i.test(content);
                if (!hasMain || !hasNav || !hasRegion) {
                    this.addFinding(findings, base, 'landmark_structure_quality', 'low', 'Long content should include robust landmark structure (main/nav/region).');
                }
            }
            var emptyLiRegex = /<li\b[^>]*>\s*(?:&nbsp;|\s|<br[^>]*>|<\/?span[^>]*>)*<\/li>/gi;
            var liMatch;
            while ((liMatch = emptyLiRegex.exec(content))) {
                this.addFinding(findings, base, 'list_empty_item', 'medium', 'List contains empty item.', liMatch[0]);
            }
            var tableRegex = /<table\b[\s\S]*?<\/table>/gi;
            var tMatch;
            while ((tMatch = tableRegex.exec(content))) {
                var tableHtml = tMatch[0];
                var noHeaders = !/<th\b/i.test(tableHtml);
                var rowCount = (tableHtml.match(/<tr\b/gi) || []).length;
                var colCount = (tableHtml.match(/<t[dh]\b/gi) || []).length;
                if (noHeaders && rowCount > 2 && colCount > 4) {
                    this.addFinding(findings, base, 'table_layout_heuristic', 'low', 'Table may be used for layout instead of data.', tableHtml);
                }
                if (/\b(rowspan|colspan)\s*=\s*["']?\d+/i.test(tableHtml) &&
                    !/\b(headers|scope)\s*=/i.test(tableHtml)) {
                    this.addFinding(findings, base, 'table_complex_assoc_missing', 'medium', 'Complex table with rowspan/colspan lacks clear header associations.', tableHtml);
                }
            }
            var imgRegex = /<img\b([^>]*)>/gi;
            var imgMatch;
            while ((imgMatch = imgRegex.exec(content))) {
                var attrs = imgMatch[1] || '';
                var altMatch = attrs.match(/\balt\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
                var srcMatch = attrs.match(/\bsrc\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
                var alt = ((_f = (_e = (_d = altMatch === null || altMatch === void 0 ? void 0 : altMatch[2]) !== null && _d !== void 0 ? _d : altMatch === null || altMatch === void 0 ? void 0 : altMatch[3]) !== null && _e !== void 0 ? _e : altMatch === null || altMatch === void 0 ? void 0 : altMatch[4]) !== null && _f !== void 0 ? _f : '').trim();
                var src = ((_j = (_h = (_g = srcMatch === null || srcMatch === void 0 ? void 0 : srcMatch[2]) !== null && _g !== void 0 ? _g : srcMatch === null || srcMatch === void 0 ? void 0 : srcMatch[3]) !== null && _h !== void 0 ? _h : srcMatch === null || srcMatch === void 0 ? void 0 : srcMatch[4]) !== null && _j !== void 0 ? _j : '').trim();
                var decorativeHint = /\b(decorative|spacer|divider|ornament|separator)\b/i.test(attrs + ' ' + src);
                if (decorativeHint &&
                    alt &&
                    !/\b(role\s*=\s*["']presentation["']|aria-hidden\s*=\s*["']true["'])/i.test(attrs)) {
                    this.addFinding(findings, base, 'img_decorative_misuse', 'low', 'Decorative image appears to have meaningful alt text.', imgMatch[0]);
                }
                if (!decorativeHint &&
                    alt === '' &&
                    !/\b(role\s*=\s*["']presentation["']|aria-hidden\s*=\s*["']true["'])/i.test(attrs)) {
                    this.addFinding(findings, base, 'img_meaningful_empty_alt', 'medium', 'Potentially meaningful image has empty alt text.', imgMatch[0]);
                }
                if (/\b(text|banner|header|poster|flyer|infographic)\b/i.test(src + ' ' + alt)) {
                    this.addFinding(findings, base, 'img_text_in_image_warning', 'low', 'Image may contain meaningful text; verify readability and alt quality.', imgMatch[0]);
                }
                if (/\.gif(?:[?#].*)?$/i.test(src)) {
                    this.addFinding(findings, base, 'motion_gif_warning', 'low', 'Animated GIF may create motion sensitivity concerns.', src);
                }
            }
            var videoRegex = /<video\b([^>]*)>([\s\S]*?)<\/video>/gi;
            var vMatch;
            while ((vMatch = videoRegex.exec(content))) {
                var attrs = vMatch[1] || '';
                var body = vMatch[2] || '';
                if (!/<track\b[^>]*\bkind\s*=\s*["']?(captions|subtitles)["']?/i.test(body)) {
                    this.addFinding(findings, base, 'video_missing_captions', 'high', 'Video is missing caption/subtitle track.', vMatch[0]);
                }
                if (/\bautoplay\b/i.test(attrs))
                    this.addFinding(findings, base, 'media_autoplay', 'medium', 'Media uses autoplay.', vMatch[0]);
            }
            var audioRegex = /<audio\b([^>]*)>([\s\S]*?)<\/audio>/gi;
            var auMatch;
            while ((auMatch = audioRegex.exec(content))) {
                var attrs = auMatch[1] || '';
                if (!hasTranscriptWord)
                    this.addFinding(findings, base, 'audio_missing_transcript', 'high', 'Audio content may be missing transcript.', auMatch[0]);
                if (/\bautoplay\b/i.test(attrs))
                    this.addFinding(findings, base, 'media_autoplay', 'medium', 'Media uses autoplay.', auMatch[0]);
            }
            if (/<iframe\b[^>]*\bsrc\s*=\s*["'][^"']*(youtube|vimeo)[^"']*["'][^>]*>/i.test(content) &&
                !/\b(captions|cc_load_policy=1|subtitle)\b/i.test(contentLower)) {
                this.addFinding(findings, base, 'video_embed_caption_unknown', 'medium', 'Embedded video captions cannot be confirmed from markup.', 'iframe video embed');
            }
            var controlRegex = /<(input|select|textarea)\b([^>]*)>/gi;
            var cMatch;
            while ((cMatch = controlRegex.exec(content))) {
                var tag = (cMatch[1] || '').toLowerCase();
                var attrs = cMatch[2] || '';
                var idMatch_1 = attrs.match(/\bid\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
                var id = ((_m = (_l = (_k = idMatch_1 === null || idMatch_1 === void 0 ? void 0 : idMatch_1[2]) !== null && _k !== void 0 ? _k : idMatch_1 === null || idMatch_1 === void 0 ? void 0 : idMatch_1[3]) !== null && _l !== void 0 ? _l : idMatch_1 === null || idMatch_1 === void 0 ? void 0 : idMatch_1[4]) !== null && _m !== void 0 ? _m : '').trim();
                var hasLabelByFor = id
                    ? new RegExp("<label\\b[^>]*\\bfor\\s*=\\s*[\"']".concat(id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), "[\"'][^>]*>[\\s\\S]*?<\\/label>"), 'i').test(content)
                    : false;
                var hasProgrammaticLabel = /\b(aria-label|aria-labelledby|title)\s*=\s*["'][^"']+["']/i.test(attrs);
                if (!hasLabelByFor && !hasProgrammaticLabel) {
                    this.addFinding(findings, base, 'form_control_missing_label', 'high', "".concat(tag, " appears to be missing an accessible label."), cMatch[0]);
                }
                if (/\bplaceholder\s*=\s*["'][^"']+["']/i.test(attrs) &&
                    !hasLabelByFor &&
                    !/\baria-label(ledby)?\b/i.test(attrs)) {
                    this.addFinding(findings, base, 'form_placeholder_as_label', 'medium', 'Placeholder appears to be used as the only label.', cMatch[0]);
                }
                if (/\b(class|data-required)\s*=\s*["'][^"']*required[^"']*["']/i.test(attrs) &&
                    !/\b(required|aria-required)\b/i.test(attrs)) {
                    this.addFinding(findings, base, 'form_required_not_programmatic', 'medium', 'Required state may be visual only and not programmatically conveyed.', cMatch[0]);
                }
                if (/\baria-invalid\s*=\s*["']true["']/i.test(attrs) &&
                    !/\baria-describedby\s*=\s*["'][^"']+["']/i.test(attrs)) {
                    this.addFinding(findings, base, 'form_error_unassociated', 'medium', 'Invalid control lacks aria-describedby reference to error text.', cMatch[0]);
                }
            }
            var roleRegex = /\brole\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/gi;
            var validRoles = new Set([
                'alert',
                'button',
                'checkbox',
                'dialog',
                'grid',
                'heading',
                'img',
                'link',
                'list',
                'listitem',
                'main',
                'menu',
                'menubar',
                'menuitem',
                'navigation',
                'option',
                'presentation',
                'progressbar',
                'radio',
                'radiogroup',
                'region',
                'row',
                'rowgroup',
                'rowheader',
                'search',
                'slider',
                'spinbutton',
                'status',
                'switch',
                'tab',
                'table',
                'tablist',
                'tabpanel',
                'textbox',
                'timer',
                'tooltip',
            ]);
            var rMatch;
            while ((rMatch = roleRegex.exec(content))) {
                var roleVal = ((_q = (_p = (_o = rMatch[2]) !== null && _o !== void 0 ? _o : rMatch[3]) !== null && _p !== void 0 ? _p : rMatch[4]) !== null && _q !== void 0 ? _q : '')
                    .trim()
                    .toLowerCase();
                if (roleVal && !validRoles.has(roleVal)) {
                    this.addFinding(findings, base, 'aria_invalid_role', 'medium', 'Element contains an invalid/unknown ARIA role.', roleVal);
                }
            }
            if (/\baria-hidden\s*=\s*["']true["'][^>]*\b(?:tabindex\s*=\s*["']?[0-9]+["']?|href=|onclick=)|<(a|button|input|select|textarea)\b[^>]*\baria-hidden\s*=\s*["']true["']/i.test(content)) {
                this.addFinding(findings, base, 'aria_hidden_focusable', 'high', 'Focusable interactive element is marked aria-hidden="true".');
            }
            var idRegex = /\bid\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/gi;
            var ids = new Map();
            var idMatch;
            while ((idMatch = idRegex.exec(content))) {
                var idVal = ((_t = (_s = (_r = idMatch[2]) !== null && _r !== void 0 ? _r : idMatch[3]) !== null && _s !== void 0 ? _s : idMatch[4]) !== null && _t !== void 0 ? _t : '').trim();
                if (!idVal)
                    continue;
                ids.set(idVal, (ids.get(idVal) || 0) + 1);
            }
            ids.forEach(function (count, idVal) {
                if (count > 1)
                    _this.addFinding(findings, base, 'duplicate_id', 'high', "Duplicate id \"".concat(idVal, "\" appears ").concat(count, " times."));
            });
            if (/\btabindex\s*=\s*["']?[1-9]\d*["']?/i.test(content) ||
                /\bonkeydown\s*=\s*["'][^"']*preventDefault\(/i.test(content)) {
                this.addFinding(findings, base, 'keyboard_focus_trap_heuristic', 'low', 'Potential keyboard navigation/focus trap risk detected.');
            }
            return findings;
        };
        CanvasService_1.prototype.getAccessibilityScan = function (courseId_1) {
            return __awaiter(this, arguments, void 0, function (courseId, options) {
                var types, startedAt, timings, warnings, timed, fetchers, fetched, resources, findings, requestedRuleIds, requestedRuleSet, effectiveFindings, enrichedFindings, bySeverity, byRule, byResourceType, resourcesScannedByType, totalMs, baseline, hasBaseline;
                var _this = this;
                if (options === void 0) { options = {}; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            types = this.resolveAccessibilityResourceTypes(options.resourceTypes);
                            startedAt = Date.now();
                            timings = {};
                            warnings = [];
                            timed = function (name, fn) { return __awaiter(_this, void 0, void 0, function () {
                                var t0, out;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            t0 = Date.now();
                                            return [4 /*yield*/, fn()];
                                        case 1:
                                            out = _a.sent();
                                            timings[name] = Date.now() - t0;
                                            return [2 /*return*/, out];
                                    }
                                });
                            }); };
                            fetchers = [];
                            if (types.includes('pages')) {
                                fetchers.push(timed('fetch_pages', function () { return __awaiter(_this, void 0, void 0, function () {
                                    var pages, items;
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0: return [4 /*yield*/, this.getCoursePages(courseId)];
                                            case 1:
                                                pages = _a.sent();
                                                items = (Array.isArray(pages) ? pages : [])
                                                    .map(function (p) {
                                                    var _a, _b, _c;
                                                    return ({
                                                        type: 'pages',
                                                        id: String((_c = (_b = (_a = p === null || p === void 0 ? void 0 : p.id) !== null && _a !== void 0 ? _a : p === null || p === void 0 ? void 0 : p.page_id) !== null && _b !== void 0 ? _b : p === null || p === void 0 ? void 0 : p.url) !== null && _c !== void 0 ? _c : ''),
                                                        title: String((p === null || p === void 0 ? void 0 : p.title) || (p === null || p === void 0 ? void 0 : p.name) || (p === null || p === void 0 ? void 0 : p.url) || 'Untitled Page'),
                                                        html: String((p === null || p === void 0 ? void 0 : p.body) || ''),
                                                        url: (p === null || p === void 0 ? void 0 : p.html_url) || (p === null || p === void 0 ? void 0 : p.url) || null,
                                                    });
                                                })
                                                    .filter(function (x) { return x.id && x.html; });
                                                return [2 /*return*/, { type: 'pages', items: items }];
                                        }
                                    });
                                }); }).catch(function (e) {
                                    warnings.push("pages fetch failed: ".concat((e === null || e === void 0 ? void 0 : e.message) || 'unknown error'));
                                    return { type: 'pages', items: [] };
                                }));
                            }
                            if (types.includes('assignments')) {
                                fetchers.push(timed('fetch_assignments', function () { return __awaiter(_this, void 0, void 0, function () {
                                    var assignments, items;
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0: return [4 /*yield*/, this.getCourseAssignments(courseId)];
                                            case 1:
                                                assignments = _a.sent();
                                                items = (Array.isArray(assignments) ? assignments : [])
                                                    .map(function (a) {
                                                    var _a, _b;
                                                    return ({
                                                        type: 'assignments',
                                                        id: String((_a = a === null || a === void 0 ? void 0 : a.id) !== null && _a !== void 0 ? _a : ''),
                                                        title: String((a === null || a === void 0 ? void 0 : a.name) || (a === null || a === void 0 ? void 0 : a.title) || "Assignment ".concat((_b = a === null || a === void 0 ? void 0 : a.id) !== null && _b !== void 0 ? _b : '')),
                                                        html: String((a === null || a === void 0 ? void 0 : a.description) || ''),
                                                        url: (a === null || a === void 0 ? void 0 : a.html_url) || null,
                                                    });
                                                })
                                                    .filter(function (x) { return x.id && x.html; });
                                                return [2 /*return*/, { type: 'assignments', items: items }];
                                        }
                                    });
                                }); }).catch(function (e) {
                                    warnings.push("assignments fetch failed: ".concat((e === null || e === void 0 ? void 0 : e.message) || 'unknown error'));
                                    return { type: 'assignments', items: [] };
                                }));
                            }
                            if (types.includes('announcements')) {
                                fetchers.push(timed('fetch_announcements', function () { return __awaiter(_this, void 0, void 0, function () {
                                    var announcements, items;
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0: return [4 /*yield*/, this.getCourseAnnouncements(courseId)];
                                            case 1:
                                                announcements = _a.sent();
                                                items = (Array.isArray(announcements) ? announcements : [])
                                                    .map(function (a) {
                                                    var _a, _b;
                                                    return ({
                                                        type: 'announcements',
                                                        id: String((_a = a === null || a === void 0 ? void 0 : a.id) !== null && _a !== void 0 ? _a : ''),
                                                        title: String((a === null || a === void 0 ? void 0 : a.title) || "Announcement ".concat((_b = a === null || a === void 0 ? void 0 : a.id) !== null && _b !== void 0 ? _b : '')),
                                                        html: String((a === null || a === void 0 ? void 0 : a.message) || ''),
                                                        url: (a === null || a === void 0 ? void 0 : a.html_url) || null,
                                                    });
                                                })
                                                    .filter(function (x) { return x.id && x.html; });
                                                return [2 /*return*/, { type: 'announcements', items: items }];
                                        }
                                    });
                                }); }).catch(function (e) {
                                    warnings.push("announcements fetch failed: ".concat((e === null || e === void 0 ? void 0 : e.message) || 'unknown error'));
                                    return { type: 'announcements', items: [] };
                                }));
                            }
                            if (types.includes('discussions')) {
                                fetchers.push(timed('fetch_discussions', function () { return __awaiter(_this, void 0, void 0, function () {
                                    var discussions, items;
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0: return [4 /*yield*/, this.getCourseDiscussions(courseId)];
                                            case 1:
                                                discussions = _a.sent();
                                                items = (Array.isArray(discussions) ? discussions : [])
                                                    .map(function (d) {
                                                    var _a, _b;
                                                    return ({
                                                        type: 'discussions',
                                                        id: String((_a = d === null || d === void 0 ? void 0 : d.id) !== null && _a !== void 0 ? _a : ''),
                                                        title: String((d === null || d === void 0 ? void 0 : d.title) || "Discussion ".concat((_b = d === null || d === void 0 ? void 0 : d.id) !== null && _b !== void 0 ? _b : '')),
                                                        html: String((d === null || d === void 0 ? void 0 : d.message) || ''),
                                                        url: (d === null || d === void 0 ? void 0 : d.html_url) || null,
                                                    });
                                                })
                                                    .filter(function (x) { return x.id && x.html; });
                                                return [2 /*return*/, { type: 'discussions', items: items }];
                                        }
                                    });
                                }); }).catch(function (e) {
                                    warnings.push("discussions fetch failed: ".concat((e === null || e === void 0 ? void 0 : e.message) || 'unknown error'));
                                    return { type: 'discussions', items: [] };
                                }));
                            }
                            if (types.includes('syllabus')) {
                                fetchers.push(timed('fetch_syllabus', function () { return __awaiter(_this, void 0, void 0, function () {
                                    var course, html, items;
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0: return [4 /*yield*/, this.getCourseDetails(courseId)];
                                            case 1:
                                                course = _a.sent();
                                                html = String((course === null || course === void 0 ? void 0 : course.syllabus_body) || '');
                                                items = html.trim()
                                                    ? [
                                                        {
                                                            type: 'syllabus',
                                                            id: String(courseId),
                                                            title: 'Course Syllabus',
                                                            html: html,
                                                            url: (course === null || course === void 0 ? void 0 : course.html_url) || null,
                                                        },
                                                    ]
                                                    : [];
                                                return [2 /*return*/, { type: 'syllabus', items: items }];
                                        }
                                    });
                                }); }).catch(function (e) {
                                    warnings.push("syllabus fetch failed: ".concat((e === null || e === void 0 ? void 0 : e.message) || 'unknown error'));
                                    return { type: 'syllabus', items: [] };
                                }));
                            }
                            return [4 /*yield*/, Promise.all(fetchers)];
                        case 1:
                            fetched = _a.sent();
                            resources = fetched.flatMap(function (x) { return x.items; });
                            return [4 /*yield*/, timed('evaluate_rules', function () { return __awaiter(_this, void 0, void 0, function () {
                                    var all, _i, resources_1, resource, base;
                                    var _a;
                                    return __generator(this, function (_b) {
                                        all = [];
                                        for (_i = 0, resources_1 = resources; _i < resources_1.length; _i++) {
                                            resource = resources_1[_i];
                                            base = {
                                                resource_type: resource.type,
                                                resource_id: resource.id,
                                                resource_title: resource.title,
                                                resource_url: (_a = resource.url) !== null && _a !== void 0 ? _a : null,
                                            };
                                            all.push.apply(all, this.evaluateAccessibilityTier1ForHtml(base, resource.html));
                                            all.push.apply(all, this.evaluateAccessibilityTier2ForHtml(base, resource.html));
                                        }
                                        return [2 /*return*/, all];
                                    });
                                }); })];
                        case 2:
                            findings = _a.sent();
                            requestedRuleIds = Array.isArray(options.ruleIds)
                                ? options.ruleIds.map(function (x) { return String(x || '').trim(); }).filter(Boolean)
                                : [];
                            requestedRuleSet = new Set(requestedRuleIds);
                            effectiveFindings = requestedRuleSet.size
                                ? findings.filter(function (f) { return requestedRuleSet.has(f.rule_id); })
                                : findings;
                            enrichedFindings = effectiveFindings.map(function (f) {
                                var _a, _b;
                                return (__assign(__assign({}, f), { fix_strategy: (_b = (_a = exports.ACCESSIBILITY_FIXABILITY_MAP[f.rule_id]) === null || _a === void 0 ? void 0 : _a.fix_strategy) !== null && _b !== void 0 ? _b : 'manual_only' }));
                            });
                            bySeverity = enrichedFindings.reduce(function (acc, f) {
                                acc[f.severity] = (acc[f.severity] || 0) + 1;
                                return acc;
                            }, {});
                            byRule = enrichedFindings.reduce(function (acc, f) {
                                acc[f.rule_id] = (acc[f.rule_id] || 0) + 1;
                                return acc;
                            }, {});
                            byResourceType = enrichedFindings.reduce(function (acc, f) {
                                acc[f.resource_type] = (acc[f.resource_type] || 0) + 1;
                                return acc;
                            }, {});
                            resourcesScannedByType = resources.reduce(function (acc, r) {
                                acc[r.type] = (acc[r.type] || 0) + 1;
                                return acc;
                            }, {});
                            totalMs = Date.now() - startedAt;
                            baseline = Number(options.canvasNativeBaselineMs);
                            hasBaseline = Number.isFinite(baseline) && baseline > 0;
                            return [2 /*return*/, {
                                    requested_resource_types: types,
                                    requested_rule_ids: requestedRuleIds,
                                    summary: {
                                        course_id: courseId,
                                        total_findings: enrichedFindings.length,
                                        resources_scanned: resources.length,
                                        resources_scanned_by_type: resourcesScannedByType,
                                        by_severity: {
                                            high: bySeverity.high || 0,
                                            medium: bySeverity.medium || 0,
                                            low: bySeverity.low || 0,
                                        },
                                        by_rule: byRule,
                                        by_resource_type: byResourceType,
                                    },
                                    benchmark: {
                                        started_at: new Date(startedAt).toISOString(),
                                        finished_at: new Date().toISOString(),
                                        total_ms: totalMs,
                                        stage_ms: timings,
                                        throttle_events: 0,
                                        canvas_native_baseline_ms: hasBaseline ? baseline : null,
                                        slower_than_canvas: hasBaseline ? totalMs > baseline : null,
                                        ratio_vs_canvas: hasBaseline
                                            ? Number((totalMs / baseline).toFixed(3))
                                            : null,
                                    },
                                    findings: enrichedFindings,
                                    warnings: warnings,
                                    rule_version: 'tier2-v1',
                                }];
                    }
                });
            });
        };
        CanvasService_1.prototype.buildAccessibilityCsv = function (report) {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j;
            var rows = Array.isArray(report === null || report === void 0 ? void 0 : report.findings) ? report.findings : [];
            var headers = [
                'resource_type',
                'resource_id',
                'resource_title',
                'resource_url',
                'rule_id',
                'tier',
                'severity',
                'message',
                'snippet',
                'rule_version',
                'scanned_at',
            ];
            var nowIso = new Date().toISOString();
            var lines = [headers.join(',')];
            for (var _i = 0, rows_1 = rows; _i < rows_1.length; _i++) {
                var r = rows_1[_i];
                var row = [
                    this.escapeCsvCell((_a = r === null || r === void 0 ? void 0 : r.resource_type) !== null && _a !== void 0 ? _a : ''),
                    this.escapeCsvCell((_b = r === null || r === void 0 ? void 0 : r.resource_id) !== null && _b !== void 0 ? _b : ''),
                    this.escapeCsvCell((_c = r === null || r === void 0 ? void 0 : r.resource_title) !== null && _c !== void 0 ? _c : ''),
                    this.escapeCsvCell((_d = r === null || r === void 0 ? void 0 : r.resource_url) !== null && _d !== void 0 ? _d : ''),
                    this.escapeCsvCell((_e = r === null || r === void 0 ? void 0 : r.rule_id) !== null && _e !== void 0 ? _e : ''),
                    this.escapeCsvCell((r === null || r === void 0 ? void 0 : r.tier) != null ? String(r.tier) : ''),
                    this.escapeCsvCell((_f = r === null || r === void 0 ? void 0 : r.severity) !== null && _f !== void 0 ? _f : ''),
                    this.escapeCsvCell((_g = r === null || r === void 0 ? void 0 : r.message) !== null && _g !== void 0 ? _g : ''),
                    this.escapeCsvCell((_h = r === null || r === void 0 ? void 0 : r.snippet) !== null && _h !== void 0 ? _h : ''),
                    this.escapeCsvCell((_j = report === null || report === void 0 ? void 0 : report.rule_version) !== null && _j !== void 0 ? _j : 'tier1-v1'),
                    this.escapeCsvCell(nowIso),
                ];
                lines.push(row.join(','));
            }
            return lines.join('\n');
        };
        CanvasService_1.prototype.fetchAccessibilityResourceContent = function (courseId, resourceType, resourceId) {
            return __awaiter(this, void 0, void 0, function () {
                var pages, page, full, _a, token, baseUrl, body, html, a, html, d, html, course, html;
                var _b, _c, _d, _e, _f, _g;
                return __generator(this, function (_h) {
                    switch (_h.label) {
                        case 0:
                            if (!(resourceType === 'pages')) return [3 /*break*/, 5];
                            return [4 /*yield*/, this.getCoursePages(courseId)];
                        case 1:
                            pages = _h.sent();
                            page = (Array.isArray(pages) ? pages : []).find(function (p) {
                                var _a, _b, _c;
                                return String((_b = (_a = p === null || p === void 0 ? void 0 : p.id) !== null && _a !== void 0 ? _a : p === null || p === void 0 ? void 0 : p.page_id) !== null && _b !== void 0 ? _b : '') === resourceId ||
                                    ((_c = p === null || p === void 0 ? void 0 : p.url) !== null && _c !== void 0 ? _c : '') === resourceId;
                            });
                            if (!(page === null || page === void 0 ? void 0 : page.url))
                                return [2 /*return*/, null];
                            return [4 /*yield*/, this.getPage(courseId, page.url)];
                        case 2:
                            full = _h.sent();
                            return [4 /*yield*/, this.getAuthHeaders()];
                        case 3:
                            _a = _h.sent(), token = _a.token, baseUrl = _a.baseUrl;
                            return [4 /*yield*/, this.resolveWikiPageBodyForGrid(courseId, page.url, full, token, baseUrl)];
                        case 4:
                            body = _h.sent();
                            html = typeof body === 'string' ? body : String((_b = full === null || full === void 0 ? void 0 : full.body) !== null && _b !== void 0 ? _b : '');
                            return [2 /*return*/, {
                                    html: html,
                                    updateKey: page.url,
                                    resourceTitle: page.title || page.url,
                                }];
                        case 5:
                            if (!(resourceType === 'assignments')) return [3 /*break*/, 7];
                            return [4 /*yield*/, this.getAssignment(courseId, Number(resourceId))];
                        case 6:
                            a = _h.sent();
                            html = String((_c = a === null || a === void 0 ? void 0 : a.description) !== null && _c !== void 0 ? _c : '');
                            return [2 /*return*/, html
                                    ? { html: html, updateKey: resourceId, resourceTitle: (_d = a === null || a === void 0 ? void 0 : a.name) !== null && _d !== void 0 ? _d : '' }
                                    : null];
                        case 7:
                            if (!(resourceType === 'announcements' || resourceType === 'discussions')) return [3 /*break*/, 9];
                            return [4 /*yield*/, this.getDiscussion(courseId, Number(resourceId))];
                        case 8:
                            d = _h.sent();
                            html = String((_e = d === null || d === void 0 ? void 0 : d.message) !== null && _e !== void 0 ? _e : '');
                            return [2 /*return*/, html
                                    ? { html: html, updateKey: resourceId, resourceTitle: (_f = d === null || d === void 0 ? void 0 : d.title) !== null && _f !== void 0 ? _f : '' }
                                    : null];
                        case 9:
                            if (!(resourceType === 'syllabus')) return [3 /*break*/, 11];
                            return [4 /*yield*/, this.getCourseDetails(courseId)];
                        case 10:
                            course = _h.sent();
                            html = String((_g = course === null || course === void 0 ? void 0 : course.syllabus_body) !== null && _g !== void 0 ? _g : '');
                            return [2 /*return*/, html
                                    ? {
                                        html: html,
                                        updateKey: String(courseId),
                                        resourceTitle: 'Course Syllabus',
                                    }
                                    : null];
                        case 11: return [2 /*return*/, null];
                    }
                });
            });
        };
        CanvasService_1.prototype.looksNonEnglishText = function (text) {
            var sample = String(text || '').slice(0, 4000);
            if (!sample.trim())
                return false;
            if (/[^\u0000-\u007F]/.test(sample))
                return true;
            var lower = sample.toLowerCase();
            var nonEnglishSignals = [
                /\b(hola|bonjour|merci|gracias|adios|por favor|guten tag|danke|ciao|buongiorno|obrigado|ol[aá]|namaste|privet)\b/i,
                /\b(el|la|los|las|le|les|des|und|der|die|das|que|qui|pour|con|sin)\b/i,
            ];
            return nonEnglishSignals.some(function (rx) { return rx.test(lower); });
        };
        CanvasService_1.prototype.callClaudeWithRetry = function (prompt, maxTokens) {
            return __awaiter(this, void 0, void 0, function () {
                var crypto, hash, cached, lastErr, _loop_4, this_3, attempt, state_1;
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, Promise.resolve().then(function () { return require('crypto'); })];
                        case 1:
                            crypto = _b.sent();
                            hash = crypto
                                .createHash('sha256')
                                .update(prompt)
                                .digest('hex')
                                .slice(0, 32);
                            cached = CanvasService.claudeCache.get(hash);
                            if (cached != null)
                                return [2 /*return*/, cached];
                            lastErr = null;
                            _loop_4 = function (attempt) {
                                var out, first, e_12, jitter_1;
                                return __generator(this, function (_c) {
                                    switch (_c.label) {
                                        case 0:
                                            _c.trys.push([0, 2, , 6]);
                                            return [4 /*yield*/, this_3.callClaudeSingleLine(prompt, maxTokens)];
                                        case 1:
                                            out = _c.sent();
                                            if (CanvasService.claudeCache.size >= CanvasService.CLAUDE_CACHE_MAX) {
                                                first = CanvasService.claudeCache.keys().next().value;
                                                if (first)
                                                    CanvasService.claudeCache.delete(first);
                                            }
                                            CanvasService.claudeCache.set(hash, out);
                                            return [2 /*return*/, { value: out }];
                                        case 2:
                                            e_12 = _c.sent();
                                            lastErr = e_12;
                                            if (!(((_a = e_12 === null || e_12 === void 0 ? void 0 : e_12.message) === null || _a === void 0 ? void 0 : _a.includes('429')) && attempt < 2)) return [3 /*break*/, 4];
                                            jitter_1 = 1000 + Math.random() * 2000;
                                            return [4 /*yield*/, new Promise(function (r) { return setTimeout(r, jitter_1); })];
                                        case 3:
                                            _c.sent();
                                            return [3 /*break*/, 5];
                                        case 4: throw e_12;
                                        case 5: return [3 /*break*/, 6];
                                        case 6: return [2 /*return*/];
                                    }
                                });
                            };
                            this_3 = this;
                            attempt = 0;
                            _b.label = 2;
                        case 2:
                            if (!(attempt < 3)) return [3 /*break*/, 5];
                            return [5 /*yield**/, _loop_4(attempt)];
                        case 3:
                            state_1 = _b.sent();
                            if (typeof state_1 === "object")
                                return [2 /*return*/, state_1.value];
                            _b.label = 4;
                        case 4:
                            attempt++;
                            return [3 /*break*/, 2];
                        case 5: throw lastErr || new Error('Claude request failed');
                    }
                });
            });
        };
        CanvasService_1.prototype.callClaudeSingleLine = function (prompt, maxTokens) {
            return __awaiter(this, void 0, void 0, function () {
                var model, staticBlock, text, line;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            model = (this.config.get('CLAUDE_MODEL') || ANTHROPIC_TEXT_MODEL_DEFAULT).trim();
                            staticBlock = 'You assist with Canvas course HTML accessibility. Respond with a single plain line only. No markdown code fences. No prose before or after the answer.';
                            return [4 /*yield*/, this.fetchAnthropicMessage({
                                    model: model,
                                    maxTokens: maxTokens,
                                    temperature: 0.1,
                                    staticBlock: staticBlock,
                                    dynamicBlock: prompt,
                                    meta: { context: 'ada_single_line' },
                                })];
                        case 1:
                            text = (_a.sent()).text;
                            line = String(text || '')
                                .replace(/```[\s\S]*?```/g, '')
                                .replace(/\s+/g, ' ')
                                .trim();
                            if (!line)
                                throw new Error('Claude returned empty response');
                            return [2 /*return*/, line];
                    }
                });
            });
        };
        CanvasService_1.prototype.callClaudeStructuredSuggestion = function (parts, opts) {
            return __awaiter(this, void 0, void 0, function () {
                var hasImage, useVision, model, lastErr, _loop_5, this_4, attempt, state_2;
                var _a, _b;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            hasImage = !!(((_a = opts === null || opts === void 0 ? void 0 : opts.image) === null || _a === void 0 ? void 0 : _a.base64) && ((_b = opts === null || opts === void 0 ? void 0 : opts.image) === null || _b === void 0 ? void 0 : _b.mediaType));
                            useVision = hasImage || (opts === null || opts === void 0 ? void 0 : opts.useVisionTierModel) === true;
                            model = useVision
                                ? (this.config.get('CLAUDE_VISION_MODEL') ||
                                    ANTHROPIC_VISION_MODEL_DEFAULT).trim()
                                : (this.config.get('CLAUDE_MODEL') ||
                                    ANTHROPIC_TEXT_MODEL_DEFAULT).trim();
                            lastErr = null;
                            _loop_5 = function (attempt) {
                                var text, raw, jsonMatch, jsonText, parsed, suggestion, confidenceRaw, confidence, reasoning, requiresReview, e_13, backoff_1;
                                return __generator(this, function (_d) {
                                    switch (_d.label) {
                                        case 0:
                                            _d.trys.push([0, 2, , 5]);
                                            return [4 /*yield*/, this_4.fetchAnthropicMessage({
                                                    model: model,
                                                    maxTokens: 250,
                                                    temperature: 0.2,
                                                    staticBlock: parts.staticInstruction,
                                                    dynamicBlock: parts.dynamicContext,
                                                    meta: {
                                                        context: 'ada_structured_suggestion',
                                                        ruleId: opts === null || opts === void 0 ? void 0 : opts.ruleId,
                                                        resourceType: opts === null || opts === void 0 ? void 0 : opts.resourceType,
                                                    },
                                                    image: opts === null || opts === void 0 ? void 0 : opts.image,
                                                })];
                                        case 1:
                                            text = (_d.sent()).text;
                                            raw = String(text || '').trim();
                                            jsonMatch = raw.match(/\{[\s\S]*\}/);
                                            jsonText = ((jsonMatch === null || jsonMatch === void 0 ? void 0 : jsonMatch[0]) || raw).trim();
                                            parsed = JSON.parse(jsonText);
                                            suggestion = String((parsed === null || parsed === void 0 ? void 0 : parsed.suggestion) || '').trim();
                                            confidenceRaw = Number(parsed === null || parsed === void 0 ? void 0 : parsed.confidence);
                                            confidence = Number.isFinite(confidenceRaw)
                                                ? Math.max(0, Math.min(1, confidenceRaw))
                                                : 0.35;
                                            reasoning = String((parsed === null || parsed === void 0 ? void 0 : parsed.reasoning) || '')
                                                .trim()
                                                .slice(0, 500);
                                            requiresReview = !!(parsed === null || parsed === void 0 ? void 0 : parsed.requires_review);
                                            if (!suggestion)
                                                throw new Error('Claude returned empty suggestion');
                                            return [2 /*return*/, { value: {
                                                        suggestion: suggestion,
                                                        confidence: confidence,
                                                        reasoning: reasoning,
                                                        requires_review: requiresReview,
                                                    } }];
                                        case 2:
                                            e_13 = _d.sent();
                                            lastErr = e_13;
                                            backoff_1 = 800 * (attempt + 1) + Math.round(Math.random() * 500);
                                            if (!(attempt < 2)) return [3 /*break*/, 4];
                                            return [4 /*yield*/, new Promise(function (r) { return setTimeout(r, backoff_1); })];
                                        case 3:
                                            _d.sent();
                                            _d.label = 4;
                                        case 4: return [3 /*break*/, 5];
                                        case 5: return [2 /*return*/];
                                    }
                                });
                            };
                            this_4 = this;
                            attempt = 0;
                            _c.label = 1;
                        case 1:
                            if (!(attempt < 3)) return [3 /*break*/, 4];
                            return [5 /*yield**/, _loop_5(attempt)];
                        case 2:
                            state_2 = _c.sent();
                            if (typeof state_2 === "object")
                                return [2 /*return*/, state_2.value];
                            _c.label = 3;
                        case 3:
                            attempt++;
                            return [3 /*break*/, 1];
                        case 4: throw lastErr || new Error('Claude structured suggestion failed');
                    }
                });
            });
        };
        CanvasService_1.prototype.fetchImageForVision = function (imageUrl) {
            return __awaiter(this, void 0, void 0, function () {
                var token_1, tryFetch, _a, _b;
                var _this = this;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            if (!imageUrl)
                                return [2 /*return*/, null];
                            _c.label = 1;
                        case 1:
                            _c.trys.push([1, 8, , 9]);
                            return [4 /*yield*/, this.getAuthHeaders()];
                        case 2:
                            token_1 = (_c.sent()).token;
                            tryFetch = function (withAuth) { return __awaiter(_this, void 0, void 0, function () {
                                var res, contentType, mediaType, arr, _a, _b;
                                return __generator(this, function (_c) {
                                    switch (_c.label) {
                                        case 0: return [4 /*yield*/, fetch(imageUrl, {
                                                method: 'GET',
                                                headers: withAuth ? { Authorization: "Bearer ".concat(token_1) } : undefined,
                                            })];
                                        case 1:
                                            res = _c.sent();
                                            if (!res.ok)
                                                throw new Error("HTTP ".concat(res.status));
                                            contentType = String(res.headers.get('content-type') || '').toLowerCase();
                                            mediaType = contentType.includes('png')
                                                ? 'image/png'
                                                : contentType.includes('webp')
                                                    ? 'image/webp'
                                                    : contentType.includes('gif')
                                                        ? 'image/gif'
                                                        : 'image/jpeg';
                                            _b = (_a = Buffer).from;
                                            return [4 /*yield*/, res.arrayBuffer()];
                                        case 2:
                                            arr = _b.apply(_a, [_c.sent()]);
                                            return [2 /*return*/, { base64: arr.toString('base64'), mediaType: mediaType }];
                                    }
                                });
                            }); };
                            _c.label = 3;
                        case 3:
                            _c.trys.push([3, 5, , 7]);
                            return [4 /*yield*/, tryFetch(true)];
                        case 4: return [2 /*return*/, _c.sent()];
                        case 5:
                            _a = _c.sent();
                            return [4 /*yield*/, tryFetch(false)];
                        case 6: return [2 /*return*/, _c.sent()];
                        case 7: return [3 /*break*/, 9];
                        case 8:
                            _b = _c.sent();
                            return [2 /*return*/, null];
                        case 9: return [2 /*return*/];
                    }
                });
            });
        };
        CanvasService_1.prototype.isCrypticImageFilename = function (name) {
            var cleaned = String(name || '')
                .replace(/\.[a-z0-9]+$/i, '')
                .trim();
            if (!cleaned)
                return true;
            return (/^(img|dsc|image|banner|photo|pic)[-_ ]?\d{2,}$/i.test(cleaned) ||
                /^[a-z]{1,4}[-_ ]?final[-_ ]?v?\d+$/i.test(cleaned));
        };
        CanvasService_1.prototype.resolveConfidenceTier = function (ruleId, confidence, opts) {
            var _a;
            var bounded = Number.isFinite(confidence)
                ? Math.max(0, Math.min(1, confidence))
                : 0.35;
            var overrideReason = '';
            if ((opts === null || opts === void 0 ? void 0 : opts.imageFetchFailed) &&
                ((_a = exports.ACCESSIBILITY_FIXABILITY_MAP[ruleId]) === null || _a === void 0 ? void 0 : _a.is_image_rule))
                overrideReason = 'image_fetch_failed';
            if (!overrideReason && ruleId === 'img_text_in_image_warning')
                overrideReason = 'rule_forced_low';
            if (!overrideReason && ruleId === 'landmark_structure_quality')
                overrideReason = 'rule_forced_low';
            if (!overrideReason && ruleId === 'color_only_information')
                overrideReason = 'rule_forced_low';
            if (!overrideReason &&
                ruleId === 'img_alt_filename' &&
                this.isCrypticImageFilename((opts === null || opts === void 0 ? void 0 : opts.imageFilename) || '')) {
                overrideReason = 'cryptic_filename';
            }
            if (!overrideReason && (opts === null || opts === void 0 ? void 0 : opts.requiresReview))
                overrideReason = 'model_requires_review';
            if (overrideReason) {
                return {
                    tier: 'low',
                    confidence: Math.min(bounded, 0.39),
                    override_reason: overrideReason,
                };
            }
            if (bounded >= 0.7)
                return { tier: 'high', confidence: bounded };
            if (bounded >= 0.4)
                return { tier: 'medium', confidence: bounded };
            return { tier: 'low', confidence: bounded };
        };
        CanvasService_1.prototype.extractFirstImageSrc = function (html) {
            var _a, _b, _c;
            var match = String(html || '').match(/<img\b[^>]*\bsrc\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
            return String((_c = (_b = (_a = match === null || match === void 0 ? void 0 : match[2]) !== null && _a !== void 0 ? _a : match === null || match === void 0 ? void 0 : match[3]) !== null && _b !== void 0 ? _b : match === null || match === void 0 ? void 0 : match[4]) !== null && _c !== void 0 ? _c : '').trim();
        };
        CanvasService_1.prototype.extractCurrentViolationValue = function (ruleId, html, fallbackSnippet) {
            var _a, _b, _c, _d, _e, _f;
            var h = String(html || '');
            if (ruleId.startsWith('img_')) {
                var alt = h.match(/<img\b[^>]*\balt\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
                return String((_c = (_b = (_a = alt === null || alt === void 0 ? void 0 : alt[2]) !== null && _a !== void 0 ? _a : alt === null || alt === void 0 ? void 0 : alt[3]) !== null && _b !== void 0 ? _b : alt === null || alt === void 0 ? void 0 : alt[4]) !== null && _c !== void 0 ? _c : '(missing)').trim();
            }
            if (ruleId.startsWith('heading_')) {
                var m = h.match(/<h[1-6]\b[^>]*>([\s\S]*?)<\/h[1-6]>/i);
                return String(((m === null || m === void 0 ? void 0 : m[1]) || '')
                    .replace(/<[^>]+>/g, ' ')
                    .replace(/\s+/g, ' ')
                    .trim() || '(empty)');
            }
            if (ruleId === 'link_broken') {
                var hm = h.match(/<a\b[^>]*\bhref\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
                return (String((_f = (_e = (_d = hm === null || hm === void 0 ? void 0 : hm[2]) !== null && _d !== void 0 ? _d : hm === null || hm === void 0 ? void 0 : hm[3]) !== null && _e !== void 0 ? _e : hm === null || hm === void 0 ? void 0 : hm[4]) !== null && _f !== void 0 ? _f : '').trim() || '(empty href)');
            }
            if (ruleId.startsWith('link_')) {
                var m = h.match(/<a\b[^>]*>([\s\S]*?)<\/a>/i);
                return String(((m === null || m === void 0 ? void 0 : m[1]) || '')
                    .replace(/<[^>]+>/g, ' ')
                    .replace(/\s+/g, ' ')
                    .trim() || '(empty)');
            }
            if (ruleId === 'table_missing_caption')
                return '(missing caption)';
            if (ruleId === 'iframe_missing_title')
                return '(missing title)';
            if (ruleId === 'button_empty_name')
                return '(empty button name)';
            if (ruleId === 'form_control_missing_label')
                return '(missing form label)';
            return (String(fallbackSnippet || '')
                .trim()
                .slice(0, 180) || '(context-only)');
        };
        CanvasService_1.prototype.applySuggestionToHtml = function (html, ruleId, suggestion) {
            return __awaiter(this, void 0, void 0, function () {
                var s, hint, boilerplate, hrefM, href, meta, t, suffix, appended, m, before, after, m, before, altValue, escaped, after, m, before, after, m, before, after, level, m, before, after, lvl, text, m, before, body, after, m, before, after, m, before, escaped, after, m, before, escaped, after, m, before, id, tag, after, mode, r, mode, r, m, before, lang, after, fragmentedMatch, before, after, reg, after, r, r, lang, htmlEl, before_1, after_1, spanEl, before, after, re, m, full, newHref, esc, after;
                var _a, _b, _c, _d, _e, _f, _g, _h;
                return __generator(this, function (_j) {
                    switch (_j.label) {
                        case 0:
                            s = String(suggestion || '').trim();
                            if (!s && ruleId !== 'link_file_missing_type_size_hint') {
                                return [2 /*return*/, { newHtml: html, changes: [], errorNote: 'Empty suggestion' }];
                            }
                            if (!(ruleId === 'link_file_missing_type_size_hint')) return [3 /*break*/, 3];
                            hint = s.replace(/^Hint added:\s*/i, '').trim();
                            boilerplate = !hint || /could not detect|enter a hint/i.test(hint);
                            if (!boilerplate) return [3 /*break*/, 2];
                            hrefM = html.match(/<a\b[^>]*\bhref\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
                            href = ((_c = (_b = (_a = hrefM === null || hrefM === void 0 ? void 0 : hrefM[2]) !== null && _a !== void 0 ? _a : hrefM === null || hrefM === void 0 ? void 0 : hrefM[3]) !== null && _b !== void 0 ? _b : hrefM === null || hrefM === void 0 ? void 0 : hrefM[4]) !== null && _c !== void 0 ? _c : '').trim();
                            return [4 /*yield*/, this.fetchLinkFileMetaForHint(href || 'https://invalid.invalid/')];
                        case 1:
                            meta = _j.sent();
                            hint = meta.suffix.trim();
                            _j.label = 2;
                        case 2:
                            if (!hint)
                                return [2 /*return*/, {
                                        newHtml: html,
                                        changes: [],
                                        errorNote: 'Enter a file type/size hint to append.',
                                    }];
                            t = hint.trim();
                            suffix = /^\(/.test(t) && /\)$/.test(t)
                                ? t.startsWith(' ')
                                    ? t
                                    : " ".concat(t)
                                : " (".concat(t.replace(/^\(|\)$/g, '').trim(), ")");
                            appended = this.applyLinkFileHintAppend(html, suffix);
                            if (!appended)
                                return [2 /*return*/, {
                                        newHtml: html,
                                        changes: [],
                                        errorNote: 'Could not append hint (no link found or hint already present).',
                                    }];
                            return [2 /*return*/, { newHtml: appended.newHtml, changes: appended.changes }];
                        case 3:
                            if (ruleId === 'heading_empty') {
                                m = html.match(/<h([1-6])\b([^>]*)>\s*<\/h\1>/i);
                                if (!m)
                                    return [2 /*return*/, {
                                            newHtml: html,
                                            changes: [],
                                            errorNote: 'No empty heading found',
                                        }];
                                before = m[0];
                                after = s.toUpperCase() === 'REMOVE'
                                    ? ''
                                    : "<h".concat(m[1]).concat(m[2], ">").concat(s.replace(/</g, '&lt;'), "</h").concat(m[1], ">");
                                return [2 /*return*/, {
                                        newHtml: html.replace(before, after),
                                        changes: [{ before: before, after: after || '(removed)' }],
                                    }];
                            }
                            if (((_d = exports.ACCESSIBILITY_FIXABILITY_MAP[ruleId]) === null || _d === void 0 ? void 0 : _d.is_image_rule) ||
                                ruleId === 'img_alt_too_long') {
                                m = html.match(/<img\b[^>]*>/i);
                                if (!m)
                                    return [2 /*return*/, { newHtml: html, changes: [], errorNote: 'No image found' }];
                                before = m[0];
                                altValue = /^decorative$/i.test(s) ? '' : s.slice(0, 125);
                                escaped = altValue.replace(/"/g, '&quot;');
                                after = /\balt\s*=/.test(before)
                                    ? before.replace(/\balt\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i, "alt=\"".concat(escaped, "\""))
                                    : before.replace(/<img\b/i, "<img alt=\"".concat(escaped, "\""));
                                return [2 /*return*/, {
                                        newHtml: html.replace(before, after),
                                        changes: [{ before: before, after: after }],
                                    }];
                            }
                            if (ruleId === 'link_ambiguous_text' || ruleId === 'link_empty_name') {
                                m = html.match(/<a\b([^>]*)>([\s\S]*?)<\/a>/i);
                                if (!m)
                                    return [2 /*return*/, { newHtml: html, changes: [], errorNote: 'No link found' }];
                                before = m[0];
                                after = "<a".concat(m[1], ">").concat(s.replace(/</g, '&lt;'), "</a>");
                                return [2 /*return*/, {
                                        newHtml: html.replace(before, after),
                                        changes: [{ before: before, after: after }],
                                    }];
                            }
                            if (ruleId === 'heading_too_long') {
                                m = html.match(/<h([1-6])\b([^>]*)>([\s\S]*?)<\/h\1>/i);
                                if (!m)
                                    return [2 /*return*/, { newHtml: html, changes: [], errorNote: 'No heading found' }];
                                before = m[0];
                                after = "<h".concat(m[1]).concat(m[2], ">").concat(s.replace(/</g, '&lt;'), "</h").concat(m[1], ">");
                                return [2 /*return*/, {
                                        newHtml: html.replace(before, after),
                                        changes: [{ before: before, after: after }],
                                    }];
                            }
                            if (ruleId === 'heading_skipped_level') {
                                level = (((_e = s.match(/h([1-6])/i)) === null || _e === void 0 ? void 0 : _e[1]) || '2').trim();
                                m = html.match(/<h([1-6])\b([^>]*)>([\s\S]*?)<\/h\1>/i);
                                if (!m)
                                    return [2 /*return*/, { newHtml: html, changes: [], errorNote: 'No heading found' }];
                                before = m[0];
                                after = "<h".concat(level).concat(m[2], ">").concat(m[3], "</h").concat(level, ">");
                                return [2 /*return*/, {
                                        newHtml: html.replace(before, after),
                                        changes: [{ before: before, after: after }],
                                    }];
                            }
                            if (ruleId === 'heading_visual_only_style') {
                                lvl = (((_f = s.match(/h([2-4])/i)) === null || _f === void 0 ? void 0 : _f[1]) || '2').trim();
                                text = s.replace(/^\s*h[2-4]\s*:\s*/i, '').trim();
                                m = html.match(/<(p|div|span)\b[^>]*>([\s\S]*?)<\/\1>/i);
                                if (!m)
                                    return [2 /*return*/, {
                                            newHtml: html,
                                            changes: [],
                                            errorNote: 'No visual heading candidate found',
                                        }];
                                before = m[0];
                                body = (text ||
                                    String(m[2] || '')
                                        .replace(/<[^>]+>/g, ' ')
                                        .trim()).replace(/</g, '&lt;');
                                after = "<h".concat(lvl, ">").concat(body, "</h").concat(lvl, ">");
                                return [2 /*return*/, {
                                        newHtml: html.replace(before, after),
                                        changes: [{ before: before, after: after }],
                                    }];
                            }
                            if (ruleId === 'table_missing_caption') {
                                m = html.match(/<table\b[^>]*>/i);
                                if (!m)
                                    return [2 /*return*/, { newHtml: html, changes: [], errorNote: 'No table found' }];
                                before = m[0];
                                after = "".concat(before, "<caption>").concat(s.replace(/</g, '&lt;'), "</caption>");
                                return [2 /*return*/, {
                                        newHtml: html.replace(before, after),
                                        changes: [{ before: before, after: after }],
                                    }];
                            }
                            if (ruleId === 'iframe_missing_title') {
                                m = html.match(/<iframe\b[^>]*>/i);
                                if (!m)
                                    return [2 /*return*/, { newHtml: html, changes: [], errorNote: 'No iframe found' }];
                                before = m[0];
                                escaped = s.replace(/"/g, '&quot;');
                                after = /\btitle\s*=/.test(before)
                                    ? before.replace(/\btitle\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i, "title=\"".concat(escaped, "\""))
                                    : before.replace(/<iframe\b/i, "<iframe title=\"".concat(escaped, "\""));
                                return [2 /*return*/, {
                                        newHtml: html.replace(before, after),
                                        changes: [{ before: before, after: after }],
                                    }];
                            }
                            if (ruleId === 'button_empty_name') {
                                m = html.match(/<button\b([^>]*)>([\s\S]*?)<\/button>/i);
                                if (!m)
                                    return [2 /*return*/, { newHtml: html, changes: [], errorNote: 'No button found' }];
                                before = m[0];
                                escaped = s.replace(/"/g, '&quot;');
                                after = "<button".concat(m[1], " aria-label=\"").concat(escaped, "\">").concat(m[2] || '', "</button>");
                                return [2 /*return*/, {
                                        newHtml: html.replace(before, after),
                                        changes: [{ before: before, after: after }],
                                    }];
                            }
                            if (ruleId === 'form_control_missing_label') {
                                m = html.match(/<(input|select|textarea)\b([^>]*)>/i);
                                if (!m)
                                    return [2 /*return*/, {
                                            newHtml: html,
                                            changes: [],
                                            errorNote: 'No form control found',
                                        }];
                                before = m[0];
                                id = ((_g = before.match(/\bid\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i)) === null || _g === void 0 ? void 0 : _g[2]) ||
                                    "acc-label-".concat(Math.random().toString(36).slice(2, 8));
                                tag = /\bid\s*=/.test(before)
                                    ? before
                                    : before.replace(/<(input|select|textarea)\b/i, "<$1 id=\"".concat(id, "\" "));
                                after = "<label for=\"".concat(id, "\">").concat(s.replace(/</g, '&lt;'), "</label> ").concat(tag);
                                return [2 /*return*/, {
                                        newHtml: html.replace(before, after),
                                        changes: [{ before: before, after: after }],
                                    }];
                            }
                            if (ruleId === 'table_layout_heuristic') {
                                mode = s === 'acc_fix:table_layout:headers' ? 'headers' : 'presentation';
                                r = this.applyTableLayoutFix(html, mode);
                                return [2 /*return*/, r
                                        ? { newHtml: r.newHtml, changes: r.changes }
                                        : {
                                            newHtml: html,
                                            changes: [],
                                            errorNote: 'Could not apply table layout fix.',
                                        }];
                            }
                            if (ruleId === 'aria_hidden_focusable') {
                                mode = s === 'acc_fix:aria_hidden:tabindex' ? 'tabindex' : 'remove';
                                r = this.applyAriaHiddenFocusableChoose(html, mode);
                                return [2 /*return*/, r
                                        ? { newHtml: r.newHtml, changes: r.changes }
                                        : {
                                            newHtml: html,
                                            changes: [],
                                            errorNote: 'No aria-hidden focusable candidate found',
                                        }];
                            }
                            if (ruleId === 'lang_inline_missing') {
                                m = html.match(/<span\b([^>]*)>([\s\S]*?)<\/span>/i);
                                if (!m)
                                    return [2 /*return*/, {
                                            newHtml: html,
                                            changes: [],
                                            errorNote: 'No inline text span found',
                                        }];
                                before = m[0];
                                lang = (((_h = s.match(/\b[a-z]{2}(-[A-Za-z0-9]+)?\b/i)) === null || _h === void 0 ? void 0 : _h[0]) || 'en').toLowerCase();
                                after = "<span".concat(m[1], " lang=\"").concat(lang, "\">").concat(m[2], "</span>");
                                return [2 /*return*/, {
                                        newHtml: html.replace(before, after),
                                        changes: [{ before: before, after: after }],
                                    }];
                            }
                            if (ruleId === 'link_split_or_broken') {
                                fragmentedMatch = html.match(/\bhttps?\s*:\s*\/\s*\/\s*[\w.-]+(?:\s*\/\s*[\w\-./?%&=+#:]*)?/i);
                                if (!fragmentedMatch)
                                    return [2 /*return*/, {
                                            newHtml: html,
                                            changes: [],
                                            errorNote: 'No split link fragment found',
                                        }];
                                before = fragmentedMatch[0];
                                after = s.includes('<a')
                                    ? s
                                    : "<a href=\"".concat(before.replace(/\s+/g, ''), "\">").concat(s.replace(/</g, '&lt;'), "</a>");
                                return [2 /*return*/, {
                                        newHtml: html.replace(before, after),
                                        changes: [{ before: before, after: after }],
                                    }];
                            }
                            if (ruleId === 'list_not_semantic') {
                                reg = (0, accessibility_heuristics_1.findSmallestManualListRegion)(html);
                                if (!reg)
                                    return [2 /*return*/, {
                                            newHtml: html,
                                            changes: [],
                                            errorNote: 'No manual list pattern found',
                                        }];
                                after = /[<>]/.test(s) ? s : reg.after;
                                return [2 /*return*/, {
                                        newHtml: html.slice(0, reg.start) + after + html.slice(reg.end),
                                        changes: [{ before: reg.before, after: after }],
                                    }];
                            }
                            if (ruleId === 'table_missing_header') {
                                r = this.applyTablePromoteFirstRowToThead(html);
                                return [2 /*return*/, r
                                        ? { newHtml: r.newHtml, changes: r.changes }
                                        : {
                                            newHtml: html,
                                            changes: [],
                                            errorNote: 'No table or first row to promote',
                                        }];
                            }
                            if (ruleId === 'aria_invalid_role') {
                                r = this.applyAriaRoleNormalizeFirst(html);
                                return [2 /*return*/, r
                                        ? { newHtml: r.newHtml, changes: r.changes }
                                        : {
                                            newHtml: html,
                                            changes: [],
                                            errorNote: 'No normalizable ARIA role found',
                                        }];
                            }
                            if (ruleId === 'lang_invalid') {
                                lang = (0, accessibility_heuristics_1.normalizeLangCode)(s);
                                htmlEl = html.match(/<html\b[^>]*>/i);
                                if (htmlEl) {
                                    before_1 = htmlEl[0];
                                    after_1 = /\blang\s*=\s*["'][^"']*["']/i.test(before_1)
                                        ? before_1.replace(/\blang\s*=\s*["'][^"']*["']/i, "lang=\"".concat(lang, "\""))
                                        : before_1.replace(/<html\b/i, "<html lang=\"".concat(lang, "\""));
                                    return [2 /*return*/, {
                                            newHtml: html.replace(before_1, after_1),
                                            changes: [{ before: before_1, after: after_1 }],
                                        }];
                                }
                                spanEl = html.match(/<span\b[^>]*>/i);
                                if (!spanEl)
                                    return [2 /*return*/, {
                                            newHtml: html,
                                            changes: [],
                                            errorNote: 'No html or span found',
                                        }];
                                before = spanEl[0];
                                after = /\blang\s*=\s*["'][^"']*["']/i.test(before)
                                    ? before.replace(/\blang\s*=\s*["'][^"']*["']/i, "lang=\"".concat(lang, "\""))
                                    : before.replace(/<span\b/i, "<span lang=\"".concat(lang, "\" "));
                                return [2 /*return*/, {
                                        newHtml: html.replace(before, after),
                                        changes: [{ before: before, after: after }],
                                    }];
                            }
                            if (ruleId === 'link_broken') {
                                re = /<a\b([^>]*\bhref\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))[^>]*)>([\s\S]*?)<\/a>/i;
                                m = html.match(re);
                                if (!m)
                                    return [2 /*return*/, { newHtml: html, changes: [], errorNote: 'No link found' }];
                                full = m[0];
                                newHref = s.trim();
                                if (!newHref)
                                    return [2 /*return*/, { newHtml: html, changes: [], errorNote: 'Empty URL' }];
                                esc = newHref.replace(/"/g, '&quot;');
                                after = full.replace(/\bhref\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i, "href=\"".concat(esc, "\""));
                                return [2 /*return*/, {
                                        newHtml: html.replace(full, after),
                                        changes: [{ before: full, after: after }],
                                    }];
                            }
                            if (ruleId === 'color_only_information' ||
                                ruleId === 'sensory_only_instructions' ||
                                ruleId === 'landmark_structure_quality') {
                                return [2 /*return*/, this.buildAiCheckpointGuidedFix(html, 'ADA content', {
                                        color_only_information: 'ai_color_only_information',
                                        sensory_only_instructions: 'ai_sensory_only_instructions',
                                        landmark_structure_quality: 'ai_landmark_structure',
                                    }[ruleId] || 'ai_landmark_structure', ruleId)];
                            }
                            return [2 /*return*/, {
                                    newHtml: html,
                                    changes: [],
                                    errorNote: 'No suggestion applier available for this rule',
                                }];
                    }
                });
            });
        };
        CanvasService_1.prototype.applySetHtmlLang = function (html) {
            var match = html.match(/<html\b[^>]*>/i);
            if (!match)
                return {
                    newHtml: html,
                    changes: [],
                    errorNote: 'No root <html> element found in content.',
                };
            var before = match[0];
            if (/\blang\s*=\s*["'][^"']+["']/i.test(before))
                return { newHtml: html, changes: [] };
            var after = before.replace(/<html\b/i, '<html lang="en"');
            return {
                newHtml: html.replace(before, after),
                changes: [{ before: before, after: after }],
            };
        };
        CanvasService_1.prototype.applyRemoveTextJustify = function (html) {
            var _a, _b;
            var changes = [];
            var styleAttrRegex = /\bstyle\s*=\s*("([^"]*)"|'([^']*)')/gi;
            var newHtml = html;
            var m;
            while ((m = styleAttrRegex.exec(html)) !== null) {
                var fullAttr = m[0];
                var styleValue = ((_b = (_a = m[2]) !== null && _a !== void 0 ? _a : m[3]) !== null && _b !== void 0 ? _b : '').trim();
                if (!/text-align\s*:\s*justify/i.test(styleValue))
                    continue;
                var updatedStyle = styleValue
                    .replace(/(?:^|;)\s*text-align\s*:\s*justify\s*;?/gi, ';')
                    .replace(/;;+/g, ';')
                    .replace(/^\s*;\s*|\s*;\s*$/g, '')
                    .trim();
                var after = updatedStyle ? "style=\"".concat(updatedStyle, "\"") : '';
                changes.push({ before: fullAttr, after: after || '(style removed)' });
                newHtml = after
                    ? newHtml.replace(fullAttr, after)
                    : newHtml.replace(/\s+\bstyle\s*=\s*("([^"]*)"|'([^']*)')/i, '');
            }
            return { newHtml: newHtml, changes: changes };
        };
        CanvasService_1.prototype.applyImgAltFilenameSuggest = function (html) {
            var _a, _b, _c;
            var imgRegex = /<img\b[^>]*>/gi;
            var changes = [];
            var newHtml = html;
            var m;
            while ((m = imgRegex.exec(html)) !== null) {
                var tag = m[0];
                var altMatch = tag.match(/\balt\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
                var alt = ((_c = (_b = (_a = altMatch === null || altMatch === void 0 ? void 0 : altMatch[2]) !== null && _a !== void 0 ? _a : altMatch === null || altMatch === void 0 ? void 0 : altMatch[3]) !== null && _b !== void 0 ? _b : altMatch === null || altMatch === void 0 ? void 0 : altMatch[4]) !== null && _c !== void 0 ? _c : '').trim();
                if (!alt)
                    continue;
                var isFilename = /\.(jpg|jpeg|png|gif|svg|webp|bmp|tiff?)$/i.test(alt) ||
                    (/[_-]/.test(alt) && !/\s/.test(alt));
                if (!isFilename)
                    continue;
                var suggested = alt
                    .replace(/\.(jpg|jpeg|png|gif|svg|webp|bmp|tiff?)$/i, '')
                    .replace(/[_-]+/g, ' ')
                    .trim();
                suggested = suggested
                    .split(/\s+/)
                    .map(function (w) { return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase(); })
                    .join(' ');
                if (!suggested)
                    suggested = 'Image';
                var withAlt = tag.replace(/\balt\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i, "alt=\"".concat(suggested.replace(/"/g, '&quot;'), "\""));
                changes.push({ before: tag, after: withAlt });
                newHtml = newHtml.replace(tag, withAlt);
            }
            return { newHtml: newHtml, changes: changes };
        };
        CanvasService_1.prototype.applyImgAltTruncate = function (html) {
            var _a, _b, _c;
            var imgRegex = /<img\b[^>]*>/gi;
            var changes = [];
            var newHtml = html;
            var m;
            while ((m = imgRegex.exec(html)) !== null) {
                var tag = m[0];
                var altMatch = tag.match(/\balt\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
                var alt = ((_c = (_b = (_a = altMatch === null || altMatch === void 0 ? void 0 : altMatch[2]) !== null && _a !== void 0 ? _a : altMatch === null || altMatch === void 0 ? void 0 : altMatch[3]) !== null && _b !== void 0 ? _b : altMatch === null || altMatch === void 0 ? void 0 : altMatch[4]) !== null && _c !== void 0 ? _c : '').trim();
                if (alt.length <= 125)
                    continue;
                var truncated = alt.slice(0, 124);
                var lastSpace = truncated.lastIndexOf(' ');
                if (lastSpace > 80)
                    truncated = truncated.slice(0, lastSpace);
                truncated = truncated.trim() + '…';
                var withAlt = tag.replace(/\balt\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i, "alt=\"".concat(truncated.replace(/"/g, '&quot;'), "\""));
                changes.push({ before: tag, after: withAlt });
                newHtml = newHtml.replace(tag, withAlt);
            }
            return { newHtml: newHtml, changes: changes };
        };
        CanvasService_1.prototype.applyHeadingH1Demote = function (html) {
            var changes = [];
            var newHtml = html;
            var regex = /<h1\b([^>]*)>([\s\S]*?)<\/h1>/gi;
            var mat;
            var matches = [];
            while ((mat = regex.exec(html)) !== null) {
                var full = mat[0];
                var repl = full.replace(/<h1\b/gi, '<h2').replace(/<\/h1>/gi, '</h2>');
                matches.push({ full: full, replacement: repl });
            }
            for (var _i = 0, matches_1 = matches; _i < matches_1.length; _i++) {
                var _a = matches_1[_i], full = _a.full, replacement = _a.replacement;
                changes.push({ before: full, after: replacement });
                newHtml = newHtml.replace(full, replacement);
            }
            return { newHtml: newHtml, changes: changes };
        };
        CanvasService_1.prototype.applyHeadingDuplicateH1Demote = function (html) {
            var changes = [];
            var newHtml = html;
            var regex = /<h1\b([^>]*)>([\s\S]*?)<\/h1>/gi;
            var matches = [];
            var first = true;
            var mat;
            while ((mat = regex.exec(html)) !== null) {
                var full = mat[0];
                if (first) {
                    first = false;
                    continue;
                }
                var repl = full.replace(/<h1\b/gi, '<h2').replace(/<\/h1>/gi, '</h2>');
                matches.push({ full: full, replacement: repl });
            }
            for (var _i = 0, matches_2 = matches; _i < matches_2.length; _i++) {
                var _a = matches_2[_i], full = _a.full, replacement = _a.replacement;
                changes.push({ before: full, after: replacement });
                newHtml = newHtml.replace(full, replacement);
            }
            return { newHtml: newHtml, changes: changes };
        };
        CanvasService_1.prototype.applyIframeTitleSuggest = function (html) {
            var _a, _b, _c;
            var changes = [];
            var newHtml = html;
            var iframeRegex = /<iframe\b([^>]*)>/gi;
            var m;
            while ((m = iframeRegex.exec(html)) !== null) {
                var tag = m[0];
                if (/\btitle\s*=\s*["'][^"']+["']/i.test(tag))
                    continue;
                var srcMatch = tag.match(/\bsrc\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
                var src = ((_c = (_b = (_a = srcMatch === null || srcMatch === void 0 ? void 0 : srcMatch[2]) !== null && _a !== void 0 ? _a : srcMatch === null || srcMatch === void 0 ? void 0 : srcMatch[3]) !== null && _b !== void 0 ? _b : srcMatch === null || srcMatch === void 0 ? void 0 : srcMatch[4]) !== null && _c !== void 0 ? _c : '').trim();
                var domain = 'unknown';
                try {
                    if (src.startsWith('//')) {
                        var u = new URL('https:' + src);
                        domain = u.hostname;
                    }
                    else if (/^https?:\/\//i.test(src)) {
                        domain = new URL(src).hostname;
                    }
                    else if (src) {
                        domain = src.split(/[/?#]/)[0] || 'content';
                    }
                }
                catch (_d) {
                    domain = src ? src.split(/[/?#]/)[0] || 'content' : 'unknown';
                }
                var title = "Embedded content from ".concat(domain);
                var withTitle = tag.replace(/<iframe\b/i, "<iframe title=\"".concat(title.replace(/"/g, '&quot;'), "\""));
                changes.push({ before: tag, after: withTitle });
                newHtml = newHtml.replace(tag, withTitle);
            }
            return { newHtml: newHtml, changes: changes };
        };
        CanvasService_1.prototype.buildAiAltTextFix = function (html, resourceTitle) {
            return __awaiter(this, void 0, void 0, function () {
                var imgRegex, img, imgTag, srcMatch, src, check, e_14, contextWindow, contextText, prompt, alt, withAlt, e_15;
                var _a, _b, _c;
                return __generator(this, function (_d) {
                    switch (_d.label) {
                        case 0:
                            imgRegex = /<img\b[^>]*>/i;
                            img = imgRegex.exec(html);
                            if (!img)
                                return [2 /*return*/, {
                                        newHtml: html,
                                        changes: [],
                                        errorNote: 'No image tag found for missing alt text.',
                                    }];
                            imgTag = img[0];
                            if (/\balt\s*=\s*("([^"]*)"|'([^']*)'|[^\s>]+)/i.test(imgTag))
                                return [2 /*return*/, { newHtml: html, changes: [] }];
                            srcMatch = imgTag.match(/\bsrc\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
                            src = ((_c = (_b = (_a = srcMatch === null || srcMatch === void 0 ? void 0 : srcMatch[2]) !== null && _a !== void 0 ? _a : srcMatch === null || srcMatch === void 0 ? void 0 : srcMatch[3]) !== null && _b !== void 0 ? _b : srcMatch === null || srcMatch === void 0 ? void 0 : srcMatch[4]) !== null && _c !== void 0 ? _c : '').trim();
                            if (!src || !/^https?:\/\//i.test(src)) {
                                return [2 /*return*/, {
                                        newHtml: html,
                                        changes: [],
                                        errorNote: 'Image src is not accessible for AI alt-text generation.',
                                    }];
                            }
                            _d.label = 1;
                        case 1:
                            _d.trys.push([1, 3, , 4]);
                            return [4 /*yield*/, fetch(src, { method: 'GET' })];
                        case 2:
                            check = _d.sent();
                            if (!check.ok)
                                return [2 /*return*/, {
                                        newHtml: html,
                                        changes: [],
                                        errorNote: "Image src returned HTTP ".concat(check.status, "."),
                                    }];
                            return [3 /*break*/, 4];
                        case 3:
                            e_14 = _d.sent();
                            return [2 /*return*/, {
                                    newHtml: html,
                                    changes: [],
                                    errorNote: "Image src fetch failed: ".concat((e_14 === null || e_14 === void 0 ? void 0 : e_14.message) || 'unknown error'),
                                }];
                        case 4:
                            contextWindow = html.slice(Math.max(0, img.index - 300), Math.min(html.length, img.index + imgTag.length + 300));
                            contextText = contextWindow
                                .replace(/<[^>]+>/g, ' ')
                                .replace(/\s+/g, ' ')
                                .trim();
                            prompt = [
                                'Return plain text only.',
                                'Generate a single alt text string under 125 characters.',
                                'Be descriptive and specific for WCAG 2.1 AA course content.',
                                'No quotes. No preamble.',
                                "Image src: ".concat(src),
                                "Page or assignment title: ".concat(resourceTitle || '(unknown)'),
                                "Surrounding context: ".concat(contextText || '(none)'),
                            ].join('\n');
                            _d.label = 5;
                        case 5:
                            _d.trys.push([5, 7, , 8]);
                            return [4 /*yield*/, this.callClaudeWithRetry(prompt, 120)];
                        case 6:
                            alt = _d.sent();
                            alt = alt.replace(/^["']|["']$/g, '').trim();
                            if (alt.length > 125)
                                alt = alt.slice(0, 125).trim();
                            if (!alt)
                                return [2 /*return*/, {
                                        newHtml: html,
                                        changes: [],
                                        errorNote: 'Claude returned empty alt text.',
                                    }];
                            withAlt = imgTag.replace(/<img\b/i, "<img alt=\"".concat(alt.replace(/"/g, '&quot;'), "\""));
                            return [2 /*return*/, {
                                    newHtml: html.replace(imgTag, withAlt),
                                    changes: [{ before: imgTag, after: withAlt }],
                                }];
                        case 7:
                            e_15 = _d.sent();
                            return [2 /*return*/, {
                                    newHtml: html,
                                    changes: [],
                                    errorNote: (e_15 === null || e_15 === void 0 ? void 0 : e_15.message) || 'Claude alt-text generation failed.',
                                }];
                        case 8: return [2 /*return*/];
                    }
                });
            });
        };
        CanvasService_1.prototype.buildAiAmbiguousLinkFix = function (html) {
            return __awaiter(this, void 0, void 0, function () {
                var ambiguous, linkRegex, m, attrs, inner, text, hrefMatch, href, contextWindow, contextText, prompt_1, suggested, before, after, e_16;
                var _a, _b, _c;
                return __generator(this, function (_d) {
                    switch (_d.label) {
                        case 0:
                            ambiguous = /^(click here|read more|learn more|more|here|this link)$/i;
                            linkRegex = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
                            _d.label = 1;
                        case 1:
                            if (!((m = linkRegex.exec(html)) !== null)) return [3 /*break*/, 6];
                            attrs = m[1] || '';
                            inner = m[2] || '';
                            text = inner
                                .replace(/<[^>]+>/g, ' ')
                                .replace(/\s+/g, ' ')
                                .trim();
                            if (!ambiguous.test(text))
                                return [3 /*break*/, 1];
                            hrefMatch = attrs.match(/\bhref\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
                            href = ((_c = (_b = (_a = hrefMatch === null || hrefMatch === void 0 ? void 0 : hrefMatch[2]) !== null && _a !== void 0 ? _a : hrefMatch === null || hrefMatch === void 0 ? void 0 : hrefMatch[3]) !== null && _b !== void 0 ? _b : hrefMatch === null || hrefMatch === void 0 ? void 0 : hrefMatch[4]) !== null && _c !== void 0 ? _c : '').trim();
                            contextWindow = html.slice(Math.max(0, m.index - 300), Math.min(html.length, m.index + m[0].length + 300));
                            contextText = contextWindow
                                .replace(/<[^>]+>/g, ' ')
                                .replace(/\s+/g, ' ')
                                .trim();
                            prompt_1 = [
                                'Return plain text only.',
                                'Return one suggested link text string under 80 characters.',
                                'No quotes. No preamble.',
                                "Current link text: ".concat(text),
                                "Link href: ".concat(href || '(missing)'),
                                "Surrounding context: ".concat(contextText || '(none)'),
                            ].join('\n');
                            _d.label = 2;
                        case 2:
                            _d.trys.push([2, 4, , 5]);
                            return [4 /*yield*/, this.callClaudeWithRetry(prompt_1, 80)];
                        case 3:
                            suggested = _d.sent();
                            suggested = suggested.replace(/^["']|["']$/g, '').trim();
                            if (suggested.length > 80)
                                suggested = suggested.slice(0, 80).trim();
                            if (!suggested)
                                return [2 /*return*/, {
                                        newHtml: html,
                                        changes: [],
                                        errorNote: 'Claude returned empty link text.',
                                    }];
                            before = m[0];
                            after = "<a".concat(attrs, ">").concat(suggested, "</a>");
                            return [2 /*return*/, {
                                    newHtml: html.replace(before, after),
                                    changes: [{ before: before, after: after }],
                                }];
                        case 4:
                            e_16 = _d.sent();
                            return [2 /*return*/, {
                                    newHtml: html,
                                    changes: [],
                                    errorNote: (e_16 === null || e_16 === void 0 ? void 0 : e_16.message) || 'Claude link-text generation failed.',
                                }];
                        case 5: return [3 /*break*/, 1];
                        case 6: return [2 /*return*/, {
                                newHtml: html,
                                changes: [],
                                errorNote: 'No ambiguous link text found in content.',
                            }];
                    }
                });
            });
        };
        CanvasService_1.prototype.buildAiLinkEmptyNameFix = function (html, resourceTitle) {
            return __awaiter(this, void 0, void 0, function () {
                var linkRegex, stripTags, m, attrs, text, hrefMatch, href, ctx, prompt_2, suggested, before, after, e_17;
                var _a, _b, _c;
                return __generator(this, function (_d) {
                    switch (_d.label) {
                        case 0:
                            linkRegex = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
                            stripTags = function (s) {
                                return s
                                    .replace(/<[^>]+>/g, ' ')
                                    .replace(/\s+/g, ' ')
                                    .trim();
                            };
                            _d.label = 1;
                        case 1:
                            if (!((m = linkRegex.exec(html)) !== null)) return [3 /*break*/, 6];
                            attrs = m[1] || '';
                            text = stripTags(m[2] || '');
                            if (text || /\baria-label\s*=\s*["'][^"']+["']/i.test(attrs))
                                return [3 /*break*/, 1];
                            hrefMatch = attrs.match(/\bhref\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
                            href = ((_c = (_b = (_a = hrefMatch === null || hrefMatch === void 0 ? void 0 : hrefMatch[2]) !== null && _a !== void 0 ? _a : hrefMatch === null || hrefMatch === void 0 ? void 0 : hrefMatch[3]) !== null && _b !== void 0 ? _b : hrefMatch === null || hrefMatch === void 0 ? void 0 : hrefMatch[4]) !== null && _c !== void 0 ? _c : '').trim();
                            ctx = html
                                .slice(Math.max(0, m.index - 200), Math.min(html.length, m.index + m[0].length + 200))
                                .replace(/<[^>]+>/g, ' ')
                                .replace(/\s+/g, ' ')
                                .trim();
                            prompt_2 = "This link has no descriptive text. Based on the href URL and surrounding context, suggest a short descriptive link text under 60 characters. Return plain text only.\n\nhref: ".concat(href, "\nContext: ").concat(ctx, "\nPage: ").concat(resourceTitle);
                            _d.label = 2;
                        case 2:
                            _d.trys.push([2, 4, , 5]);
                            return [4 /*yield*/, this.callClaudeWithRetry(prompt_2, 60)];
                        case 3:
                            suggested = _d.sent();
                            suggested = suggested
                                .replace(/^["']|["']$/g, '')
                                .trim()
                                .slice(0, 60);
                            if (!suggested)
                                return [3 /*break*/, 1];
                            before = m[0];
                            after = "<a".concat(attrs, ">").concat(suggested, "</a>");
                            return [2 /*return*/, {
                                    newHtml: html.replace(before, after),
                                    changes: [{ before: before, after: after }],
                                }];
                        case 4:
                            e_17 = _d.sent();
                            return [2 /*return*/, {
                                    newHtml: html,
                                    changes: [],
                                    errorNote: (e_17 === null || e_17 === void 0 ? void 0 : e_17.message) || 'Claude failed.',
                                }];
                        case 5: return [3 /*break*/, 1];
                        case 6: return [2 /*return*/, {
                                newHtml: html,
                                changes: [],
                                errorNote: 'No empty-name link found.',
                            }];
                    }
                });
            });
        };
        CanvasService_1.prototype.buildAiLinkFileHintFix = function (html, resourceTitle) {
            return __awaiter(this, void 0, void 0, function () {
                var linkRegex, stripTags, m, attrs, text, hrefMatch, href, ext, ctx, prompt_3, suggested, before, after, e_18;
                var _a, _b, _c, _d, _e;
                return __generator(this, function (_f) {
                    switch (_f.label) {
                        case 0:
                            linkRegex = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
                            stripTags = function (s) {
                                return s
                                    .replace(/<[^>]+>/g, ' ')
                                    .replace(/\s+/g, ' ')
                                    .trim();
                            };
                            _f.label = 1;
                        case 1:
                            if (!((m = linkRegex.exec(html)) !== null)) return [3 /*break*/, 6];
                            attrs = m[1] || '';
                            text = stripTags(m[2] || '');
                            hrefMatch = attrs.match(/\bhref\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
                            href = ((_c = (_b = (_a = hrefMatch === null || hrefMatch === void 0 ? void 0 : hrefMatch[2]) !== null && _a !== void 0 ? _a : hrefMatch === null || hrefMatch === void 0 ? void 0 : hrefMatch[3]) !== null && _b !== void 0 ? _b : hrefMatch === null || hrefMatch === void 0 ? void 0 : hrefMatch[4]) !== null && _c !== void 0 ? _c : '').trim();
                            ext = ((_e = (_d = href
                                .match(/\.(pdf|docx?|pptx?|xlsx?|csv)(?:[?#].*)?$/i)) === null || _d === void 0 ? void 0 : _d[1]) === null || _e === void 0 ? void 0 : _e.toUpperCase()) || 'file';
                            if (!/\.(pdf|docx?|pptx?|xlsx?|csv)(?:[?#].*)?$/i.test(href))
                                return [3 /*break*/, 1];
                            if (/\b(pdf|doc|word|ppt|powerpoint|xls|excel|csv)\b/i.test(text))
                                return [3 /*break*/, 1];
                            ctx = html
                                .slice(Math.max(0, m.index - 150), m.index + m[0].length + 150)
                                .replace(/<[^>]+>/g, ' ')
                                .replace(/\s+/g, ' ')
                                .trim();
                            prompt_3 = "This link points to a ".concat(ext, " file but does not tell the user. Suggest updated link text that naturally incorporates the file type, e.g. \"Course Syllabus (PDF)\". Return plain text only, under 80 characters.\n\nCurrent text: ").concat(text, "\nPage: ").concat(resourceTitle, "\nContext: ").concat(ctx);
                            _f.label = 2;
                        case 2:
                            _f.trys.push([2, 4, , 5]);
                            return [4 /*yield*/, this.callClaudeWithRetry(prompt_3, 80)];
                        case 3:
                            suggested = _f.sent();
                            suggested = suggested
                                .replace(/^["']|["']$/g, '')
                                .trim()
                                .slice(0, 80);
                            if (!suggested)
                                return [3 /*break*/, 1];
                            before = m[0];
                            after = "<a".concat(attrs, ">").concat(suggested, "</a>");
                            return [2 /*return*/, {
                                    newHtml: html.replace(before, after),
                                    changes: [{ before: before, after: after }],
                                }];
                        case 4:
                            e_18 = _f.sent();
                            return [2 /*return*/, {
                                    newHtml: html,
                                    changes: [],
                                    errorNote: (e_18 === null || e_18 === void 0 ? void 0 : e_18.message) || 'Claude failed.',
                                }];
                        case 5: return [3 /*break*/, 1];
                        case 6: return [2 /*return*/, {
                                newHtml: html,
                                changes: [],
                                errorNote: 'No file link without type hint found.',
                            }];
                    }
                });
            });
        };
        CanvasService_1.prototype.buildAiHeadingShortenFix = function (html, resourceTitle) {
            return __awaiter(this, void 0, void 0, function () {
                var headingRegex, stripTags, m, level, attrs, text, ctx, prompt_4, suggested, before, after, e_19;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            headingRegex = /<(h[1-6])\b([^>]*)>([\s\S]*?)<\/\1>/gi;
                            stripTags = function (s) {
                                return s
                                    .replace(/<[^>]+>/g, ' ')
                                    .replace(/\s+/g, ' ')
                                    .trim();
                            };
                            _a.label = 1;
                        case 1:
                            if (!((m = headingRegex.exec(html)) !== null)) return [3 /*break*/, 6];
                            level = m[1];
                            attrs = m[2] || '';
                            text = stripTags(m[3] || '');
                            if (text.length <= 120)
                                return [3 /*break*/, 1];
                            ctx = html
                                .slice(Math.max(0, m.index - 100), m.index + m[0].length + 300)
                                .replace(/<[^>]+>/g, ' ')
                                .replace(/\s+/g, ' ')
                                .trim();
                            prompt_4 = "This heading is too long for accessibility. Suggest a shortened version under 80 characters that preserves the core meaning. Return plain text only.\n\nHeading: ".concat(text, "\nSection context: ").concat(ctx, "\nPage: ").concat(resourceTitle);
                            _a.label = 2;
                        case 2:
                            _a.trys.push([2, 4, , 5]);
                            return [4 /*yield*/, this.callClaudeWithRetry(prompt_4, 80)];
                        case 3:
                            suggested = _a.sent();
                            suggested = suggested
                                .replace(/^["']|["']$/g, '')
                                .trim()
                                .slice(0, 80);
                            if (!suggested)
                                return [3 /*break*/, 1];
                            before = m[0];
                            after = "<".concat(level).concat(attrs, ">").concat(suggested, "</").concat(level, ">");
                            return [2 /*return*/, {
                                    newHtml: html.replace(before, after),
                                    changes: [{ before: before, after: after }],
                                }];
                        case 4:
                            e_19 = _a.sent();
                            return [2 /*return*/, {
                                    newHtml: html,
                                    changes: [],
                                    errorNote: (e_19 === null || e_19 === void 0 ? void 0 : e_19.message) || 'Claude failed.',
                                }];
                        case 5: return [3 /*break*/, 1];
                        case 6: return [2 /*return*/, { newHtml: html, changes: [], errorNote: 'No long heading found.' }];
                    }
                });
            });
        };
        CanvasService_1.prototype.buildAiHeadingVisualFix = function (html, resourceTitle) {
            return __awaiter(this, void 0, void 0, function () {
                var styledRegex, m, inner, ctx, prompt_5, out, tagMatch, before, after, e_20;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            styledRegex = /<(?:p|div|span)\b[^>]*style\s*=\s*["'][^"']*(?:font-size\s*:\s*(?:2[4-9]|[3-9]\d)px|font-weight\s*:\s*(?:700|800|900|bold))[^"']*["'][^>]*>([\s\S]*?)<\/(?:p|div|span)>/gi;
                            _a.label = 1;
                        case 1:
                            if (!((m = styledRegex.exec(html)) !== null)) return [3 /*break*/, 6];
                            inner = m[1] || '';
                            ctx = html
                                .slice(Math.max(0, m.index - 150), m.index + m[0].length + 150)
                                .replace(/<[^>]+>/g, ' ')
                                .replace(/\s+/g, ' ')
                                .trim();
                            prompt_5 = "This text appears to be used as a heading based on its styling but is not marked up semantically. Suggest the appropriate heading level (H2, H3, or H4) and return only the corrected heading HTML tag wrapping the original text.\n\nText: ".concat(inner, "\nContext: ").concat(ctx, "\nPage: ").concat(resourceTitle);
                            _a.label = 2;
                        case 2:
                            _a.trys.push([2, 4, , 5]);
                            return [4 /*yield*/, this.callClaudeWithRetry(prompt_5, 200)];
                        case 3:
                            out = _a.sent();
                            out = out.replace(/```\w*\n?|\n?```/g, '').trim();
                            tagMatch = out.match(/<h[2-4]\b[^>]*>[\s\S]*<\/h[2-4]>/i);
                            if (!tagMatch)
                                return [3 /*break*/, 1];
                            before = m[0];
                            after = tagMatch[0];
                            return [2 /*return*/, {
                                    newHtml: html.replace(before, after),
                                    changes: [{ before: before, after: after }],
                                }];
                        case 4:
                            e_20 = _a.sent();
                            return [2 /*return*/, {
                                    newHtml: html,
                                    changes: [],
                                    errorNote: (e_20 === null || e_20 === void 0 ? void 0 : e_20.message) || 'Claude failed.',
                                }];
                        case 5: return [3 /*break*/, 1];
                        case 6: return [2 /*return*/, {
                                newHtml: html,
                                changes: [],
                                errorNote: 'No visual-only heading found.',
                            }];
                    }
                });
            });
        };
        CanvasService_1.prototype.buildAiListSemanticFix = function (html, resourceTitle) {
            return __awaiter(this, void 0, void 0, function () {
                var bulletLine, numLine, block, text, prompt, out, before, e_21;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            bulletLine = /^[\s]*[-*•]\s+.+$/gm;
                            numLine = /^[\s]*\d+[.)]\s+.+$/gm;
                            block = html.match(/(?:<p\b[^>]*>|<div\b[^>]*>)[\s\S]*?(?:[-*•]\s+.+|\d+[.)]\s+.+)[\s\S]*?<\/(?:p|div)>/i) || html.match(/([-*•]\s+.+(\n[-*•]\s+.+)+)/m);
                            text = block
                                ? Array.isArray(block)
                                    ? block[1] || block[0]
                                    : block[0]
                                : '';
                            if (!text || (!bulletLine.test(text) && !numLine.test(text)))
                                return [2 /*return*/, {
                                        newHtml: html,
                                        changes: [],
                                        errorNote: 'No list-like content found.',
                                    }];
                            prompt = "This text appears to be a list but is not marked up as HTML. Convert it to a properly structured <ul> or <ol> with <li> items as appropriate. Return only the corrected HTML list.\n\nText:\n".concat(text, "\nPage: ").concat(resourceTitle);
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 3, , 4]);
                            return [4 /*yield*/, this.callClaudeWithRetry(prompt, 400)];
                        case 2:
                            out = _a.sent();
                            out = out.replace(/```\w*\n?|\n?```/g, '').trim();
                            if (!/<(?:ul|ol)\b/i.test(out))
                                return [2 /*return*/, {
                                        newHtml: html,
                                        changes: [],
                                        errorNote: 'Claude did not return valid list HTML.',
                                    }];
                            before = block ? (Array.isArray(block) ? block[0] : block) : text;
                            if (!html.includes(String(before)))
                                return [2 /*return*/, {
                                        newHtml: html,
                                        changes: [],
                                        errorNote: 'Matching block not found in content.',
                                    }];
                            return [2 /*return*/, {
                                    newHtml: html.replace(String(before), out),
                                    changes: [{ before: String(before), after: out }],
                                }];
                        case 3:
                            e_21 = _a.sent();
                            return [2 /*return*/, {
                                    newHtml: html,
                                    changes: [],
                                    errorNote: (e_21 === null || e_21 === void 0 ? void 0 : e_21.message) || 'Claude failed.',
                                }];
                        case 4: return [2 /*return*/];
                    }
                });
            });
        };
        CanvasService_1.prototype.buildAiImgDecorativeFix = function (html, resourceTitle) {
            return __awaiter(this, void 0, void 0, function () {
                var imgRegex, m, attrs, srcMatch, src, ctx, prompt_6, out, tag, final, suggested, withAlt, e_22;
                var _a, _b, _c;
                return __generator(this, function (_d) {
                    switch (_d.label) {
                        case 0:
                            imgRegex = /<img\b([^>]*)>/gi;
                            _d.label = 1;
                        case 1:
                            if (!((m = imgRegex.exec(html)) !== null)) return [3 /*break*/, 6];
                            attrs = m[1] || '';
                            srcMatch = attrs.match(/\bsrc\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
                            src = ((_c = (_b = (_a = srcMatch === null || srcMatch === void 0 ? void 0 : srcMatch[2]) !== null && _a !== void 0 ? _a : srcMatch === null || srcMatch === void 0 ? void 0 : srcMatch[3]) !== null && _b !== void 0 ? _b : srcMatch === null || srcMatch === void 0 ? void 0 : srcMatch[4]) !== null && _c !== void 0 ? _c : '').trim();
                            ctx = html
                                .slice(Math.max(0, m.index - 200), m.index + m[0].length + 200)
                                .replace(/<[^>]+>/g, ' ')
                                .replace(/\s+/g, ' ')
                                .trim();
                            prompt_6 = "Based on the image URL and surrounding content, determine whether this image is decorative or informational. If informational, suggest a short descriptive alt text under 125 characters. Return either the word DECORATIVE or the suggested alt text only.\n\nsrc: ".concat(src, "\nContext: ").concat(ctx, "\nPage: ").concat(resourceTitle);
                            _d.label = 2;
                        case 2:
                            _d.trys.push([2, 4, , 5]);
                            return [4 /*yield*/, this.callClaudeWithRetry(prompt_6, 130)];
                        case 3:
                            out = _d.sent();
                            out = out
                                .replace(/^["']|["']$/g, '')
                                .trim()
                                .toUpperCase();
                            tag = m[0];
                            if (out === 'DECORATIVE' || out.startsWith('DECORATIVE')) {
                                final = /\balt\s*=/.test(tag)
                                    ? tag.replace(/\balt\s*=\s*["'][^"']*["']/i, 'alt=""')
                                    : tag.replace(/<img\b/i, '<img alt=""');
                                return [2 /*return*/, {
                                        newHtml: html.replace(tag, final),
                                        changes: [{ before: tag, after: final }],
                                    }];
                            }
                            suggested = out.length > 125 ? out.slice(0, 125).trim() : out;
                            withAlt = /\balt\s*=/.test(tag)
                                ? tag.replace(/\balt\s*=\s*["'][^"']*["']/i, "alt=\"".concat(suggested.replace(/"/g, '&quot;'), "\""))
                                : tag.replace(/<img\b/i, "<img alt=\"".concat(suggested.replace(/"/g, '&quot;'), "\""));
                            return [2 /*return*/, {
                                    newHtml: html.replace(tag, withAlt),
                                    changes: [{ before: tag, after: withAlt }],
                                }];
                        case 4:
                            e_22 = _d.sent();
                            return [2 /*return*/, {
                                    newHtml: html,
                                    changes: [],
                                    errorNote: (e_22 === null || e_22 === void 0 ? void 0 : e_22.message) || 'Claude failed.',
                                }];
                        case 5: return [3 /*break*/, 1];
                        case 6: return [2 /*return*/, { newHtml: html, changes: [], errorNote: 'No image found.' }];
                    }
                });
            });
        };
        CanvasService_1.prototype.buildAiImgMeaningfulAltFix = function (html, resourceTitle) {
            return __awaiter(this, void 0, void 0, function () {
                var imgRegex, m, attrs, altMatch, alt, srcMatch, src, ctx, prompt_7, suggested, tag, withAlt, e_23;
                var _a, _b, _c, _d, _e, _f;
                return __generator(this, function (_g) {
                    switch (_g.label) {
                        case 0:
                            imgRegex = /<img\b([^>]*)>/gi;
                            _g.label = 1;
                        case 1:
                            if (!((m = imgRegex.exec(html)) !== null)) return [3 /*break*/, 6];
                            attrs = m[1] || '';
                            altMatch = attrs.match(/\balt\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
                            alt = ((_c = (_b = (_a = altMatch === null || altMatch === void 0 ? void 0 : altMatch[2]) !== null && _a !== void 0 ? _a : altMatch === null || altMatch === void 0 ? void 0 : altMatch[3]) !== null && _b !== void 0 ? _b : altMatch === null || altMatch === void 0 ? void 0 : altMatch[4]) !== null && _c !== void 0 ? _c : '').trim();
                            if (alt ||
                                /\b(role\s*=\s*["']presentation["']|aria-hidden\s*=\s*["']true["'])/i.test(attrs))
                                return [3 /*break*/, 1];
                            srcMatch = attrs.match(/\bsrc\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
                            src = ((_f = (_e = (_d = srcMatch === null || srcMatch === void 0 ? void 0 : srcMatch[2]) !== null && _d !== void 0 ? _d : srcMatch === null || srcMatch === void 0 ? void 0 : srcMatch[3]) !== null && _e !== void 0 ? _e : srcMatch === null || srcMatch === void 0 ? void 0 : srcMatch[4]) !== null && _f !== void 0 ? _f : '').trim();
                            ctx = html
                                .slice(Math.max(0, m.index - 200), m.index + m[0].length + 200)
                                .replace(/<[^>]+>/g, ' ')
                                .replace(/\s+/g, ' ')
                                .trim();
                            prompt_7 = "This image appears to be meaningful but has no alt text. Based on the image URL and surrounding context, suggest a short descriptive alt text under 125 characters. Return plain text only.\n\nsrc: ".concat(src, "\nContext: ").concat(ctx, "\nPage: ").concat(resourceTitle);
                            _g.label = 2;
                        case 2:
                            _g.trys.push([2, 4, , 5]);
                            return [4 /*yield*/, this.callClaudeWithRetry(prompt_7, 130)];
                        case 3:
                            suggested = _g.sent();
                            suggested = suggested
                                .replace(/^["']|["']$/g, '')
                                .trim()
                                .slice(0, 125);
                            if (!suggested)
                                return [3 /*break*/, 1];
                            tag = m[0];
                            withAlt = tag.replace(/<img\b/i, "<img alt=\"".concat(suggested.replace(/"/g, '&quot;'), "\""));
                            return [2 /*return*/, {
                                    newHtml: html.replace(tag, withAlt),
                                    changes: [{ before: tag, after: withAlt }],
                                }];
                        case 4:
                            e_23 = _g.sent();
                            return [2 /*return*/, {
                                    newHtml: html,
                                    changes: [],
                                    errorNote: (e_23 === null || e_23 === void 0 ? void 0 : e_23.message) || 'Claude failed.',
                                }];
                        case 5: return [3 /*break*/, 1];
                        case 6: return [2 /*return*/, {
                                newHtml: html,
                                changes: [],
                                errorNote: 'No meaningful image with empty alt found.',
                            }];
                    }
                });
            });
        };
        CanvasService_1.prototype.buildAiButtonLabelFix = function (html, resourceTitle) {
            return __awaiter(this, void 0, void 0, function () {
                var btnRegex, stripTags, m, attrs, text, ctx, iconClasses, prompt_8, suggested, before, after, e_24;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            btnRegex = /<button\b([^>]*)>([\s\S]*?)<\/button>/gi;
                            stripTags = function (s) {
                                return s
                                    .replace(/<[^>]+>/g, ' ')
                                    .replace(/\s+/g, ' ')
                                    .trim();
                            };
                            _a.label = 1;
                        case 1:
                            if (!((m = btnRegex.exec(html)) !== null)) return [3 /*break*/, 6];
                            attrs = m[1] || '';
                            text = stripTags(m[2] || '');
                            if (text || /\baria-label\s*=\s*["'][^"']+["']/i.test(attrs))
                                return [3 /*break*/, 1];
                            ctx = html
                                .slice(Math.max(0, m.index - 150), m.index + m[0].length + 150)
                                .replace(/<[^>]+>/g, ' ')
                                .replace(/\s+/g, ' ')
                                .trim();
                            iconClasses = (attrs.match(/\bclass\s*=\s*["']([^"']*)["']/i) || [])[1] || '';
                            prompt_8 = "This button has no accessible name. Based on its context, icon classes, or surrounding content, suggest a short descriptive label under 40 characters. Return plain text only.\n\nButton attrs: ".concat(attrs, "\nIcon classes: ").concat(iconClasses, "\nContext: ").concat(ctx, "\nPage: ").concat(resourceTitle);
                            _a.label = 2;
                        case 2:
                            _a.trys.push([2, 4, , 5]);
                            return [4 /*yield*/, this.callClaudeWithRetry(prompt_8, 40)];
                        case 3:
                            suggested = _a.sent();
                            suggested = suggested
                                .replace(/^["']|["']$/g, '')
                                .trim()
                                .slice(0, 40);
                            if (!suggested)
                                return [3 /*break*/, 1];
                            before = m[0];
                            after = "<button".concat(attrs, " aria-label=\"").concat(suggested.replace(/"/g, '&quot;'), "\">").concat(m[2] || '', "</button>");
                            return [2 /*return*/, {
                                    newHtml: html.replace(before, after),
                                    changes: [{ before: before, after: after }],
                                }];
                        case 4:
                            e_24 = _a.sent();
                            return [2 /*return*/, {
                                    newHtml: html,
                                    changes: [],
                                    errorNote: (e_24 === null || e_24 === void 0 ? void 0 : e_24.message) || 'Claude failed.',
                                }];
                        case 5: return [3 /*break*/, 1];
                        case 6: return [2 /*return*/, {
                                newHtml: html,
                                changes: [],
                                errorNote: 'No empty-name button found.',
                            }];
                    }
                });
            });
        };
        CanvasService_1.prototype.buildAiFormLabelFix = function (html, resourceTitle) {
            return __awaiter(this, void 0, void 0, function () {
                var controlRegex, m, attrs, idMatch, id, hasLabel, ctx, prompt_9, suggested, fullTag, elId, labelHtml, before, after, e_25;
                var _a, _b, _c;
                return __generator(this, function (_d) {
                    switch (_d.label) {
                        case 0:
                            controlRegex = /<(input|select|textarea)\b([^>]*)>/gi;
                            _d.label = 1;
                        case 1:
                            if (!((m = controlRegex.exec(html)) !== null)) return [3 /*break*/, 6];
                            attrs = m[2] || '';
                            if (/\b(aria-label|aria-labelledby|title)\s*=\s*["'][^"']+["']/i.test(attrs))
                                return [3 /*break*/, 1];
                            idMatch = attrs.match(/\bid\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
                            id = ((_c = (_b = (_a = idMatch === null || idMatch === void 0 ? void 0 : idMatch[2]) !== null && _a !== void 0 ? _a : idMatch === null || idMatch === void 0 ? void 0 : idMatch[3]) !== null && _b !== void 0 ? _b : idMatch === null || idMatch === void 0 ? void 0 : idMatch[4]) !== null && _c !== void 0 ? _c : '').trim();
                            hasLabel = id &&
                                new RegExp("<label\\b[^>]*\\bfor\\s*=\\s*[\"']".concat((id || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), "[\"']"), 'i').test(html);
                            if (hasLabel)
                                return [3 /*break*/, 1];
                            ctx = html
                                .slice(Math.max(0, m.index - 150), m.index + m[0].length + 150)
                                .replace(/<[^>]+>/g, ' ')
                                .replace(/\s+/g, ' ')
                                .trim();
                            prompt_9 = "This form control has no label. Based on its type, name, placeholder, and surrounding form context, suggest an appropriate short label text under 40 characters. Return plain text only.\n\nControl: ".concat(m[0], "\nContext: ").concat(ctx, "\nPage: ").concat(resourceTitle);
                            _d.label = 2;
                        case 2:
                            _d.trys.push([2, 4, , 5]);
                            return [4 /*yield*/, this.callClaudeWithRetry(prompt_9, 40)];
                        case 3:
                            suggested = _d.sent();
                            suggested = suggested
                                .replace(/^["']|["']$/g, '')
                                .trim()
                                .slice(0, 40);
                            if (!suggested)
                                return [3 /*break*/, 1];
                            fullTag = m[0];
                            elId = id || "label-".concat(Math.random().toString(36).slice(2, 10));
                            if (!id)
                                fullTag = fullTag.replace(/<(input|select|textarea)\b/i, "<$1 id=\"".concat(elId, "\" "));
                            labelHtml = "<label for=\"".concat(elId, "\">").concat(suggested.replace(/</g, '&lt;').replace(/"/g, '&quot;'), "</label> ");
                            before = m[0];
                            after = labelHtml + (id ? m[0] : fullTag);
                            return [2 /*return*/, {
                                    newHtml: html.replace(before, after),
                                    changes: [{ before: before, after: after }],
                                }];
                        case 4:
                            e_25 = _d.sent();
                            return [2 /*return*/, {
                                    newHtml: html,
                                    changes: [],
                                    errorNote: (e_25 === null || e_25 === void 0 ? void 0 : e_25.message) || 'Claude failed.',
                                }];
                        case 5: return [3 /*break*/, 1];
                        case 6: return [2 /*return*/, {
                                newHtml: html,
                                changes: [],
                                errorNote: 'No unlabelled form control found.',
                            }];
                    }
                });
            });
        };
        CanvasService_1.prototype.buildAiTableCaptionFix = function (html, resourceTitle) {
            return __awaiter(this, void 0, void 0, function () {
                var tableRegex, m, tableHtml, ctx, prompt_10, suggested, openTag, withCaption, newTableHtml, e_26;
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            tableRegex = /<table\b([^>]*)>([\s\S]*?)<\/table>/gi;
                            _b.label = 1;
                        case 1:
                            if (!((m = tableRegex.exec(html)) !== null)) return [3 /*break*/, 6];
                            tableHtml = m[0];
                            if (/<caption\b/i.test(tableHtml))
                                return [3 /*break*/, 1];
                            ctx = html
                                .slice(Math.max(0, m.index - 100), m.index + tableHtml.length + 100)
                                .replace(/<[^>]+>/g, ' ')
                                .replace(/\s+/g, ' ')
                                .trim();
                            prompt_10 = "This table has no caption. Based on the table content and surrounding text, suggest a short descriptive caption under 80 characters. Return plain text only.\n\nTable: ".concat(tableHtml.slice(0, 500), "\nContext: ").concat(ctx, "\nPage: ").concat(resourceTitle);
                            _b.label = 2;
                        case 2:
                            _b.trys.push([2, 4, , 5]);
                            return [4 /*yield*/, this.callClaudeWithRetry(prompt_10, 80)];
                        case 3:
                            suggested = _b.sent();
                            suggested = suggested
                                .replace(/^["']|["']$/g, '')
                                .trim()
                                .slice(0, 80);
                            if (!suggested)
                                return [3 /*break*/, 1];
                            openTag = ((_a = tableHtml.match(/<table\b[^>]*>/)) === null || _a === void 0 ? void 0 : _a[0]) || '<table>';
                            withCaption = openTag + "<caption>".concat(suggested.replace(/</g, '&lt;'), "</caption>");
                            newTableHtml = tableHtml.replace(openTag, withCaption);
                            return [2 /*return*/, {
                                    newHtml: html.replace(tableHtml, newTableHtml),
                                    changes: [{ before: openTag, after: withCaption }],
                                }];
                        case 4:
                            e_26 = _b.sent();
                            return [2 /*return*/, {
                                    newHtml: html,
                                    changes: [],
                                    errorNote: (e_26 === null || e_26 === void 0 ? void 0 : e_26.message) || 'Claude failed.',
                                }];
                        case 5: return [3 /*break*/, 1];
                        case 6: return [2 /*return*/, {
                                newHtml: html,
                                changes: [],
                                errorNote: 'No table without caption found.',
                            }];
                    }
                });
            });
        };
        CanvasService_1.prototype.buildAiTableHeaderFix = function (html, resourceTitle) {
            return __awaiter(this, void 0, void 0, function () {
                var tableRegex, m, tableHtml, prompt_11, out, e_27;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            tableRegex = /<table\b[\s\S]*?<\/table>/gi;
                            _a.label = 1;
                        case 1:
                            if (!((m = tableRegex.exec(html)) !== null)) return [3 /*break*/, 6];
                            tableHtml = m[0];
                            if (/<th\b/i.test(tableHtml))
                                return [3 /*break*/, 1];
                            prompt_11 = "This table has no header row. Based on the column content, suggest which row should be the header row and return the corrected table HTML with <th> elements replacing the appropriate <td> elements in that row. Return only the corrected table HTML.\n\nTable:\n".concat(tableHtml, "\nPage: ").concat(resourceTitle);
                            _a.label = 2;
                        case 2:
                            _a.trys.push([2, 4, , 5]);
                            return [4 /*yield*/, this.callClaudeWithRetry(prompt_11, 800)];
                        case 3:
                            out = _a.sent();
                            out = out.replace(/```\w*\n?|\n?```/g, '').trim();
                            if (!/<th\b/i.test(out))
                                return [3 /*break*/, 1];
                            return [2 /*return*/, {
                                    newHtml: html.replace(tableHtml, out),
                                    changes: [{ before: tableHtml, after: out }],
                                }];
                        case 4:
                            e_27 = _a.sent();
                            return [2 /*return*/, {
                                    newHtml: html,
                                    changes: [],
                                    errorNote: (e_27 === null || e_27 === void 0 ? void 0 : e_27.message) || 'Claude failed.',
                                }];
                        case 5: return [3 /*break*/, 1];
                        case 6: return [2 /*return*/, {
                                newHtml: html,
                                changes: [],
                                errorNote: 'No table without header found.',
                            }];
                    }
                });
            });
        };
        CanvasService_1.prototype.buildAiLinkBrokenFix = function (html, resourceTitle) {
            return __awaiter(this, void 0, void 0, function () {
                var linkRegex, stripTags, m, attrs, text, hrefMatch, href, res, _a, ctx, prompt_12, suggested, before, newAttrs, after, e_28;
                var _b, _c, _d;
                return __generator(this, function (_e) {
                    switch (_e.label) {
                        case 0:
                            linkRegex = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
                            stripTags = function (s) {
                                return s
                                    .replace(/<[^>]+>/g, ' ')
                                    .replace(/\s+/g, ' ')
                                    .trim();
                            };
                            _e.label = 1;
                        case 1:
                            if (!((m = linkRegex.exec(html)) !== null)) return [3 /*break*/, 10];
                            attrs = m[1] || '';
                            text = stripTags(m[2] || '');
                            hrefMatch = attrs.match(/\bhref\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
                            href = ((_d = (_c = (_b = hrefMatch === null || hrefMatch === void 0 ? void 0 : hrefMatch[2]) !== null && _b !== void 0 ? _b : hrefMatch === null || hrefMatch === void 0 ? void 0 : hrefMatch[3]) !== null && _c !== void 0 ? _c : hrefMatch === null || hrefMatch === void 0 ? void 0 : hrefMatch[4]) !== null && _d !== void 0 ? _d : '').trim();
                            if (!href || !/^https?:\/\//i.test(href))
                                return [3 /*break*/, 1];
                            _e.label = 2;
                        case 2:
                            _e.trys.push([2, 4, , 5]);
                            return [4 /*yield*/, fetch(href, { method: 'HEAD', redirect: 'follow' })];
                        case 3:
                            res = _e.sent();
                            if (res.ok)
                                return [3 /*break*/, 1];
                            return [3 /*break*/, 5];
                        case 4:
                            _a = _e.sent();
                            void 0;
                            return [3 /*break*/, 5];
                        case 5:
                            ctx = html
                                .slice(Math.max(0, m.index - 200), m.index + m[0].length + 200)
                                .replace(/<[^>]+>/g, ' ')
                                .replace(/\s+/g, ' ')
                                .trim();
                            prompt_12 = "This link is broken. Based on the link text and surrounding context, suggest the single most likely replacement URL. Return only the URL, nothing else. If you cannot determine a replacement with reasonable confidence, return the word UNKNOWN.\n\nLink text: ".concat(text, "\nhref: ").concat(href, "\nContext: ").concat(ctx, "\nPage: ").concat(resourceTitle);
                            _e.label = 6;
                        case 6:
                            _e.trys.push([6, 8, , 9]);
                            return [4 /*yield*/, this.callClaudeWithRetry(prompt_12, 200)];
                        case 7:
                            suggested = _e.sent();
                            suggested = suggested.replace(/^["']|["']$/g, '').trim();
                            if (suggested.toUpperCase() === 'UNKNOWN' || !suggested) {
                                return [2 /*return*/, {
                                        newHtml: html,
                                        changes: [],
                                        errorNote: 'Could not determine replacement URL. Manual review required.',
                                    }];
                            }
                            before = m[0];
                            newAttrs = attrs.replace(/\bhref\s*=\s*["'][^"']*["']/i, "href=\"".concat(suggested.replace(/"/g, '&quot;'), "\""));
                            after = "<a ".concat(newAttrs, ">").concat(m[2] || '', "</a>");
                            return [2 /*return*/, {
                                    newHtml: html.replace(before, after),
                                    changes: [{ before: before, after: after }],
                                }];
                        case 8:
                            e_28 = _e.sent();
                            return [2 /*return*/, {
                                    newHtml: html,
                                    changes: [],
                                    errorNote: (e_28 === null || e_28 === void 0 ? void 0 : e_28.message) || 'Claude failed.',
                                }];
                        case 9: return [3 /*break*/, 1];
                        case 10: return [2 /*return*/, { newHtml: html, changes: [], errorNote: 'No broken link found.' }];
                    }
                });
            });
        };
        CanvasService_1.prototype.buildAiLinkSplitFix = function (html, resourceTitle) {
            return __awaiter(this, void 0, void 0, function () {
                var ctx, splitUrlRegex, match, fragmented, prompt, out, href, after, e_29;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            ctx = html
                                .replace(/<[^>]+>/g, ' ')
                                .replace(/\s+/g, ' ')
                                .trim()
                                .slice(0, 500);
                            splitUrlRegex = /\b(?:https?:\s*\/\s*\/\s*[\w.-]+(?:\s*\/\s*[\w\-./?%&=+#:]*)?|www\.\s*[\w.-]+\s*\.\s*[a-z]{2,}(?:\s*\/\s*[\w\-./?%&=+#:]*)?)\b/gi;
                            match = ctx.match(splitUrlRegex);
                            if (!match || !match.find(function (u) { return /\s/.test(u); }))
                                return [2 /*return*/, { newHtml: html, changes: [], errorNote: 'No split URL found.' }];
                            fragmented = match.find(function (u) { return /\s/.test(u); }) || '';
                            prompt = "This link appears to be split or broken by formatting. Reconstruct it as a single clean <a> tag with correct href and descriptive link text. Return only the corrected <a> tag HTML.\n\nFragmented URL: ".concat(fragmented, "\nContext: ").concat(ctx, "\nPage: ").concat(resourceTitle);
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 3, , 4]);
                            return [4 /*yield*/, this.callClaudeWithRetry(prompt, 300)];
                        case 2:
                            out = _a.sent();
                            out = out.replace(/```\w*\n?|\n?```/g, '').trim();
                            if (!/<a\b/i.test(out))
                                return [2 /*return*/, {
                                        newHtml: html,
                                        changes: [],
                                        errorNote: 'Claude did not return valid link HTML.',
                                    }];
                            href = fragmented.replace(/\s+/g, '');
                            after = out.replace(/href\s*=\s*["'][^"']*["']/i, "href=\"".concat(href, "\""));
                            if (!html.includes(fragmented))
                                return [2 /*return*/, {
                                        newHtml: html,
                                        changes: [],
                                        errorNote: 'Fragmented URL not found in content.',
                                    }];
                            return [2 /*return*/, {
                                    newHtml: html.replace(fragmented, after),
                                    changes: [{ before: fragmented, after: after }],
                                }];
                        case 3:
                            e_29 = _a.sent();
                            return [2 /*return*/, {
                                    newHtml: html,
                                    changes: [],
                                    errorNote: (e_29 === null || e_29 === void 0 ? void 0 : e_29.message) || 'Claude failed.',
                                }];
                        case 4: return [2 /*return*/];
                    }
                });
            });
        };
        CanvasService_1.prototype.buildAiCheckpointGuidedFix = function (html, resourceTitle, kind, ruleId) {
            return __awaiter(this, void 0, void 0, function () {
                var TASK, task, staticBlock, dynamicBlock, model, outRaw, out, e_30;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            TASK = {
                                ai_landmark_structure: 'Add or adjust semantic landmarks: use <main> for primary content, <nav> for navigation blocks, and region roles where appropriate. Preserve all text and meaning.',
                                ai_img_text_in_image: 'For images that may contain important text (banners, posters, infographics), improve alt text to describe essential text or state that text appears in the image. Update only relevant <img> tags.',
                                ai_color_only_information: 'Revise content so required information is not conveyed by color alone; add text or non-color cues where needed.',
                                ai_sensory_only_instructions: 'Rewrite instructions that rely only on sensory characteristics (e.g. position or color alone) to include structural or text-based cues.',
                            };
                            task = TASK[kind];
                            if (!task)
                                return [2 /*return*/, {
                                        newHtml: html,
                                        changes: [],
                                        errorNote: "Unknown guided fix kind: ".concat(kind),
                                    }];
                            if (html.length > 24000) {
                                return [2 /*return*/, {
                                        newHtml: html,
                                        changes: [],
                                        errorNote: 'Content exceeds AI fix size limit (24k). Edit manually in Canvas.',
                                    }];
                            }
                            staticBlock = 'You are an accessibility expert. Follow the task in the next block exactly.\nReturn ONLY the full corrected HTML document. Do not wrap in markdown code fences.';
                            dynamicBlock = "Task:\n".concat(task, "\n\nPage title: ").concat(resourceTitle, "\n\nHTML:\n").concat(html);
                            model = (this.config.get('CLAUDE_MODEL') || ANTHROPIC_TEXT_MODEL_DEFAULT).trim();
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 3, , 4]);
                            return [4 /*yield*/, this.fetchAnthropicMessage({
                                    model: model,
                                    maxTokens: 12000,
                                    temperature: 0.2,
                                    staticBlock: staticBlock,
                                    dynamicBlock: dynamicBlock,
                                    meta: {
                                        context: 'ada_second_stage_guided',
                                        ruleId: ruleId,
                                    },
                                })];
                        case 2:
                            outRaw = (_a.sent()).text;
                            out = String(outRaw || '')
                                .replace(/^```html?\s*/i, '')
                                .replace(/\s*```$/i, '')
                                .trim();
                            if (!out || out.length < 20)
                                return [2 /*return*/, { newHtml: html, changes: [], errorNote: 'Empty AI response.' }];
                            if (out === html)
                                return [2 /*return*/, {
                                        newHtml: html,
                                        changes: [],
                                        errorNote: 'No changes suggested.',
                                    }];
                            return [2 /*return*/, { newHtml: out, changes: [{ before: html, after: out }] }];
                        case 3:
                            e_30 = _a.sent();
                            return [2 /*return*/, {
                                    newHtml: html,
                                    changes: [],
                                    errorNote: (e_30 === null || e_30 === void 0 ? void 0 : e_30.message) || 'Claude failed.',
                                }];
                        case 4: return [2 /*return*/];
                    }
                });
            });
        };
        CanvasService_1.prototype.applyMergeDuplicateLinks = function (html) {
            var _a, _b, _c, _d, _e;
            var changes = [];
            var regex = /<a\b([^>]*href\s*=\s*("([^"]*)"|'([^']*)')[^>]*)>([\s\S]*?)<\/a>\s*(?:&nbsp;|\s|<span[^>]*>\s*<\/span>|<br[^>]*>)*<a\b([^>]*href\s*=\s*("([^"]*)"|'([^']*)')[^>]*)>([\s\S]*?)<\/a>/gi;
            var newHtml = html;
            var m;
            while ((m = regex.exec(html)) !== null) {
                var h1 = ((_b = (_a = m[3]) !== null && _a !== void 0 ? _a : m[4]) !== null && _b !== void 0 ? _b : '').trim();
                var h2 = ((_d = (_c = m[8]) !== null && _c !== void 0 ? _c : m[9]) !== null && _d !== void 0 ? _d : '').trim();
                if (h1 && h2 && h1 === h2) {
                    var fullMatch = m[0];
                    var inner1 = ((_e = m[5]) !== null && _e !== void 0 ? _e : '').trim();
                    var merged = "<a ".concat(m[1].trim(), ">").concat(inner1, "</a>");
                    changes.push({ before: fullMatch, after: merged });
                    newHtml = newHtml.replace(fullMatch, merged);
                }
            }
            return { newHtml: newHtml, changes: changes };
        };
        CanvasService_1.prototype.applyRemoveEmptyLi = function (html) {
            var changes = [];
            var newHtml = html;
            var emptyLiRegex = /<li\b[^>]*>\s*(?:&nbsp;|\s|<br[^>]*>|<\/?span[^>]*>)*<\/li>/gi;
            var m;
            var emptyLis = [];
            while ((m = emptyLiRegex.exec(html)) !== null)
                emptyLis.push(m[0]);
            for (var _i = 0, emptyLis_1 = emptyLis; _i < emptyLis_1.length; _i++) {
                var li = emptyLis_1[_i];
                changes.push({ before: li, after: '(removed)' });
                newHtml = newHtml.replace(li, '');
            }
            var emptyListRegex = /<(ul|ol)\b[^>]*>\s*(?:&nbsp;|\s)*<\/\1>/gi;
            while ((m = emptyListRegex.exec(newHtml)) !== null) {
                changes.push({ before: m[0], after: '(removed)' });
                newHtml = newHtml.replace(m[0], '');
            }
            return { newHtml: newHtml, changes: changes };
        };
        CanvasService_1.prototype.applyRemoveEmptyHeading = function (html) {
            var changes = [];
            var newHtml = html;
            var regex = /<(h[1-6])\b[^>]*>\s*(?:&nbsp;|\s)*<\/\1>/gi;
            var matches = [];
            var m;
            while ((m = regex.exec(html)) !== null)
                matches.push(m[0]);
            for (var _i = 0, matches_3 = matches; _i < matches_3.length; _i++) {
                var tag = matches_3[_i];
                changes.push({ before: tag, after: '(removed)' });
                newHtml = newHtml.replace(tag, '');
            }
            newHtml = newHtml
                .replace(/(?:\s*<(p|div)\b[^>]*>\s*<\/\1>\s*)+/gi, ' ')
                .replace(/\n{3,}/g, '\n\n')
                .trim();
            return { newHtml: newHtml, changes: changes };
        };
        CanvasService_1.prototype.applyAppendNewTabWarning = function (html) {
            var _a;
            var changes = [];
            var regex = /<a\b([^>]*)\btarget\s*=\s*["']_blank["'][^>]*>([\s\S]*?)<\/a>/gi;
            var suffix = '<span class="sr-only"> (opens in new tab)</span>';
            var newHtml = html;
            var m;
            while ((m = regex.exec(html)) !== null) {
                var full = m[0];
                var inner = (_a = m[2]) !== null && _a !== void 0 ? _a : '';
                if (!/\b(new tab|opens in new tab|sr-only)\b/i.test(inner)) {
                    var after = full.replace(/([\s\S]*?)<\/a>$/i, "$1".concat(suffix, "</a>"));
                    changes.push({ before: full, after: after });
                    newHtml = newHtml.replace(full, after);
                }
            }
            return { newHtml: newHtml, changes: changes };
        };
        CanvasService_1.prototype.applyFontSizeMin12 = function (html) {
            var _a, _b;
            var changes = [];
            var styleAttrRegex = /\bstyle\s*=\s*("([^"]*)"|'([^']*)')/gi;
            var newHtml = html;
            var m;
            while ((m = styleAttrRegex.exec(html)) !== null) {
                var fullAttr = m[0];
                var styleValue = ((_b = (_a = m[2]) !== null && _a !== void 0 ? _a : m[3]) !== null && _b !== void 0 ? _b : '').trim();
                var fsMatch = styleValue.match(/(?:^|;)\s*font-size\s*:\s*([0-9.]+)px/i);
                if (!fsMatch)
                    continue;
                var px = Number(fsMatch[1]);
                if (px >= 12)
                    continue;
                var updatedStyle = styleValue.replace(/(?:^|;)\s*font-size\s*:\s*[0-9.]+px/gi, function (x) { return x.replace(/[0-9.]+(?=px)/i, '12'); });
                var quote = m[3] !== undefined ? "'" : '"';
                var after = "style=".concat(quote).concat(updatedStyle).concat(quote);
                changes.push({ before: fullAttr, after: after });
                newHtml = newHtml.replace(fullAttr, after);
            }
            return { newHtml: newHtml, changes: changes };
        };
        CanvasService_1.prototype.mixRgb = function (a, b, t) {
            var u = Math.max(0, Math.min(1, t));
            return {
                r: Math.round(a.r * (1 - u) + b.r * u),
                g: Math.round(a.g * (1 - u) + b.g * u),
                b: Math.round(a.b * (1 - u) + b.b * u),
            };
        };
        CanvasService_1.prototype.rgbToCssHex = function (c) {
            var h = function (n) {
                return Math.max(0, Math.min(255, Math.round(n)))
                    .toString(16)
                    .padStart(2, '0');
            };
            return "#".concat(h(c.r)).concat(h(c.g)).concat(h(c.b));
        };
        CanvasService_1.prototype.nudgeTextColorForContrast = function (fg, bg, minRatio) {
            if (this.contrastRatio(fg, bg) >= minRatio)
                return fg;
            var black = { r: 0, g: 0, b: 0 };
            var white = { r: 255, g: 255, b: 255 };
            for (var step = 1; step <= 100; step++) {
                var t = step / 100;
                var dark = this.mixRgb(fg, black, t);
                var light = this.mixRgb(fg, white, t);
                var rd = this.contrastRatio(dark, bg);
                var rl = this.contrastRatio(light, bg);
                var darkOk = rd >= minRatio;
                var lightOk = rl >= minRatio;
                if (darkOk || lightOk) {
                    if (darkOk && lightOk)
                        return rd >= rl ? dark : light;
                    return darkOk ? dark : light;
                }
            }
            var rb = this.contrastRatio(black, bg);
            var rw = this.contrastRatio(white, bg);
            if (rb >= minRatio)
                return black;
            if (rw >= minRatio)
                return white;
            return null;
        };
        CanvasService_1.prototype.applyFixInlineTextContrast = function (html) {
            var _a, _b;
            var changes = [];
            var styleTagRegex = /<([a-z0-9]+)\b[^>]*style\s*=\s*("([^"]*)"|'([^']*)')[^>]*>/gi;
            var replacements = [];
            var m;
            var _loop_6 = function () {
                var fullTag = m[0];
                var style = (_b = (_a = m[3]) !== null && _a !== void 0 ? _a : m[4]) !== null && _b !== void 0 ? _b : '';
                var colorMatch = style.match(/(?:^|;)\s*color\s*:\s*([^;]+)/i);
                var bgMatch = style.match(/(?:^|;)\s*background(?:-color)?\s*:\s*([^;]+)/i);
                if (!colorMatch || !bgMatch)
                    return "continue";
                var fg = this_5.parseCssColor(colorMatch[1]);
                var bg = this_5.parseCssColor(bgMatch[1]);
                if (!fg || !bg)
                    return "continue";
                var fsMatch = style.match(/(?:^|;)\s*font-size\s*:\s*([0-9.]+)px/i);
                var fwMatch = style.match(/(?:^|;)\s*font-weight\s*:\s*([^;]+)/i);
                var fontSizePx = fsMatch ? Number(fsMatch[1]) : 16;
                var fontWeightRaw = ((fwMatch === null || fwMatch === void 0 ? void 0 : fwMatch[1]) || '').trim().toLowerCase();
                var isBold = fontWeightRaw === 'bold' || Number(fontWeightRaw) >= 700;
                var isLarge = fontSizePx >= 24 || (isBold && fontSizePx >= 18.67);
                var minRatio = isLarge ? 3 : 4.5;
                if (this_5.contrastRatio(fg, bg) >= minRatio)
                    return "continue";
                var newFg = this_5.nudgeTextColorForContrast(fg, bg, minRatio);
                if (!newFg)
                    return "continue";
                var hex = this_5.rgbToCssHex(newFg);
                var newStyle = style.replace(/(^|;)\s*color\s*:\s*[^;]+/i, function (_x, lead) { return "".concat(lead, "color: ").concat(hex); });
                var afterTag = fullTag.replace(style, newStyle);
                if (afterTag === fullTag)
                    return "continue";
                changes.push({ before: fullTag, after: afterTag });
                replacements.push({
                    index: m.index,
                    len: fullTag.length,
                    after: afterTag,
                });
            };
            var this_5 = this;
            while ((m = styleTagRegex.exec(html)) !== null) {
                _loop_6();
            }
            var newHtml = html;
            replacements.sort(function (a, b) { return b.index - a.index; });
            for (var _i = 0, replacements_1 = replacements; _i < replacements_1.length; _i++) {
                var r = replacements_1[_i];
                newHtml =
                    newHtml.slice(0, r.index) + r.after + newHtml.slice(r.index + r.len);
            }
            return { newHtml: newHtml, changes: changes };
        };
        CanvasService_1.prototype.applyRemoveMediaAutoplay = function (html) {
            var changes = [];
            var re = /<(video|audio)\b([^>]*)>/gi;
            var newHtml = html;
            var m;
            var orig = html;
            while ((m = re.exec(orig)) !== null) {
                var full = m[0];
                if (!/\bautoplay\b/i.test(full))
                    continue;
                var after = full.replace(/\s+\bautoplay\b(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?/gi, '');
                if (after === full)
                    continue;
                changes.push({ before: full, after: after });
                newHtml = newHtml.replace(full, after);
            }
            return { newHtml: newHtml, changes: changes };
        };
        CanvasService_1.prototype.applyFormRequiredProgrammatic = function (html) {
            var re = /<(input|select|textarea)\b([^>]*)>/gi;
            var replacements = [];
            var changes = [];
            var m;
            while ((m = re.exec(html)) !== null) {
                var attrs = m[2] || '';
                if (!/\b(class|data-required)\s*=\s*["'][^"']*required[^"']*["']/i.test(attrs))
                    continue;
                if (/\b(required|aria-required)\s*=/i.test(attrs))
                    continue;
                var full = m[0];
                var fixed = full.replace(/>$/, ' required aria-required="true">');
                replacements.push({ idx: m.index, len: full.length, after: fixed });
                changes.push({ before: full, after: fixed });
            }
            if (!replacements.length)
                return null;
            var newHtml = html;
            replacements.sort(function (a, b) { return b.idx - a.idx; });
            for (var _i = 0, replacements_2 = replacements; _i < replacements_2.length; _i++) {
                var r = replacements_2[_i];
                newHtml =
                    newHtml.slice(0, r.idx) + r.after + newHtml.slice(r.idx + r.len);
            }
            return { newHtml: newHtml, changes: changes };
        };
        CanvasService_1.prototype.applyFormErrorAriaDescribedby = function (html) {
            var _a, _b, _c;
            var re = /<(input|select|textarea)\b([^>]*)>/gi;
            var replacements = [];
            var changes = [];
            var m;
            while ((m = re.exec(html)) !== null) {
                var attrs = m[2] || '';
                if (!/\baria-invalid\s*=\s*["']true["']/i.test(attrs))
                    continue;
                if (/\baria-describedby\s*=\s*["'][^"']+["']/i.test(attrs))
                    continue;
                var full = m[0];
                var rest = html.slice(m.index + full.length, m.index + full.length + 2500);
                var nextOpening = rest.match(/<\s*(\w+)\b[^>]*>/);
                if (!nextOpening)
                    continue;
                var cand = nextOpening[0];
                var idM = cand.match(/\bid\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
                var nid = idM ? ((_c = (_b = (_a = idM[2]) !== null && _a !== void 0 ? _a : idM[3]) !== null && _b !== void 0 ? _b : idM[4]) !== null && _c !== void 0 ? _c : '').trim() : '';
                if (!nid)
                    continue;
                var fixed = full.replace(/>$/, " aria-describedby=\"".concat(nid.replace(/"/g, '&quot;'), "\">"));
                if (fixed === full)
                    continue;
                replacements.push({ idx: m.index, len: full.length, after: fixed });
                changes.push({ before: full, after: fixed });
            }
            if (!replacements.length)
                return null;
            var newHtml = html;
            replacements.sort(function (a, b) { return b.idx - a.idx; });
            for (var _i = 0, replacements_3 = replacements; _i < replacements_3.length; _i++) {
                var r = replacements_3[_i];
                newHtml =
                    newHtml.slice(0, r.idx) + r.after + newHtml.slice(r.idx + r.len);
            }
            return { newHtml: newHtml, changes: changes };
        };
        CanvasService_1.prototype.applyListManualMarkersToSemantic = function (html) {
            var r = (0, accessibility_heuristics_1.findSmallestManualListRegion)(html);
            if (!r)
                return null;
            return {
                newHtml: html.slice(0, r.start) + r.after + html.slice(r.end),
                changes: [{ before: r.before, after: r.after }],
            };
        };
        CanvasService_1.prototype.applyTablePromoteFirstRowToThead = function (html) {
            var tableOpen = html.match(/<table\b[^>]*>/i);
            if (!tableOpen || tableOpen.index === undefined)
                return null;
            var i0 = tableOpen.index;
            var openTag = tableOpen[0];
            var tail = html.slice(i0 + openTag.length);
            if (/^\s*<thead\b/i.test(tail))
                return null;
            var trMatch = tail.match(/<tr\b[^>]*>[\s\S]*?<\/tr>/i);
            if (!trMatch || trMatch.index === undefined)
                return null;
            var trFull = trMatch[0];
            var thRow = trFull
                .replace(/<td\b/gi, '<th scope="col"')
                .replace(/<\/td>/gi, '</th>');
            var theadBlock = "<thead>".concat(thRow, "</thead>");
            var beforeLen = openTag.length + trMatch.index + trFull.length;
            var newMiddle = openTag +
                tail.slice(0, trMatch.index) +
                theadBlock +
                tail.slice(trMatch.index + trFull.length);
            var before = html.slice(i0, i0 + beforeLen);
            var after = newMiddle;
            return {
                newHtml: html.slice(0, i0) + newMiddle + html.slice(i0 + beforeLen),
                changes: [{ before: before, after: after }],
            };
        };
        CanvasService_1.prototype.applyAriaRoleNormalizeFirst = function (html) {
            var _a, _b, _c;
            var m = html.match(/<([a-z0-9]+)(\b[^>]*\brole\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))[^>]*)>/i);
            if (!m || m.index === undefined)
                return null;
            var tag = String(m[1] || '').toLowerCase();
            var rawRole = String((_c = (_b = (_a = m[4]) !== null && _a !== void 0 ? _a : m[5]) !== null && _b !== void 0 ? _b : m[6]) !== null && _c !== void 0 ? _c : '').trim();
            var _d = (0, accessibility_heuristics_1.normalizeAriaRoleValue)(rawRole, tag), next = _d.next, action = _d.action;
            var start = m.index;
            var end = html.indexOf('>', start);
            if (end < 0)
                return null;
            var before = html.slice(start, end + 1);
            var after = before;
            if (action === 'strip') {
                after = before.replace(/\s*\brole\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i, '');
            }
            else if (next) {
                after = before.replace(/\brole\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i, "role=\"".concat(next.replace(/"/g, ''), "\""));
            }
            if (after === before)
                return null;
            return {
                newHtml: html.replace(before, after),
                changes: [{ before: before, after: after }],
            };
        };
        CanvasService_1.prototype.applyHeadingTruncate120 = function (html) {
            var hm = html.match(/<h([1-6])\b([^>]*)>([\s\S]*?)<\/h\1>/i);
            if (!hm)
                return null;
            var innerText = String(hm[3] || '')
                .replace(/<[^>]+>/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
            if (innerText.length <= 120)
                return null;
            var trunc = (0, accessibility_heuristics_1.truncateHeadingText)(innerText, 120);
            var before = hm[0];
            var after = "<h".concat(hm[1]).concat(hm[2], ">").concat(trunc.replace(/</g, '&lt;'), "</h").concat(hm[1], ">");
            return {
                newHtml: html.replace(before, after),
                changes: [{ before: before, after: after }],
            };
        };
        CanvasService_1.prototype.applyIframeTitleFromSrcFirst = function (html) {
            var _a, _b, _c;
            var iframeRe = /<iframe\b([^>]*)>/gi;
            var m;
            while ((m = iframeRe.exec(html)) !== null) {
                var tag = m[0];
                if (/\btitle\s*=\s*["'][^"']*["']/i.test(tag))
                    continue;
                var srcMatch = tag.match(/\bsrc\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
                var src = ((_c = (_b = (_a = srcMatch === null || srcMatch === void 0 ? void 0 : srcMatch[2]) !== null && _a !== void 0 ? _a : srcMatch === null || srcMatch === void 0 ? void 0 : srcMatch[3]) !== null && _b !== void 0 ? _b : srcMatch === null || srcMatch === void 0 ? void 0 : srcMatch[4]) !== null && _c !== void 0 ? _c : '').trim();
                var title = (0, accessibility_heuristics_1.suggestIframeTitleFromSrc)(src);
                var escaped = title.replace(/"/g, '&quot;');
                var after = /\btitle\s*=/.test(tag)
                    ? tag.replace(/\btitle\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i, "title=\"".concat(escaped, "\""))
                    : tag.replace(/<iframe\b/i, "<iframe title=\"".concat(escaped, "\""));
                return {
                    newHtml: html.replace(tag, after),
                    changes: [{ before: tag, after: after }],
                };
            }
            return null;
        };
        CanvasService_1.prototype.applyLinkFileHintAppend = function (html, hintSuffix) {
            var _a;
            var hint = String(hintSuffix || '').trim();
            if (!hint)
                return null;
            var m = html.match(/<a\b([^>]*)>([\s\S]*?)<\/a>/i);
            if (!m)
                return null;
            var before = m[0];
            var inner = (_a = m[2]) !== null && _a !== void 0 ? _a : '';
            if (inner.includes(hint))
                return null;
            var after = "<a".concat(m[1], ">").concat(inner).concat(hint.replace(/</g, '&lt;'), "</a>");
            return {
                newHtml: html.replace(before, after),
                changes: [{ before: before, after: after }],
            };
        };
        CanvasService_1.prototype.fetchLinkFileMetaForHint = function (href) {
            return __awaiter(this, void 0, void 0, function () {
                var extPart, u, path_1, ext, map, sizePart, res, cl, n, _a, parts, suffix;
                var _b, _c;
                return __generator(this, function (_d) {
                    switch (_d.label) {
                        case 0:
                            extPart = '';
                            try {
                                u = /^https?:\/\//i.test(href)
                                    ? new URL(href)
                                    : href.startsWith('//')
                                        ? new URL('https:' + href)
                                        : new URL(href, 'https://example.invalid');
                                path_1 = u.pathname || '';
                                ext = (_c = (_b = path_1.match(/\.([a-z0-9]{1,8})$/i)) === null || _b === void 0 ? void 0 : _b[1]) === null || _c === void 0 ? void 0 : _c.toLowerCase();
                                map = {
                                    pdf: 'PDF',
                                    doc: 'Word',
                                    docx: 'Word',
                                    xls: 'Excel',
                                    xlsx: 'Excel',
                                    ppt: 'PowerPoint',
                                    pptx: 'PowerPoint',
                                    zip: 'ZIP',
                                    csv: 'CSV',
                                    txt: 'Text',
                                    png: 'PNG',
                                    jpg: 'JPEG',
                                    jpeg: 'JPEG',
                                    gif: 'GIF',
                                    mp4: 'MP4',
                                    mp3: 'MP3',
                                };
                                if (ext)
                                    extPart = map[ext] || ext.toUpperCase();
                            }
                            catch (_e) {
                                /* ignore */
                            }
                            sizePart = '';
                            if (!/^https?:\/\//i.test(href)) return [3 /*break*/, 4];
                            _d.label = 1;
                        case 1:
                            _d.trys.push([1, 3, , 4]);
                            return [4 /*yield*/, fetch(href, {
                                    method: 'HEAD',
                                    signal: AbortSignal.timeout(5000),
                                })];
                        case 2:
                            res = _d.sent();
                            cl = res.headers.get('content-length');
                            if (cl) {
                                n = parseInt(cl, 10);
                                if (n > 0) {
                                    if (n < 1024)
                                        sizePart = "".concat(n, " B");
                                    else if (n < 1048576)
                                        sizePart = "".concat((n / 1024).toFixed(1), " KB");
                                    else
                                        sizePart = "".concat((n / 1048576).toFixed(1), " MB");
                                }
                            }
                            return [3 /*break*/, 4];
                        case 3:
                            _a = _d.sent();
                            return [3 /*break*/, 4];
                        case 4:
                            parts = [extPart, sizePart].filter(Boolean);
                            suffix = parts.length ? " (".concat(parts.join(', '), ")") : '';
                            return [2 /*return*/, { suffix: suffix, extPart: extPart, sizePart: sizePart }];
                    }
                });
            });
        };
        CanvasService_1.prototype.applyTableCaptionFromContextFirst = function (html) {
            var m = html.match(/<table\b[^>]*>/i);
            if (!m || m.index === undefined)
                return null;
            var chunk = html.slice(m.index, m.index + 800);
            if (/<caption\b/i.test(chunk))
                return null;
            var cap = (0, accessibility_heuristics_1.extractTableCaptionFromContext)(html, m.index);
            var esc = cap.replace(/</g, '&lt;');
            var before = m[0];
            var after = "".concat(before, "<caption>").concat(esc, "</caption>");
            return {
                newHtml: html.replace(before, after),
                changes: [{ before: before, after: after }],
            };
        };
        CanvasService_1.prototype.applyAriaHiddenFocusableChoose = function (html, mode) {
            var m = html.match(/<([a-z0-9]+)\b([^>]*\baria-hidden\s*=\s*["']true["'][^>]*)>/i);
            if (!m || m.index === undefined)
                return null;
            var start = m.index;
            var end = html.indexOf('>', start);
            if (end < 0)
                return null;
            var before = html.slice(start, end + 1);
            var after = before;
            if (mode === 'remove') {
                after = before.replace(/\s*\baria-hidden\s*=\s*["']true["']/i, '');
            }
            else {
                if (/\btabindex\s*=/i.test(before))
                    after = before.replace(/\btabindex\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i, 'tabindex="-1"');
                else
                    after = before.replace(/>$/, ' tabindex="-1">');
            }
            if (after === before)
                return null;
            return {
                newHtml: html.replace(before, after),
                changes: [{ before: before, after: after }],
            };
        };
        CanvasService_1.prototype.applyLangInlineFrancFirst = function (html) {
            var _a;
            var m = html.match(/<span\b([^>]*)>([\s\S]*?)<\/span>/i);
            if (!m)
                return null;
            var open = m[0];
            if (/\blang\s*=\s*["'][^"']+["']/i.test(open))
                return null;
            var inner = (_a = m[2]) !== null && _a !== void 0 ? _a : '';
            var plain = inner
                .replace(/<[^>]+>/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
            var lang = (0, accessibility_heuristics_1.detectLangWithFranc)(plain);
            var attrs = m[1] || '';
            var after = "<span".concat(attrs, " lang=\"").concat(lang, "\">").concat(inner, "</span>");
            return {
                newHtml: html.replace(open, after),
                changes: [{ before: open, after: after }],
                suggestionText: lang,
            };
        };
        CanvasService_1.prototype.applyLangCodeNormalizeFirst = function (html) {
            var _a, _b;
            var htmlEl = html.match(/<html\b[^>]*>/i);
            if (htmlEl && /\blang\s*=\s*["'][^"']*["']/i.test(htmlEl[0])) {
                var lm = htmlEl[0].match(/\blang\s*=\s*["']([^"']*)["']/i);
                var raw = ((_a = lm === null || lm === void 0 ? void 0 : lm[1]) !== null && _a !== void 0 ? _a : '').trim();
                if (!raw)
                    return null;
                var norm = (0, accessibility_heuristics_1.normalizeLangCode)(raw);
                var rawLc = raw.toLowerCase().replace(/_/g, '-');
                if (norm === rawLc)
                    return null;
                var before = htmlEl[0];
                var after = before.replace(/\blang\s*=\s*["'][^"']*["']/i, "lang=\"".concat(norm, "\""));
                if (after === before)
                    return null;
                return {
                    newHtml: html.replace(before, after),
                    changes: [{ before: before, after: after }],
                    suggestionText: norm,
                };
            }
            var spanM = html.match(/<span\b([^>]*\blang\s*=\s*["']([^"']*)["'][^>]*)>/i);
            if (spanM) {
                var raw = ((_b = spanM[2]) !== null && _b !== void 0 ? _b : '').trim();
                if (!raw)
                    return null;
                var norm = (0, accessibility_heuristics_1.normalizeLangCode)(raw);
                var rawLc = raw.toLowerCase().replace(/_/g, '-');
                if (norm === rawLc)
                    return null;
                var before = spanM[0];
                var after = before.replace(/\blang\s*=\s*["'][^"']*["']/i, "lang=\"".concat(norm, "\""));
                return {
                    newHtml: html.replace(before, after),
                    changes: [{ before: before, after: after }],
                    suggestionText: norm,
                };
            }
            return null;
        };
        CanvasService_1.prototype.applyTableLayoutFix = function (html, mode) {
            var tableOpen = html.match(/<table\b[^>]*>/i);
            if (!tableOpen || tableOpen.index === undefined)
                return null;
            if (!(0, accessibility_heuristics_1.isLayoutTableCandidate)(html, tableOpen.index))
                return null;
            if (mode === 'presentation') {
                var tag = tableOpen[0];
                if (/\brole\s*=\s*["']presentation["']/i.test(tag))
                    return null;
                var after = /\brole\s*=/i.test(tag)
                    ? tag.replace(/\brole\s*=\s*["'][^"']*["']/i, 'role="presentation"')
                    : tag.replace(/<table\b/i, '<table role="presentation" ');
                return {
                    newHtml: html.replace(tag, after),
                    changes: [{ before: tag, after: after }],
                };
            }
            return this.applyTablePromoteFirstRowToThead(html);
        };
        CanvasService_1.prototype.applyLinkBrokenTeacherHref = function (html) {
            var re = /<a\b([^>]*\bhref\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))[^>]*)>([\s\S]*?)<\/a>/i;
            var m = html.match(re);
            if (!m)
                return null;
            var full = m[0];
            var after = full.replace(/\bhref\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i, 'href="#"');
            if (after === full)
                return null;
            return {
                newHtml: html.replace(full, after),
                changes: [{ before: full, after: after }],
            };
        };
        CanvasService_1.prototype.runFixExecutor = function (html, fixType) {
            switch (fixType) {
                case AccessibilityFixType.merge_duplicate_links:
                    return this.applyMergeDuplicateLinks(html);
                case AccessibilityFixType.remove_empty_li:
                    return this.applyRemoveEmptyLi(html);
                case AccessibilityFixType.remove_empty_heading:
                    return this.applyRemoveEmptyHeading(html);
                case AccessibilityFixType.append_new_tab_warning:
                    return this.applyAppendNewTabWarning(html);
                case AccessibilityFixType.set_html_lang: {
                    var r = this.applySetHtmlLang(html);
                    return { newHtml: r.newHtml, changes: r.changes };
                }
                case AccessibilityFixType.remove_text_justify:
                    return this.applyRemoveTextJustify(html);
                case AccessibilityFixType.font_size_min_12:
                    return this.applyFontSizeMin12(html);
                case AccessibilityFixType.fix_inline_text_contrast:
                    return this.applyFixInlineTextContrast(html);
                case AccessibilityFixType.remove_media_autoplay:
                    return this.applyRemoveMediaAutoplay(html);
                case AccessibilityFixType.form_required_programmatic: {
                    var r = this.applyFormRequiredProgrammatic(html);
                    return r ? { newHtml: r.newHtml, changes: r.changes } : null;
                }
                case AccessibilityFixType.form_error_aria_describedby: {
                    var r = this.applyFormErrorAriaDescribedby(html);
                    return r ? { newHtml: r.newHtml, changes: r.changes } : null;
                }
                case AccessibilityFixType.img_alt_filename_suggest: {
                    var r = this.applyImgAltFilenameSuggest(html);
                    return { newHtml: r.newHtml, changes: r.changes };
                }
                case AccessibilityFixType.img_alt_truncate: {
                    var r = this.applyImgAltTruncate(html);
                    return { newHtml: r.newHtml, changes: r.changes };
                }
                case AccessibilityFixType.heading_h1_demote: {
                    var r = this.applyHeadingH1Demote(html);
                    return { newHtml: r.newHtml, changes: r.changes };
                }
                case AccessibilityFixType.heading_duplicate_h1_demote: {
                    var r = this.applyHeadingDuplicateH1Demote(html);
                    return { newHtml: r.newHtml, changes: r.changes };
                }
                case AccessibilityFixType.iframe_title_from_src: {
                    var r = this.applyIframeTitleFromSrcFirst(html);
                    return r ? { newHtml: r.newHtml, changes: r.changes } : null;
                }
                case AccessibilityFixType.duplicate_id_suffix: {
                    var r = this.applyDuplicateIdSuffix(html);
                    return r ? { newHtml: r.newHtml, changes: r.changes } : null;
                }
                case AccessibilityFixType.form_placeholder_to_label: {
                    var r = this.applyFormPlaceholderToLabel(html);
                    return r ? { newHtml: r.newHtml, changes: r.changes } : null;
                }
                case AccessibilityFixType.table_scope_fix: {
                    var r = this.applyTableScopeFix(html);
                    return r ? { newHtml: r.newHtml, changes: r.changes } : null;
                }
                case AccessibilityFixType.heading_scope_fix: {
                    var r = this.applyHeadingScopeFix(html);
                    return r ? { newHtml: r.newHtml, changes: r.changes } : null;
                }
                case AccessibilityFixType.list_manual_markers_to_semantic:
                    return this.applyListManualMarkersToSemantic(html);
                case AccessibilityFixType.table_promote_first_row_to_thead:
                    return this.applyTablePromoteFirstRowToThead(html);
                case AccessibilityFixType.aria_role_normalize:
                    return this.applyAriaRoleNormalizeFirst(html);
                case AccessibilityFixType.heading_truncate_120:
                    return this.applyHeadingTruncate120(html);
                case AccessibilityFixType.table_caption_from_context:
                    return this.applyTableCaptionFromContextFirst(html);
                case AccessibilityFixType.aria_hidden_focusable_choice:
                    return this.applyAriaHiddenFocusableChoose(html, 'remove');
                case AccessibilityFixType.table_layout_presentation_or_headers:
                    return this.applyTableLayoutFix(html, 'presentation');
                case AccessibilityFixType.link_broken_teacher_href:
                    return this.applyLinkBrokenTeacherHref(html);
                case AccessibilityFixType.link_file_hint_append:
                case AccessibilityFixType.lang_inline_franc_suggest:
                case AccessibilityFixType.lang_code_normalize:
                    return null;
                case AccessibilityFixType.ai_generate_alt_text:
                case AccessibilityFixType.ai_img_decorative:
                case AccessibilityFixType.ai_img_meaningful_alt:
                case AccessibilityFixType.ai_img_text_in_image:
                case AccessibilityFixType.ai_replace_ambiguous_link_text:
                case AccessibilityFixType.ai_link_text:
                case AccessibilityFixType.ai_link_reconstruct:
                case AccessibilityFixType.ai_heading_visual:
                case AccessibilityFixType.ai_button_label:
                case AccessibilityFixType.ai_form_label:
                case AccessibilityFixType.ai_color_only_information:
                case AccessibilityFixType.ai_sensory_only_instructions:
                case AccessibilityFixType.ai_landmark_structure:
                case AccessibilityFixType.manual_only:
                    return null;
                default: {
                    var _exhaustive = fixType;
                    throw new Error("Unhandled AccessibilityFixType: ".concat(String(_exhaustive)));
                }
            }
        };
        CanvasService_1.prototype.applyDuplicateIdSuffix = function (html) {
            var _a, _b, _c;
            var idRegex = /\bid\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/gi;
            var occurrences = [];
            var m;
            while ((m = idRegex.exec(html)) !== null) {
                var idVal = ((_c = (_b = (_a = m[2]) !== null && _a !== void 0 ? _a : m[3]) !== null && _b !== void 0 ? _b : m[4]) !== null && _c !== void 0 ? _c : '').trim();
                if (!idVal)
                    continue;
                occurrences.push({ id: idVal, full: m[0], index: m.index });
            }
            var counts = new Map();
            for (var _i = 0, occurrences_1 = occurrences; _i < occurrences_1.length; _i++) {
                var o = occurrences_1[_i];
                counts.set(o.id, (counts.get(o.id) || 0) + 1);
            }
            var dupIds = new Set();
            counts.forEach(function (c, id) {
                if (c > 1)
                    dupIds.add(id);
            });
            if (dupIds.size === 0)
                return null;
            var changes = [];
            var newHtml = html;
            var nextSuffix = new Map();
            var repls = [];
            for (var _d = 0, occurrences_2 = occurrences; _d < occurrences_2.length; _d++) {
                var _e = occurrences_2[_d], id = _e.id, full = _e.full, index = _e.index;
                if (!dupIds.has(id))
                    continue;
                var suffix = (nextSuffix.get(id) || 0) + 1;
                nextSuffix.set(id, suffix);
                if (suffix === 1)
                    continue;
                var newId = "".concat(id, "-").concat(suffix);
                var escaped = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                var after = full.replace(new RegExp("id\\s*=\\s*[\"']?".concat(escaped, "[\"']?"), 'i'), "id=\"".concat(newId, "\""));
                changes.push({ before: full, after: after });
                repls.push({
                    start: index,
                    end: index + full.length,
                    replacement: after,
                });
            }
            var sorted = repls.sort(function (a, b) { return b.start - a.start; });
            for (var _f = 0, sorted_1 = sorted; _f < sorted_1.length; _f++) {
                var r = sorted_1[_f];
                newHtml =
                    newHtml.slice(0, r.start) + r.replacement + newHtml.slice(r.end);
            }
            return { newHtml: newHtml, changes: changes };
        };
        CanvasService_1.prototype.applyFormPlaceholderToLabel = function (html) {
            var _a, _b, _c, _d, _e, _f;
            var controlRegex = /<(input|select|textarea)\b([^>]*)>/gi;
            var changes = [];
            var newHtml = html;
            var matches = [];
            var m;
            while ((m = controlRegex.exec(html)) !== null)
                matches.push(__assign({}, m));
            var _loop_7 = function (match) {
                var attrs = match[2] || '';
                var placeholderMatch = attrs.match(/\bplaceholder\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
                if (!placeholderMatch)
                    return "continue";
                var placeholder = ((_c = (_b = (_a = placeholderMatch[2]) !== null && _a !== void 0 ? _a : placeholderMatch[3]) !== null && _b !== void 0 ? _b : placeholderMatch[4]) !== null && _c !== void 0 ? _c : '').trim();
                if (!placeholder)
                    return "continue";
                var idMatch = attrs.match(/\bid\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
                var id = ((_f = (_e = (_d = idMatch === null || idMatch === void 0 ? void 0 : idMatch[2]) !== null && _d !== void 0 ? _d : idMatch === null || idMatch === void 0 ? void 0 : idMatch[3]) !== null && _e !== void 0 ? _e : idMatch === null || idMatch === void 0 ? void 0 : idMatch[4]) !== null && _f !== void 0 ? _f : '').trim();
                var fullTag = match[0];
                if (!id) {
                    id = "label-".concat(Math.random().toString(36).slice(2, 10));
                    var withId = fullTag.replace(/<(input|select|textarea)\b/i, function (x) { return "".concat(x, " id=\"").concat(id, "\" "); });
                    changes.push({ before: fullTag, after: withId });
                    newHtml = newHtml.replace(fullTag, withId);
                    fullTag = withId;
                }
                var labelHtml = "<label for=\"".concat(id, "\">").concat(placeholder.replace(/</g, '&lt;').replace(/"/g, '&quot;'), "</label> ");
                if (!newHtml.includes(fullTag))
                    return "continue";
                changes.push({ before: fullTag, after: labelHtml + fullTag });
                newHtml = newHtml.replace(fullTag, labelHtml + fullTag);
            };
            for (var _i = 0, matches_4 = matches; _i < matches_4.length; _i++) {
                var match = matches_4[_i];
                _loop_7(match);
            }
            return changes.length ? { newHtml: newHtml, changes: changes } : null;
        };
        CanvasService_1.prototype.applyTableScopeFix = function (html) {
            var thRegex = /<th\b([^>]*)>/gi;
            var changes = [];
            var newHtml = html;
            var m;
            while ((m = thRegex.exec(html)) !== null) {
                var full = m[0];
                if (/\bscope\s*=/i.test(full))
                    continue;
                var prevThInRow = (html.slice(0, m.index).match(/<th\b/gi) || [])
                    .length;
                var scope = prevThInRow === 0 ? 'row' : 'col';
                var withScope = full.replace(/<th\b/i, "<th scope=\"".concat(scope, "\""));
                changes.push({ before: full, after: withScope });
                newHtml = newHtml.replace(full, withScope);
            }
            return changes.length ? { newHtml: newHtml, changes: changes } : null;
        };
        CanvasService_1.prototype.applyHeadingScopeFix = function (html) {
            var levels = [];
            var headingRegex = /<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi;
            var m;
            while ((m = headingRegex.exec(html)) !== null) {
                levels.push(parseInt(m[1], 10));
            }
            var fixed = false;
            for (var i = 1; i < levels.length; i++) {
                if (levels[i] > levels[i - 1] + 1) {
                    fixed = true;
                    levels[i] = levels[i - 1] + 1;
                }
            }
            if (!fixed)
                return null;
            var changes = [];
            var newHtml = html;
            var headingRegex2 = /<h([1-6])\b([^>]*)>([\s\S]*?)<\/h\1>/gi;
            var idx = 0;
            var mat;
            while ((mat = headingRegex2.exec(html)) !== null && idx < levels.length) {
                var currentLevel = parseInt(mat[1], 10);
                var targetLevel = levels[idx];
                if (currentLevel !== targetLevel) {
                    var full = mat[0];
                    var repl = full
                        .replace(new RegExp("<h".concat(currentLevel, "\\b"), 'gi'), "<h".concat(targetLevel))
                        .replace(new RegExp("</h".concat(currentLevel, ">"), 'gi'), "</h".concat(targetLevel, ">"));
                    changes.push({ before: full, after: repl });
                    newHtml = newHtml.replace(full, repl);
                }
                idx++;
            }
            return changes.length ? { newHtml: newHtml, changes: changes } : null;
        };
        CanvasService_1.prototype.getAccessibilityFixPreview = function (courseId, findings) {
            return __awaiter(this, void 0, void 0, function () {
                var seen, actions, _i, findings_1, f, key, action;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            seen = new Set();
                            actions = [];
                            _i = 0, findings_1 = findings;
                            _a.label = 1;
                        case 1:
                            if (!(_i < findings_1.length)) return [3 /*break*/, 4];
                            f = findings_1[_i];
                            key = "".concat(f.resource_type, ":").concat(f.resource_id, ":").concat(f.rule_id);
                            if (seen.has(key))
                                return [3 /*break*/, 3];
                            seen.add(key);
                            return [4 /*yield*/, this.getAccessibilityFixPreviewItem(courseId, f)];
                        case 2:
                            action = _a.sent();
                            if (action)
                                actions.push(action);
                            _a.label = 3;
                        case 3:
                            _i++;
                            return [3 /*break*/, 1];
                        case 4: return [2 /*return*/, { actions: actions }];
                    }
                });
            });
        };
        CanvasService_1.prototype.getAccessibilityFixPreviewItem = function (courseId, f) {
            return __awaiter(this, void 0, void 0, function () {
                var contract, content, crypto, hash, currentValue, resTitle, result, suggestion, reasoning, confidence, requiresReview, imageUrl, imageFetchFailed, isImageRule, imagePayload, _a, htmlPlain, sliceLen, staticInstruction, dynamicContext, ai, e_31, hrefM, href, meta, appended, r, r, nonEnglish, syncResult, before0, hm, brokenHref, aft, tm, aft, tm, fixChoices, fixChoiceIntro, beforeSnippet, afterSnippet, actionId, hasError, effectiveStrategy, confidenceResolved, beforeHtml, afterHtml;
                var _b, _c, _d, _e, _f, _g;
                return __generator(this, function (_h) {
                    switch (_h.label) {
                        case 0:
                            contract = exports.ACCESSIBILITY_FIXABILITY_MAP[f.rule_id];
                            if (!(contract === null || contract === void 0 ? void 0 : contract.supports_preview))
                                return [2 /*return*/, null];
                            return [4 /*yield*/, this.fetchAccessibilityResourceContent(courseId, f.resource_type, f.resource_id)];
                        case 1:
                            content = _h.sent();
                            if (!content)
                                return [2 /*return*/, null];
                            return [4 /*yield*/, Promise.resolve().then(function () { return require('crypto'); })];
                        case 2:
                            crypto = _h.sent();
                            hash = function (s) {
                                return crypto.createHash('sha256').update(s).digest('hex').slice(0, 16);
                            };
                            currentValue = this.extractCurrentViolationValue(f.rule_id, content.html, f.snippet);
                            resTitle = content.resourceTitle || f.resource_title || '';
                            result = null;
                            suggestion = '';
                            reasoning = '';
                            confidence = 0.55;
                            requiresReview = false;
                            imageUrl = '';
                            imageFetchFailed = false;
                            if (!contract.uses_ai) return [3 /*break*/, 12];
                            isImageRule = contract.is_image_rule;
                            imageUrl = isImageRule ? this.extractFirstImageSrc(content.html) : '';
                            if (!(isImageRule && imageUrl)) return [3 /*break*/, 4];
                            return [4 /*yield*/, this.fetchImageForVision(imageUrl)];
                        case 3:
                            _a = _h.sent();
                            return [3 /*break*/, 5];
                        case 4:
                            _a = null;
                            _h.label = 5;
                        case 5:
                            imagePayload = _a;
                            if (isImageRule && imageUrl && !imagePayload)
                                imageFetchFailed = true;
                            htmlPlain = String(content.html || '')
                                .replace(/<[^>]+>/g, ' ')
                                .replace(/\s+/g, ' ')
                                .trim();
                            sliceLen = isImageRule
                                ? ADA_AI_HTML_CONTEXT_IMAGE
                                : ADA_AI_HTML_CONTEXT_TEXT;
                            staticInstruction = [
                                'You are an ADA accessibility remediation assistant for Canvas course content.',
                                'Return ONLY valid JSON with keys: suggestion, confidence, reasoning, requires_review.',
                                'confidence must be a float between 0 and 1.',
                                'suggestion must be concise and directly applicable to the violation.',
                            ].join('\n');
                            dynamicContext = [
                                "Rule ID: ".concat(f.rule_id),
                                "Resource title: ".concat(resTitle || '(unknown)'),
                                "Resource type: ".concat(f.resource_type),
                                "Current violating value: ".concat(currentValue),
                                "Nearby snippet: ".concat(String(f.snippet || '').slice(0, 500) || '(none)'),
                                "HTML context excerpt: ".concat(htmlPlain.slice(0, sliceLen)),
                            ].join('\n');
                            _h.label = 6;
                        case 6:
                            _h.trys.push([6, 8, , 9]);
                            return [4 /*yield*/, this.callClaudeStructuredSuggestion({ staticInstruction: staticInstruction, dynamicContext: dynamicContext }, {
                                    image: imagePayload,
                                    ruleId: f.rule_id,
                                    resourceType: f.resource_type,
                                    useVisionTierModel: contract.is_image_rule,
                                })];
                        case 7:
                            ai = _h.sent();
                            suggestion = ai.suggestion;
                            reasoning = ai.reasoning;
                            confidence = ai.confidence;
                            requiresReview = ai.requires_review;
                            return [3 /*break*/, 9];
                        case 8:
                            e_31 = _h.sent();
                            suggestion = '';
                            reasoning = '';
                            confidence = 0.2;
                            requiresReview = true;
                            result = {
                                newHtml: content.html,
                                changes: [],
                                errorNote: (e_31 === null || e_31 === void 0 ? void 0 : e_31.message) || 'AI suggestion generation failed.',
                            };
                            return [3 /*break*/, 9];
                        case 9:
                            if (!!result) return [3 /*break*/, 11];
                            return [4 /*yield*/, this.applySuggestionToHtml(content.html, f.rule_id, suggestion)];
                        case 10:
                            result = _h.sent();
                            _h.label = 11;
                        case 11: return [3 /*break*/, 15];
                        case 12:
                            if (!(f.rule_id === 'link_file_missing_type_size_hint')) return [3 /*break*/, 14];
                            hrefM = content.html.match(/<a\b[^>]*\bhref\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
                            href = ((_d = (_c = (_b = hrefM === null || hrefM === void 0 ? void 0 : hrefM[2]) !== null && _b !== void 0 ? _b : hrefM === null || hrefM === void 0 ? void 0 : hrefM[3]) !== null && _c !== void 0 ? _c : hrefM === null || hrefM === void 0 ? void 0 : hrefM[4]) !== null && _d !== void 0 ? _d : '').trim();
                            return [4 /*yield*/, this.fetchLinkFileMetaForHint(href || 'https://invalid.invalid/')];
                        case 13:
                            meta = _h.sent();
                            appended = this.applyLinkFileHintAppend(content.html, meta.suffix);
                            if (appended) {
                                result = { newHtml: appended.newHtml, changes: appended.changes };
                                suggestion = meta.suffix
                                    ? "Hint added:".concat(meta.suffix)
                                    : 'Could not detect type/size. Enter a hint (e.g. PDF, 2 MB) and apply.';
                            }
                            else if (!hrefM) {
                                result = {
                                    newHtml: content.html,
                                    changes: [],
                                    errorNote: 'No link with href found in this content.',
                                };
                            }
                            else {
                                result = {
                                    newHtml: content.html,
                                    changes: [],
                                    errorNote: 'Could not detect file type or size. Enter a hint in the field below and apply.',
                                };
                                suggestion = '(PDF, 2 MB)';
                            }
                            confidence = 0.65;
                            return [3 /*break*/, 15];
                        case 14:
                            if (f.rule_id === 'lang_inline_missing') {
                                r = this.applyLangInlineFrancFirst(content.html);
                                result = r ? { newHtml: r.newHtml, changes: r.changes } : null;
                                if (r)
                                    suggestion = r.suggestionText;
                                confidence = 0.72;
                            }
                            else if (f.rule_id === 'lang_invalid') {
                                r = this.applyLangCodeNormalizeFirst(content.html);
                                result = r ? { newHtml: r.newHtml, changes: r.changes } : null;
                                if (r)
                                    suggestion = r.suggestionText;
                                confidence = 0.72;
                            }
                            else if (contract.fix_type === AccessibilityFixType.set_html_lang) {
                                nonEnglish = this.looksNonEnglishText(content.html.replace(/<[^>]+>/g, ' '));
                                result = nonEnglish
                                    ? {
                                        newHtml: content.html,
                                        changes: [],
                                        errorNote: 'Possible non-English content detected. Human review required before setting a default language.',
                                    }
                                    : this.applySetHtmlLang(content.html);
                            }
                            else {
                                syncResult = this.runFixExecutor(content.html, contract.fix_type);
                                result = syncResult ? __assign({}, syncResult) : null;
                            }
                            _h.label = 15;
                        case 15:
                            if (f.rule_id === 'link_broken' &&
                                result &&
                                result.changes.length &&
                                !result.errorNote) {
                                before0 = result.changes[0].before;
                                hm = before0.match(/\bhref\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
                                brokenHref = ((_g = (_f = (_e = hm === null || hm === void 0 ? void 0 : hm[2]) !== null && _e !== void 0 ? _e : hm === null || hm === void 0 ? void 0 : hm[3]) !== null && _f !== void 0 ? _f : hm === null || hm === void 0 ? void 0 : hm[4]) !== null && _g !== void 0 ? _g : '').trim();
                                suggestion = "Enter the correct URL for this link. Broken href was: ".concat(brokenHref || '(empty)');
                            }
                            if (f.rule_id === 'iframe_missing_title' &&
                                result &&
                                result.changes.length &&
                                !result.errorNote) {
                                aft = result.changes[0].after;
                                tm = aft.match(/\btitle\s*=\s*["']([^"']*)["']/i);
                                if (tm)
                                    suggestion = String(tm[1] || '').trim();
                            }
                            if (f.rule_id === 'heading_too_long' &&
                                result &&
                                result.changes.length &&
                                !result.errorNote) {
                                aft = result.changes[0].after;
                                tm = aft.match(/<h[1-6]\b[^>]*>([\s\S]*?)<\/h[1-6]>/i);
                                if (tm)
                                    suggestion = String(tm[1] || '')
                                        .replace(/<[^>]+>/g, ' ')
                                        .replace(/\s+/g, ' ')
                                        .trim();
                            }
                            if (f.rule_id === 'aria_hidden_focusable' &&
                                result &&
                                result.changes.length &&
                                !result.errorNote) {
                                fixChoiceIntro =
                                    'Choose how to fix an element that is aria-hidden but can still receive keyboard focus. Removing aria-hidden exposes the element to assistive technology. Adding tabindex="-1" removes it from the tab order while keeping aria-hidden—use only when that matches your intent.';
                                fixChoices = [
                                    {
                                        value: 'acc_fix:aria_hidden:remove',
                                        label: 'Remove aria-hidden="true"',
                                        help: 'Use when the content should be available to screen readers.',
                                    },
                                    {
                                        value: 'acc_fix:aria_hidden:tabindex',
                                        label: 'Keep aria-hidden; add tabindex="-1"',
                                        help: 'Use when the element should stay hidden from assistive tech and not be focusable.',
                                    },
                                ];
                                suggestion = fixChoices[0].value;
                            }
                            if (f.rule_id === 'table_layout_heuristic' &&
                                result &&
                                result.changes.length &&
                                !result.errorNote) {
                                fixChoiceIntro =
                                    'This table looks like it might be a layout table (for visual alignment) or a data table with weak markup. Layout tables should use role="presentation" so screen readers ignore structure. Data tables need real header cells (<th>) so screen reader users understand rows and columns.';
                                fixChoices = [
                                    {
                                        value: 'acc_fix:table_layout:presentation',
                                        label: 'Layout table: add role="presentation"',
                                        help: 'Pick this when the table is only for visual layout, not for tabular data.',
                                    },
                                    {
                                        value: 'acc_fix:table_layout:headers',
                                        label: 'Data table: promote first row to header cells',
                                        help: 'Pick this when the table holds real data and needs column/row headers.',
                                    },
                                ];
                                suggestion = fixChoices[0].value;
                            }
                            if (!result || (result.changes.length === 0 && !result.errorNote))
                                return [2 /*return*/, null];
                            beforeSnippet = result.changes.map(function (c) { return c.before; }).join('\n---\n');
                            afterSnippet = result.changes.map(function (c) { return c.after; }).join('\n---\n');
                            actionId = "".concat(hash(content.html), ":").concat(f.resource_type, ":").concat(f.resource_id, ":").concat(f.rule_id);
                            hasError = !!result.errorNote;
                            effectiveStrategy = hasError
                                ? 'manual_only'
                                : contract.fix_strategy;
                            confidenceResolved = this.resolveConfidenceTier(f.rule_id, confidence, {
                                imageFetchFailed: imageFetchFailed,
                                imageFilename: imageUrl.split('/').pop() || '',
                                requiresReview: requiresReview,
                            });
                            beforeHtml = beforeSnippet;
                            afterHtml = hasError ? '' : afterSnippet;
                            return [2 /*return*/, __assign({ action_id: actionId, resource_type: f.resource_type, resource_id: f.resource_id, update_key: content.updateKey, resource_title: content.resourceTitle || f.resource_title || '', rule_id: f.rule_id, fix_type: contract.fix_type, fix_strategy: effectiveStrategy, risk: contract.risk, before_html: beforeHtml, after_html: afterHtml, beforeHtml: beforeHtml, afterHtml: afterHtml, before_snippet: (currentValue ||
                                        beforeHtml ||
                                        result.errorNote ||
                                        '').slice(0, 1000), after_snippet: (suggestion || afterHtml || result.errorNote || '').slice(0, 1000), content_hash: hash(content.html), proposed_html: hasError ? undefined : result.newHtml, error_note: result.errorNote, suggestion: suggestion, edited_suggestion: suggestion, reasoning: reasoning, requires_review: requiresReview, confidence: confidenceResolved.confidence, confidence_tier: confidenceResolved.tier, confidence_override_reason: confidenceResolved.override_reason, image_url: imageUrl || undefined, image_fetch_failed: !!imageFetchFailed }, ((fixChoices === null || fixChoices === void 0 ? void 0 : fixChoices.length)
                                    ? {
                                        fix_choices: fixChoices,
                                        fix_choice_intro: fixChoiceIntro,
                                    }
                                    : {}))];
                    }
                });
            });
        };
        CanvasService_1.prototype.applyAccessibilityFixes = function (courseId, approvedActions) {
            return __awaiter(this, void 0, void 0, function () {
                var crypto, hash, results, fixed, skipped, failed, byResource, _i, approvedActions_1, a, key, content, entry, _a, byResource_1, _b, entry, html, appliedActionIds, _c, _d, a, c, fromSuggestion, nextHtml, result, beforeHash, persisted, afterHash, _e, token, baseUrl, r, _f, _g, a, _h, _j, a, e_32, _k, _l, a;
                var _m;
                return __generator(this, function (_o) {
                    switch (_o.label) {
                        case 0: return [4 /*yield*/, Promise.resolve().then(function () { return require('crypto'); })];
                        case 1:
                            crypto = _o.sent();
                            hash = function (s) {
                                return crypto.createHash('sha256').update(s).digest('hex').slice(0, 16);
                            };
                            results = [];
                            fixed = 0;
                            skipped = 0;
                            failed = 0;
                            byResource = new Map();
                            _i = 0, approvedActions_1 = approvedActions;
                            _o.label = 2;
                        case 2:
                            if (!(_i < approvedActions_1.length)) return [3 /*break*/, 6];
                            a = approvedActions_1[_i];
                            key = "".concat(a.resource_type, ":").concat(a.resource_id);
                            if (!!byResource.has(key)) return [3 /*break*/, 4];
                            return [4 /*yield*/, this.fetchAccessibilityResourceContent(courseId, a.resource_type, a.resource_id)];
                        case 3:
                            content = _o.sent();
                            if (!content) {
                                results.push({
                                    action_id: a.action_id,
                                    resource_type: a.resource_type,
                                    resource_id: a.resource_id,
                                    rule_id: a.rule_id,
                                    status: 'failed',
                                    error: 'Could not fetch resource content',
                                });
                                failed++;
                                return [3 /*break*/, 5];
                            }
                            if (hash(content.html) !== a.content_hash) {
                                results.push({
                                    action_id: a.action_id,
                                    resource_type: a.resource_type,
                                    resource_id: a.resource_id,
                                    rule_id: a.rule_id,
                                    status: 'skipped',
                                    error: 'Content changed since preview',
                                });
                                skipped++;
                                return [3 /*break*/, 5];
                            }
                            byResource.set(key, {
                                actions: [],
                                html: content.html,
                                updateKey: content.updateKey,
                                resourceType: a.resource_type,
                            });
                            _o.label = 4;
                        case 4:
                            entry = byResource.get(key);
                            if (hash(entry.html) !== a.content_hash) {
                                results.push({
                                    action_id: a.action_id,
                                    resource_type: a.resource_type,
                                    resource_id: a.resource_id,
                                    rule_id: a.rule_id,
                                    status: 'skipped',
                                    error: 'Content hash mismatch',
                                });
                                skipped++;
                                return [3 /*break*/, 5];
                            }
                            entry.actions.push(a);
                            _o.label = 5;
                        case 5:
                            _i++;
                            return [3 /*break*/, 2];
                        case 6:
                            _a = 0, byResource_1 = byResource;
                            _o.label = 7;
                        case 7:
                            if (!(_a < byResource_1.length)) return [3 /*break*/, 26];
                            _b = byResource_1[_a], entry = _b[1];
                            html = entry.html;
                            appliedActionIds = new Set();
                            _c = 0, _d = entry.actions;
                            _o.label = 8;
                        case 8:
                            if (!(_c < _d.length)) return [3 /*break*/, 12];
                            a = _d[_c];
                            if (a.fix_strategy === 'manual_only') {
                                results.push({
                                    action_id: a.action_id,
                                    resource_type: a.resource_type,
                                    resource_id: a.resource_id,
                                    rule_id: a.rule_id,
                                    status: 'skipped',
                                    error: a.error_note || 'Marked manual_only in preview',
                                });
                                skipped++;
                                return [3 /*break*/, 11];
                            }
                            c = exports.ACCESSIBILITY_FIXABILITY_MAP[a.rule_id];
                            if (a.before_html &&
                                typeof a.after_html === 'string' &&
                                a.after_html !== '(removed)' &&
                                html.includes(a.before_html)) {
                                html = html.replace(a.before_html, a.after_html);
                                appliedActionIds.add(a.action_id);
                                return [3 /*break*/, 11];
                            }
                            if (a.before_html &&
                                a.after_html === '(removed)' &&
                                html.includes(a.before_html)) {
                                html = html.replace(a.before_html, '');
                                appliedActionIds.add(a.action_id);
                                return [3 /*break*/, 11];
                            }
                            if (!(typeof a.edited_suggestion === 'string' &&
                                a.edited_suggestion.trim())) return [3 /*break*/, 10];
                            return [4 /*yield*/, this.applySuggestionToHtml(html, a.rule_id, a.edited_suggestion)];
                        case 9:
                            fromSuggestion = _o.sent();
                            if (fromSuggestion &&
                                !fromSuggestion.errorNote &&
                                fromSuggestion.newHtml !== html) {
                                html = fromSuggestion.newHtml;
                                appliedActionIds.add(a.action_id);
                                return [3 /*break*/, 11];
                            }
                            _o.label = 10;
                        case 10:
                            if (typeof a.proposed_html === 'string' && a.proposed_html.trim()) {
                                nextHtml = a.proposed_html;
                                if (nextHtml !== html) {
                                    html = nextHtml;
                                    appliedActionIds.add(a.action_id);
                                }
                                return [3 /*break*/, 11];
                            }
                            if (c === null || c === void 0 ? void 0 : c.fix_type) {
                                result = this.runFixExecutor(html, c.fix_type);
                                if (result && result.newHtml !== html) {
                                    html = result.newHtml;
                                    appliedActionIds.add(a.action_id);
                                }
                            }
                            if (!appliedActionIds.has(a.action_id)) {
                                results.push({
                                    action_id: a.action_id,
                                    resource_type: a.resource_type,
                                    resource_id: a.resource_id,
                                    rule_id: a.rule_id,
                                    status: 'skipped',
                                    error: 'No effective content change for action',
                                });
                                skipped++;
                            }
                            _o.label = 11;
                        case 11:
                            _c++;
                            return [3 /*break*/, 8];
                        case 12:
                            _o.trys.push([12, 24, , 25]);
                            if (!appliedActionIds.size)
                                return [3 /*break*/, 25];
                            if (!(entry.resourceType === 'pages')) return [3 /*break*/, 14];
                            return [4 /*yield*/, this.updatePage(courseId, entry.updateKey, {
                                    wiki_page: { body: html },
                                })];
                        case 13:
                            _o.sent();
                            return [3 /*break*/, 23];
                        case 14:
                            if (!(entry.resourceType === 'assignments')) return [3 /*break*/, 16];
                            return [4 /*yield*/, this.updateAssignment(courseId, Number(entry.updateKey), {
                                    description: html,
                                })];
                        case 15:
                            _o.sent();
                            return [3 /*break*/, 23];
                        case 16:
                            if (!(entry.resourceType === 'announcements' ||
                                entry.resourceType === 'discussions')) return [3 /*break*/, 19];
                            beforeHash = hash(entry.html);
                            return [4 /*yield*/, this.updateDiscussion(courseId, Number(entry.updateKey), {
                                    message: html,
                                })];
                        case 17:
                            _o.sent();
                            return [4 /*yield*/, this.fetchAccessibilityResourceContent(courseId, entry.resourceType, entry.updateKey)];
                        case 18:
                            persisted = _o.sent();
                            if (!persisted) {
                                throw new Error("Could not re-fetch ".concat(entry.resourceType, " ").concat(entry.updateKey, " after update"));
                            }
                            afterHash = hash(persisted.html);
                            if (afterHash === beforeHash) {
                                throw new Error("Canvas reported success but ".concat(entry.resourceType, " ").concat(entry.updateKey, " content did not change"));
                            }
                            return [3 /*break*/, 23];
                        case 19:
                            if (!(entry.resourceType === 'syllabus')) return [3 /*break*/, 22];
                            return [4 /*yield*/, this.getAuthHeaders()];
                        case 20:
                            _e = _o.sent(), token = _e.token, baseUrl = _e.baseUrl;
                            return [4 /*yield*/, fetch("".concat(baseUrl, "/courses/").concat(courseId), {
                                    method: 'PUT',
                                    headers: {
                                        Authorization: "Bearer ".concat(token),
                                        'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify({ course: { syllabus_body: html } }),
                                })];
                        case 21:
                            r = _o.sent();
                            if (!r.ok)
                                throw new Error("Syllabus update failed: ".concat(r.status));
                            return [3 /*break*/, 23];
                        case 22:
                            for (_f = 0, _g = entry.actions; _f < _g.length; _f++) {
                                a = _g[_f];
                                results.push({
                                    action_id: a.action_id,
                                    resource_type: a.resource_type,
                                    resource_id: a.resource_id,
                                    rule_id: a.rule_id,
                                    status: 'failed',
                                    error: 'Unsupported resource type',
                                });
                                failed++;
                            }
                            return [3 /*break*/, 25];
                        case 23:
                            for (_h = 0, _j = entry.actions; _h < _j.length; _h++) {
                                a = _j[_h];
                                if (!appliedActionIds.has(a.action_id))
                                    continue;
                                results.push({
                                    action_id: a.action_id,
                                    resource_type: a.resource_type,
                                    resource_id: a.resource_id,
                                    rule_id: a.rule_id,
                                    status: 'fixed',
                                });
                                fixed++;
                            }
                            return [3 /*break*/, 25];
                        case 24:
                            e_32 = _o.sent();
                            for (_k = 0, _l = entry.actions; _k < _l.length; _k++) {
                                a = _l[_k];
                                if (!appliedActionIds.has(a.action_id))
                                    continue;
                                results.push({
                                    action_id: a.action_id,
                                    resource_type: a.resource_type,
                                    resource_id: a.resource_id,
                                    rule_id: a.rule_id,
                                    status: 'failed',
                                    error: (_m = e_32 === null || e_32 === void 0 ? void 0 : e_32.message) !== null && _m !== void 0 ? _m : 'Update failed',
                                });
                                failed++;
                            }
                            return [3 /*break*/, 25];
                        case 25:
                            _a++;
                            return [3 /*break*/, 7];
                        case 26: return [2 /*return*/, { fixed: fixed, skipped: skipped, failed: failed, results: results }];
                    }
                });
            });
        };
        return CanvasService_1;
    }());
    __setFunctionName(_classThis, "CanvasService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        CanvasService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
    })();
    _classThis.ACCREDITATION_PROFILE_PAGE_URL = 'accreditation-profile';
    _classThis.START_HERE_MODULE_NAME = 'Start Here';
    _classThis.ACCREDITATION_PRE_CLASS = 'accreditation-profile-data';
    _classThis.ACCREDITATION_STAGE_IDS = [
        '0',
        '1',
        '2',
        '3',
        '3b',
        '4',
        '5',
    ];
    _classThis.ACCREDITATION_STAGE_STATES = [
        'draft',
        'ready',
        'approved',
        'applied',
    ];
    _classThis.OPERATION_LOG_CAP = 100;
    _classThis.PROFILE_KEYS = [
        { key: 'state', label: 'State' },
        { key: 'city', label: 'City' },
        { key: 'institutionName', label: 'Institution' },
        { key: 'institutionId', label: 'Institution ID' },
        { key: 'program', label: 'Program' },
        { key: 'programCip4', label: 'Program CIP4' },
        { key: 'programTitle', label: 'Program Title' },
        { key: 'programFocusCip6', label: 'Program Focus CIP6' },
        { key: 'selectedStandards', label: 'Selected Standards' },
        { key: 'aiSuggestedAccepted', label: 'AI Suggested Accepted' },
        { key: 'aiSuggestedRejected', label: 'AI Suggested Rejected' },
        { key: 'aiSuggestedReviewLater', label: 'AI Suggested Review Later' },
        { key: 'stages', label: 'Stages' },
        { key: 'operationLog', label: 'OperationLog' },
    ];
    _classThis.GENERAL_ACCREDITORS = [
        { id: 'QM', abbreviation: 'QM', name: 'Quality Matters' },
        {
            id: 'SACSCOC',
            abbreviation: 'SACSCOC',
            name: 'Southern Association of Colleges and Schools Commission on Colleges',
        },
    ];
    _classThis.STUB_ACCREDITORS_BY_CIP = {
        '16.16': [
            {
                id: 'ACTFL',
                abbreviation: 'ACTFL',
                name: 'American Council on the Teaching of Foreign Languages',
            },
            {
                id: 'ASLTA',
                abbreviation: 'ASLTA',
                name: 'American Sign Language Teachers Association / NCIEC',
            },
            {
                id: 'CCIE',
                abbreviation: 'CCIE',
                name: 'Commission on Collegiate Interpreter Education',
            },
            {
                id: 'CED',
                abbreviation: 'CED',
                name: 'Council on Education of the Deaf',
            },
            {
                id: 'CEC',
                abbreviation: 'CEC',
                name: 'Council for Exceptional Children',
            },
            {
                id: 'BEI',
                abbreviation: 'BEI',
                name: 'Board for Evaluation of Interpreters (Texas)',
            },
            {
                id: 'RID',
                abbreviation: 'RID',
                name: 'Registry of Interpreters for the Deaf',
            },
        ],
    };
    _classThis.STUB_STANDARDS_BY_ORG = {
        QM: [
            { id: 'QM-1', title: 'Course Overview and Introduction' },
            { id: 'QM-2', title: 'Learning Objectives (Competencies)' },
            { id: 'QM-3', title: 'Assessment and Measurement' },
        ],
        ACTFL: [
            { id: 'ACTFL-C', title: 'Communication' },
            { id: 'ACTFL-CU', title: 'Cultures' },
            { id: 'ACTFL-CO', title: 'Connections' },
        ],
        ASLTA: [
            { id: 'ASLTA-1', title: 'Language Knowledge and Performance' },
            { id: 'ASLTA-2', title: 'Instructional Planning and Delivery' },
            { id: 'ASLTA-3', title: 'Assessment and Professional Practice' },
        ],
    };
    _classThis.STANDARDS_PREFIX_REGEX = /\|STANDARDS:([^|]+)\|/;
    _classThis.ACCESSIBILITY_SUPPORTED_TYPES = [
        'pages',
        'assignments',
        'announcements',
        'syllabus',
        'discussions',
    ];
    _classThis.claudeCache = new Map();
    _classThis.CLAUDE_CACHE_MAX = 500;
    (function () {
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return CanvasService = _classThis;
}();
exports.CanvasService = CanvasService;
