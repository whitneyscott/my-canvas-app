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

async function fetchScan(apiBase, courseId, headers) {
  const base = String(apiBase || '').replace(/\/$/, '');
  const scanUrl = `${base}/canvas/courses/${courseId}/accessibility/scan`;
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
  return scanRes.json();
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
  const token = resolveCanvasTokenForScripts();
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
      'Set CANVAS_ACCESS_TOKEN, CANVAS_TOKEN, or QA_CANVAS_TOKEN',
    );
    process.exit(1);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const courseId = manifest.course_id;
  if (!courseId) {
    console.error('Manifest missing course_id');
    process.exit(1);
  }

  const report = {
    run_id: `qa-${Date.now()}`,
    timestamp: new Date().toISOString(),
    manifest_version: manifest.manifest_version,
    course_id: courseId,
    qa_fix_auto: fixAuto,
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
  };

  const headers = {
    'X-QA-Canvas-Token': token,
    'X-QA-Canvas-Url': baseUrl,
  };

  let scanData;
  try {
    scanData = await fetchScan(apiBase, courseId, headers);
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
        for (let a = 1; a < retries && !scannerOk; a++) {
          await new Promise((r) => setTimeout(r, 1500));
          try {
            scanData = await fetchScan(apiBase, courseId, headers);
          } catch {
            continue;
          }
          findings = scanData.findings || [];
          const br = indexFindingsByResource(findings);
          byResource.clear();
          for (const [k, v] of br.entries()) {
            byResource.set(k, v);
          }
          resourceFindings = byResource.get(rk) || [];
          const again = assertScannerForFixture(fixture, resourceFindings);
          scannerOk = again.scannerOk;
          notes = again.notes;
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

        if (fixture.dual_option && dualChoice) {
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
            if (!fixResult.ok) {
              fixStatus = 'fail';
              fixNotes = fixResult.reason;
              report.by_tier[tier].fix_fail++;
              if (tier === 'strict') strictFixFail++;
              else bestEffortFixFail++;
            } else {
              scanData = await fetchScan(apiBase, courseId, headers);
              findings = scanData.findings || [];
              const br2 = indexFindingsByResource(findings);
              const rf2 = br2.get(rk) || [];
              const after = rf2.filter((x) => x.rule_id === fixture.rule_id).length;
              if (after > 0) {
                fixStatus = 'fail';
                fixNotes = `After apply, expected 0 findings for ${fixture.rule_id}, got ${after}`;
                report.by_tier[tier].fix_fail++;
                if (tier === 'strict') strictFixFail++;
                else bestEffortFixFail++;
              } else {
                fixStatus = 'pass';
                fixNotes = 'Rule cleared on resource after apply (dual_option_choice)';
              }
              byResource.clear();
              for (const [k, v] of indexFindingsByResource(findings).entries()) {
                byResource.set(k, v);
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
              if (!fixResult.ok) {
                fixStatus = 'fail';
                fixNotes = fixResult.reason;
                report.by_tier[tier].fix_fail++;
                if (tier === 'strict') strictFixFail++;
                else bestEffortFixFail++;
              } else {
                scanData = await fetchScan(apiBase, courseId, headers);
                findings = scanData.findings || [];
                const br2 = indexFindingsByResource(findings);
                const rf2 = br2.get(rk) || [];
                const after = rf2.filter((x) => x.rule_id === fixture.rule_id).length;
                if (after > 0) {
                  fixStatus = 'fail';
                  fixNotes = `After apply, expected 0 findings for ${fixture.rule_id}, got ${after}`;
                  report.by_tier[tier].fix_fail++;
                  if (tier === 'strict') strictFixFail++;
                  else bestEffortFixFail++;
                } else {
                  fixStatus = 'pass';
                  fixNotes = 'Rule cleared on resource after apply';
                }
                byResource.clear();
                for (const [k, v] of indexFindingsByResource(findings).entries()) {
                  byResource.set(k, v);
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
    (strictAll ? bestEffortFixFail : 0);

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
  if (exitFail > 0) {
    console.error(
      'Failures:',
      report.results.filter(
        (r) => r.scanner_status === 'fail' || r.fix_status === 'fail',
      ),
    );
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
