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

const QA_COURSE_NAME = '[QA][Bulk] Core Fixtures';
const QA_COURSE_CODE = 'QA-BULK-CORE';
const PAGE_SLUG = 'qa-bulk-core-page';
const PAGE_TITLE = '[QA][Bulk] Core Page';
const ASSIGNMENT_NAME = '[QA][Bulk] Core Assignment';
const QUIZ_TITLE = '[QA][Bulk] Core Quiz';
const DISC_TITLE = '[QA][Bulk] Core Discussion';
const ANN_TITLE = '[QA][Bulk] Core Announcement';
const MODULE_NAME = '[QA][Bulk] Module';

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
  if (existing) return existing.id;
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
  throw new Error('Failed to create bulk QA course');
}

async function createOrUpdatePage(baseUrl, token, courseId, wikiPageUrl, body, title) {
  const wikiPageUrlEnc = encodeURIComponent(wikiPageUrl);
  const getRes = await fetch(
    `${baseUrl.replace(/\/$/, '')}/courses/${courseId}/pages/${wikiPageUrlEnc}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  const editBody = { wiki_page: { body, title: title || wikiPageUrl } };
  if (getRes.ok) {
    const putRes = await canvasFetch(baseUrl, token, `/courses/${courseId}/pages/${wikiPageUrlEnc}`, {
      method: 'PUT',
      body: JSON.stringify(editBody),
    });
    const page = await putRes.json();
    return { resource_id: String(page.url || page.page_id || wikiPageUrl) };
  }
  const postRes = await canvasFetch(baseUrl, token, `/courses/${courseId}/pages`, {
    method: 'POST',
    body: JSON.stringify({ wiki_page: { ...editBody.wiki_page, url: wikiPageUrl } }),
  });
  const page = await postRes.json();
  return { resource_id: String(page.url || page.page_id || wikiPageUrl) };
}

async function createOrUpdateAssignment(baseUrl, token, courseId, name, description) {
  const listRes = await canvasFetch(
    baseUrl,
    token,
    `/courses/${courseId}/assignments?per_page=100&search_term=${encodeURIComponent(name)}`,
  );
  const assignments = await listRes.json();
  const existing = Array.isArray(assignments) ? assignments.find((a) => a.name === name) : null;
  const payload = { assignment: { name, description: description || '', submission_types: ['none'] } };
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
    const putRes = await canvasFetch(baseUrl, token, `/courses/${courseId}/quizzes/${existing.id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
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

async function findDiscussionTopicByTitle(baseUrl, token, courseId, title, announcementsOnly) {
  const path = announcementsOnly
    ? `/courses/${courseId}/discussion_topics?only_announcements=true&per_page=100`
    : `/courses/${courseId}/discussion_topics?per_page=100`;
  const listRes = await canvasFetch(baseUrl, token, path);
  const list = await listRes.json();
  const t = String(title);
  return Array.isArray(list) ? list.find((row) => String(row.title) === t) : null;
}

async function createOrUpdateDiscussionTopic(baseUrl, token, courseId, title, message, announcementsOnly) {
  const existing = await findDiscussionTopicByTitle(baseUrl, token, courseId, title, announcementsOnly);
  const body = {
    title,
    message: message || '',
    published: true,
    discussion_type: 'threaded',
  };
  if (announcementsOnly) body.is_announcement = true;
  const jsonHeaders = { 'Content-Type': 'application/json' };
  if (existing) {
    await canvasFetch(baseUrl, token, `/courses/${courseId}/discussion_topics/${existing.id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
      headers: jsonHeaders,
    });
    return { resource_id: String(existing.id) };
  }
  const postRes = await canvasFetch(baseUrl, token, `/courses/${courseId}/discussion_topics`, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: jsonHeaders,
  });
  const row = await postRes.json();
  return { resource_id: String(row.id) };
}

async function findOrCreateModule(baseUrl, token, courseId) {
  const listRes = await canvasFetch(baseUrl, token, `/courses/${courseId}/modules?per_page=100`);
  const list = await listRes.json();
  const existing = Array.isArray(list) ? list.find((m) => String(m.name) === MODULE_NAME) : null;
  if (existing) return { id: existing.id };
  const postRes = await canvasFetch(baseUrl, token, `/courses/${courseId}/modules`, {
    method: 'POST',
    body: JSON.stringify({ module: { name: MODULE_NAME, published: true } }),
  });
  const mod = await postRes.json();
  const id = mod.id ?? mod.module?.id;
  if (!id) throw new Error('Module create returned no id');
  return { id };
}

async function ensurePageModuleItem(baseUrl, token, courseId, moduleId, pageUrl) {
  const itemsRes = await canvasFetch(
    baseUrl,
    token,
    `/courses/${courseId}/modules/${moduleId}/items?per_page=100`,
  );
  const items = await itemsRes.json();
  const has = Array.isArray(items)
    ? items.some(
        (i) => i.type === 'Page' && String(i.page_url || '').toLowerCase() === String(pageUrl).toLowerCase(),
      )
    : false;
  if (has) {
    const found = items.find(
      (i) => i.type === 'Page' && String(i.page_url || '').toLowerCase() === String(pageUrl).toLowerCase(),
    );
    return { resource_id: found ? String(found.id) : '' };
  }
  const postRes = await canvasFetch(baseUrl, token, `/courses/${courseId}/modules/${moduleId}/items`, {
    method: 'POST',
    body: JSON.stringify({
      module_item: {
        type: 'Page',
        page_url: pageUrl,
      },
    }),
  });
  const row = await postRes.json();
  const item = row.module_item || row;
  return { resource_id: String(item.id || '') };
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

  if (forceRebuild) {
    try {
      const listRes = await canvasFetch(baseUrl, token, '/courses?per_page=100&include[]=course_image');
      const courses = await listRes.json();
      const existing = Array.isArray(courses)
        ? courses.find((c) => c.course_code === QA_COURSE_CODE || c.name === QA_COURSE_NAME)
        : null;
      if (existing?.id) {
        await tryDeleteCourseById(baseUrl, token, existing.id);
        console.log(`force-rebuild: deleted bulk QA course ${existing.id}`);
      }
    } catch (e) {
      console.warn(
        'force-rebuild: could not delete existing bulk QA course (continuing):',
        e instanceof Error ? e.message : e,
      );
    }
  }

  const courseId = await findOrCreateCourse(baseUrl, token);
  console.log(`Using course ${courseId} (${QA_COURSE_NAME})`);

  const pageHtml = '<p>[QA][Bulk] seeded page body.</p>';
  const { resource_id: pageUrl } = await createOrUpdatePage(
    baseUrl,
    token,
    courseId,
    PAGE_SLUG,
    pageHtml,
    PAGE_TITLE,
  );
  const { resource_id: assignmentId } = await createOrUpdateAssignment(
    baseUrl,
    token,
    courseId,
    ASSIGNMENT_NAME,
    '<p>[QA][Bulk] assignment</p>',
  );
  const { resource_id: quizId } = await createOrUpdateQuiz(
    baseUrl,
    token,
    courseId,
    QUIZ_TITLE,
    '<p>[QA][Bulk] quiz</p>',
  );
  const { resource_id: discussionId } = await createOrUpdateDiscussionTopic(
    baseUrl,
    token,
    courseId,
    DISC_TITLE,
    '<p>[QA][Bulk] discussion</p>',
    false,
  );
  const { resource_id: announcementId } = await createOrUpdateDiscussionTopic(
    baseUrl,
    token,
    courseId,
    ANN_TITLE,
    '<p>[QA][Bulk] announcement</p>',
    true,
  );
  const { id: moduleId } = await findOrCreateModule(baseUrl, token, courseId);
  const { resource_id: moduleItemId } = await ensurePageModuleItem(
    baseUrl,
    token,
    courseId,
    moduleId,
    pageUrl,
  );

  const manifest = {
    manifest_version: '1.0',
    builder_version: '1.0.0',
    canvas_base_url: baseUrl.replace(/\/api\/v1\/?$/, ''),
    course_id: courseId,
    course_name: QA_COURSE_NAME,
    course_code: QA_COURSE_CODE,
    rebuilt_at: new Date().toISOString(),
    rebuild_reason: forceRebuild ? 'force-rebuild' : 'script run',
    resources: {
      page_url: pageUrl,
      assignment_id: assignmentId,
      quiz_id: quizId,
      discussion_id: discussionId,
      announcement_id: announcementId,
      module_id: String(moduleId),
      module_item_id: moduleItemId || '',
    },
  };

  const outDir = path.join(__dirname, '..', 'test', 'fixtures', 'bulk-editor-qa');
  fs.mkdirSync(outDir, { recursive: true });
  const manifestPath = path.join(outDir, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
  console.log(`Manifest written to ${manifestPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
