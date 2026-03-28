'use strict';

const fs = require('fs');
const path = require('path');

const CANVAS_QA_DEFAULT_BASES = {
  docker: 'http://127.0.0.1/api/v1',
  online: 'https://canvas.instructure.com/api/v1',
};

function loadLocalProjectDotEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) return;
  const text = fs.readFileSync(envPath, 'utf8');
  for (const line of text.split('\n')) {
    const s = line.trim();
    if (!s || s.startsWith('#')) continue;
    const eq = s.indexOf('=');
    if (eq < 1) continue;
    const key = s.slice(0, eq).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue;
    let val = s.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

const CANVAS_API_TOKEN_ENV_KEYS = [
  'CANVAS_ACCESS_TOKEN',
  'CANVAS_TOKEN',
  'QA_CANVAS_TOKEN',
];

function normalizeCanvasApiV1Base(raw) {
  const s = String(raw || '').trim();
  if (!s) return '';
  return s.replace(/\/+$/, '').replace(/\/api\/v1\/?$/, '') + '/api/v1';
}

function resolveCanvasApiBaseForScripts() {
  const explicit =
    process.env.CANVAS_BASE_URL || process.env.QA_CANVAS_BASE_URL || '';
  if (explicit.trim()) {
    return normalizeCanvasApiV1Base(explicit.trim());
  }
  const profile = String(
    process.env.CANVAS_QA_PROFILE || process.env.QA_CANVAS_PROFILE || '',
  )
    .trim()
    .toLowerCase();
  if (profile === 'docker' || profile === 'local') {
    return normalizeCanvasApiV1Base(CANVAS_QA_DEFAULT_BASES.docker);
  }
  if (profile === 'online' || profile === 'hosted') {
    return normalizeCanvasApiV1Base(CANVAS_QA_DEFAULT_BASES.online);
  }
  throw new Error(
    [
      'Canvas API base is ambiguous: set CANVAS_BASE_URL or QA_CANVAS_BASE_URL,',
      'or set CANVAS_QA_PROFILE to choose a default:',
      `  docker → ${CANVAS_QA_DEFAULT_BASES.docker} (Canvas OSS / Docker)`,
      `  online → ${CANVAS_QA_DEFAULT_BASES.online} (hosted Instructure-style)`,
    ].join('\n'),
  );
}

function resolveCanvasTokenForScripts() {
  const entries = CANVAS_API_TOKEN_ENV_KEYS.map((key) => [
    key,
    String(process.env[key] || '').trim(),
  ]).filter(([, v]) => v.length > 0);
  if (entries.length === 0) return '';
  const uniqueValues = [...new Set(entries.map(([, v]) => v))];
  if (uniqueValues.length > 1) {
    throw new Error(
      [
        'Canvas API token env vars disagree (different non-empty values):',
        entries.map(([k]) => k).join(', '),
        'Use one of CANVAS_ACCESS_TOKEN, CANVAS_TOKEN, QA_CANVAS_TOKEN, or set them to the same token.',
      ].join(' '),
    );
  }
  return uniqueValues[0];
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
  loadLocalProjectDotEnv,
  enrichFixtureRegistryFields,
  DUAL_OPTION_RULE_IDS,
  CANVAS_QA_DEFAULT_BASES,
  normalizeCanvasApiV1Base,
  resolveCanvasApiBaseForScripts,
  resolveCanvasTokenForScripts,
};
