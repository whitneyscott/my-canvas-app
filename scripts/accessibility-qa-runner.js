#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const {
  loadLocalProjectDotEnv,
  resolveCanvasApiBaseForScripts,
  resolveCanvasTokenForScripts,
} = require('./accessibility-qa-helpers');

loadLocalProjectDotEnv();

function fetchErrorDetail(err) {
  const c = err && err.cause;
  if (!c) return '';
  if (typeof c === 'object' && c !== null && 'code' in c) return String(c.code);
  if (c instanceof Error) return c.message;
  return String(c);
}

const TELEMETRY_DIR = path.join(
  __dirname,
  '..',
  'test',
  'fixtures',
  'accessibility-qa',
);
const TELEMETRY_JSONL = path.join(TELEMETRY_DIR, 'qa-scan-telemetry.jsonl');
const TELEMETRY_LATEST = path.join(TELEMETRY_DIR, 'qa-scan-telemetry.latest.json');

async function fetchScan(apiBase, courseId, headers, opts, recordScanTelemetry) {
  const base = String(apiBase || '').replace(/\/$/, '');
  const params = new URLSearchParams();
  if (opts && Array.isArray(opts.resource_types) && opts.resource_types.length) {
    params.set('resource_types', opts.resource_types.join(','));
  }
  if (opts && Array.isArray(opts.rule_ids) && opts.rule_ids.length) {
    params.set('rule_ids', opts.rule_ids.map(String).join(','));
  }
  const q = params.toString();
  const scanUrl = `${base}/canvas/courses/${courseId}/accessibility/scan${q ? `?${q}` : ''}`;
  let scanRes;
  try {
    scanRes = await fetch(scanUrl, { headers, credentials: 'include' });
  } catch (err) {
    const d = fetchErrorDetail(err);
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(
      `${msg}${d ? ` [${d}]` : ''} — tried ${scanUrl}`,
    );
  }
  if (!scanRes.ok) {
    const text = await scanRes.text();
    throw new Error(`Scan ${scanRes.status}: ${text.slice(0, 400)}`);
  }
  const data = await scanRes.json();
  if (typeof recordScanTelemetry === 'function') {
    recordScanTelemetry(opts?.trigger || 'scan', courseId, data);
  }
  return data;
}

function appendScanTelemetryFile(rec) {
  fs.mkdirSync(TELEMETRY_DIR, { recursive: true });
  fs.appendFileSync(TELEMETRY_JSONL, `${JSON.stringify(rec)}\n`, 'utf8');
  fs.writeFileSync(TELEMETRY_LATEST, JSON.stringify(rec, null, 2), 'utf8');
}

function snapshotScan(scanData) {
  return {
    requested_resource_types: scanData.requested_resource_types,
    requested_rule_ids: scanData.requested_rule_ids,
    summary: scanData.summary,
    benchmark: scanData.benchmark,
    findings: scanData.findings || [],
    warnings: scanData.warnings,
    rule_version: scanData.rule_version,
  };
}

function buildScanCompare(initialFindings, finalFindings) {
  function sig(f) {
    return [
      String(f.resource_type || '').toLowerCase(),
      String(f.resource_id || ''),
      String(f.rule_id || ''),
      String(f.snippet || '').slice(0, 300),
    ].join('\x1f');
  }
  function countByRule(arr) {
    const o = {};
    for (const f of arr) {
      const r = String(f.rule_id || '');
      o[r] = (o[r] || 0) + 1;
    }
    return o;
  }
  const ini = initialFindings || [];
  const fin = finalFindings || [];
  const fMap = new Map(fin.map((f) => [sig(f), f]));
  const iMap = new Map(ini.map((f) => [sig(f), f]));
  const removed = [...iMap.keys()].filter((k) => !fMap.has(k));
  const added = [...fMap.keys()].filter((k) => !iMap.has(k));
  const byInitial = countByRule(ini);
  const byFinal = countByRule(fin);
  const ruleIds = new Set([...Object.keys(byInitial), ...Object.keys(byFinal)]);
  const by_rule_delta = {};
  for (const r of ruleIds) {
    const a = byInitial[r] || 0;
    const b = byFinal[r] || 0;
    if (a !== b) by_rule_delta[r] = { initial: a, final: b, delta: b - a };
  }
  const newFindings = added.map((k) => fMap.get(k));
  const high_severity_new_count = newFindings.filter(
    (f) => String(f?.severity || '').toLowerCase() === 'high',
  ).length;
  return {
    total_findings_initial: ini.length,
    total_findings_final: fin.length,
    cleared_count: removed.length,
    new_count: added.length,
    high_severity_new_count,
    by_rule_delta,
    removed_keys: removed.slice(0, 500),
    new_findings_sample: newFindings.slice(0, 50),
  };
}

