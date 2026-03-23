#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

async function main() {
  const manifestPath =
    process.env.MANIFEST_PATH ||
    process.env.QA_MANIFEST_PATH ||
    path.join(__dirname, '..', 'test', 'fixtures', 'accessibility-qa', 'manifest.json');
  const apiBase = process.env.API_BASE_URL || process.env.QA_API_BASE_URL || 'http://localhost:3002';
  const token = process.env.CANVAS_TOKEN || process.env.QA_CANVAS_TOKEN;
  const baseUrl = process.env.CANVAS_BASE_URL || process.env.QA_CANVAS_BASE_URL;
  const strictAll = process.env.QA_STRICT_ALL === '1';

  if (!fs.existsSync(manifestPath)) {
    console.error(`Manifest not found: ${manifestPath}. Run the builder first.`);
    process.exit(1);
  }
  if (!token || !baseUrl) {
    console.error('Set CANVAS_TOKEN and CANVAS_BASE_URL (or QA_* equivalents)');
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
    results: [],
    by_rule: {},
    by_tier: { strict: { pass: 0, fail: 0, skip: 0 }, best_effort: { pass: 0, fail: 0, skip: 0 } },
    failure_domain: null,
  };

  const scanUrl = `${apiBase}/canvas/courses/${courseId}/accessibility/scan`;
  const headers = {
    'X-QA-Canvas-Token': token,
    'X-QA-Canvas-Url': baseUrl,
  };

  let scanRes;
  try {
    scanRes = await fetch(scanUrl, { headers, credentials: 'include' });
  } catch (e) {
    report.failure_domain = 'infrastructure';
    console.error('Scan request failed:', e.message);
    console.error('Is the app running with QA_ACCESSIBILITY_ENABLED=1?');
    process.exit(1);
  }

  if (!scanRes.ok) {
    const text = await scanRes.text();
    console.error(`Scan failed ${scanRes.status}: ${text.slice(0, 400)}`);
    report.failure_domain = 'infrastructure';
    if (scanRes.status === 401) {
      console.error('Ensure QA_ACCESSIBILITY_ENABLED=1 and token/url headers are accepted.');
    }
    process.exit(1);
  }

  const scanData = await scanRes.json();
  const findings = scanData.findings || [];
  const findingsByResource = new Map();
  for (const f of findings) {
    const key = `${f.resource_type}:${f.resource_id}`;
    if (!findingsByResource.has(key)) findingsByResource.set(key, []);
    findingsByResource.get(key).push(f);
  }

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
      report.by_tier[tier] = report.by_tier[tier] || { pass: 0, fail: 0, skip: 0 };
      report.by_tier[tier].skip++;
      continue;
    }

    const resourceKey = `${fixture.content_type === 'pages' ? 'pages' : fixture.content_type}:${fixture.resource_id}`;
    const resourceFindings = findingsByResource.get(resourceKey) || [];
    const tier = fixture.expectation_tier || 'strict';
    report.by_tier[tier] = report.by_tier[tier] || { pass: 0, fail: 0, skip: 0 };

    if (fixture.is_clean_control) {
      const anyFinding = resourceFindings.length > 0;
      const status = anyFinding ? 'fail' : 'pass';
      report.results.push({
        fixture_id: fixture.fixture_id,
        rule_id: 'clean_control',
        content_type: fixture.content_type,
        scanner_status: status,
        fix_status: 'n/a',
        notes: anyFinding ? `False positive: ${resourceFindings.length} finding(s)` : 'No false positives',
        expectation_tier: tier,
      });
      if (status === 'fail') report.by_tier[tier].fail++;
      else report.by_tier[tier].pass++;
      continue;
    }

    const expected = fixture.expected_findings || [{ rule_id: fixture.rule_id, count_min: 1, count_max: 10 }];
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
    if (resourceFindings.length === 0 && expected.some((e) => (e.count_min ?? 1) > 0)) {
      scannerOk = false;
      notes.push(`No findings for ${fixture.rule_id}`);
    }

    const status = scannerOk ? 'pass' : 'fail';
    report.results.push({
      fixture_id: fixture.fixture_id,
      rule_id: fixture.rule_id,
      content_type: fixture.content_type,
      scanner_status: status,
      fix_status: 'n/a',
      notes: notes.join('; ') || (scannerOk ? 'OK' : 'Assertion failed'),
      expectation_tier: tier,
    });
    if (status === 'pass') report.by_tier[tier].pass++;
    else report.by_tier[tier].fail++;
  }

  const outPath =
    process.env.QA_REPORT_PATH ||
    path.join(__dirname, '..', 'test', 'fixtures', 'accessibility-qa', `report-${report.run_id}.json`);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf8');

  const strictFail = report.by_tier.strict?.fail ?? 0;
  const bestEffortFail = report.by_tier.best_effort?.fail ?? 0;
  const exitFail = strictAll ? strictFail + bestEffortFail : strictFail;

  console.log('QA Report:', outPath);
  console.log('Strict:  pass=%d fail=%d skip=%d', report.by_tier.strict?.pass ?? 0, report.by_tier.strict?.fail ?? 0, report.by_tier.strict?.skip ?? 0);
  console.log('Best-effort: pass=%d fail=%d skip=%d', report.by_tier.best_effort?.pass ?? 0, report.by_tier.best_effort?.fail ?? 0, report.by_tier.best_effort?.skip ?? 0);
  if (exitFail > 0) {
    console.error('Failures:', report.results.filter((r) => r.scanner_status === 'fail'));
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
