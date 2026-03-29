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

const FIXTURES_DIR = path.join(__dirname, '..', 'test', 'fixtures', 'bulk-editor-qa');

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function buildContext(manifest) {
  const r = manifest.resources || {};
  return {
    course_id: String(manifest.course_id),
    ...r,
  };
}

function substituteString(s, ctx) {
  let out = String(s);
  for (const [k, v] of Object.entries(ctx)) {
    if (v === undefined || v === null) continue;
    out = out.split(`{${k}}`).join(String(v));
  }
  if (/\{[^}]+\}/.test(out)) {
    throw new Error(`Unresolved template placeholder in: ${out.slice(0, 200)}`);
  }
  return out;
}

function substituteDeep(obj, ctx) {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') return substituteString(obj, ctx);
  if (Array.isArray(obj)) return obj.map((x) => substituteDeep(x, ctx));
  if (typeof obj === 'object') {
    const o = {};
    for (const [k, v] of Object.entries(obj)) {
      o[k] = substituteDeep(v, ctx);
    }
    return o;
  }
  return obj;
}

function applyPathEncoding(pathAfterSubstitute) {
  const m = pathAfterSubstitute.match(/^(\/canvas\/courses\/[^/]+)\/pages\/(.+)$/);
  if (m) return `${m[1]}/pages/${encodeURIComponent(m[2])}`;
  const m2 = pathAfterSubstitute.match(/^(\/canvas\/courses\/[^/]+)\/pages\/(.+)\/revisions$/);
  if (m2) return `${m2[1]}/pages/${encodeURIComponent(m2[2])}/revisions`;
  return pathAfterSubstitute;
}

function assertNoAccreditation(p) {
  if (p.includes('/accreditation/') || p.includes('/accreditation')) {
    throw new Error(`Blocked accreditation path: ${p}`);
  }
}

function bulkResultsAllSuccess(bodyText) {
  let data;
  try {
    data = JSON.parse(bodyText);
  } catch {
    return { ok: true, note: 'non-json' };
  }
  if (!Array.isArray(data)) return { ok: true, note: 'not-array' };
  const bad = data.filter((row) => row && row.success === false);
  if (bad.length) return { ok: false, note: `${bad.length} row(s) failed` };
  return { ok: true };
}