function replaceResourceFindings(findings, resourceType, resourceId, newSlice) {
  const rtl = String(resourceType || '').toLowerCase();
  const rid = String(resourceId || '');
  const rest = findings.filter(
    (f) =>
      !(
        String(f.resource_type || '').toLowerCase() === rtl &&
        String(f.resource_id || '') === rid
      ),
  );
  findings.length = 0;
  findings.push(...rest, ...(newSlice || []));
}

async function postEvaluateHtml(apiBase, courseId, headers, fixture, finding) {
  const base = String(apiBase || '').replace(/\/$/, '');
  const url = `${base}/canvas/courses/${courseId}/accessibility/evaluate-html`;
  const body = {
    resource_type: String(fixture.content_type || '').trim(),
    resource_id: String(fixture.resource_id || '').trim(),
    resource_title: finding?.resource_title,
    resource_url: finding?.resource_url ?? null,
    refetch: true,
  };
  const res = await postJson(url, headers, body);
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`evaluate-html ${res.status}: ${t.slice(0, 400)}`);
  }
  return res.json();
}

async function verifyFixWithEvaluateHtml({
  apiBase,
  courseId,
  headers,
  fixture,
  finding,
  findings,
  byResource,
  rk,
}) {
  if (process.env.QA_FIX_VERIFY === 'apply_only') {
    return {
      ok: true,
      fixNotes: 'QA_FIX_VERIFY=apply_only (no evaluate-html)',
    };
  }
  try {
    const data = await postEvaluateHtml(
      apiBase,
      courseId,
      headers,
      fixture,
      finding,
    );
    const slice = data.findings || [];
    replaceResourceFindings(
      findings,
      fixture.content_type,
      fixture.resource_id,
      slice,
    );
    syncFindingsMaps(byResource, findings);
    const rf2 = byResource.get(rk) || [];
    const ruleId = fixture.rule_id;
    const after = rf2.filter((x) => x.rule_id === ruleId).length;
    if (after > 0) {
      return {
        ok: false,
        fixNotes: `After apply, evaluate-html expected 0 ${ruleId}, got ${after}`,
      };
    }
    return { ok: true, fixNotes: 'Rule cleared (evaluate-html refetch)' };
  } catch (e) {
    return {
      ok: false,
      fixNotes: `evaluate-html: ${e instanceof Error ? e.message : String(e)}`,
    };
  }
}

function syncFindingsMaps(byResource, findings) {
  byResource.clear();
  for (const [k, v] of indexFindingsByResource(findings).entries()) {
    byResource.set(k, v);
  }
}

function indexFindingsByResource(findings) {
  const byResource = new Map();
  for (const f of findings) {
    const key = `${f.resource_type}:${f.resource_id}`;
    if (!byResource.has(key)) byResource.set(key, []);
    byResource.get(key).push(f);
  }
  return byResource;
}

function resourceKey(fixture) {
  return `${fixture.content_type}:${fixture.resource_id}`;
}

function assertZeroAiForNonAiRule(fixture, meter, fixAutoAi) {
  if (process.env.QA_ASSERT_ZERO_AI_HEURISTIC === '0') {
    return { ok: true };
  }
  if (fixAutoAi) return { ok: true };
  if (!meter || fixture.uses_ai !== false) return { ok: true };
  if (fixture.pending_heuristic) return { ok: true };
  const inT = Number(meter.input_tokens) || 0;
  const outT = Number(meter.output_tokens) || 0;
  if (inT + outT > 0) {
    return {
      ok: false,
      reason: `Expected 0 AI tokens for uses_ai=false rule; got input=${inT} output=${outT}`,
    };
  }
  return { ok: true };
}

