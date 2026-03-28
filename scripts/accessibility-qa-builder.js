#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const {
  loadFixabilityMapFromDist,
  loadLocalProjectDotEnv,
  enrichFixtureRegistryFields,
  resolveCanvasApiBaseForScripts,
  resolveCanvasTokenForScripts,
} = require('./accessibility-qa-helpers');

loadLocalProjectDotEnv();

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

async function tryDeleteCourseById(baseUrl, token, courseId) {
  const url = `${baseUrl.replace(/\/$/, '')}/courses/${courseId}`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`DELETE course ${courseId}: ${res.status} ${text.slice(0, 200)}`);
  }
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
    return {
      resource_id: String(page.url || page.page_id || wikiPageUrl),
      update_key: page.url || wikiPageUrl,
    };
  }
  const postRes = await canvasFetch(baseUrl, token, `/courses/${courseId}/pages`, {
    method: 'POST',
    body: JSON.stringify({ wiki_page: { ...editBody.wiki_page, url: wikiPageUrl } }),
  });
  const page = await postRes.json();
  return {
    resource_id: String(page.url || page.page_id || wikiPageUrl),
    update_key: page.url || wikiPageUrl,
  };
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

function mapCanvasResourceType(contentType) {
  switch (contentType) {
    case 'pages':
      return 'wiki_page';
    case 'assignments':
      return 'assignment';
    case 'announcements':
    case 'discussions':
      return 'discussion_topic';
    case 'quizzes':
      return 'quiz';
    case 'syllabus':
      return 'syllabus';
    default:
      return contentType;
  }
}

const MINIMAL_PDF_BYTES = Buffer.from(
  '%PDF-1.1\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 3 3]>>endobj\nxref\n0 4\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n100\n%%EOF\n',
  'utf8',
);