async function main() {
  const manifestPath =
    process.env.MANIFEST_PATH ||
    process.env.QA_BULK_MANIFEST_PATH ||
    path.join(FIXTURES_DIR, 'manifest.json');
  const fixturesPath =
    process.env.FIXTURES_PATH ||
    process.env.QA_BULK_FIXTURES_PATH ||
    path.join(FIXTURES_DIR, 'fixtures.json');
  const apiBase = String(
    process.env.API_BASE_URL || process.env.QA_API_BASE_URL || 'http://127.0.0.1:3002',
  ).replace(/\/$/, '');
  const includeSafeWrite = process.env.QA_BULK_INCLUDE_SAFE_WRITE === '1';
  const allowMutations = process.env.QA_BULK_ALLOW_MUTATIONS === '1';
  const delayMs = Math.max(0, Number(process.env.QA_BULK_DELAY_MS || '0') || 0);

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
  if (!token) {
    console.error('Set Canvas token (CANVAS_ACCESS_TOKEN / CANVAS_TOKEN / QA_CANVAS_TOKEN).');
    process.exit(1);
  }
  if (!fs.existsSync(manifestPath)) {
    console.error(`Manifest not found: ${manifestPath}. Run npm run qa:bulk:build first.`);
    process.exit(1);
  }
  if (!fs.existsSync(fixturesPath)) {
    console.error(`Fixtures not found: ${fixturesPath}`);
    process.exit(1);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const { cases = [] } = JSON.parse(fs.readFileSync(fixturesPath, 'utf8'));
  const courseId = manifest.course_id;
  if (!courseId) {
    console.error('Manifest missing course_id');
    process.exit(1);
  }

  const ctx = buildContext(manifest);
  console.error(
    '[QA_BULK] manifest %s course_id=%s rebuilt_at=%s',
    manifestPath,
    courseId,
    manifest.rebuilt_at ?? 'n/a',
  );

  const headers = {
    'X-QA-Canvas-Token': token,
    'X-QA-Canvas-Url': baseUrl,
    'Content-Type': 'application/json',
  };

  const report = {
    run_id: `bulk-qa-${Date.now()}`,
    timestamp: new Date().toISOString(),
    manifest_version: manifest.manifest_version,
    course_id: courseId,
    include_safe_write: includeSafeWrite,
    allow_mutations: allowMutations,
    results: [],
    summary: { pass: 0, fail: 0, skip: 0 },
  };

  for (const c of cases) {
    const tier = c.tier || 'read_only';
    if (tier === 'safe_write' && !includeSafeWrite) {
      report.results.push({
        fixture_id: c.fixture_id,
        status: 'skip',
        notes: 'tier safe_write (set QA_BULK_INCLUDE_SAFE_WRITE=1)',
      });
      report.summary.skip++;
      continue;
    }
    if (tier === 'destructive' && !allowMutations) {
      report.results.push({
        fixture_id: c.fixture_id,
        status: 'skip',
        notes: 'tier destructive (set QA_BULK_ALLOW_MUTATIONS=1)',
      });
      report.summary.skip++;
      continue;
    }
    const method = String(c.method || 'GET').toUpperCase();
    if ((method === 'POST' || method === 'DELETE') && !allowMutations) {
      report.results.push({
        fixture_id: c.fixture_id,
        status: 'skip',
        notes: `${method} requires QA_BULK_ALLOW_MUTATIONS=1`,
      });
      report.summary.skip++;
      continue;
    }

    let relPath;
    try {
      relPath = substituteString(c.path_template, ctx);
      relPath = applyPathEncoding(relPath);
      assertNoAccreditation(relPath);
    } catch (e) {
      report.results.push({
        fixture_id: c.fixture_id,
        status: 'fail',
        notes: e instanceof Error ? e.message : String(e),
      });
      report.summary.fail++;
      continue;
    }

    const url = `${apiBase}${relPath}`;
    let bodyStr;
    if (c.body_template != null && method !== 'GET' && method !== 'HEAD') {
      const bodyObj = substituteDeep(c.body_template, ctx);
      if (Array.isArray(bodyObj.itemIds) && !relPath.includes('/pages/_bulk/')) {
        bodyObj.itemIds = bodyObj.itemIds.map((id) => {
          const n = Number(id);
          return Number.isFinite(n) ? n : id;
        });
      }
      bodyStr = JSON.stringify(bodyObj);
    }

    try {
      const res = await fetch(url, {
        method,
        headers: headersForMethod(method),
        body: bodyStr,
      });
      const text = await res.text();
      const expectStatus = Number(c.expect_status) || 200;
      const statusOk = res.status === expectStatus;
      let innerOk = true;
      let innerNote = '';
      if (statusOk && text && method === 'PUT' && relPath.includes('/_bulk/update')) {
        const br = bulkResultsAllSuccess(text);
        innerOk = br.ok;
        innerNote = br.note || '';
      }
      const ok = statusOk && innerOk;
      report.results.push({
        fixture_id: c.fixture_id,
        method,
        path: relPath,
        status: ok ? 'pass' : 'fail',
        http_status: res.status,
        expected_status: expectStatus,
        notes: ok
          ? innerNote || 'ok'
          : !statusOk
            ? `HTTP ${res.status}, expected ${expectStatus}: ${text.slice(0, 240)}`
            : `Bulk partial failure: ${innerNote} ${text.slice(0, 200)}`,
      });
      if (ok) report.summary.pass++;
      else report.summary.fail++;
    } catch (e) {
      report.results.push({
        fixture_id: c.fixture_id,
        method,
        path: relPath,
        status: 'fail',
        notes: e instanceof Error ? e.message : String(e),
      });
      report.summary.fail++;
    }

    if (delayMs) await sleep(delayMs);
  }

  const outPath =
    process.env.QA_BULK_REPORT_PATH ||
    path.join(FIXTURES_DIR, `report-bulk-qa-${report.run_id}.json`);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf8');

  console.log('Bulk QA report:', outPath);
  console.log(
    'Summary: pass=%d fail=%d skip=%d',
    report.summary.pass,
    report.summary.fail,
    report.summary.skip,
  );

  if (report.summary.fail > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