function compareStrictBaseline(currentReport, baselinePath, fixAuto) {
  const regressions = [];
  let baseline;
  try {
    baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
      regressions: [],
      baseline_path: baselinePath,
    };
  }
  const baseById = new Map();
  for (const r of baseline.results || []) {
    if ((r.expectation_tier || 'strict') !== 'strict') continue;
    baseById.set(r.fixture_id, r);
  }
  for (const r of currentReport.results || []) {
    if ((r.expectation_tier || 'strict') !== 'strict') continue;
    const b = baseById.get(r.fixture_id);
    if (!b) continue;
    if (b.scanner_status === 'pass' && r.scanner_status !== 'pass') {
      regressions.push({
        fixture_id: r.fixture_id,
        kind: 'scanner',
        baseline: b.scanner_status,
        current: r.scanner_status,
      });
    }
    if (
      fixAuto &&
      b.fix_status === 'pass' &&
      r.fix_status !== 'pass' &&
      r.fix_status !== 'n/a' &&
      r.fix_status !== 'skip'
    ) {
      regressions.push({
        fixture_id: r.fixture_id,
        kind: 'fix',
        baseline: b.fix_status,
        current: r.fix_status,
      });
    }
  }
  return {
    ok: regressions.length === 0,
    regressions,
    baseline_path: baselinePath,
    baseline_run_id: baseline.run_id ?? null,
    compared_fixtures: baseById.size,
  };
}

function assertScannerForFixture(fixture, resourceFindings) {
  const expected =
    fixture.expected_findings || [{ rule_id: fixture.rule_id, count_min: 1, count_max: 10 }];
  let scannerOk = true;
  const notes = [];
  for (const exp of expected) {
    const ruleFindings = resourceFindings.filter((r) => r.rule_id === exp.rule_id);
    const count = ruleFindings.length;
    const min = exp.count_min ?? 1;
    const max = exp.count_max ?? 10;
    if (count < min || count > max) {
      scannerOk = false;
      notes.push(`Expected ${exp.rule_id}: ${min}-${max}, got ${count}`);
    }
  }
  if (
    resourceFindings.length === 0 &&
    expected.some((e) => (e.count_min ?? 1) > 0)
  ) {
    scannerOk = false;
    notes.push(`No findings for ${fixture.rule_id}`);
  }
  return { scannerOk, notes };
}