async function uploadCourseFile(baseUrl, token, courseId, filename, buffer, contentType) {
  const urlRoot = baseUrl.replace(/\/$/, '');
  const initRes = await fetch(`${urlRoot}/courses/${courseId}/files`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: filename,
      size: buffer.length,
      content_type: contentType,
    }),
  });
  if (!initRes.ok) {
    const t = await initRes.text();
    throw new Error(`files init ${initRes.status}: ${t.slice(0, 240)}`);
  }
  const spec = await initRes.json();
  const uploadUrl = spec.upload_url;
  const params = spec.upload_params || {};
  if (!uploadUrl || typeof params !== 'object') {
    throw new Error('Canvas files init missing upload_url or upload_params');
  }
  const form = new FormData();
  for (const [k, v] of Object.entries(params)) {
    form.append(k, String(v));
  }
  form.append('file', new Blob([buffer]), filename);
  const upRes = await fetch(uploadUrl, { method: 'POST', body: form });
  if (!upRes.ok) {
    const t = await upRes.text();
    throw new Error(`files upload ${upRes.status}: ${t.slice(0, 240)}`);
  }
  const fileId = spec.id;
  if (!fileId) {
    const uj = await upRes.json().catch(() => ({}));
    return { file_id: uj.id, file_url: uj.url || uj.public_url || null };
  }
  const metaRes = await fetch(`${urlRoot}/files/${fileId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const meta = metaRes.ok ? await metaRes.json() : {};
  const fileUrl = meta.url || meta.public_url || meta.download_url || null;
  return { file_id: String(fileId), file_url: fileUrl };
}

async function findDiscussionTopicByTitle(baseUrl, token, courseId, title, announcementsOnly) {
  const path = announcementsOnly
    ? `/courses/${courseId}/discussion_topics?only_announcements=true&per_page=100`
    : `/courses/${courseId}/discussion_topics?per_page=100`;
  const listRes = await canvasFetch(baseUrl, token, path);
  const list = await listRes.json();
  const t = String(title);
  return Array.isArray(list) ? list.find((row) => String(row.title) === t) : null;
}

async function createOrUpdateQuiz(baseUrl, token, courseId, title, description) {
  const listRes = await canvasFetch(baseUrl, token, `/courses/${courseId}/quizzes?per_page=100`);
  const list = await listRes.json();
  const t = String(title);
  const existing = Array.isArray(list) ? list.find((row) => String(row.title) === t) : null;
  const payload = {
    quiz: {
      title: t,
      description: description || '',
      quiz_type: 'assignment',
      published: false,
    },
  };
  if (existing) {
    const putRes = await canvasFetch(
      baseUrl,
      token,
      `/courses/${courseId}/quizzes/${existing.id}`,
      {
        method: 'PUT',
        body: JSON.stringify(payload),
      },
    );
    const raw = await putRes.json();
    const q = raw.quiz || raw;
    return { resource_id: String(q.id) };
  }
  const postRes = await canvasFetch(baseUrl, token, `/courses/${courseId}/quizzes`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  const raw = await postRes.json();
  const row = raw.quiz || raw;
  return { resource_id: String(row.id) };
}

async function createOrUpdateDiscussionTopic(
  baseUrl,
  token,
  courseId,
  title,
  message,
  announcementsOnly,
) {
  const existing = await findDiscussionTopicByTitle(
    baseUrl,
    token,
    courseId,
    title,
    announcementsOnly,
  );
  const body = {
    title,
    message: message || '',
    published: true,
    discussion_type: 'threaded',
  };
  if (announcementsOnly) body.is_announcement = true;
  const jsonHeaders = { 'Content-Type': 'application/json' };
  if (existing) {
    await canvasFetch(
      baseUrl,
      token,
      `/courses/${courseId}/discussion_topics/${existing.id}`,
      {
        method: 'PUT',
        body: JSON.stringify(body),
        headers: jsonHeaders,
      },
    );
    return { resource_id: String(existing.id) };
  }
  const postRes = await canvasFetch(
    baseUrl,
    token,
    `/courses/${courseId}/discussion_topics`,
    {
      method: 'POST',
      body: JSON.stringify(body),
      headers: jsonHeaders,
    },
  );
  const row = await postRes.json();
  return { resource_id: String(row.id) };
}

async function setCourseSyllabusBody(baseUrl, token, courseId, syllabusBody) {
  await canvasFetch(baseUrl, token, `/courses/${courseId}`, {
    method: 'PUT',
    body: JSON.stringify({ course: { syllabus_body: syllabusBody } }),
    headers: { 'Content-Type': 'application/json' },
  });
}

function expandFixturesForAllContentTypes(rawFixtures) {
  const out = [];
  for (const f of rawFixtures) {
    out.push(f);
    if (f.content_type === 'pages' && !f.is_clean_control) {
      out.push({
        ...f,
        fixture_id: `ann_${f.fixture_id}`,
        content_type: 'announcements',
        location_hint: `[QA] Ann ${f.location_hint || f.fixture_id}`,
      });
      out.push({
        ...f,
        fixture_id: `disc_${f.fixture_id}`,
        content_type: 'discussions',
        location_hint: `[QA] Disc ${f.location_hint || f.fixture_id}`,
      });
      out.push({
        ...f,
        fixture_id: `quiz_${f.fixture_id}`,
        content_type: 'quizzes',
        location_hint: `[QA] Quiz ${f.location_hint || f.fixture_id}`,
      });
      out.push({
        ...f,
        fixture_id: `mod_${f.fixture_id}`,
        content_type: 'modules',
        location_hint: `[QA] Mod ${f.fixture_id}`,
        module_link: 'page',
        module_page_slug: pageSlugFromFixture(f),
      });
    }
    if (f.content_type === 'assignments' && !f.is_clean_control) {
      out.push({
        ...f,
        fixture_id: `mod_${f.fixture_id}`,
        content_type: 'modules',
        location_hint: `[QA] Mod ${f.fixture_id}`,
        module_link: 'assignment',
        module_assignment_name: f.location_hint,
      });
    }
  }
  return out;
}

async function main() {
  const forceRebuild = process.argv.includes('--force-rebuild');
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
    console.error(
      'Set exactly one Canvas token: CANVAS_ACCESS_TOKEN, CANVAS_TOKEN, or QA_CANVAS_TOKEN (Render or .env).',
    );
    process.exit(1);
  }
  const fixturesPath = path.join(__dirname, '..', 'test', 'fixtures', 'accessibility-qa', 'fixtures.json');
  const fixturesData = JSON.parse(fs.readFileSync(fixturesPath, 'utf8'));
  const rawFixtures = fixturesData.fixtures || [];
  const expandedFixtures = expandFixturesForAllContentTypes(rawFixtures);
  const fixabilityMap = loadFixabilityMapFromDist();
  if (forceRebuild) {
    try {
      const listRes = await canvasFetch(baseUrl, token, '/courses?per_page=100&include[]=course_image');
      const courses = await listRes.json();
      const existing = Array.isArray(courses)
        ? courses.find((c) => c.course_code === QA_COURSE_CODE || c.name === QA_COURSE_NAME)
        : null;
      if (existing?.id) {
        await tryDeleteCourseById(baseUrl, token, existing.id);
        console.log(`force-rebuild: deleted QA course ${existing.id}`);
      }
    } catch (e) {
      console.warn(
        'force-rebuild: could not delete existing QA course (continuing):',
        e instanceof Error ? e.message : e,
      );
    }
  }
  const courseId = await findOrCreateCourse(baseUrl, token);
  console.log(`Using course ${courseId} (${QA_COURSE_NAME})`);

  const manifest = {
    manifest_version: '1.1',
    builder_version: '1.1.0',
    canvas_base_url: baseUrl.replace(/\/api\/v1\/?$/, ''),
    course_id: courseId,
    course_name: QA_COURSE_NAME,
    course_code: QA_COURSE_CODE,
    created_at: new Date().toISOString(),
    rebuilt_at: new Date().toISOString(),
    rebuild_reason: forceRebuild ? 'force-rebuild' : 'script run',
    registry_rule_count: Object.keys(fixabilityMap).length,
    fixtures: [],
    canvas_capability: {},
  };

  let quizRichTextOk = null;

  for (const f of expandedFixtures) {
    const ruleId = f.rule_id || 'clean_control';
    const entry = {
      fixture_id: f.fixture_id,
      rule_id: ruleId,
      content_type: f.content_type,
      canvas_resource_type: mapCanvasResourceType(f.content_type),
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
      if (typeof f.dual_option_choice === 'string' && f.dual_option_choice.trim())
        entry.dual_option_choice = f.dual_option_choice.trim();
      if (typeof f.broken_link_url === 'string' && f.broken_link_url.trim())
        entry.broken_link_url = f.broken_link_url.trim();
      if (typeof f.correct_link_href === 'string' && f.correct_link_href.trim())
        entry.correct_link_href = f.correct_link_href.trim();
    }
    try {
      if (f.content_type === 'pages') {
        const slug = (f.location_hint || f.fixture_id).toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        let bodyHtml = f.html || '';
        if (f.use_course_pdf_placeholder) {
          try {
            const { file_url } = await uploadCourseFile(
              baseUrl,
              token,
              courseId,
              'qa-minimal.pdf',
              MINIMAL_PDF_BYTES,
              'application/pdf',
            );
            if (file_url) {
              bodyHtml = bodyHtml.split('PLACEHOLDER_COURSE_PDF').join(file_url);
              entry.injection_method = 'hybrid';
            } else {
              entry.injection_method = 'api_html';
            }
          } catch (e) {
            console.warn(`Fixture ${f.fixture_id} PDF upload:`, e.message || e);
            bodyHtml = bodyHtml
              .split('PLACEHOLDER_COURSE_PDF')
              .join('https://example.com/qa-fallback.pdf');
            entry.injection_method = 'api_html';
            manifest.canvas_capability.course_pdf_upload = false;
          }
        }
        const { resource_id } = await createOrUpdatePage(
          baseUrl,
          token,
          courseId,
          slug,
          bodyHtml,
          f.location_hint,
        );
        entry.resource_id = resource_id;
      } else if (f.content_type === 'assignments') {
        const { resource_id } = await createOrUpdateAssignment(baseUrl, token, courseId, f.location_hint, f.html || '');
        entry.resource_id = resource_id;
      } else if (f.content_type === 'announcements') {
        const { resource_id } = await createOrUpdateDiscussionTopic(
          baseUrl,
          token,
          courseId,
          f.location_hint,
          f.html || '',
          true,
        );
        entry.resource_id = resource_id;
      } else if (f.content_type === 'discussions') {
        const { resource_id } = await createOrUpdateDiscussionTopic(
          baseUrl,
          token,
          courseId,
          f.location_hint,
          f.html || '',
          false,
        );
        entry.resource_id = resource_id;
      } else if (f.content_type === 'quizzes') {
        const htmlIn = f.html || '';
        const { resource_id } = await createOrUpdateQuiz(
          baseUrl,
          token,
          courseId,
          f.location_hint,
          htmlIn,
        );
        entry.resource_id = resource_id;
        if (quizRichTextOk === null && htmlIn.length > 12) {
          try {
            const getRes = await fetch(
              `${baseUrl.replace(/\/$/, '')}/courses/${courseId}/quizzes/${resource_id}`,
              { headers: { Authorization: `Bearer ${token}` } },
            );
            const qj = getRes.ok ? await getRes.json() : {};
            const back = String(qj.description || '');
            const needle = htmlIn.replace(/\s+/g, ' ').trim().slice(0, 24);
            quizRichTextOk = needle.length > 0 && back.includes(needle.slice(0, 12));
          } catch {
            quizRichTextOk = false;
          }
        }
      } else if (f.content_type === 'modules') {
        if (!qaModuleId) {
          qaModuleId = await findOrCreateQaModule(baseUrl, token, courseId);
        }
        if (f.module_link === 'page' && f.module_page_slug) {
          const { resource_id } = await ensureModulePageItem(
            baseUrl,
            token,
            courseId,
            qaModuleId,
            f.module_page_slug,
            f.location_hint,
          );
          entry.resource_id = resource_id;
        } else if (f.module_link === 'assignment' && f.module_assignment_name) {
          const a = await findAssignmentByName(
            baseUrl,
            token,
            courseId,
            f.module_assignment_name,
          );
          if (!a?.id) {
            entry.skipped_reason = 'module_assignment_not_found';
          } else {
            const { resource_id } = await ensureModuleAssignmentItem(
              baseUrl,
              token,
              courseId,
              qaModuleId,
              a.id,
              f.module_assignment_name,
            );
            entry.resource_id = resource_id;
          }
        } else {
          entry.skipped_reason = 'module_fixture_missing_target';
        }
      } else {
        entry.skipped_reason = 'content_type_not_implemented';
      }
    } catch (e) {
      entry.skipped_reason = e.message || 'injection_failed';
      console.warn(`Fixture ${f.fixture_id}: ${entry.skipped_reason}`);
    }
    manifest.fixtures.push(entry);
  }

  const pageViolations = rawFixtures.filter(
    (x) => x.content_type === 'pages' && !x.is_clean_control,
  );
  const sylRuleId = 'syllabus_composite_page_violations';
  if (pageViolations.length) {
    const mergedHtml = pageViolations
      .map(
        (s) =>
          `<div data-qa-fixture="${String(s.fixture_id).replace(/"/g, '')}">${s.html || ''}</div>`,
      )
      .join('\n');
    try {
      await setCourseSyllabusBody(baseUrl, token, courseId, mergedHtml);
      const sylEntry = {
        fixture_id: sylRuleId,
        rule_id: sylRuleId,
        content_type: 'syllabus',
        canvas_resource_type: 'syllabus',
        resource_id: String(courseId),
        location_hint: 'syllabus_composite',
        injection_method: 'api_html',
        expected_findings: pageViolations.map((s) => ({
          rule_id: s.rule_id,
          count_min: 1,
          count_max: 10,
        })),
        expectation_tier: 'strict',
        is_clean_control: false,
      };
      const reg = enrichFixtureRegistryFields(sylRuleId, fixabilityMap);
      if (reg.fix_strategy) sylEntry.fix_strategy = reg.fix_strategy;
      if (reg.uses_ai != null) sylEntry.uses_ai = reg.uses_ai;
      if (reg.is_image_rule != null) sylEntry.is_image_rule = reg.is_image_rule;
      if (reg.uses_second_stage_ai != null)
        sylEntry.uses_second_stage_ai = reg.uses_second_stage_ai;
      manifest.fixtures.push(sylEntry);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      manifest.fixtures.push({
        fixture_id: sylRuleId,
        rule_id: sylRuleId,
        content_type: 'syllabus',
        canvas_resource_type: 'syllabus',
        resource_id: null,
        location_hint: 'syllabus_composite',
        skipped_reason: msg || 'syllabus_injection_failed',
        expectation_tier: 'strict',
        is_clean_control: false,
      });
      console.warn(`Syllabus composite: ${msg}`);
    }
  }

  if (quizRichTextOk !== null) {
    manifest.canvas_capability.quizzes_rich_text = !!quizRichTextOk;
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
