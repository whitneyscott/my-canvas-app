#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const {
  loadFixabilityMapFromDist,
  enrichFixtureRegistryFields,
  resolveCanvasApiBaseForScripts,
  resolveCanvasTokenForScripts,
} = require('./accessibility-qa-helpers');

const QA_COURSE_NAME = '[QA][A11y] Automated Fixtures';
const QA_COURSE_CODE = 'QA-A11Y-FIX';

async function canvasFetch(baseUrl, token, pathname, options = {}) {
  const url = baseUrl.replace(/\/$/, '') + pathname;
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`Canvas API ${res.status}: ${text.slice(0, 300)}`);
  }
  return res;
}

async function findOrCreateCourse(baseUrl, token) {
  const listRes = await canvasFetch(baseUrl, token, '/courses?per_page=100&include[]=course_image');
  const courses = await listRes.json();
  const existing = Array.isArray(courses)
    ? courses.find((c) => c.course_code === QA_COURSE_CODE || c.name === QA_COURSE_NAME)
    : null;
  if (existing) {
    return existing.id;
  }
  const accountRes = await canvasFetch(baseUrl, token, '/accounts');
  const accounts = await accountRes.json();
  const accountId = Array.isArray(accounts) && accounts[0] ? accounts[0].id : 1;
  const createRes = await canvasFetch(baseUrl, token, `/accounts/${accountId}/courses`, {
    method: 'POST',
    body: JSON.stringify({
      course: {
        name: QA_COURSE_NAME,
        course_code: QA_COURSE_CODE,
        is_public: false,
      },
    }),
  });
  const created = await createRes.json();
  if (created.id) return created.id;
  throw new Error('Failed to create QA course');
}

async function createOrUpdatePage(baseUrl, token, courseId, wikiPageUrl, body, title) {
  const wikiPageUrlEnc = encodeURIComponent(wikiPageUrl);
  const getRes = await fetch(
    `${baseUrl.replace(/\/$/, '')}/courses/${courseId}/pages/${wikiPageUrlEnc}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const editBody = { wiki_page: { body, title: title || wikiPageUrl } };
  if (getRes.ok) {
    const putRes = await canvasFetch(baseUrl, token, `/courses/${courseId}/pages/${wikiPageUrlEnc}`, {
      method: 'PUT',
      body: JSON.stringify(editBody),
    });
    const page = await putRes.json();
    return { resource_id: String(page.page_id || page.url || wikiPageUrl), update_key: page.url || wikiPageUrl };
  }
  const postRes = await canvasFetch(baseUrl, token, `/courses/${courseId}/pages`, {
    method: 'POST',
    body: JSON.stringify({ wiki_page: { ...editBody.wiki_page, url: wikiPageUrl } }),
  });
  const page = await postRes.json();
  return { resource_id: String(page.page_id || page.url || wikiPageUrl), update_key: page.url || wikiPageUrl };
}

async function createOrUpdateAssignment(baseUrl, token, courseId, name, description) {
  const listRes = await canvasFetch(baseUrl, token, `/courses/${courseId}/assignments?per_page=100&search_term=${encodeURIComponent(name)}`);
  const assignments = await listRes.json();
  const existing = Array.isArray(assignments) ? assignments.find((a) => a.name === name) : null;
  const payload = { assignment: { name, description, submission_types: ['none'] } };
  if (existing) {
    const putRes = await canvasFetch(baseUrl, token, `/courses/${courseId}/assignments/${existing.id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    const a = await putRes.json();
    return { resource_id: String(a.id) };
  }
  const postRes = await canvasFetch(baseUrl, token, `/courses/${courseId}/assignments`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  const a = await postRes.json();
  return { resource_id: String(a.id) };
}

async function main() {
  const token = resolveCanvasTokenForScripts();
  const baseUrl = resolveCanvasApiBaseForScripts();
  if (!token) {
    console.error(
      'Set CANVAS_ACCESS_TOKEN, CANVAS_TOKEN, or QA_CANVAS_TOKEN',
    );
    process.exit(1);
  }
  const fixturesPath = path.join(__dirname, '..', 'test', 'fixtures', 'accessibility-qa', 'fixtures.json');
  const fixturesData = JSON.parse(fs.readFileSync(fixturesPath, 'utf8'));
  const rawFixtures = fixturesData.fixtures || [];
  const fixabilityMap = loadFixabilityMapFromDist();
  const courseId = await findOrCreateCourse(baseUrl, token);
  console.log(`Using course ${courseId} (${QA_COURSE_NAME})`);

  const manifest = {
    manifest_version: '1.0',
    builder_version: '1.0.0',
    canvas_base_url: baseUrl.replace(/\/api\/v1\/?$/, ''),
    course_id: courseId,
    course_name: QA_COURSE_NAME,
    course_code: QA_COURSE_CODE,
    created_at: new Date().toISOString(),
    rebuilt_at: new Date().toISOString(),
    rebuild_reason: 'script run',
    registry_rule_count: Object.keys(fixabilityMap).length,
    fixtures: [],
  };

  for (const f of rawFixtures) {
    const ruleId = f.rule_id || 'clean_control';
    const entry = {
      fixture_id: f.fixture_id,
      rule_id: ruleId,
      content_type: f.content_type,
      canvas_resource_type: f.content_type === 'pages' ? 'wiki_page' : f.content_type === 'assignments' ? 'assignment' : f.content_type,
      resource_id: null,
      location_hint: f.location_hint,
      injection_method: 'api_html',
      expected_findings: f.is_clean_control ? [] : [{ rule_id: ruleId, count_min: 1, count_max: 10 }],
      expectation_tier: f.expectation_tier || 'strict',
      is_clean_control: !!f.is_clean_control,
    };
    if (!f.is_clean_control) {
      const reg = enrichFixtureRegistryFields(ruleId, fixabilityMap);
      entry.fix_strategy = reg.fix_strategy;
      entry.uses_ai = reg.uses_ai;
      entry.is_image_rule = reg.is_image_rule;
      entry.uses_second_stage_ai = reg.uses_second_stage_ai;
      if (reg.dual_option) entry.dual_option = true;
      if (reg.pending_heuristic) entry.pending_heuristic = true;
    }
    try {
      if (f.content_type === 'pages') {
        const slug = (f.location_hint || f.fixture_id).toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        await createOrUpdatePage(baseUrl, token, courseId, slug, f.html || '', f.location_hint);
        entry.resource_id = slug;
      } else if (f.content_type === 'assignments') {
        const { resource_id } = await createOrUpdateAssignment(baseUrl, token, courseId, f.location_hint, f.html || '');
        entry.resource_id = resource_id;
      } else {
        entry.skipped_reason = 'content_type_not_implemented';
      }
    } catch (e) {
      entry.skipped_reason = e.message || 'injection_failed';
      console.warn(`Fixture ${f.fixture_id}: ${entry.skipped_reason}`);
    }
    manifest.fixtures.push(entry);
  }

  const outDir = path.join(__dirname, '..', 'test', 'fixtures', 'accessibility-qa');
  const manifestPath = path.join(outDir, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
  console.log(`Manifest written to ${manifestPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