async function postJson(url, headers, body) {
  return fetch(url, {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

async function trySuggestedFixWithEditedChoice({
  apiBase,
  courseId,
  headers,
  fixture,
  finding,
  editedSuggestion,
}) {
  const previewUrl = `${apiBase}/canvas/courses/${courseId}/accessibility/fix-preview-item`;
  const body = {
    finding: {
      resource_type: finding.resource_type,
      resource_id: finding.resource_id,
      resource_title: finding.resource_title,
      rule_id: finding.rule_id,
      snippet: finding.snippet ?? null,
    },
  };
  const previewRes = await postJson(previewUrl, headers, body);
  if (!previewRes.ok) {
    const t = await previewRes.text();
    return {
      ok: false,
      meter: null,
      reason: `fix-preview-item ${previewRes.status}: ${t.slice(0, 300)}`,
    };
  }
  const data = await previewRes.json();
  const action = data.action;
  const meter = data.meter || null;
  if (!action) {
    return {
      ok: false,
      meter,
      reason: data.error || 'No action returned from preview',
    };
  }
  const fs = action.fix_strategy;
  if (fs !== 'suggested' && fs !== 'auto') {
    return {
      ok: false,
      meter,
      reason: `Preview fix_strategy is ${fs}, expected suggested or auto`,
    };
  }
  const choices = action.fix_choices;
  if (Array.isArray(choices) && choices.length) {
    const ok = choices.some((c) => c && c.value === editedSuggestion);
    if (!ok) {
      return {
        ok: false,
        meter,
        reason: `edited choice ${editedSuggestion} not in fix_choices`,
      };
    }
  }
  const applyUrl = `${apiBase}/canvas/courses/${courseId}/accessibility/fix-apply`;
  const applyBody = {
    actions: [
      {
        action_id: action.action_id,
        resource_type: action.resource_type,
        resource_id: action.resource_id,
        update_key: action.update_key,
        rule_id: action.rule_id,
        content_hash: action.content_hash,
        fix_strategy: action.fix_strategy,
        before_html: action.before_html,
        after_html: action.after_html,
        proposed_html: action.proposed_html,
        suggestion: action.suggestion,
        edited_suggestion: editedSuggestion,
      },
    ],
  };
  const applyRes = await postJson(applyUrl, headers, applyBody);
  if (!applyRes.ok) {
    const t = await applyRes.text();
    return {
      ok: false,
      meter,
      reason: `fix-apply ${applyRes.status}: ${t.slice(0, 300)}`,
    };
  }
  return { ok: true, meter, reason: '' };
}

async function tryAutoFixOne({
  apiBase,
  courseId,
  headers,
  fixture,
  finding,
}) {
  const previewUrl = `${apiBase}/canvas/courses/${courseId}/accessibility/fix-preview-item`;
  const body = {
    finding: {
      resource_type: finding.resource_type,
      resource_id: finding.resource_id,
      resource_title: finding.resource_title,
      rule_id: finding.rule_id,
      snippet: finding.snippet ?? null,
    },
  };
  const previewRes = await postJson(previewUrl, headers, body);
  if (!previewRes.ok) {
    const t = await previewRes.text();
    return {
      ok: false,
      meter: null,
      reason: `fix-preview-item ${previewRes.status}: ${t.slice(0, 300)}`,
    };
  }
  const data = await previewRes.json();
  const action = data.action;
  const meter = data.meter || null;
  if (!action) {
    return {
      ok: false,
      meter,
      reason: data.error || 'No action returned from preview',
    };
  }
  if (action.fix_strategy !== 'auto') {
    return {
      ok: false,
      meter,
      reason: `Preview fix_strategy is ${action.fix_strategy}, not auto`,
    };
  }
  const applyUrl = `${apiBase}/canvas/courses/${courseId}/accessibility/fix-apply`;
  const applyBody = {
    actions: [
      {
        action_id: action.action_id,
        resource_type: action.resource_type,
        resource_id: action.resource_id,
        update_key: action.update_key,
        rule_id: action.rule_id,
        content_hash: action.content_hash,
        fix_strategy: action.fix_strategy,
        before_html: action.before_html,
        after_html: action.after_html,
        proposed_html: action.proposed_html,
        suggestion: action.suggestion,
        edited_suggestion: action.edited_suggestion,
      },
    ],
  };
  const applyRes = await postJson(applyUrl, headers, applyBody);
  if (!applyRes.ok) {
    const t = await applyRes.text();
    return {
      ok: false,
      meter,
      reason: `fix-apply ${applyRes.status}: ${t.slice(0, 300)}`,
    };
  }
  return { ok: true, meter, reason: '' };
}

async function main() {
  const manifestPath =
    process.env.MANIFEST_PATH ||
    process.env.QA_MANIFEST_PATH ||
    path.join(__dirname, '..', 'test', 'fixtures', 'accessibility-qa', 'manifest.json');
  const apiBase =
    process.env.API_BASE_URL ||
    process.env.QA_API_BASE_URL ||
    'http://127.0.0.1:3002';
  let token;
  try {
    token = resolveCanvasTokenForScripts();
  } catch (e) {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  }
  let baseUrl;
  try {
    baseUrl = resolveCanvasApiBaseForScripts();
  } catch (e) {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  }
  const strictAll = process.env.QA_STRICT_ALL === '1';
  const fixAuto = process.env.QA_FIX_AUTO === '1';
  const fixAutoAi = process.env.QA_FIX_AUTO_AI === '1';

  if (!fs.existsSync(manifestPath)) {
    console.error(`Manifest not found: ${manifestPath}. Run the builder first.`);
    process.exit(1);
  }
  if (!token) {
    console.error(
      'Set exactly one Canvas token: CANVAS_ACCESS_TOKEN, CANVAS_TOKEN, or QA_CANVAS_TOKEN (Render or .env).',
    );
    process.exit(1);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const courseId = manifest.course_id;
  if (!courseId) {
    console.error('Manifest missing course_id');
    process.exit(1);
  }
  console.error(
    '[QA] manifest %s course_id=%s rebuilt_at=%s',
    manifestPath,
    courseId,
    manifest.rebuilt_at ?? 'n/a',
  );

  const report = {
    run_id: `qa-${Date.now()}`,
    timestamp: new Date().toISOString(),
    manifest_version: manifest.manifest_version,
    course_id: courseId,
    qa_fix_auto: fixAuto,
    qa_assert_zero_ai_heuristic: process.env.QA_ASSERT_ZERO_AI_HEURISTIC !== '0',
    results: [],
    by_tier: {
      strict: { pass: 0, fail: 0, skip: 0, fix_fail: 0 },
      best_effort: { pass: 0, fail: 0, skip: 0, fix_fail: 0 },
    },
    failure_domain: null,
    fix_meter_aggregate: fixAuto
      ? {
          input_tokens: 0,
          output_tokens: 0,
          cache_read_input_tokens: 0,
          cache_creation_input_tokens: 0,
        }
      : undefined,
    ai_heuristic_assert_failures: 0,
    initial_scan: null,
    final_scan: null,
    scan_compare: null,
    scan_telemetry: [],
    final_scan_skipped: false,
  };

  const headers = {
    'X-QA-Canvas-Token': token,
    'X-QA-Canvas-Url': baseUrl,
  };

  const scanTelemetry = [];
  function recordScanTelemetry(trigger, cid, scanData) {
    const summary = scanData.summary || {};
    const rec = {
      ts: new Date().toISOString(),
      trigger,
      course_id: cid,
      total_findings:
        summary.total_findings ?? (scanData.findings || []).length,
    };
    console.error(
      `[QA_SCAN] trigger=${trigger} course_id=${cid} total_findings=${rec.total_findings}`,
    );
    scanTelemetry.push(rec);
    appendScanTelemetryFile(rec);
  }

  let scanData;
  try {
    console.error(
      '[QA] Initial GET accessibility/scan loads the whole course (slow). Mid-loop: no course rescan — fixes verified with POST evaluate-html (refetch). After fixtures: second full scan by default (QA_FINAL_SCAN=0 to skip).',
    );
    scanData = await fetchScan(apiBase, courseId, headers, {
      trigger: 'initial',
    }, recordScanTelemetry);
    report.initial_scan = snapshotScan(scanData);
  } catch (e) {
    report.failure_domain = 'infrastructure';
    console.error('Scan request failed:', e instanceof Error ? e.message : e);
    console.error('Target Nest base:', apiBase);
    console.error(
      'Start API in another terminal: $env:QA_ACCESSIBILITY_ENABLED="1"; npm run start:api',
    );
    console.error(
      'Override base if needed: $env:API_BASE_URL="http://localhost:3002"',
    );
    process.exit(1);
  }

  let findings = scanData.findings || [];
  if (process.env.QA_DEBUG_SCAN === '1') {
    const keys = [
      ...new Set(
        findings.map((f) => `${f.resource_type}:${f.resource_id}`),
      ),
    ].sort();
    console.error(
      '[QA_DEBUG_SCAN] findings=%d unique_resources=%d sample_keys=%j',
      findings.length,
      keys.length,
      keys.slice(0, 30),
    );
  }

  const runManifestPass = async () => {
    const byResource = indexFindingsByResource(findings);
    let strictFixFail = 0;
    let bestEffortFixFail = 0;

    for (const fixture of manifest.fixtures || []) {
      if (fixture.skipped_reason) {
        report.results.push({
          fixture_id: fixture.fixture_id,
          rule_id: fixture.rule_id,
          content_type: fixture.content_type,
          scanner_status: 'skip',
          fix_status: 'n/a',
          notes: fixture.skipped_reason,
          expectation_tier: fixture.expectation_tier || 'strict',
        });
        const tier = fixture.expectation_tier || 'strict';
        report.by_tier[tier] = report.by_tier[tier] || {
          pass: 0,
          fail: 0,
          skip: 0,
          fix_fail: 0,
        };
        report.by_tier[tier].skip++;
        continue;
      }

      const rk = resourceKey(fixture);
      let resourceFindings = byResource.get(rk) || [];
      const tier = fixture.expectation_tier || 'strict';
      report.by_tier[tier] = report.by_tier[tier] || {
        pass: 0,
        fail: 0,
        skip: 0,
        fix_fail: 0,
      };

      if (fixture.is_clean_control) {
        const anyFinding = resourceFindings.length > 0;
        const status = anyFinding ? 'fail' : 'pass';
        report.results.push({
          fixture_id: fixture.fixture_id,
          rule_id: 'clean_control',
          content_type: fixture.content_type,
          scanner_status: status,
          fix_status: 'n/a',
          notes: anyFinding
            ? `False positive: ${resourceFindings.length} finding(s)`
            : 'No false positives',
          expectation_tier: tier,
        });
        if (status === 'fail') report.by_tier[tier].fail++;
        else report.by_tier[tier].pass++;
        continue;
      }

      let { scannerOk, notes } = assertScannerForFixture(
        fixture,
        resourceFindings,
      );
      if (
        !scannerOk &&
        (fixture.broken_link_url || fixture.rule_id === 'link_broken')
      ) {
        const retries = Math.max(
          2,
          Number(process.env.QA_LINK_SCAN_RETRIES) || 3,
        );
        const hint = resourceFindings[0] || {
          resource_title: undefined,
          resource_url: null,
        };
        for (let a = 1; a < retries && !scannerOk; a++) {
          await new Promise((r) => setTimeout(r, 1500));
          try {
            const ev = await postEvaluateHtml(
              apiBase,
              courseId,
              headers,
              fixture,
              hint,
            );
            replaceResourceFindings(
              findings,
              fixture.content_type,
              fixture.resource_id,
              ev.findings || [],
            );
            syncFindingsMaps(byResource, findings);
            resourceFindings = byResource.get(rk) || [];
            const again = assertScannerForFixture(fixture, resourceFindings);
            scannerOk = again.scannerOk;
            notes = again.notes;
          } catch {
            continue;
          }
        }
      }
      const status = scannerOk ? 'pass' : 'fail';
      let fixStatus = 'n/a';
      let fixNotes = '';
      let previewMeter = null;

      if (fixAuto && scannerOk) {
        const dualChoice =
          typeof fixture.dual_option_choice === 'string'
            ? fixture.dual_option_choice.trim()
            : '';

        if (
          fixture.rule_id === 'link_broken' &&
          typeof fixture.correct_link_href === 'string' &&
          fixture.correct_link_href.trim()
        ) {
          const match = resourceFindings.find((x) => x.rule_id === 'link_broken');
          if (!match) {
            fixStatus = 'skip';
            fixNotes = 'No link_broken finding for teacher URL fix';
          } else {
            const fixResult = await trySuggestedFixWithEditedChoice({
              apiBase,
              courseId,
              headers,
              fixture,
              finding: match,
              editedSuggestion: fixture.correct_link_href.trim(),
            });
            previewMeter = fixResult.meter;
            if (previewMeter && report.fix_meter_aggregate) {
              report.fix_meter_aggregate.input_tokens +=
                Number(previewMeter.input_tokens) || 0;
              report.fix_meter_aggregate.output_tokens +=
                Number(previewMeter.output_tokens) || 0;
              report.fix_meter_aggregate.cache_read_input_tokens +=
                Number(previewMeter.cache_read_input_tokens) || 0;
              report.fix_meter_aggregate.cache_creation_input_tokens +=
                Number(previewMeter.cache_creation_input_tokens) || 0;
            }
            const aiChk = assertZeroAiForNonAiRule(fixture, previewMeter, fixAutoAi);
            if (!aiChk.ok) {
              fixStatus = 'fail';
              fixNotes = aiChk.reason || 'AI heuristic assert failed';
              report.ai_heuristic_assert_failures += 1;
              report.by_tier[tier].fix_fail++;
              if (tier === 'strict') strictFixFail++;
              else bestEffortFixFail++;
            } else if (!fixResult.ok) {
              fixStatus = 'fail';
              fixNotes = fixResult.reason;
              report.by_tier[tier].fix_fail++;
              if (tier === 'strict') strictFixFail++;
              else bestEffortFixFail++;
            } else {
              const v = await verifyFixWithEvaluateHtml({
                apiBase,
                courseId,
                headers,
                fixture,
                finding: match,
                findings,
                byResource,
                rk,
              });
              if (!v.ok) {
                fixStatus = 'fail';
                fixNotes = v.fixNotes;
                report.by_tier[tier].fix_fail++;
                if (tier === 'strict') strictFixFail++;
                else bestEffortFixFail++;
              } else {
                fixStatus = 'pass';
                fixNotes = v.fixNotes;
              }
            }
          }
        } else if (fixture.dual_option && dualChoice) {
          const match = resourceFindings.find((x) => x.rule_id === fixture.rule_id);
          if (!match) {
            fixStatus = 'skip';
            fixNotes = 'No matching finding for dual-option fix';
          } else {
            const fixResult = await trySuggestedFixWithEditedChoice({
              apiBase,
              courseId,
              headers,
              fixture,
              finding: match,
              editedSuggestion: dualChoice,
            });
            previewMeter = fixResult.meter;
            if (previewMeter && report.fix_meter_aggregate) {
              report.fix_meter_aggregate.input_tokens +=
                Number(previewMeter.input_tokens) || 0;
              report.fix_meter_aggregate.output_tokens +=
                Number(previewMeter.output_tokens) || 0;
              report.fix_meter_aggregate.cache_read_input_tokens +=
                Number(previewMeter.cache_read_input_tokens) || 0;
              report.fix_meter_aggregate.cache_creation_input_tokens +=
                Number(previewMeter.cache_creation_input_tokens) || 0;
            }
            const aiChkDual = assertZeroAiForNonAiRule(
              fixture,
              previewMeter,
              fixAutoAi,
            );
            if (!aiChkDual.ok) {
              fixStatus = 'fail';
              fixNotes = aiChkDual.reason || 'AI heuristic assert failed';
              report.ai_heuristic_assert_failures += 1;
              report.by_tier[tier].fix_fail++;
              if (tier === 'strict') strictFixFail++;
              else bestEffortFixFail++;
            } else if (!fixResult.ok) {
              fixStatus = 'fail';
              fixNotes = fixResult.reason;
              report.by_tier[tier].fix_fail++;
              if (tier === 'strict') strictFixFail++;
              else bestEffortFixFail++;
            } else {
              const v = await verifyFixWithEvaluateHtml({
                apiBase,
                courseId,
                headers,
                fixture,
                finding: match,
                findings,
                byResource,
                rk,
              });
              if (!v.ok) {
                fixStatus = 'fail';
                fixNotes = v.fixNotes;
                report.by_tier[tier].fix_fail++;
                if (tier === 'strict') strictFixFail++;
                else bestEffortFixFail++;
              } else {
                fixStatus = 'pass';
                fixNotes = v.fixNotes;
              }
            }
          }
        } else if (fixture.fix_strategy === 'auto' && !fixture.dual_option) {
          if (fixture.uses_ai && !fixAutoAi) {
            fixStatus = 'skip';
            fixNotes = 'uses_ai (set QA_FIX_AUTO_AI=1 to attempt)';
          } else {
            const match = resourceFindings.find((x) => x.rule_id === fixture.rule_id);
            if (!match) {
              fixStatus = 'skip';
              fixNotes = 'No matching finding for fix';
            } else {
              const fixResult = await tryAutoFixOne({
                apiBase,
                courseId,
                headers,
                fixture,
                finding: match,
              });
              previewMeter = fixResult.meter;
              if (previewMeter && report.fix_meter_aggregate) {
                report.fix_meter_aggregate.input_tokens +=
                  Number(previewMeter.input_tokens) || 0;
                report.fix_meter_aggregate.output_tokens +=
                  Number(previewMeter.output_tokens) || 0;
                report.fix_meter_aggregate.cache_read_input_tokens +=
                  Number(previewMeter.cache_read_input_tokens) || 0;
                report.fix_meter_aggregate.cache_creation_input_tokens +=
                  Number(previewMeter.cache_creation_input_tokens) || 0;
              }
              const aiChkAuto = assertZeroAiForNonAiRule(
                fixture,
                previewMeter,
                fixAutoAi,
              );
              if (!aiChkAuto.ok) {
                fixStatus = 'fail';
                fixNotes = aiChkAuto.reason || 'AI heuristic assert failed';
                report.ai_heuristic_assert_failures += 1;
                report.by_tier[tier].fix_fail++;
                if (tier === 'strict') strictFixFail++;
                else bestEffortFixFail++;
              } else if (!fixResult.ok) {
                fixStatus = 'fail';
                fixNotes = fixResult.reason;
                report.by_tier[tier].fix_fail++;
                if (tier === 'strict') strictFixFail++;
                else bestEffortFixFail++;
              } else {
                const v = await verifyFixWithEvaluateHtml({
                  apiBase,
                  courseId,
                  headers,
                  fixture,
                  finding: match,
                  findings,
                  byResource,
                  rk,
                });
                if (!v.ok) {
                  fixStatus = 'fail';
                  fixNotes = v.fixNotes;
                  report.by_tier[tier].fix_fail++;
                  if (tier === 'strict') strictFixFail++;
                  else bestEffortFixFail++;
                } else {
                  fixStatus = 'pass';
                  fixNotes = v.fixNotes;
                }
              }
            }
          }
        } else if (fixture.dual_option && !dualChoice) {
          fixStatus = 'skip';
          fixNotes = 'dual_option (add dual_option_choice to fixture)';
        } else if (fixture.fix_strategy && fixture.fix_strategy !== 'auto') {
          fixStatus = 'skip';
          fixNotes = `fix_strategy ${fixture.fix_strategy}`;
        }
      }

      report.results.push({
        fixture_id: fixture.fixture_id,
        rule_id: fixture.rule_id,
        content_type: fixture.content_type,
        scanner_status: status,
        fix_status: fixStatus,
        notes: [notes.join('; ') || (scannerOk ? 'OK' : 'Assertion failed'), fixNotes]
          .filter(Boolean)
          .join(' | '),
        expectation_tier: tier,
        preview_meter: previewMeter || undefined,
      });
      if (status === 'pass') report.by_tier[tier].pass++;
      else report.by_tier[tier].fail++;
    }

    return { strictFixFail, bestEffortFixFail };
  };

  const { strictFixFail, bestEffortFixFail } = await runManifestPass();

  report.scan_telemetry = scanTelemetry;

  const finalScanEnabled = process.env.QA_FINAL_SCAN !== '0';
  if (finalScanEnabled) {
    try {
      const finalScanData = await fetchScan(
        apiBase,
        courseId,
        headers,
        { trigger: 'final' },
        recordScanTelemetry,
      );
      report.final_scan = snapshotScan(finalScanData);
      if (report.initial_scan && report.final_scan) {
        report.scan_compare = buildScanCompare(
          report.initial_scan.findings,
          report.final_scan.findings,
        );
        const h = report.scan_compare.high_severity_new_count || 0;
        if (h > 0) {
          console.error(
            '[QA] scan_compare: new high-severity findings vs initial: %d (see report.scan_compare.new_findings_sample)',
            h,
          );
        }
      }
    } catch (e) {
      report.final_scan = null;
      report.scan_compare = null;
      report.final_scan_error = e instanceof Error ? e.message : String(e);
      if (!report.failure_domain) report.failure_domain = 'infrastructure';
      console.error('[QA] Final scan failed:', report.final_scan_error);
    }
  } else {
    report.final_scan_skipped = true;
    report.final_scan = null;
    report.scan_compare = null;
  }

  const baselinePathRaw =
    process.env.QA_BASELINE_REPORT || process.env.QA_BASELINE_PATH || '';
  const baselinePath = String(baselinePathRaw || '').trim();
  let baselineCompare = null;
  let baselineFail = 0;
  if (baselinePath) {
    baselineCompare = compareStrictBaseline(report, baselinePath, fixAuto);
    report.baseline_compare = baselineCompare;
    if (baselineCompare.error) {
      baselineFail = 1;
      console.error('[QA] Baseline file error:', baselineCompare.error);
    } else if (!baselineCompare.ok) {
      baselineFail = baselineCompare.regressions.length;
      console.error(
        '[QA] Baseline regressions vs',
        baselinePath,
        ':',
        baselineCompare.regressions,
      );
    } else {
      console.log(
        '[QA] Baseline OK (%d strict fixtures compared): %s',
        baselineCompare.compared_fixtures,
        baselinePath,
      );
    }
  }

  const outPath =
    process.env.QA_REPORT_PATH ||
    path.join(__dirname, '..', 'test', 'fixtures', 'accessibility-qa', `report-${report.run_id}.json`);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf8');

  const strictFail = report.by_tier.strict?.fail ?? 0;
  const bestEffortFail = report.by_tier.best_effort?.fail ?? 0;
  const exitFail =
    (strictAll ? strictFail + bestEffortFail : strictFail) +
    strictFixFail +
    (strictAll ? bestEffortFixFail : 0) +
    baselineFail;

  console.log('QA Report:', outPath);
  console.log(
    'Strict:  pass=%d fail=%d skip=%d fix_fail=%d',
    report.by_tier.strict?.pass ?? 0,
    report.by_tier.strict?.fail ?? 0,
    report.by_tier.strict?.skip ?? 0,
    report.by_tier.strict?.fix_fail ?? 0,
  );
  console.log(
    'Best-effort: pass=%d fail=%d skip=%d fix_fail=%d',
    report.by_tier.best_effort?.pass ?? 0,
    report.by_tier.best_effort?.fail ?? 0,
    report.by_tier.best_effort?.skip ?? 0,
    report.by_tier.best_effort?.fix_fail ?? 0,
  );
  if (fixAuto && (report.ai_heuristic_assert_failures || 0) > 0) {
    console.error(
      'AI heuristic token assertions failed: %d (set QA_ASSERT_ZERO_AI_HEURISTIC=0 to disable)',
      report.ai_heuristic_assert_failures,
    );
  }
  if (exitFail > 0) {
    console.error(
      'Failures:',
      report.results.filter(
        (r) => r.scanner_status === 'fail' || r.fix_status === 'fail',
      ),
    );
    if (fixAuto && strictFail > 0 && strictFixFail === 0) {
      const ini =
        report.initial_scan?.summary?.total_findings ??
        (Array.isArray(report.initial_scan?.findings)
          ? report.initial_scan.findings.length
          : null);
      console.error(
        '[QA] Scanner failed but fix_fail=0: strict rows expected violations that were missing on the initial scan (initial total_findings=%s). Re-seed: npm run qa:accessibility:build:force, confirm this run logs the same course_id as manifest.json, then one runner command. If total_findings stays low after build, check builder output for Canvas errors. RUNBOOK §2.1.',
        ini == null ? 'n/a' : String(ini),
      );
    }
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
