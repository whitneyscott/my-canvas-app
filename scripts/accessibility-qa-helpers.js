'use strict';

const fs = require('fs');
const path = require('path');

const DEFAULT_CANVAS_API_BASE =
  'https://canvas.instructure.com/api/v1';

function normalizeCanvasApiV1Base(raw) {
  const s = String(raw || '').trim();
  if (!s) return '';
  return s.replace(/\/+$/, '').replace(/\/api\/v1\/?$/, '') + '/api/v1';
}

function resolveCanvasApiBaseForScripts() {
  const explicit =
    process.env.CANVAS_BASE_URL || process.env.QA_CANVAS_BASE_URL || '';
  return normalizeCanvasApiV1Base(explicit.trim() || DEFAULT_CANVAS_API_BASE);
}

function resolveCanvasTokenForScripts() {
  return (
    process.env.CANVAS_TOKEN ||
    process.env.QA_CANVAS_TOKEN ||
    process.env.CANVAS_ACCESS_TOKEN ||
    ''
  ).trim();
}

const DUAL_OPTION_RULE_IDS = new Set([
  'aria_hidden_focusable',
  'table_layout_heuristic',
]);

function loadFixabilityMapFromDist() {
  const distPath = path.join(
    __dirname,
    '..',
    'dist',
    'canvas',
    'canvas.service.js',
  );
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Missing ${distPath}. Run "npm run build" before the accessibility QA builder.`,
    );
  }
  const resolved = require.resolve(distPath);
  delete require.cache[resolved];
  const mod = require(distPath);
  const map = mod.ACCESSIBILITY_FIXABILITY_MAP;
  if (!map || typeof map !== 'object') {
    throw new Error('ACCESSIBILITY_FIXABILITY_MAP not found in compiled canvas.service.js');
  }
  return map;
}

function manifestContentTypeToScanResourceType(contentType) {
  if (contentType === 'pages') return 'page';
  if (contentType === 'assignments') return 'assignment';
  return contentType;
}

function enrichFixtureRegistryFields(ruleId, fixabilityMap) {
  const contract = fixabilityMap[ruleId];
  const dual_option = DUAL_OPTION_RULE_IDS.has(ruleId);
  const pending_heuristic = ruleId === 'link_empty_name';
  if (!contract) {
    return {
      fix_strategy: undefined,
      uses_ai: undefined,
      is_image_rule: undefined,
      uses_second_stage_ai: undefined,
      dual_option,
      pending_heuristic,
    };
  }
  return {
    fix_strategy: contract.fix_strategy,
    uses_ai: !!contract.uses_ai,
    is_image_rule: !!contract.is_image_rule,
    uses_second_stage_ai: !!contract.uses_second_stage_ai,
    dual_option,
    pending_heuristic,
  };
}

module.exports = {
  loadFixabilityMapFromDist,
  manifestContentTypeToScanResourceType,
  enrichFixtureRegistryFields,
  DUAL_OPTION_RULE_IDS,
  DEFAULT_CANVAS_API_BASE,
  normalizeCanvasApiV1Base,
  resolveCanvasApiBaseForScripts,
  resolveCanvasTokenForScripts,
};
