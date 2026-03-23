import { Injectable, Scope, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { REQUEST } from '@nestjs/core';
import { promises as fs } from 'fs';
import * as path from 'path';

interface CanvasCourse {
  id: number;
  name?: string;
  course_code?: string;
  sis_course_id?: string;
  enrollment_term_id?: number;
  start_at?: string;
  end_at?: string;
  created_at?: string;
}

type AccessibilitySeverity = 'high' | 'medium' | 'low';

interface AccessibilityFinding {
  resource_type: string;
  resource_id: string;
  resource_title: string;
  resource_url?: string | null;
  rule_id: string;
  severity: AccessibilitySeverity;
  message: string;
  snippet?: string | null;
  fix_strategy?: FixStrategy;
}

interface AccessibilityScanOptions {
  canvasNativeBaselineMs?: number;
  resourceTypes?: string[];
  ruleIds?: string[];
}

type FixRisk = 'low' | 'medium' | 'high';
type FixStrategy = 'auto' | 'suggested' | 'manual_only';
type FalsePositiveRisk = 'low' | 'medium' | 'high';

interface AccessibilityFixabilityContract {
  auto_fixable: boolean;
  fix_strategy: FixStrategy;
  false_positive_risk: FalsePositiveRisk;
  risk: FixRisk;
  fix_type: string;
  supports_preview: boolean;
  requires_content_fetch: boolean;
}

const ACCESSIBILITY_FIXABILITY_MAP: Record<string, AccessibilityFixabilityContract> = {
  adjacent_duplicate_links: { auto_fixable: true, fix_strategy: 'auto', false_positive_risk: 'low', risk: 'low', fix_type: 'merge_duplicate_links', supports_preview: true, requires_content_fetch: true },
  list_empty_item: { auto_fixable: true, fix_strategy: 'auto', false_positive_risk: 'low', risk: 'low', fix_type: 'remove_empty_li', supports_preview: true, requires_content_fetch: true },
  heading_empty: { auto_fixable: true, fix_strategy: 'auto', false_positive_risk: 'low', risk: 'low', fix_type: 'remove_empty_heading', supports_preview: true, requires_content_fetch: true },
  link_new_tab_no_warning: { auto_fixable: true, fix_strategy: 'auto', false_positive_risk: 'low', risk: 'low', fix_type: 'append_new_tab_warning', supports_preview: true, requires_content_fetch: true },
  img_missing_alt: { auto_fixable: true, fix_strategy: 'suggested', false_positive_risk: 'high', risk: 'high', fix_type: 'ai_generate_alt_text', supports_preview: true, requires_content_fetch: true },
  img_alt_too_long: { auto_fixable: false, fix_strategy: 'suggested', false_positive_risk: 'medium', risk: 'medium', fix_type: 'img_alt_truncate', supports_preview: true, requires_content_fetch: true },
  img_alt_filename: { auto_fixable: false, fix_strategy: 'suggested', false_positive_risk: 'medium', risk: 'medium', fix_type: 'img_alt_filename_suggest', supports_preview: true, requires_content_fetch: true },
  small_text_contrast: { auto_fixable: false, fix_strategy: 'manual_only', false_positive_risk: 'high', risk: 'high', fix_type: 'manual_only', supports_preview: false, requires_content_fetch: false },
  large_text_contrast: { auto_fixable: false, fix_strategy: 'manual_only', false_positive_risk: 'high', risk: 'high', fix_type: 'manual_only', supports_preview: false, requires_content_fetch: false },
  table_missing_caption: { auto_fixable: false, fix_strategy: 'suggested', false_positive_risk: 'medium', risk: 'medium', fix_type: 'ai_table_caption', supports_preview: true, requires_content_fetch: true },
  table_missing_header: { auto_fixable: false, fix_strategy: 'suggested', false_positive_risk: 'high', risk: 'high', fix_type: 'ai_table_header', supports_preview: true, requires_content_fetch: true },
  table_header_scope_missing: { auto_fixable: false, fix_strategy: 'suggested', false_positive_risk: 'medium', risk: 'medium', fix_type: 'table_scope_fix', supports_preview: true, requires_content_fetch: true },
  heading_skipped_level: { auto_fixable: false, fix_strategy: 'suggested', false_positive_risk: 'medium', risk: 'medium', fix_type: 'heading_scope_fix', supports_preview: true, requires_content_fetch: true },
  heading_h1_in_body: { auto_fixable: false, fix_strategy: 'suggested', false_positive_risk: 'medium', risk: 'medium', fix_type: 'heading_h1_demote', supports_preview: true, requires_content_fetch: true },
  heading_too_long: { auto_fixable: false, fix_strategy: 'suggested', false_positive_risk: 'low', risk: 'low', fix_type: 'ai_heading_shorten', supports_preview: true, requires_content_fetch: true },
  list_not_semantic: { auto_fixable: false, fix_strategy: 'suggested', false_positive_risk: 'medium', risk: 'medium', fix_type: 'ai_list_semantic', supports_preview: true, requires_content_fetch: true },
  link_split_or_broken: { auto_fixable: false, fix_strategy: 'suggested', false_positive_risk: 'medium', risk: 'medium', fix_type: 'ai_link_reconstruct', supports_preview: true, requires_content_fetch: true },
  link_empty_name: { auto_fixable: false, fix_strategy: 'suggested', false_positive_risk: 'high', risk: 'high', fix_type: 'ai_link_text', supports_preview: true, requires_content_fetch: true },
  link_ambiguous_text: { auto_fixable: true, fix_strategy: 'suggested', false_positive_risk: 'medium', risk: 'medium', fix_type: 'ai_replace_ambiguous_link_text', supports_preview: true, requires_content_fetch: true },
  link_file_missing_type_size_hint: { auto_fixable: false, fix_strategy: 'suggested', false_positive_risk: 'low', risk: 'low', fix_type: 'ai_link_file_hint', supports_preview: true, requires_content_fetch: true },
  heading_duplicate_h1: { auto_fixable: false, fix_strategy: 'suggested', false_positive_risk: 'medium', risk: 'medium', fix_type: 'heading_duplicate_h1_demote', supports_preview: true, requires_content_fetch: true },
  heading_visual_only_style: { auto_fixable: false, fix_strategy: 'suggested', false_positive_risk: 'low', risk: 'low', fix_type: 'ai_heading_visual', supports_preview: true, requires_content_fetch: true },
  landmark_structure_quality: { auto_fixable: false, fix_strategy: 'suggested', false_positive_risk: 'low', risk: 'low', fix_type: 'manual_only', supports_preview: false, requires_content_fetch: false },
  table_layout_heuristic: { auto_fixable: false, fix_strategy: 'suggested', false_positive_risk: 'low', risk: 'low', fix_type: 'manual_only', supports_preview: false, requires_content_fetch: false },
  table_complex_assoc_missing: { auto_fixable: false, fix_strategy: 'manual_only', false_positive_risk: 'medium', risk: 'medium', fix_type: 'manual_only', supports_preview: false, requires_content_fetch: false },
  img_decorative_misuse: { auto_fixable: false, fix_strategy: 'suggested', false_positive_risk: 'low', risk: 'low', fix_type: 'ai_img_decorative', supports_preview: true, requires_content_fetch: true },
  img_meaningful_empty_alt: { auto_fixable: false, fix_strategy: 'suggested', false_positive_risk: 'medium', risk: 'medium', fix_type: 'ai_img_meaningful_alt', supports_preview: true, requires_content_fetch: true },
  img_text_in_image_warning: { auto_fixable: false, fix_strategy: 'suggested', false_positive_risk: 'low', risk: 'low', fix_type: 'manual_only', supports_preview: false, requires_content_fetch: false },
  video_missing_captions: { auto_fixable: false, fix_strategy: 'manual_only', false_positive_risk: 'high', risk: 'high', fix_type: 'manual_only', supports_preview: false, requires_content_fetch: false },
  audio_missing_transcript: { auto_fixable: false, fix_strategy: 'manual_only', false_positive_risk: 'high', risk: 'high', fix_type: 'manual_only', supports_preview: false, requires_content_fetch: false },
  media_autoplay: { auto_fixable: false, fix_strategy: 'manual_only', false_positive_risk: 'medium', risk: 'medium', fix_type: 'manual_only', supports_preview: false, requires_content_fetch: false },
  motion_gif_warning: { auto_fixable: false, fix_strategy: 'suggested', false_positive_risk: 'low', risk: 'low', fix_type: 'manual_only', supports_preview: false, requires_content_fetch: false },
  video_embed_caption_unknown: { auto_fixable: false, fix_strategy: 'manual_only', false_positive_risk: 'medium', risk: 'medium', fix_type: 'manual_only', supports_preview: false, requires_content_fetch: false },
  form_control_missing_label: { auto_fixable: false, fix_strategy: 'suggested', false_positive_risk: 'high', risk: 'high', fix_type: 'ai_form_label', supports_preview: true, requires_content_fetch: true },
  form_placeholder_as_label: { auto_fixable: false, fix_strategy: 'suggested', false_positive_risk: 'medium', risk: 'medium', fix_type: 'form_placeholder_to_label', supports_preview: true, requires_content_fetch: true },
  form_required_not_programmatic: { auto_fixable: false, fix_strategy: 'manual_only', false_positive_risk: 'medium', risk: 'medium', fix_type: 'manual_only', supports_preview: false, requires_content_fetch: false },
  form_error_unassociated: { auto_fixable: false, fix_strategy: 'manual_only', false_positive_risk: 'medium', risk: 'medium', fix_type: 'manual_only', supports_preview: false, requires_content_fetch: false },
  aria_invalid_role: { auto_fixable: false, fix_strategy: 'manual_only', false_positive_risk: 'medium', risk: 'medium', fix_type: 'manual_only', supports_preview: false, requires_content_fetch: false },
  aria_hidden_focusable: { auto_fixable: false, fix_strategy: 'manual_only', false_positive_risk: 'high', risk: 'high', fix_type: 'manual_only', supports_preview: false, requires_content_fetch: false },
  duplicate_id: { auto_fixable: false, fix_strategy: 'suggested', false_positive_risk: 'high', risk: 'high', fix_type: 'duplicate_id_suffix', supports_preview: true, requires_content_fetch: true },
  keyboard_focus_trap_heuristic: { auto_fixable: false, fix_strategy: 'suggested', false_positive_risk: 'low', risk: 'low', fix_type: 'manual_only', supports_preview: false, requires_content_fetch: false },
  doc_pdf_accessibility_unknown: { auto_fixable: false, fix_strategy: 'suggested', false_positive_risk: 'low', risk: 'low', fix_type: 'manual_only', supports_preview: false, requires_content_fetch: false },
  doc_office_structure_unknown: { auto_fixable: false, fix_strategy: 'suggested', false_positive_risk: 'low', risk: 'low', fix_type: 'manual_only', supports_preview: false, requires_content_fetch: false },
  doc_spreadsheet_headers_unknown: { auto_fixable: false, fix_strategy: 'suggested', false_positive_risk: 'low', risk: 'low', fix_type: 'manual_only', supports_preview: false, requires_content_fetch: false },
  button_empty_name: { auto_fixable: false, fix_strategy: 'suggested', false_positive_risk: 'high', risk: 'high', fix_type: 'ai_button_label', supports_preview: true, requires_content_fetch: true },
  lang_missing: { auto_fixable: true, fix_strategy: 'suggested', false_positive_risk: 'low', risk: 'low', fix_type: 'set_html_lang', supports_preview: true, requires_content_fetch: true },
  lang_invalid: { auto_fixable: false, fix_strategy: 'suggested', false_positive_risk: 'low', risk: 'low', fix_type: 'suggested', supports_preview: false, requires_content_fetch: true },
  lang_inline_missing: { auto_fixable: false, fix_strategy: 'manual_only', false_positive_risk: 'high', risk: 'high', fix_type: 'manual_only', supports_preview: false, requires_content_fetch: true },
  color_only_information: { auto_fixable: false, fix_strategy: 'manual_only', false_positive_risk: 'high', risk: 'high', fix_type: 'manual_only', supports_preview: false, requires_content_fetch: true },
  sensory_only_instructions: { auto_fixable: false, fix_strategy: 'manual_only', false_positive_risk: 'medium', risk: 'medium', fix_type: 'manual_only', supports_preview: false, requires_content_fetch: true },
  text_justified: { auto_fixable: true, fix_strategy: 'auto', false_positive_risk: 'low', risk: 'low', fix_type: 'remove_text_justify', supports_preview: true, requires_content_fetch: true },
  font_size_too_small: { auto_fixable: true, fix_strategy: 'auto', false_positive_risk: 'low', risk: 'low', fix_type: 'font_size_min_12', supports_preview: true, requires_content_fetch: true },
  iframe_missing_title: { auto_fixable: false, fix_strategy: 'suggested', false_positive_risk: 'low', risk: 'low', fix_type: 'iframe_title_suggest', supports_preview: true, requires_content_fetch: true },
  session_timeout_no_warning: { auto_fixable: false, fix_strategy: 'manual_only', false_positive_risk: 'high', risk: 'high', fix_type: 'manual_only', supports_preview: false, requires_content_fetch: true },
  link_broken: { auto_fixable: false, fix_strategy: 'suggested', false_positive_risk: 'low', risk: 'low', fix_type: 'ai_link_broken', supports_preview: true, requires_content_fetch: true },
};

interface AccreditationStandardNode {
  id: string;
  title: string;
  description?: string | null;
  version?: string | null;
  effectiveDate?: string | null;
  parentId?: string | null;
  sourceType?: 'db' | 'api' | 'file' | 'scrape' | 'ai';
  sourceUri?: string | null;
  confidence?: number;
  retrievedAt?: string;
}

interface StandardsResolutionResult {
  sourceType: 'db' | 'api' | 'file' | 'scrape' | 'ai' | 'none';
  standards: AccreditationStandardNode[];
  sourceUri?: string | null;
  confidence: number;
  usedAiFallback: boolean;
  warnings: string[];
}

const CLEARABLE_CONTENT_KEYS = new Set(['description', 'message', 'body', 'instructions']);
const NULLABLE_QUIZ_FIELDS = new Set(['time_limit']);

function processDateField(key: string, value: any): any {
  if (!key.endsWith('_at')) return undefined;
  if (value === null) return null;
  if (value === undefined || value === '') return undefined;
  try {
    const d = new Date(value);
    return !isNaN(d.getTime()) ? d.toISOString().slice(0, 19) + 'Z' : undefined;
  } catch { return undefined; }
}

function validateDateOrder(updates: Record<string, any>, itemLabel = 'Item'): void {
  const due = updates.due_at != null ? new Date(updates.due_at).getTime() : NaN;
  const unlock = updates.unlock_at != null ? new Date(updates.unlock_at).getTime() : NaN;
  const lock = updates.lock_at != null ? new Date(updates.lock_at).getTime() : NaN;
  const delayed = updates.delayed_post_at != null ? new Date(updates.delayed_post_at).getTime() : NaN;
  if (!Number.isFinite(due) && !Number.isFinite(unlock) && !Number.isFinite(lock) && !Number.isFinite(delayed)) return;
  if (Number.isFinite(unlock) && Number.isFinite(due) && unlock >= due) {
    throw new Error(`${itemLabel}: unlock_at must be before due_at (Canvas requirement)`);
  }
  if (Number.isFinite(due) && Number.isFinite(lock) && lock <= due) {
    throw new Error(`${itemLabel}: lock_at must be after due_at (Canvas requirement)`);
  }
  if (Number.isFinite(unlock) && Number.isFinite(lock) && !Number.isFinite(due) && unlock >= lock) {
    throw new Error(`${itemLabel}: unlock_at must be before lock_at (Canvas requirement)`);
  }
  if (Number.isFinite(delayed) && Number.isFinite(lock) && delayed >= lock) {
    throw new Error(`${itemLabel}: delayed_post_at must be before lock_at (Canvas requirement)`);
  }
}

function cleanContentUpdates(
  updates: Record<string, any>,
  options: { clearableTextFields: boolean },
): Record<string, any> {
  const cleanedUpdates: Record<string, any> = {};
  Object.keys(updates).forEach(key => {
    const v = updates[key];
    if (v === undefined) return;
    const dateVal = processDateField(key, v);
    if (dateVal !== undefined) {
      cleanedUpdates[key] = dateVal;
      return;
    }
    if (
      options.clearableTextFields &&
      (v === null || v === '') &&
      CLEARABLE_CONTENT_KEYS.has(key)
    ) {
      cleanedUpdates[key] = v === null ? null : '';
    } else if (v !== null && v !== undefined && v !== '') {
      cleanedUpdates[key] = v;
    }
  });
  return cleanedUpdates;
}

@Injectable({ scope: Scope.REQUEST })
export class CanvasService {
  constructor(
    @Inject(REQUEST) private readonly req: any,
    private config: ConfigService,
  ) {}
  
  
  async getCourses() {
    const { token, baseUrl } = await this.getAuthHeaders();

    const termMap = await this.getTermMap();
    
    let allCourses: CanvasCourse[] = [];
    let url: string | null = `${baseUrl}/users/self/courses?per_page=100&state=all`;

    while (url) {
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errBody = await response.text().catch(() => '');
        throw new Error(
          `Canvas API ${response.status} ${response.statusText}${errBody ? `: ${errBody.slice(0, 500)}` : ''}`
        );
      }

      const chunk = (await response.json()) as CanvasCourse[];
      if (Array.isArray(chunk)) {
        allCourses.push(...chunk);
      }

      const linkHeader = response.headers.get('link');
      url = this.getNextUrl(linkHeader);
    }

    const processedCourses = allCourses.map((course) => {
      const sisId = (course.sis_course_id || '').trim();
      const termLabel = this.buildTermLabel(course, termMap, sisId);

      return {
        id: course.id,
        name: course.name || course.course_code || `ID: ${course.id}`,
        course_code: course.course_code || 'No Code',
        term_label: termLabel,
        end_date: course.end_at || null,
        created_at: course.created_at || null
      };
    });

    const grouped = processedCourses.reduce((acc, course) => {
      const term = course.term_label;
      if (!acc[term]) {
        const termData = Object.values(termMap).find(t => t.name === term);
        const sortDate = termData?.end || course.end_date || course.created_at || '1970-01-01T00:00:00Z';

        acc[term] = {
          term,
          sortDate: sortDate,
          courses: []
        };
      }
      acc[term].courses.push(course);
      return acc;
    }, {} as Record<string, { term: string; sortDate: string; courses: any[] }>);

    return Object.values(grouped)
      .sort((a, b) => {
        if (a.term === 'No Term Assigned') return 1;
        if (b.term === 'No Term Assigned') return -1;
        return new Date(b.sortDate).getTime() - new Date(a.sortDate).getTime();
      })
      .map(group => ({
        term: group.term,
        courses: group.courses.sort((a, b) => a.name.localeCompare(b.name))
      }));
  }

  private buildTermLabel(course: CanvasCourse, termMap: Record<number, { name: string; end: string }>, sisId: string): string {
    const match = sisId.match(/(\d{5,6})\s*$/);
    if (match) {
      return this.decodeNumericTerm(match[1]);
    }

    if (course.enrollment_term_id && termMap[course.enrollment_term_id]) {
      return termMap[course.enrollment_term_id].name;
    }

    return 'No Term Assigned';
  }

  private decodeNumericTerm(numericTerm: string): string {
    const year = parseInt(numericTerm.substring(0, 4), 10);
    const termIndex = parseInt(numericTerm.substring(4), 10);

    const universalMap: Record<number, string> = {
      1: "Fall", 2: "Spring", 3: "Summer I", 4: "Summer II", 5: "Summer Special",
      10: "Fall", 20: "Spring", 31: "Summer I", 32: "Summer II", 40: "Summer Special"
    };

    const termName = universalMap[termIndex] || `Term ${termIndex}`;
    const realYear = (termIndex === 1 || termIndex === 10) ? year - 1 : year;

    return `${termName} ${realYear}`;
  }

private async getTermMap(): Promise<Record<number, { name: string; end: string }>> {
    try {
      const { token, baseUrl } = await this.getAuthHeaders();
      const response = await fetch(`${baseUrl}/accounts/self/terms`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) return {};
      const data = await response.json();
      const terms = data.enrollment_terms || [];
      const termMap: Record<number, { name: string; end: string }> = {};
      
      terms.forEach((t: any) => { 
        if (t.id != null) {
          termMap[t.id] = { 
            name: t.name || '', 
            end: t.end_at || '1970-01-01T00:00:00Z' 
          };
        }
      });
      return termMap;
    } catch {
      return {};
    }
  }

  private getNextUrl(linkHeader: string | null): string | null {
    if (!linkHeader) return null;
    const match = linkHeader.split(',').find(l => l.includes('rel="next"'))?.match(/<([^>]+)>/);
    return match ? match[1] : null;
  }

  private async getAuthHeaders() {
    const token = this.req?.session?.canvasToken;
    const baseUrl = this.req?.session?.canvasUrl;
    if (!token || !baseUrl) {
      throw new Error('Unauthorized: No Canvas token. Launch via LTI and complete Canvas OAuth.');
    }
    return { token, baseUrl };
  }

  private quizApiV1Base(apiV1BaseUrl: string): string {
    const trimmed = apiV1BaseUrl.replace(/\/$/, '');
    if (trimmed.endsWith('/api/v1')) {
      return `${trimmed.slice(0, -'/api/v1'.length)}/api/quiz/v1`;
    }
    return `${trimmed}/api/quiz/v1`;
  }

  private isLikelyNewQuizAssignment(assignment: any): boolean {
    if (!assignment || typeof assignment !== 'object') return false;
    if (assignment.is_quiz_assignment === true) return true;
    if (assignment.quiz_lti === true) return true;
    const submissionTypes = Array.isArray(assignment.submission_types) ? assignment.submission_types : [];
    if (submissionTypes.includes('external_tool') && assignment.quiz_id) return true;
    return false;
  }

  private isQuizLinkedAssignment(assignment: any): boolean {
    if (!assignment || typeof assignment !== 'object') return false;
    if (assignment.is_quiz_assignment === true || (assignment as any).isQuizAssignment === true) return true;
    if (assignment.quiz_lti === true || (assignment as any).quizLti === true) return true;
    const quizId = assignment.quiz_id ?? (assignment as any).quizId;
    if (quizId != null) return true;
    const st = assignment.submission_types ?? (assignment as any).submissionTypes;
    const submissionTypes = Array.isArray(st) ? st : [];
    if (submissionTypes.includes('online_quiz')) return true;
    if (submissionTypes.includes('external_tool')) return true;
    return false;
  }

  private extractNewQuizInstructionsFromPayload(q: any): string {
    if (!q || typeof q !== 'object') return '';
    const tryString = (v: unknown): string | null => this.nonEmptyBodyString(v);
    for (const key of ['instructions', 'instructions_html', 'description', 'body', 'general_instructions']) {
      const s = tryString(q[key]);
      if (s) return s;
    }
    const instr = q.instructions;
    if (instr && typeof instr === 'object') {
      const fromBlocks = this.extractTextFromBlockEditorBlocks(instr);
      if (fromBlocks) return fromBlocks;
    }
    const ed = q.editor_display;
    if (ed && typeof ed === 'object') {
      for (const k of ['blocks', 'content', 'html']) {
        if (ed[k] != null) {
          const s = typeof ed[k] === 'string' ? tryString(ed[k]) : null;
          if (s) return s;
          const t = this.extractTextFromBlockEditorBlocks(ed[k]);
          if (t) return t;
        }
      }
    }
    const rootBlocks = q.instructions_blocks ?? q.content_blocks;
    if (rootBlocks != null) {
      const t = this.extractTextFromBlockEditorBlocks(rootBlocks);
      if (t) return t;
    }
    return '';
  }

  private normalizeNewQuizListItem(q: any): any | null {
    const assignmentId = q.assignment_id ?? q.assignmentId ?? q.id;
    const idNum = assignmentId != null ? Number(assignmentId) : NaN;
    if (!Number.isFinite(idNum)) return null;
    const title = q.title ?? q.name ?? '';
    const description = this.extractNewQuizInstructionsFromPayload(q);
    return {
      id: idNum,
      name: typeof title === 'string' ? title : String(title),
      description,
      assignment_group_id: q.assignment_group_id ?? q.assignment_group?.id,
      points_possible: q.points_possible,
      due_at: q.due_at,
      unlock_at: q.unlock_at,
      lock_at: q.lock_at,
      published: q.published,
    };
  }

  private async fetchPaginatedNewQuizQuizzes(courseId: number, token: string, canvasApiV1Base: string): Promise<any[]> {
    const quizBase = this.quizApiV1Base(canvasApiV1Base);
    let all: any[] = [];
    let url: string | null = `${quizBase}/courses/${courseId}/quizzes?per_page=100`;
    while (url) {
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`New Quizzes API ${res.status}: ${text.slice(0, 400)}`);
      }
      const chunk = await res.json().catch(() => null);
      let items: any[] = [];
      if (Array.isArray(chunk)) {
        items = chunk;
      } else if (chunk && typeof chunk === 'object') {
        items = (chunk as any).quizzes ?? (chunk as any).data ?? (chunk as any).items ?? [];
        if (!Array.isArray(items) && (chunk as any).quiz) {
          items = [(chunk as any).quiz];
        }
      }
      if (Array.isArray(items)) {
        all.push(...items);
      }
      url = this.getNextUrl(res.headers.get('link'));
    }
    return all;
  }

  private async enrichNewQuizRowsFromDetail(
    courseId: number,
    rows: any[],
    token: string,
    canvasApiV1Base: string,
  ): Promise<void> {
    const quizBase = this.quizApiV1Base(canvasApiV1Base);
    const needDetail = rows.filter((r) => !r.description || String(r.description).trim() === '');
    const batch = 10;
    for (let i = 0; i < needDetail.length; i += batch) {
      const slice = needDetail.slice(i, i + batch);
      await Promise.all(
        slice.map(async (row) => {
          const url = `${quizBase}/courses/${courseId}/quizzes/${row.id}`;
          const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
          if (!res.ok) return;
          const q = await res.json().catch(() => null);
          if (!q || typeof q !== 'object') return;
          const d = this.extractNewQuizInstructionsFromPayload(q);
          if (d) row.description = d;
          const t = q.title ?? q.name;
          if (t != null && String(t).trim() !== '') {
            row.name = String(t);
          }
        }),
      );
    }
  }

  async getCourseNewQuizzes(courseId: number): Promise<any[]> {
    const { token, baseUrl } = await this.getAuthHeaders();
    const raw = await this.fetchPaginatedNewQuizQuizzes(courseId, token, baseUrl);
    const rows: any[] = [];
    for (const q of raw) {
      const row = this.normalizeNewQuizListItem(q);
      if (row) rows.push(row);
    }
    await this.enrichNewQuizRowsFromDetail(courseId, rows, token, baseUrl);
    const rubricLookup = await this.getAssignmentRubricLookup(courseId, token, baseUrl);
    return rows.map((row: any) => {
      const assignmentId = Number(row?.id);
      const rubric = Number.isFinite(assignmentId) ? rubricLookup.get(assignmentId) : null;
      return {
        ...row,
        rubric_id: rubric?.rubric_id ?? null,
        rubric_summary: rubric?.rubric_summary ?? null,
        rubric_url: rubric?.rubric_url ?? null,
        rubric_association_id: rubric?.rubric_association_id ?? null,
      };
    });
  }

  async updateNewQuizRow(courseId: number, assignmentId: number, updates: Record<string, any>) {
    const { token, baseUrl } = await this.getAuthHeaders();
    const assignmentUpdates: Record<string, any> = { ...updates };
    const quizUpdates: { instructions?: string; title?: string } = {};

    if (Object.prototype.hasOwnProperty.call(assignmentUpdates, 'description')) {
      const rawDesc = assignmentUpdates.description;
      quizUpdates.instructions = rawDesc === null || rawDesc === undefined ? '' : String(rawDesc);
      delete assignmentUpdates.description;
    }
    if (Object.prototype.hasOwnProperty.call(assignmentUpdates, 'name')) {
      const rawTitle = assignmentUpdates.name;
      quizUpdates.title = rawTitle === null || rawTitle === undefined ? '' : String(rawTitle);
      delete assignmentUpdates.name;
    }

    if (Object.keys(quizUpdates).length > 0) {
      await this.patchNewQuizByAssignment(courseId, assignmentId, quizUpdates, token, baseUrl);
    }

    if (Object.keys(assignmentUpdates).length > 0) {
      return this.updateAssignment(courseId, assignmentId, assignmentUpdates);
    }

    return this.getAssignment(courseId, assignmentId);
  }

  async createNewQuiz(courseId: number, body: Record<string, any>): Promise<any> {
    const { token, baseUrl } = await this.getAuthHeaders();
    const quizBase = this.quizApiV1Base(baseUrl);
    const url = `${quizBase}/courses/${courseId}/quizzes`;
    const payload: Record<string, any> = {};
    if (body.title != null) payload.title = body.title;
    if (body.name != null) payload.title = payload.title ?? body.name;
    if (body.instructions != null) payload.instructions = body.instructions;
    if (body.description != null) payload.instructions = payload.instructions ?? body.description;
    if (body.assignment_group_id != null) payload.assignment_group_id = body.assignment_group_id;
    if (body.points_possible != null) payload.points_possible = body.points_possible;
    if (body.due_at != null) payload.due_at = body.due_at;
    if (body.unlock_at != null) payload.unlock_at = body.unlock_at;
    if (body.lock_at != null) payload.lock_at = body.lock_at;
    const form = new URLSearchParams();
    Object.entries(payload).forEach(([k, v]) => {
      if (v !== undefined && v !== null) form.append(k, String(v));
    });
    const requestAttempts: Array<{ contentType: string; body: string }> = [
      { contentType: 'application/json', body: JSON.stringify(payload) },
      { contentType: 'application/json', body: JSON.stringify({ quiz: payload }) },
      { contentType: 'application/x-www-form-urlencoded', body: form.toString() },
    ];

    let created: any = null;
    let lastErrorText = '';
    for (const attempt of requestAttempts) {
      const res = await fetch(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': attempt.contentType },
        body: attempt.body,
      });
      const text = await res.text();
      if (res.ok) {
        try {
          created = text ? JSON.parse(text) : {};
        } catch {
          created = {};
        }
        break;
      }
      lastErrorText = text || `${res.status} ${res.statusText}`;
      if (![400, 415, 422].includes(res.status)) {
        break;
      }
    }

    if (!created) {
      let errMsg = lastErrorText;
      try {
        const j = JSON.parse(lastErrorText);
        errMsg = j.message || j.error || errMsg;
      } catch {
        /* ignore */
      }
      throw new Error(`New Quizzes API: ${errMsg}`);
    }
    const id = created.assignment_id ?? created.id ?? created.assignmentId;
    return { ...created, id };
  }

  private async patchNewQuizByAssignment(
    courseId: number,
    assignmentId: number,
    quizUpdates: { instructions?: string; title?: string },
    token: string,
    canvasApiV1Base: string,
  ): Promise<any> {
    const quizBase = this.quizApiV1Base(canvasApiV1Base);
    const url = `${quizBase}/courses/${courseId}/quizzes/${assignmentId}`;
    const params = new URLSearchParams();
    if (Object.prototype.hasOwnProperty.call(quizUpdates, 'instructions')) {
      params.append('quiz[instructions]', quizUpdates.instructions ?? '');
    }
    if (Object.prototype.hasOwnProperty.call(quizUpdates, 'title')) {
      params.append('quiz[title]', quizUpdates.title ?? '');
    }
    const formBody = params.toString();
    const jsonBody = JSON.stringify({ quiz: quizUpdates });
    const tryRequest = async (contentType: string, body: string) => {
      console.log(`[Service][NewQuiz] PATCH ${url}`);
      console.log(`[Service][NewQuiz] Request Content-Type: ${contentType}`);
      console.log(`[Service][NewQuiz] Request Body: ${body}`);
      const res = await fetch(url, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': contentType },
        body,
      });
      const text = await res.text();
      console.log(`[Service][NewQuiz] Response Status: ${res.status} ${res.statusText}`);
      console.log(`[Service][NewQuiz] Response Body: ${text}`);
      return { ok: res.ok, status: res.status, text };
    };
    let result = await tryRequest('application/x-www-form-urlencoded', formBody);
    if (!result.ok && (result.status === 400 || result.status === 415 || result.status === 422)) {
      result = await tryRequest('application/json', jsonBody);
    }
    if (!result.ok) {
      let errMsg: string;
      try {
        const j = JSON.parse(result.text);
        errMsg = j.message || j.error || result.text;
      } catch {
        errMsg = result.text || `${result.status}`;
      }
      throw new Error(`New Quizzes API: ${errMsg}`);
    }
    try {
      return JSON.parse(result.text);
    } catch {
      return { ok: true };
    }
  }

  async getCourseDetails(courseId: number) {
    const { token, baseUrl } = await this.getAuthHeaders();

    const response = await fetch(`${baseUrl}/courses/${courseId}?include[]=syllabus_body&include[]=total_scores`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error(`Canvas API Error: ${response.statusText}`);
    }

    return await response.json();
  }

  async getCourseStudents(courseId: number) {
    try {
      await this.ensureAccommodationColumns(courseId);
    } catch (error: any) {
      console.warn(`[Service] Failed to ensure accommodation columns before fetching students:`, error.message);
    }
    
    const { token, baseUrl } = await this.getAuthHeaders();

    let allStudents: any[] = [];
    let url: string | null = `${baseUrl}/courses/${courseId}/enrollments?per_page=100&type[]=StudentEnrollment&include[]=user`;

    while (url) {
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error(`Canvas API Error: ${response.statusText}`);
      }

      const chunk = await response.json();
      if (Array.isArray(chunk)) {
        allStudents.push(...chunk);
      }

      const linkHeader = response.headers.get('link');
      url = this.getNextUrl(linkHeader);
    }

    // Extract and format student data
    return allStudents.map((enrollment) => ({
      id: enrollment.user?.id || enrollment.user_id,
      name: enrollment.user?.name || enrollment.user?.display_name || 'Unknown',
      email: enrollment.user?.email || enrollment.user?.login_id || null,
      sis_user_id: enrollment.user?.sis_user_id || null,
      enrollment_id: enrollment.id,
      enrollment_type: enrollment.type,
      enrollment_state: enrollment.enrollment_state,
      created_at: enrollment.created_at,
      updated_at: enrollment.updated_at,
    }));
  }

  private async fetchPaginatedData(url: string, token: string): Promise<any[]> {
    try {
      let allData: any[] = [];
      let currentUrl: string | null = url;
      let pageCount = 0;

      while (currentUrl) {
        pageCount++;
        console.log(`[Service] Fetching page ${pageCount} from: ${currentUrl}`);
        
        const response = await fetch(currentUrl, {
          headers: { Authorization: `Bearer ${token}` },
        });

        console.log(`[Service] Response status: ${response.status} ${response.statusText}`);

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[Service] Canvas API error: ${response.status} ${response.statusText}`);
          console.error(`[Service] Error response: ${errorText}`);
          throw new Error(`Canvas API Error: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const responseText = await response.text();
        console.log(`[Service] Response body length: ${responseText.length} characters`);
        console.log(`[Service] Raw response body: ${responseText.substring(0, 500)}${responseText.length > 500 ? '...' : ''}`);
        
        let chunk;
        try {
          chunk = JSON.parse(responseText);
        } catch (parseError: any) {
          console.error(`[Service] Failed to parse JSON: ${parseError.message}`);
          console.error(`[Service] Response text: ${responseText}`);
          throw new Error(`Invalid JSON response: ${parseError.message}`);
        }
        
        console.log(`[Service] Parsed chunk type: ${Array.isArray(chunk) ? 'array' : typeof chunk}, length: ${Array.isArray(chunk) ? chunk.length : 'N/A'}`);
        
        if (Array.isArray(chunk)) {
          allData.push(...chunk);
          console.log(`[Service] Added ${chunk.length} items, total: ${allData.length}`);
        } else if (chunk) {
          // Some endpoints return objects instead of arrays
          allData.push(chunk);
          console.log(`[Service] Added 1 object, total: ${allData.length}`);
        } else {
          console.log(`[Service] Chunk is null/undefined, skipping`);
        }

        const linkHeader = response.headers.get('link');
        console.log(`[Service] Link header: ${linkHeader || 'none'}`);
        currentUrl = this.getNextUrl(linkHeader);
        
        if (currentUrl) {
          console.log(`[Service] More pages available, next URL: ${currentUrl}`);
        } else {
          console.log(`[Service] No more pages, total items: ${allData.length}`);
        }
      }

      console.log(`[Service] fetchPaginatedData complete, returning ${allData.length} items`);
      return allData;
    } catch (error: any) {
      console.error(`[Service] Error in fetchPaginatedData:`, error);
      console.error(`[Service] Error message:`, error.message);
      console.error(`[Service] Error stack:`, error.stack);
      throw error;
    }
  }

  async getCourseQuizzes(courseId: number) {
    try {
      console.log(`[Service] Getting quizzes for course ${courseId}`);
      const { token, baseUrl } = await this.getAuthHeaders();
      const url = `${baseUrl}/courses/${courseId}/quizzes?per_page=100`;
      console.log(`[Service] Fetching from: ${url}`);
      console.log(`[Service] Base URL: ${baseUrl}`);
      console.log(`[Service] Course ID: ${courseId}`);
      console.log(`[Service] Full URL: ${url}`);
      const result = await this.fetchPaginatedData(url, token);
      const rubricLookup = await this.getAssignmentRubricLookup(courseId, token, baseUrl);
      const enriched = result.map((quiz: any) => {
        const assignmentId = Number(quiz?.assignment_id);
        const rubric = Number.isFinite(assignmentId) ? rubricLookup.get(assignmentId) : null;
        return {
          ...quiz,
          rubric_id: rubric?.rubric_id ?? null,
          rubric_summary: rubric?.rubric_summary ?? null,
          rubric_url: rubric?.rubric_url ?? null,
          rubric_association_id: rubric?.rubric_association_id ?? null,
        };
      });
      console.log(`[Service] Retrieved ${enriched.length} quizzes`);
      return enriched;
    } catch (error: any) {
      console.error(`[Service] Error in getCourseQuizzes for course ${courseId}:`, error);
      console.error(`[Service] Error message:`, error.message);
      console.error(`[Service] Error stack:`, error.stack);
      throw error;
    }
  }

  async getCourseAssignments(courseId: number): Promise<any[]> {
    const { token, baseUrl } = await this.getAuthHeaders();
    const url = `${baseUrl}/courses/${courseId}/assignments?per_page=100&include[]=submission`;
    const assignments = await this.fetchPaginatedData(url, token);
    const pure = assignments.filter((a: any) => !this.isQuizLinkedAssignment(a));
    const rubricLookup = await this.getAssignmentRubricLookup(courseId, token, baseUrl);
    return pure.map((assignment: any) => {
      const assignmentId = Number(assignment?.id);
      const rubric = Number.isFinite(assignmentId) ? rubricLookup.get(assignmentId) : null;
      return {
        ...assignment,
        rubric_id: rubric?.rubric_id ?? null,
        rubric_summary: rubric?.rubric_summary ?? null,
        rubric_url: rubric?.rubric_url ?? null,
        rubric_association_id: rubric?.rubric_association_id ?? null,
      };
    });
  }

  async getCourseAssignmentGroups(courseId: number) {
    try {
      const { token, baseUrl } = await this.getAuthHeaders();
      const url = `${baseUrl}/courses/${courseId}/assignment_groups?per_page=100`;
      const groups = await this.fetchPaginatedData(url, token);
      console.log(`[Service] Retrieved ${groups.length} assignment groups for course ${courseId}`);
      return groups;
    } catch (error: any) {
      console.error(`[Service] Error in getCourseAssignmentGroups for course ${courseId}:`, error);
      throw error;
    }
  }

  private canvasHtmlBase(apiV1BaseUrl: string): string {
    const trimmed = apiV1BaseUrl.replace(/\/$/, '');
    return trimmed.endsWith('/api/v1') ? trimmed.slice(0, -'/api/v1'.length) : trimmed;
  }

  private async getAssignmentRubricLookup(courseId: number, token: string, baseUrl: string): Promise<Map<number, { rubric_id: number; rubric_summary: string; rubric_url: string; rubric_association_id: number | null }>> {
    const rubricsUrl = `${baseUrl}/courses/${courseId}/rubrics?per_page=100&include[]=associations`;
    const rubrics = await this.fetchPaginatedData(rubricsUrl, token);
    const htmlBase = this.canvasHtmlBase(baseUrl);
    const map = new Map<number, { rubric_id: number; rubric_summary: string; rubric_url: string; rubric_association_id: number | null }>();
    rubrics.forEach((rubric: any) => {
      const rubricId = Number(rubric?.id);
      if (!Number.isFinite(rubricId)) return;
      const associations = Array.isArray(rubric?.associations) ? rubric.associations : [];
      associations.forEach((assoc: any) => {
        const associationId = Number(assoc?.association_id);
        if (!Number.isFinite(associationId)) return;
        if (String(assoc?.association_type || '') !== 'Assignment') return;
        map.set(associationId, {
          rubric_id: rubricId,
          rubric_summary: String(rubric?.title || `Rubric ${rubricId}`),
          rubric_url: `${htmlBase}/courses/${courseId}/rubrics/${rubricId}`,
          rubric_association_id: Number.isFinite(Number(assoc?.id)) ? Number(assoc.id) : null,
        });
      });
    });
    return map;
  }

  async getCourseRubrics(courseId: number) {
    const { token, baseUrl } = await this.getAuthHeaders();
    const htmlBase = this.canvasHtmlBase(baseUrl);
    const rubricsUrl = `${baseUrl}/courses/${courseId}/rubrics?per_page=100`;
    const rubrics = await this.fetchPaginatedData(rubricsUrl, token);
    return rubrics
      .map((r: any) => {
        const id = Number(r?.id);
        if (!Number.isFinite(id)) return null;
        return {
          id,
          title: String(r?.title || `Rubric ${id}`),
          url: `${htmlBase}/courses/${courseId}/rubrics/${id}`,
        };
      })
      .filter(Boolean);
  }

  async createCourseRubric(
    courseId: number,
    body: { title?: string; association_id?: number; association_type?: string },
  ) {
    const { token, baseUrl } = await this.getAuthHeaders();
    const htmlBase = this.canvasHtmlBase(baseUrl);
    const title = (body?.title || 'New Rubric').trim() || 'New Rubric';
    const associationType = body?.association_type || 'Assignment';
    const associationId = body?.association_id != null ? Number(body.association_id) : null;
    const url = `${baseUrl}/courses/${courseId}/rubrics`;
    const withCriteria = new URLSearchParams();
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
    const noCriteria = new URLSearchParams(withCriteria.toString());
    ['rubric[criteria][0][description]', 'rubric[criteria][0][points]', 'rubric[criteria][0][ratings][0][description]', 'rubric[criteria][0][ratings][0][points]', 'rubric[criteria][0][ratings][1][description]', 'rubric[criteria][0][ratings][1][points]'].forEach((k) => noCriteria.delete(k));

    const attempts = [withCriteria, noCriteria];
    let payload: any = null;
    let lastError = '';
    for (const params of attempts) {
      const res = await fetch(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      });
      const text = await res.text();
      if (res.ok) {
        try {
          payload = text ? JSON.parse(text) : {};
        } catch {
          payload = {};
        }
        break;
      }
      lastError = text || `${res.status} ${res.statusText}`;
      if (![400, 415, 422].includes(res.status)) break;
    }

    if (!payload) {
      throw new Error(`Failed to create rubric: ${lastError}`);
    }

    const rubric = payload.rubric || payload;
    const id = Number(rubric?.id);
    if (!Number.isFinite(id)) {
      throw new Error('Rubric created but ID was not returned');
    }
    return {
      id,
      title: String(rubric?.title || title),
      url: `${htmlBase}/courses/${courseId}/rubrics/${id}`,
    };
  }

  private async upsertAssignmentRubricAssociation(
    courseId: number,
    assignmentId: number,
    rubricId: number | null,
    token: string,
    baseUrl: string,
  ): Promise<void> {
    const lookup = await this.getAssignmentRubricLookup(courseId, token, baseUrl);
    const current = lookup.get(assignmentId);

    if (rubricId == null) {
      if (current?.rubric_association_id) {
        await fetch(`${baseUrl}/courses/${courseId}/rubric_associations/${current.rubric_association_id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      return;
    }

    if (current?.rubric_id === rubricId) return;

    const params = new URLSearchParams();
    params.append('rubric_association[rubric_id]', String(rubricId));
    params.append('rubric_association[association_id]', String(assignmentId));
    params.append('rubric_association[association_type]', 'Assignment');
    params.append('rubric_association[purpose]', 'grading');
    params.append('rubric_association[use_for_grading]', 'true');

    const targetUrl = current?.rubric_association_id
      ? `${baseUrl}/courses/${courseId}/rubric_associations/${current.rubric_association_id}`
      : `${baseUrl}/courses/${courseId}/rubric_associations`;
    const method = current?.rubric_association_id ? 'PUT' : 'POST';
    const res = await fetch(targetUrl, {
      method,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to update rubric association: ${res.status} ${res.statusText} - ${text}`);
    }
  }

  async createAssignmentGroup(courseId: number, name: string, groupWeight?: number) {
    try {
      const { token, baseUrl } = await this.getAuthHeaders();
      const url = `${baseUrl}/courses/${courseId}/assignment_groups`;
      
      const body: any = { name: name };
      if (groupWeight !== undefined) {
        body.group_weight = groupWeight;
      }
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Canvas API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      console.log(`[Service] Created assignment group "${name}" with ID: ${result.id}`);
      return result;
    } catch (error: any) {
      console.error(`[Service] Error creating assignment group:`, error);
      throw error;
    }
  }

  async updateAssignmentGroup(courseId: number, groupId: number, updates: { name?: string; group_weight?: number }) {
    try {
      const { token, baseUrl } = await this.getAuthHeaders();
      const url = `${baseUrl}/courses/${courseId}/assignment_groups/${groupId}`;
      
      const body: any = {};
      if (updates.name !== undefined) {
        body.name = updates.name;
      }
      if (updates.group_weight !== undefined) {
        body.group_weight = updates.group_weight;
      }
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Canvas API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      console.log(`[Service] Updated assignment group ${groupId}`);
      return result;
    } catch (error: any) {
      console.error(`[Service] Error updating assignment group:`, error);
      throw error;
    }
  }

  async deleteAssignmentGroup(courseId: number, groupId: number) {
    try {
      const { token, baseUrl } = await this.getAuthHeaders();
      const url = `${baseUrl}/courses/${courseId}/assignment_groups/${groupId}`;
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Canvas API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      console.log(`[Service] Deleted assignment group ${groupId}`);
      return { success: true };
    } catch (error: any) {
      console.error(`[Service] Error deleting assignment group:`, error);
      throw error;
    }
  }

  async getCourseDiscussions(courseId: number) {
    const { token, baseUrl } = await this.getAuthHeaders();
    const url = `${baseUrl}/courses/${courseId}/discussion_topics?per_page=100`;
    const discussions = await this.fetchPaginatedData(url, token);
    const htmlBase = this.canvasHtmlBase(baseUrl);

    const assignmentsUrl = `${baseUrl}/courses/${courseId}/assignments?per_page=100`;
    const assignments = await this.fetchPaginatedData(assignmentsUrl, token);
    const assignmentById = new Map<number, any>();
    assignments.forEach((a: any) => {
      const id = Number(a?.id);
      if (Number.isFinite(id)) assignmentById.set(id, a);
    });
    const rubricLookup = await this.getAssignmentRubricLookup(courseId, token, baseUrl);

    return discussions.map((topic: any) => {
      const assignmentId = Number(topic?.assignment_id);
      const assignment = Number.isFinite(assignmentId) ? assignmentById.get(assignmentId) : null;
      const rubric = Number.isFinite(assignmentId) ? rubricLookup.get(assignmentId) : null;
      const assignmentRubricId = Number(assignment?.rubric_settings?.id ?? assignment?.rubric_id);
      const rubricId = rubric?.rubric_id ?? (Number.isFinite(assignmentRubricId) ? assignmentRubricId : null);
      const rubricSummary =
        rubric?.rubric_summary ??
        assignment?.rubric_settings?.title ??
        (rubricId != null ? `Rubric ${rubricId}` : null);
      const rubricUrl =
        rubric?.rubric_url ??
        (rubricId != null ? `${htmlBase}/courses/${courseId}/rubrics/${rubricId}` : null);
      return {
        ...topic,
        graded: Boolean(assignment),
        points_possible: assignment?.points_possible ?? null,
        assignment_group_id: assignment?.assignment_group_id ?? topic?.assignment_group_id ?? null,
        due_at: assignment?.due_at ?? topic?.due_at ?? null,
        unlock_at: assignment?.unlock_at ?? topic?.unlock_at ?? null,
        lock_at: topic?.lock_at ?? assignment?.lock_at ?? null,
        rubric_id: rubricId,
        rubric_summary: rubricSummary,
        rubric_url: rubricUrl,
        rubric_association_id: rubric?.rubric_association_id ?? null,
      };
    });
  }

  private extractTextFromBlockEditorBlocks(blocks: unknown): string {
    if (blocks == null) return '';
    if (typeof blocks === 'string') {
      const t = blocks.trim();
      if (!t) return '';
      try {
        return this.extractTextFromBlockEditorBlocks(JSON.parse(blocks));
      } catch {
        return t;
      }
    }
    if (typeof blocks === 'number' || typeof blocks === 'boolean') {
      return String(blocks);
    }
    if (Array.isArray(blocks)) {
      return blocks
        .map((x) => this.extractTextFromBlockEditorBlocks(x))
        .filter((s) => s.length > 0)
        .join(' ');
    }
    if (typeof blocks === 'object') {
      const o = blocks as Record<string, unknown>;
      if (typeof o.text === 'string' && o.text.trim()) return o.text.trim();
      const nestedKeys = ['content', 'children', 'blocks', 'nodes', 'items'];
      const parts: string[] = [];
      for (const k of nestedKeys) {
        if (o[k] != null) {
          const p = this.extractTextFromBlockEditorBlocks(o[k]);
          if (p) parts.push(p);
        }
      }
      return parts.join(' ');
    }
    return '';
  }

  private nonEmptyBodyString(value: unknown): string | null {
    if (value == null) return null;
    const s = typeof value === 'string' ? value : String(value);
    return s.trim() === '' ? null : s;
  }

  private async resolveWikiPageBodyForGrid(
    courseId: number,
    pageUrlSlug: string,
    pageDetails: Record<string, any>,
    token: string,
    baseUrl: string,
  ): Promise<string | null> {
    const fromTop = this.nonEmptyBodyString(pageDetails.body);
    if (fromTop) return fromTop;

    const fromWiki = this.nonEmptyBodyString(
      pageDetails.wiki_page?.body ?? pageDetails.wiki_page?.['body'],
    );
    if (fromWiki) return fromWiki;

    const fromBlocks = this.extractTextFromBlockEditorBlocks(
      pageDetails.block_editor_attributes?.blocks,
    ).trim();
    if (fromBlocks) return fromBlocks;

    try {
      const revUrl = `${baseUrl}/courses/${courseId}/pages/${encodeURIComponent(pageUrlSlug)}/revisions/latest`;
      const revRes = await fetch(revUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (revRes.ok) {
        const rev = await revRes.json();
        const fromRev = this.nonEmptyBodyString(rev.body);
        if (fromRev) return fromRev;
      }
    } catch (_) {}

    return typeof pageDetails.body === 'string' ? pageDetails.body : null;
  }

  async getCoursePages(courseId: number) {
    const { token, baseUrl } = await this.getAuthHeaders();
    const url = `${baseUrl}/courses/${courseId}/pages?per_page=100`;
    const pages = await this.fetchPaginatedData(url, token);
    
    const pagesWithBody = await Promise.all(
      pages.map(async (page) => {
        if (page.url) {
          try {
            const pageUrl =
              `${baseUrl}/courses/${courseId}/pages/${encodeURIComponent(page.url)}` +
              '?include[]=body&include[]=block_editor_attributes';
            const pageResponse = await fetch(pageUrl, {
              headers: { Authorization: `Bearer ${token}` },
            });
            
            if (pageResponse.ok) {
              const pageDetails = await pageResponse.json();
              const body = await this.resolveWikiPageBodyForGrid(
                courseId,
                page.url,
                pageDetails,
                token,
                baseUrl,
              );
              return {
                ...page,
                body: body ?? null,
                html_url: pageDetails.html_url || page.html_url || null,
              };
            }
          } catch (error) {
            console.warn(`[Service] Failed to fetch body for page ${page.url}:`, error);
          }
        }
        return page;
      })
    );
    
    return pagesWithBody;
  }

  async getCourseAnnouncements(courseId: number) {
    const { token, baseUrl } = await this.getAuthHeaders();
    const url = `${baseUrl}/courses/${courseId}/discussion_topics?only_announcements=true&per_page=100`;
    const announcements = await this.fetchPaginatedData(url, token);

    const withMessage = await Promise.all(
      announcements.map(async (row: any) => {
        if (!row?.id) return row;
        try {
          const full = await this.getDiscussion(courseId, row.id);
          return {
            ...row,
            ...full,
            message: full.message ?? row.message,
            title: full.title ?? row.title,
            delayed_post_at: full.delayed_post_at ?? row.delayed_post_at ?? null,
            lock_at: full.lock_at ?? row.lock_at ?? null,
            posted_at: full.posted_at ?? row.posted_at ?? null,
          };
        } catch {
          return row;
        }
      }),
    );

    return withMessage;
  }

  async getCourseModules(courseId: number) {
    const { token, baseUrl } = await this.getAuthHeaders();
    const url = `${baseUrl}/courses/${courseId}/modules?per_page=100&include[]=items`;
    return await this.fetchPaginatedData(url, token);
  }

  async getCourseFiles(courseId: number) {
    const { token, baseUrl } = await this.getAuthHeaders();
    const filesUrl = `${baseUrl}/courses/${courseId}/files?per_page=100`;
    const files = await this.fetchPaginatedData(filesUrl, token);
    const foldersUrl = `${baseUrl}/courses/${courseId}/folders?per_page=100`;
    const folders = await this.fetchPaginatedData(foldersUrl, token);
    const folderMap = new Map<number, string>();
    folders.forEach((folder: any) => {
      if (folder.id && folder.full_name) {
        folderMap.set(folder.id, folder.full_name);
      }
    });
    const filesWithMeta = files.map((file: any) => {
      const folderPath = file.folder_id ? (folderMap.get(file.folder_id) || 'Unknown') : 'Root';
      return { ...file, usage: [], folder_path: folderPath, is_folder: false };
    });
    
    const foldersWithCounts = folders.map((folder: any) => {
      const fileCount = folder.files_count || 0;
      const folderCount = folder.folders_count ?? 0;
      const folderPath = folder.parent_folder_id ? (folderMap.get(folder.parent_folder_id) || 'Unknown') : 'Root';
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
        folder_count: folderCount
      };
    });
    return [...filesWithMeta, ...foldersWithCounts];
  }

  private async getCourseRootFolderId(courseId: number, token: string, baseUrl: string): Promise<number> {
    const res = await fetch(`${baseUrl}/courses/${courseId}/folders/root`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const t = await res.text().catch(() => '');
      throw new Error(`Failed to resolve root folder: ${res.status} ${res.statusText}${t ? ` - ${t}` : ''}`);
    }
    const folder = await res.json();
    const id = Number(folder?.id);
    if (!Number.isFinite(id)) throw new Error('Invalid root folder id returned by Canvas');
    return id;
  }

  async copyFileToFolder(
    courseId: number,
    sourceFileId: number,
    destFolderId?: number | null,
    displayName?: string,
  ) {
    const { token, baseUrl } = await this.getAuthHeaders();
    const targetFolderId = Number.isFinite(Number(destFolderId))
      ? Number(destFolderId)
      : await this.getCourseRootFolderId(courseId, token, baseUrl);

    const body = new URLSearchParams();
    body.set('source_file_id', String(sourceFileId));
    body.set('on_duplicate', 'rename');

    const copyRes = await fetch(`${baseUrl}/folders/${targetFolderId}/copy_file`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });
    const copyText = await copyRes.text();
    if (!copyRes.ok) {
      throw new Error(`Canvas API error: ${copyRes.status} ${copyRes.statusText} - ${copyText}`);
    }
    let copied: any = {};
    if (copyText) {
      try {
        copied = JSON.parse(copyText);
      } catch {
        copied = {};
      }
    }

    const desiredName = (displayName || '').trim();
    const currentName = String(copied?.display_name || copied?.filename || copied?.name || '').trim();
    if (desiredName && copied?.id && desiredName !== currentName) {
      return this.updateFile(courseId, Number(copied.id), { name: desiredName });
    }
    return copied;
  }

  async createFolder(courseId: number, name: string, parentFolderId?: number | null) {
    const { token, baseUrl } = await this.getAuthHeaders();
    const body = new URLSearchParams();
    body.set('name', name);
    if (parentFolderId != null && Number.isFinite(Number(parentFolderId))) {
      body.set('parent_folder_id', String(parentFolderId));
    }
    const res = await fetch(`${baseUrl}/courses/${courseId}/folders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`Canvas API error: ${res.status} ${res.statusText} - ${text}`);
    try {
      return JSON.parse(text);
    } catch {
      return {};
    }
  }

  async copyFolderToFolder(
    courseId: number,
    sourceFolderId: number,
    destFolderId?: number | null,
    name?: string,
  ) {
    const { token, baseUrl } = await this.getAuthHeaders();
    const targetFolderId = Number.isFinite(Number(destFolderId))
      ? Number(destFolderId)
      : await this.getCourseRootFolderId(courseId, token, baseUrl);

    const body = new URLSearchParams();
    body.set('source_folder_id', String(sourceFolderId));
    const copyRes = await fetch(`${baseUrl}/folders/${targetFolderId}/copy_folder`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });
    const copyText = await copyRes.text();
    if (!copyRes.ok) {
      throw new Error(`Canvas API error: ${copyRes.status} ${copyRes.statusText} - ${copyText}`);
    }
    let copied: any = {};
    if (copyText) {
      try {
        copied = JSON.parse(copyText);
      } catch {
        copied = {};
      }
    }

    const desiredName = (name || '').trim();
    const currentName = String(copied?.name || copied?.full_name || '').trim();
    if (desiredName && copied?.id && desiredName !== currentName) {
      return this.updateFolder(Number(copied.id), { name: desiredName });
    }
    return copied;
  }

  private async getFileUsage(courseId: number, fileId: number): Promise<Array<{ type: string; id: number; title: string }>> {
    const { token, baseUrl } = await this.getAuthHeaders();
    const usage: Array<{ type: string; id: number; title: string }> = [];
    
    try {
      const fileUrl = `${baseUrl}/files/${fileId}`;
      const fileResponse = await fetch(fileUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!fileResponse.ok) return usage;
      
      const fileData = await fileResponse.json();
      const fileUrlPattern = fileData.url ? new RegExp(fileData.url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi') : null;
      const fileIdPattern = new RegExp(`/files/${fileId}`, 'gi');
      
      const [assignments, quizzes, pages, discussions] = await Promise.all([
        this.fetchPaginatedData(`${baseUrl}/courses/${courseId}/assignments?per_page=100`, token).catch(() => []),
        this.fetchPaginatedData(`${baseUrl}/courses/${courseId}/quizzes?per_page=100`, token).catch(() => []),
        this.fetchPaginatedData(`${baseUrl}/courses/${courseId}/pages?per_page=100`, token).catch(() => []),
        this.fetchPaginatedData(`${baseUrl}/courses/${courseId}/discussions?per_page=100`, token).catch(() => []),
      ]);
      
      assignments.forEach((assignment: any) => {
        const content = (assignment.description || assignment.instructions || '').toLowerCase();
        const matchesUrl = fileUrlPattern ? fileUrlPattern.test(content) : false;
        if (matchesUrl || fileIdPattern.test(content)) {
          usage.push({ type: 'Assignment', id: assignment.id, title: assignment.name || assignment.title || 'Untitled' });
        }
      });
      
      quizzes.forEach((quiz: any) => {
        const content = (quiz.description || '').toLowerCase();
        const matchesUrl = fileUrlPattern ? fileUrlPattern.test(content) : false;
        if (matchesUrl || fileIdPattern.test(content)) {
          usage.push({ type: 'Quiz', id: quiz.id, title: quiz.title || 'Untitled' });
        }
      });
      
      pages.forEach((page: any) => {
        const content = (page.body || '').toLowerCase();
        const matchesUrl = fileUrlPattern ? fileUrlPattern.test(content) : false;
        if (matchesUrl || fileIdPattern.test(content)) {
          usage.push({ type: 'Page', id: page.page_id, title: page.title || page.url || 'Untitled' });
        }
      });
      
      discussions.forEach((discussion: any) => {
        const content = (discussion.message || '').toLowerCase();
        const matchesUrl = fileUrlPattern ? fileUrlPattern.test(content) : false;
        if (matchesUrl || fileIdPattern.test(content)) {
          usage.push({ type: 'Discussion', id: discussion.id, title: discussion.title || 'Untitled' });
        }
      });
    } catch (error) {
      console.error(`[Service] Error checking file usage for file ${fileId}:`, error);
    }
    
    return usage;
  }

  async bulkDeleteFiles(courseId: number, fileIds: number[], isFolders: boolean[] = []) {
    const { token, baseUrl } = await this.getAuthHeaders();
    const results: Array<{ fileId: number; success: boolean; error?: string }> = [];

    for (let i = 0; i < fileIds.length; i++) {
      const fileId = fileIds[i];
      const isFolder = isFolders[i] || false;
      
      try {
        const url = isFolder ? `${baseUrl}/folders/${fileId}` : `${baseUrl}/files/${fileId}`;
        const response = await fetch(url, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to delete ${isFolder ? 'folder' : 'file'} ${fileId}: ${response.status} ${response.statusText} - ${errorText}`);
        }

        results.push({ fileId, success: true });
      } catch (error: any) {
        console.error(`[Service] Error deleting ${isFolder ? 'folder' : 'file'} ${fileId}:`, error);
        results.push({ fileId, success: false, error: error.message });
      }
    }

    return results;
  }

  async updateFile(courseId: number, fileId: number, updates: Record<string, any>) {
    const { token, baseUrl } = await this.getAuthHeaders();
    const payload: Record<string, any> = {};
    if (updates.name != null) payload.name = updates.name;
    if (updates.display_name != null) payload.name = updates.display_name;
    if (updates.locked != null) payload.locked = !!updates.locked;
    if (updates.lock_at != null) payload.lock_at = updates.lock_at;
    if (updates.unlock_at != null) payload.unlock_at = updates.unlock_at;
    if (updates.hidden != null) payload.hidden = !!updates.hidden;
    if (Object.keys(payload).length === 0) throw new Error('No valid file updates provided');

    const url = `${baseUrl}/files/${fileId}`;
    const response = await fetch(url, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Canvas API error: ${response.status} ${response.statusText} - ${errorText}`);
    }
    try {
      return await response.json();
    } catch {
      return { id: fileId };
    }
  }

  async updateFolder(folderId: number, updates: Record<string, any>) {
    const { token, baseUrl } = await this.getAuthHeaders();
    const payload: Record<string, any> = {};
    if (updates.name != null) payload.name = updates.name;
    if (updates.display_name != null) payload.name = updates.display_name;
    if (updates.locked != null) payload.locked = !!updates.locked;
    if (updates.lock_at != null) payload.lock_at = updates.lock_at;
    if (updates.unlock_at != null) payload.unlock_at = updates.unlock_at;
    if (updates.hidden != null) payload.hidden = !!updates.hidden;
    if (Object.keys(payload).length === 0) throw new Error('No valid folder updates provided');

    const url = `${baseUrl}/folders/${folderId}`;
    const response = await fetch(url, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Canvas API error: ${response.status} ${response.statusText} - ${errorText}`);
    }
    try {
      return await response.json();
    } catch {
      return { id: folderId };
    }
  }

  async renameFile(courseId: number, fileId: number, newName: string) {
    return this.updateFile(courseId, fileId, { name: newName });
  }

  async renameFolder(folderId: number, newName: string) {
    return this.updateFolder(folderId, { name: newName });
  }

  async getCourseAccommodations(courseId: number) {
    const { token, baseUrl } = await this.getAuthHeaders();
    const assignUrl = `${baseUrl}/courses/${courseId}/assignments?per_page=100&include[]=submission`;
    const assignments = await this.fetchPaginatedData(assignUrl, token);
    const allOverrides: any[] = [];

    // Get overrides for each assignment
    for (const assignment of assignments) {
      try {
        const url = `${baseUrl}/courses/${courseId}/assignments/${assignment.id}/overrides?per_page=100`;
        const overrides = await this.fetchPaginatedData(url, token);
        allOverrides.push(...overrides.map((override: any) => ({
          ...override,
          assignment_id: assignment.id,
          assignment_name: assignment.name,
        })));
      } catch (error) {
        // Some assignments may not have overrides, continue
        console.warn(`Could not fetch overrides for assignment ${assignment.id}`);
      }
    }

    // Also fetch quiz extensions
    const quizzes = await this.getCourseQuizzes(courseId);
    for (const quiz of quizzes) {
      try {
        const url = `${baseUrl}/courses/${courseId}/quizzes/${quiz.id}/extensions?per_page=100`;
        const extensions = await this.fetchPaginatedData(url, token);
        allOverrides.push(...extensions.map((ext: any) => ({
          ...ext,
          quiz_id: quiz.id,
          quiz_name: quiz.title,
          type: 'quiz_extension',
        })));
      } catch (error) {
        // Some quizzes may not have extensions, continue
        console.warn(`Could not fetch extensions for quiz ${quiz.id}`);
      }
    }

    return allOverrides;
  }

  // Individual GET methods (for fetching full item data)
  async getAssignment(courseId: number, assignmentId: number) {
    const { token, baseUrl } = await this.getAuthHeaders();
    const response = await fetch(`${baseUrl}/courses/${courseId}/assignments/${assignmentId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get assignment: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return await response.json();
  }

  async getQuiz(courseId: number, quizId: number) {
    const { token, baseUrl } = await this.getAuthHeaders();
    const response = await fetch(`${baseUrl}/courses/${courseId}/quizzes/${quizId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get quiz: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return await response.json();
  }

  async getDiscussion(courseId: number, discussionId: number) {
    const { token, baseUrl } = await this.getAuthHeaders();
    const response = await fetch(`${baseUrl}/courses/${courseId}/discussion_topics/${discussionId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get discussion: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return await response.json();
  }

  async getPage(courseId: number, pageUrl: string) {
    const { token, baseUrl } = await this.getAuthHeaders();
    
    // Retry logic for 404s (Canvas may need a moment to make the resource available)
    let lastError: Error | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      if (attempt > 0) {
        // Wait 500ms before retry
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      const response = await fetch(`${baseUrl}/courses/${courseId}/pages/${encodeURIComponent(pageUrl)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        return await response.json();
      }
      
      if (response.status !== 404 || attempt === 2) {
        // If not 404, or this is the last attempt, throw the error
        const errorText = await response.text();
        lastError = new Error(`Failed to get page: ${response.status} ${response.statusText} - ${errorText}`);
        if (response.status !== 404) {
          throw lastError;
        }
      }
    }
    
    // If we get here, all retries failed with 404
    throw lastError || new Error(`Failed to get page: Resource not found after retries`);
  }

  async getAnnouncement(courseId: number, announcementId: number) {
    // Announcements are discussions, so use the same endpoint
    return this.getDiscussion(courseId, announcementId);
  }

  // Individual update methods (for inline editing)
  async updateAssignment(courseId: number, assignmentId: number, updates: Record<string, any>) {
    try {
      console.log(`[Service] updateAssignment called for assignment ${assignmentId} in course ${courseId}`);
      console.log(`[Service] Raw updates:`, JSON.stringify(updates, null, 2));
      
      const { token, baseUrl } = await this.getAuthHeaders();
      const pending: Record<string, any> = { ...updates };
      let rubricSelection: number | null | undefined = undefined;
      if (Object.prototype.hasOwnProperty.call(pending, 'rubric_id')) {
        const rawRubric = pending.rubric_id;
        if (rawRubric === null || rawRubric === '' || rawRubric === undefined) {
          rubricSelection = null;
        } else {
          const parsedRubricId = Number(rawRubric);
          rubricSelection = Number.isFinite(parsedRubricId) ? parsedRubricId : null;
        }
        delete pending.rubric_id;
      }
      delete pending.rubric_summary;
      delete pending.rubric_url;
      delete pending.rubric_association_id;

      const needsNewQuizRoute =
        Object.prototype.hasOwnProperty.call(pending, 'description') ||
        Object.prototype.hasOwnProperty.call(pending, 'name');
      if (needsNewQuizRoute) {
        const snapshot = await this.getAssignment(courseId, assignmentId);
        const isNewQuiz = this.isLikelyNewQuizAssignment(snapshot);
        console.log(`[Service][NewQuiz] Assignment ${assignmentId} detection:`, {
          isNewQuizAssignment: snapshot?.is_quiz_assignment,
          quizLti: snapshot?.quiz_lti,
          quizId: snapshot?.quiz_id,
          submissionTypes: snapshot?.submission_types,
          resolvedAsNewQuiz: isNewQuiz,
        });
        if (isNewQuiz) {
          const quizUpdates: { instructions?: string; title?: string } = {};
          if (Object.prototype.hasOwnProperty.call(pending, 'description')) {
            const rawDesc = pending.description;
            quizUpdates.instructions = rawDesc === null || rawDesc === undefined ? '' : String(rawDesc);
            delete pending.description;
          }
          if (Object.prototype.hasOwnProperty.call(pending, 'name')) {
            const rawTitle = pending.name;
            quizUpdates.title = rawTitle === null || rawTitle === undefined ? '' : String(rawTitle);
            delete pending.name;
          }
          if (Object.keys(quizUpdates).length > 0) {
            await this.patchNewQuizByAssignment(courseId, assignmentId, quizUpdates, token, baseUrl);
          }
        }
      }

      const cleanedUpdates: Record<string, any> = {};
      Object.keys(pending).forEach(key => {
        const value = pending[key];
        const dateVal = processDateField(key, value);
        if (dateVal !== undefined) {
          cleanedUpdates[key] = dateVal;
          return;
        }
        if (value === undefined) return;
        if ((value === null || value === '') && CLEARABLE_CONTENT_KEYS.has(key)) {
          cleanedUpdates[key] = value === null ? null : '';
          return;
        }
        if (value === null || value === '') return;

        // Handle boolean values
        if (typeof value === 'boolean') {
          cleanedUpdates[key] = value;
        }
        // Handle numbers
        else if (typeof value === 'number') {
          cleanedUpdates[key] = value;
        }
        // Handle strings
        else if (typeof value === 'string') {
          cleanedUpdates[key] = value;
        }
        else {
          cleanedUpdates[key] = value;
        }
      });
      
      if (Object.keys(cleanedUpdates).length === 0) {
        if (rubricSelection !== undefined) {
          await this.upsertAssignmentRubricAssociation(courseId, assignmentId, rubricSelection, token, baseUrl);
        }
        return await this.getAssignment(courseId, assignmentId);
      }

      validateDateOrder(cleanedUpdates, `Assignment ${assignmentId}`);
      
      console.log(`[Service] Updating assignment ${assignmentId} in course ${courseId}`);
      console.log(`[Service] Cleaned updates:`, JSON.stringify(cleanedUpdates, null, 2));
      console.log(`[Service] Canvas API URL: ${baseUrl}/courses/${courseId}/assignments/${assignmentId}`);
      
      // Canvas API expects the request body to be wrapped in an "assignment" object
      const requestBody = JSON.stringify({ assignment: cleanedUpdates });
      console.log(`[Service] Request body (wrapped):`, requestBody);
      
      const response = await fetch(`${baseUrl}/courses/${courseId}/assignments/${assignmentId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: requestBody,
      });

      console.log(`[Service] Response status: ${response.status} ${response.statusText}`);
      
      // Get response text first to see raw response
      const responseText = await response.text();
      console.log(`[Service] Raw response body:`, responseText);
      console.log(`[Service] Response body length: ${responseText.length} characters`);

      if (!response.ok) {
        console.error(`[Service] Canvas API error: ${response.status} ${response.statusText}`);
        console.error(`[Service] Error response body:`, responseText);
        
        // Provide more helpful error messages for common issues
        if (response.status === 403) {
          let errorMessage = `Canvas API returned 403 Forbidden. Common causes:\n`;
          errorMessage += `1. The course has ended - Canvas restricts write operations on ended courses\n`;
          errorMessage += `2. The API token doesn't have write permissions\n`;
          errorMessage += `3. The user associated with the token doesn't have permission to modify assignments in this course\n`;
          errorMessage += `4. The token may need to be regenerated with proper scopes\n\n`;
          errorMessage += `Canvas API response: ${responseText}`;
          throw new Error(errorMessage);
        }
        
        throw new Error(`Canvas API error: ${response.status} ${response.statusText} - ${responseText}`);
      }

      // Parse JSON response
      let result;
      try {
        result = JSON.parse(responseText);
        console.log(`[Service] Parsed JSON response successfully`);
      } catch (parseError: any) {
        console.error(`[Service] Failed to parse JSON response:`, parseError);
        console.error(`[Service] Response text that failed to parse:`, responseText);
        throw new Error(`Canvas API returned invalid JSON: ${responseText}`);
      }

      console.log(`[Service] Assignment ${assignmentId} updated successfully`);
      console.log(`[Service] Canvas API response (formatted):`, JSON.stringify(result, null, 2));

      if (rubricSelection !== undefined) {
        await this.upsertAssignmentRubricAssociation(courseId, assignmentId, rubricSelection, token, baseUrl);
        return await this.getAssignment(courseId, assignmentId);
      }

      return result;
    } catch (error: any) {
      console.error(`[Service] Error in updateAssignment for assignment ${assignmentId}:`, error);
      console.error(`[Service] Error message:`, error.message);
      console.error(`[Service] Error stack:`, error.stack);
      // Ensure we throw a proper error that NestJS can handle
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error(`Failed to update assignment ${assignmentId}: ${String(error)}`);
      }
    }
  }

  async updateQuiz(courseId: number, quizId: number, updates: Record<string, any>) {
    try {
      console.log(`[Service] updateQuiz called for quiz ${quizId} in course ${courseId}`);
      console.log(`[Service] Raw updates:`, JSON.stringify(updates, null, 2));
      
      const { token, baseUrl } = await this.getAuthHeaders();
      
      // Check if course has ended - Canvas restricts write operations on ended courses
      try {
        const courseInfo = await this.getCourseDetails(courseId);
        const endDate = courseInfo.end_at ? new Date(courseInfo.end_at) : null;
        const now = new Date();
        
        if (endDate && endDate < now) {
          const errorMessage = `Cannot update quiz: Course has ended (ended on ${endDate.toLocaleDateString()}). ` +
            `Canvas restricts write operations on ended courses to preserve historical data.`;
          console.warn(`[Service] ${errorMessage}`);
          throw new Error(errorMessage);
        }
      } catch (courseCheckError: any) {
        // If the error is about course ending, re-throw it
        if (courseCheckError.message.includes('Course has ended')) {
          throw courseCheckError;
        }
        // Otherwise, log but continue (course check is not critical)
        console.warn(`[Service] Could not verify course end date:`, courseCheckError.message);
      }
      console.log(`[Service] Got auth headers, baseUrl: ${baseUrl}`);
      const pending: Record<string, any> = { ...updates };
      let rubricSelection: number | null | undefined = undefined;
      if (Object.prototype.hasOwnProperty.call(pending, 'rubric_id')) {
        const rawRubric = pending.rubric_id;
        if (rawRubric === null || rawRubric === '' || rawRubric === undefined) {
          rubricSelection = null;
        } else {
          const parsedRubricId = Number(rawRubric);
          rubricSelection = Number.isFinite(parsedRubricId) ? parsedRubricId : null;
        }
        delete pending.rubric_id;
      }
      delete pending.rubric_summary;
      delete pending.rubric_url;
      delete pending.rubric_association_id;

      const cleanedUpdates: Record<string, any> = {};
      Object.keys(pending).forEach(key => {
        const value = pending[key];
        if (value === undefined) return;
        const dateVal = processDateField(key, value);
        if (dateVal !== undefined) {
          cleanedUpdates[key] = dateVal;
          return;
        }
        if ((value === null || value === '') && CLEARABLE_CONTENT_KEYS.has(key)) {
          cleanedUpdates[key] = value === null ? null : '';
          return;
        }
        if (value === null && NULLABLE_QUIZ_FIELDS.has(key)) {
          cleanedUpdates[key] = null;
          return;
        }
        if (key === 'time_limit') {
          const n = typeof value === 'number' ? value : parseInt(String(value), 10);
          if (isNaN(n) || n < 0) {
            cleanedUpdates[key] = null;
          } else {
            cleanedUpdates[key] = Math.floor(n);
          }
          return;
        }
        if (value === null || value === '') return;

        if (typeof value === 'boolean') {
          cleanedUpdates[key] = value;
        }
        // Handle numbers
        else if (typeof value === 'number') {
          cleanedUpdates[key] = value;
        }
        // Handle strings
        else if (typeof value === 'string') {
          cleanedUpdates[key] = value;
        }
        else {
          cleanedUpdates[key] = value;
        }
      });

      delete cleanedUpdates.points_possible;

      const showAt = cleanedUpdates.show_correct_answers_at;
      const hideAt = cleanedUpdates.hide_correct_answers_at;
      if (showAt && hideAt && showAt === hideAt) {
        const d = new Date(showAt);
        d.setDate(d.getDate() + 1);
        cleanedUpdates.hide_correct_answers_at = d.toISOString().slice(0, 19) + 'Z';
      }
      
      if (Object.keys(cleanedUpdates).length === 0) {
        if (rubricSelection === undefined) {
          throw new Error('No valid updates to send to Canvas API');
        }
        const quizSnapshot = await this.getQuiz(courseId, quizId);
        const assignmentId = Number(quizSnapshot?.assignment_id);
        if (!Number.isFinite(assignmentId)) {
          throw new Error('Cannot set rubric: quiz does not have an assignment_id');
        }
        await this.upsertAssignmentRubricAssociation(courseId, assignmentId, rubricSelection, token, baseUrl);
        return await this.getQuiz(courseId, quizId);
      }

      validateDateOrder(cleanedUpdates, `Quiz ${quizId}`);
      
      console.log(`[Service] Updating quiz ${quizId} in course ${courseId}`);
      console.log(`[Service] Cleaned updates:`, JSON.stringify(cleanedUpdates, null, 2));
      console.log(`[Service] Canvas API URL: ${baseUrl}/courses/${courseId}/quizzes/${quizId}`);
      
      // Canvas API expects the request body to be wrapped in a "quiz" object
      const requestBody = JSON.stringify({ quiz: cleanedUpdates });
      console.log(`[Service] Request body (wrapped):`, requestBody);
      
      const response = await fetch(`${baseUrl}/courses/${courseId}/quizzes/${quizId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: requestBody,
      });

      console.log(`[Service] Response status: ${response.status} ${response.statusText}`);
      console.log(`[Service] Response headers:`, JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2));

      // Get response text first to see raw response
      const responseText = await response.text();
      console.log(`[Service] Raw response body:`, responseText);
      console.log(`[Service] Response body length: ${responseText.length} characters`);

      if (!response.ok) {
        console.error(`[Service] Canvas API error: ${response.status} ${response.statusText}`);
        console.error(`[Service] Error response body:`, responseText);
        
        // Provide more helpful error messages for common issues
        if (response.status === 403) {
          let errorMessage = `Canvas API returned 403 Forbidden. Common causes:\n`;
          errorMessage += `1. The course has ended - Canvas restricts write operations on ended courses to preserve historical data\n`;
          errorMessage += `2. The API token doesn't have write permissions\n`;
          errorMessage += `3. The user associated with the token doesn't have permission to modify quizzes in this course\n`;
          errorMessage += `4. The token may need to be regenerated with proper scopes\n\n`;
          errorMessage += `Canvas API response: ${responseText}`;
          throw new Error(errorMessage);
        }
        
        throw new Error(`Canvas API error: ${response.status} ${response.statusText} - ${responseText}`);
      }

      // Parse JSON response
      let result;
      try {
        result = JSON.parse(responseText);
        console.log(`[Service] Parsed JSON response successfully`);
      } catch (parseError: any) {
        console.error(`[Service] Failed to parse JSON response:`, parseError);
        console.error(`[Service] Response text that failed to parse:`, responseText);
        throw new Error(`Canvas API returned invalid JSON: ${responseText}`);
      }

      console.log(`[Service] Quiz ${quizId} updated successfully`);
      console.log(`[Service] Canvas API response (formatted):`, JSON.stringify(result, null, 2));
      
      // Log specific fields we care about
      console.log(`[Service] Response quiz ID: ${result.id}`);
      console.log(`[Service] Response quiz title: ${result.title}`);
      console.log(`[Service] Response due_at: ${result.due_at || 'null/undefined'}`);
      console.log(`[Service] Response assignment_id: ${result.assignment_id || 'null/undefined'}`);
      console.log(`[Service] Response lock_at: ${result.lock_at || 'null/undefined'}`);
      console.log(`[Service] Response unlock_at: ${result.unlock_at || 'null/undefined'}`);
      console.log(`[Service] Response published: ${result.published}`);
      
      // Compare what we sent vs what we got back
      console.log(`[Service] === UPDATE COMPARISON ===`);
      console.log(`[Service] Fields we sent:`, Object.keys(cleanedUpdates));
      console.log(`[Service] Fields in response:`, Object.keys(result));
      
      // Check each field we updated
      Object.keys(cleanedUpdates).forEach(key => {
        const sentValue = cleanedUpdates[key];
        const receivedValue = result[key];
        if (sentValue !== receivedValue) {
          console.warn(`[Service] ⚠️  FIELD MISMATCH for ${key}:`);
          console.warn(`[Service]    Sent: ${sentValue}`);
          console.warn(`[Service]    Received: ${receivedValue}`);
        } else {
          console.log(`[Service] ✓ Field ${key} matches: ${sentValue}`);
        }
      });
      
      if (Object.prototype.hasOwnProperty.call(cleanedUpdates, 'due_at') && result.assignment_id) {
        console.log(`[Service] Quiz has assignment_id ${result.assignment_id}, updating assignment due date as well`);
        console.log(`[Service] Updating assignment ${result.assignment_id} with due_at: ${cleanedUpdates.due_at}`);
        try {
          const assignmentResult = await this.updateAssignment(courseId, result.assignment_id, { due_at: cleanedUpdates.due_at });
          console.log(`[Service] ✓ Successfully updated assignment ${result.assignment_id} due date`);
          console.log(`[Service] Assignment response due_at: ${assignmentResult.due_at || 'null/undefined'}`);
        } catch (assignmentError: any) {
          console.error(`[Service] ✗ Failed to update assignment due date:`, assignmentError.message);
          console.error(`[Service] Assignment error stack:`, assignmentError.stack);
          // Don't throw - the quiz update succeeded, this is just a warning
          console.warn(`[Service] ⚠️  Quiz due date updated, but assignment due date update failed. The quiz due date may not display correctly in Canvas.`);
        }
      } else if (Object.prototype.hasOwnProperty.call(cleanedUpdates, 'due_at') && !result.assignment_id) {
        console.log(`[Service] Quiz does not have an assignment_id (likely a practice quiz or ungraded survey)`);
      }

      if (Object.prototype.hasOwnProperty.call(cleanedUpdates, 'due_at') && cleanedUpdates.due_at) {
        if (result.due_at) {
          console.log(`[Service] Due date comparison:`);
          console.log(`[Service]   Request: ${cleanedUpdates.due_at}`);
          console.log(`[Service]   Response: ${result.due_at}`);
          if (cleanedUpdates.due_at !== result.due_at) {
            console.warn(`[Service] ⚠️  WARNING: Due date mismatch!`);
            console.warn(`[Service]   Request: ${cleanedUpdates.due_at}`);
            console.warn(`[Service]   Response: ${result.due_at}`);
          } else {
            console.log(`[Service] ✓ Due date matches in response`);
          }
        } else {
          console.warn(`[Service] ⚠️  WARNING: Sent due_at but it's not in the response!`);
          console.warn(`[Service]   This is normal for graded quizzes - the due date is stored on the assignment.`);
        }
      }

      if (rubricSelection !== undefined) {
        const assignmentId = Number(result?.assignment_id);
        if (!Number.isFinite(assignmentId)) {
          throw new Error('Cannot set rubric: quiz does not have an assignment_id');
        }
        await this.upsertAssignmentRubricAssociation(courseId, assignmentId, rubricSelection, token, baseUrl);
        return await this.getQuiz(courseId, quizId);
      }

      return result;
    } catch (error: any) {
      console.error(`[Service] Error in updateQuiz for quiz ${quizId}:`, error);
      console.error(`[Service] Error message:`, error.message);
      console.error(`[Service] Error stack:`, error.stack);
      // Ensure we throw a proper error that NestJS can handle
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error(`Failed to update quiz ${quizId}: ${String(error)}`);
      }
    }
  }

  async updateDiscussion(courseId: number, discussionId: number, updates: Record<string, any>) {
    const { token, baseUrl } = await this.getAuthHeaders();
    const pending: Record<string, any> = { ...updates };
    if (Object.prototype.hasOwnProperty.call(pending, 'expand')) {
      pending.expanded = pending.expand;
      delete pending.expand;
    }
    if (Object.prototype.hasOwnProperty.call(pending, 'expand_locked')) {
      pending.expanded_locked = pending.expand_locked;
      delete pending.expand_locked;
    }
    let gradedSelection: boolean | undefined = undefined;
    if (Object.prototype.hasOwnProperty.call(pending, 'graded')) {
      gradedSelection = Boolean(pending.graded);
      delete pending.graded;
    }
    let rubricSelection: number | null | undefined = undefined;
    if (Object.prototype.hasOwnProperty.call(pending, 'rubric_id')) {
      const rawRubric = pending.rubric_id;
      if (rawRubric === null || rawRubric === '' || rawRubric === undefined) {
        rubricSelection = null;
      } else {
        const parsedRubricId = Number(rawRubric);
        rubricSelection = Number.isFinite(parsedRubricId) ? parsedRubricId : null;
      }
      delete pending.rubric_id;
    }
    delete pending.rubric_summary;
    delete pending.rubric_url;
    delete pending.rubric_association_id;

    const topicUrl = `${baseUrl}/courses/${courseId}/discussion_topics/${discussionId}`;
    let assignmentId: number | null = null;
    let isAnnouncement = false;
    try {
      const topic = await this.getDiscussion(courseId, discussionId);
      assignmentId = topic?.assignment_id ?? null;
      isAnnouncement = Boolean(topic?.is_announcement);
    } catch (e: any) {
      assignmentId = null;
      isAnnouncement = false;
    }

    const sendDiscussionUpdate = async (payload: Record<string, any>): Promise<any> => {
      if (!payload || Object.keys(payload).length === 0) return null;
      const toFormValue = (value: any): string => {
        if (typeof value === 'boolean') return value ? '1' : '0';
        return String(value);
      };
      const form = new URLSearchParams();
      const wrappedForm = new URLSearchParams();
      Object.entries(payload).forEach(([k, v]) => {
        if (v === undefined || v === null) return;
        if (typeof v === 'object' && !Array.isArray(v)) {
          Object.entries(v).forEach(([subK, subV]) => {
            if (subV !== undefined && subV !== null) {
              form.append(`${k}[${subK}]`, toFormValue(subV));
              wrappedForm.append(`discussion_topic[${k}][${subK}]`, toFormValue(subV));
            }
          });
        } else {
          form.append(k, toFormValue(v));
          wrappedForm.append(`discussion_topic[${k}]`, toFormValue(v));
        }
      });
      const attempts: Array<{ name: string; contentType: string; body: string }> = [
        { name: 'form_urlencoded_wrapped', contentType: 'application/x-www-form-urlencoded', body: wrappedForm.toString() },
        { name: 'form_urlencoded', contentType: 'application/x-www-form-urlencoded', body: form.toString() },
        { name: 'json_wrapped', contentType: 'application/json', body: JSON.stringify({ discussion_topic: payload }) },
        { name: 'json_raw', contentType: 'application/json', body: JSON.stringify(payload) },
      ];
      let lastStatus = 0;
      let lastText = '';
      let lastAttempt: { name: string; contentType: string; body: string } | null = null;
      let out: any = null;
      for (const attempt of attempts) {
        const response = await fetch(topicUrl, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': attempt.contentType,
          },
          body: attempt.body,
        });
        const text = await response.text();
        if (response.ok) {
          if (text) {
            try {
              out = JSON.parse(text);
            } catch {
              out = {};
            }
          } else {
            out = {};
          }
          lastStatus = 0;
          lastText = '';
          break;
        }
        lastStatus = response.status;
        lastText = text || response.statusText;
        lastAttempt = attempt;
        if (![400, 415, 422].includes(response.status)) break;
      }
      if (lastStatus) {
        throw new Error(
          `Failed to update discussion ${discussionId}: ${lastStatus} - ${lastText}. Endpoint: ${topicUrl}. ` +
          `Format: ${lastAttempt?.name || 'unknown'}. Payload: ${(lastAttempt?.body || '').slice(0, 1000)}`
        );
      }
      return out;
    };

    const sendDiscussionDateDetailsUpdate = async (payload: Record<string, any>): Promise<void> => {
      if (!payload || Object.keys(payload).length === 0) return;
      const dateDetailsUrl = `${baseUrl}/courses/${courseId}/discussion_topics/${discussionId}/date_details`;
      const response = await fetch(dateDetailsUrl, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      const text = await response.text();
      if (!response.ok) {
        throw new Error(
          `Failed to update discussion date_details ${discussionId}: ${response.status} - ${text || response.statusText}. ` +
          `Endpoint: ${dateDetailsUrl}. Payload: ${JSON.stringify(payload).slice(0, 1000)}`
        );
      }
    };

    let topicResult: any = null;
    if (gradedSelection !== undefined) {
      if (gradedSelection && !assignmentId) {
        const pointsSeedRaw = pending.points_possible;
        const pointsSeedNum = Number(pointsSeedRaw);
        const assignmentPayload: Record<string, any> = {};
        if (pointsSeedRaw !== undefined && pointsSeedRaw !== null && pointsSeedRaw !== '' && Number.isFinite(pointsSeedNum)) {
          assignmentPayload.points_possible = pointsSeedNum;
        }
        topicResult = await sendDiscussionUpdate({ assignment: assignmentPayload });
        const refreshed = await this.getDiscussion(courseId, discussionId);
        assignmentId = refreshed?.assignment_id ?? null;
      }
      if (!gradedSelection && assignmentId) {
        topicResult = await sendDiscussionUpdate({ assignment: { set_assignment: false } });
        assignmentId = null;
      }
    }

    const cleanedUpdates = cleanContentUpdates(pending, { clearableTextFields: true });
    if (
      Object.prototype.hasOwnProperty.call(cleanedUpdates, 'podcast_enabled') &&
      cleanedUpdates.podcast_enabled === true &&
      !Object.prototype.hasOwnProperty.call(cleanedUpdates, 'podcast_has_student_posts')
    ) {
      cleanedUpdates.podcast_has_student_posts = false;
    }
    const podcastRequested =
      Object.prototype.hasOwnProperty.call(cleanedUpdates, 'podcast_enabled') ||
      Object.prototype.hasOwnProperty.call(cleanedUpdates, 'podcast_has_student_posts');
    const expectedPodcastEnabled = Object.prototype.hasOwnProperty.call(cleanedUpdates, 'podcast_enabled')
      ? Boolean(cleanedUpdates.podcast_enabled)
      : undefined;
    const expectedPodcastStudentPosts = Object.prototype.hasOwnProperty.call(cleanedUpdates, 'podcast_has_student_posts')
      ? Boolean(cleanedUpdates.podcast_has_student_posts)
      : undefined;
    const discussionUpdates: Record<string, any> = { ...cleanedUpdates };
    const assignmentUpdates: Record<string, any> = {};
    ['due_at', 'unlock_at', 'points_possible', 'assignment_group_id'].forEach((k) => {
      if (Object.prototype.hasOwnProperty.call(discussionUpdates, k)) {
        assignmentUpdates[k] = discussionUpdates[k];
        delete discussionUpdates[k];
      }
    });

    const dateDetailsUpdates: Record<string, any> = {};
    const dateDetailKeys = isAnnouncement ? ['due_at', 'unlock_at'] : ['due_at', 'unlock_at', 'lock_at'];
    dateDetailKeys.forEach((k) => {
      if (Object.prototype.hasOwnProperty.call(discussionUpdates, k)) {
        dateDetailsUpdates[k] = discussionUpdates[k];
        delete discussionUpdates[k];
      }
      if (Object.prototype.hasOwnProperty.call(assignmentUpdates, k)) {
        dateDetailsUpdates[k] = assignmentUpdates[k];
        delete assignmentUpdates[k];
      }
    });

    const mergedDates = isAnnouncement
      ? { delayed_post_at: discussionUpdates.delayed_post_at, lock_at: discussionUpdates.lock_at }
      : { ...dateDetailsUpdates };
    if (Object.keys(mergedDates).length > 0) {
      validateDateOrder(mergedDates, `Discussion ${discussionId}`);
    }
    if (
      Object.prototype.hasOwnProperty.call(dateDetailsUpdates, 'due_at') &&
      !assignmentId
    ) {
      throw new Error('Cannot set due_at on an ungraded discussion. Enable Graded first.');
    }

    if (Object.keys(dateDetailsUpdates).length > 0) {
      await sendDiscussionDateDetailsUpdate(dateDetailsUpdates);
    }

    if (Object.keys(discussionUpdates).length > 0) {
      topicResult = await sendDiscussionUpdate(discussionUpdates);
    }

    if (Object.keys(assignmentUpdates).length > 0) {
      if (!assignmentId) {
        throw new Error('Cannot set grading fields on an ungraded discussion. Enable Graded first.');
      }
      await this.updateAssignment(courseId, assignmentId, assignmentUpdates);
    }

    if (rubricSelection !== undefined) {
      if (!assignmentId) {
        throw new Error('Cannot set rubric: discussion does not have an assignment_id');
      }
      await this.upsertAssignmentRubricAssociation(courseId, assignmentId, rubricSelection, token, baseUrl);
    }

    const finalTopic = await this.getDiscussion(courseId, discussionId);
    if (podcastRequested) {
      const podcastUrl = typeof finalTopic?.podcast_url === 'string' ? finalTopic.podcast_url.trim() : '';
      const actualPodcastEnabledByUrl = podcastUrl.length > 0;
      const hasPodcastEnabled = Object.prototype.hasOwnProperty.call(finalTopic || {}, 'podcast_enabled');
      const hasPodcastStudentPosts = Object.prototype.hasOwnProperty.call(finalTopic || {}, 'podcast_has_student_posts');
      const actualPodcastEnabled = hasPodcastEnabled ? Boolean(finalTopic?.podcast_enabled) : undefined;
      const actualPodcastStudentPosts = hasPodcastStudentPosts ? Boolean(finalTopic?.podcast_has_student_posts) : undefined;
      if (
        (expectedPodcastEnabled !== undefined && actualPodcastEnabledByUrl !== expectedPodcastEnabled) ||
        (expectedPodcastStudentPosts !== undefined && hasPodcastStudentPosts && actualPodcastStudentPosts !== expectedPodcastStudentPosts)
      ) {
        throw new Error(
          `Podcast setting did not persist on discussion ${discussionId}. Requested podcast_enabled=${expectedPodcastEnabled}, ` +
          `podcast_has_student_posts=${expectedPodcastStudentPosts}; Canvas returned podcast_url=${podcastUrl || 'null'}, ` +
          `podcast_enabled=${actualPodcastEnabled}, podcast_has_student_posts=${actualPodcastStudentPosts}.`
        );
      }
    }

    return topicResult || finalTopic;
  }

  async updatePage(courseId: number, pageUrl: string, updates: Record<string, any>) {
    const { token, baseUrl } = await this.getAuthHeaders();
    const cleanedUpdates = cleanContentUpdates(updates, { clearableTextFields: true });

    validateDateOrder(cleanedUpdates, `Page ${pageUrl}`);

    const requestBody = cleanedUpdates.wiki_page
      ? cleanedUpdates
      : { wiki_page: cleanedUpdates };

    console.log(`Updating page ${pageUrl} with:`, requestBody);

    const response = await fetch(`${baseUrl}/courses/${courseId}/pages/${encodeURIComponent(pageUrl)}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Page update failed: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`Failed to update page: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return await response.json();
  }

  async updateAnnouncement(courseId: number, announcementId: number, updates: Record<string, any>) {
    return this.updateDiscussion(courseId, announcementId, updates);
  }

  async updateModule(courseId: number, moduleId: number, updates: Record<string, any>) {
    const { token, baseUrl } = await this.getAuthHeaders();
    const cleanedUpdates = cleanContentUpdates(updates, { clearableTextFields: false });
    console.log(`Updating module ${moduleId} with:`, cleanedUpdates);
    
    const requestBody = { module: cleanedUpdates };
    
    const response = await fetch(`${baseUrl}/courses/${courseId}/modules/${moduleId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Module update failed: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`Failed to update module: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return await response.json();
  }

  async bulkUpdateAssignments(courseId: number, itemIds: number[], updates: Record<string, any>) {
    const results: Array<{ id: number; success: boolean; data?: any; error?: string }> = [];

    for (const assignmentId of itemIds) {
      try {
        const data = await this.updateAssignment(courseId, assignmentId, { ...updates });
        results.push({ id: assignmentId, success: true, data });
      } catch (error: any) {
        results.push({ id: assignmentId, success: false, error: error.message });
      }
    }

    return results;
  }

  async bulkUpdateQuizzes(courseId: number, itemIds: number[], updates: Record<string, any>) {
    const results: Array<{ id: number; success: boolean; data?: any; error?: string }> = [];
    for (const quizId of itemIds) {
      try {
        const data = await this.updateQuiz(courseId, quizId, { ...updates });
        results.push({ id: quizId, success: true, data });
      } catch (error: any) {
        results.push({ id: quizId, success: false, error: error.message });
      }
    }
    return results;
  }

  async bulkUpdateDiscussions(courseId: number, itemIds: number[], updates: Record<string, any>) {
    const results: Array<{ id: number; success: boolean; data?: any; error?: string }> = [];
    for (const discussionId of itemIds) {
      try {
        const data = await this.updateDiscussion(courseId, discussionId, { ...updates });
        results.push({ id: discussionId, success: true, data });
      } catch (error: any) {
        results.push({ id: discussionId, success: false, error: error.message });
      }
    }
    return results;
  }

  async bulkUpdatePages(courseId: number, itemIds: string[], updates: Record<string, any>) {
    const results: Array<{ id: string; success: boolean; data?: any; error?: string }> = [];

    for (const pageUrl of itemIds) {
      try {
        const updated = await this.updatePage(courseId, pageUrl, updates);
        results.push({ id: pageUrl, success: true, data: updated });
      } catch (error: any) {
        results.push({ id: pageUrl, success: false, error: error.message });
      }
    }

    return results;
  }

  async bulkUpdateAnnouncements(courseId: number, itemIds: number[], updates: Record<string, any>) {
    const results: Array<{ id: number; success: boolean; data?: any; error?: string }> = [];

    for (const announcementId of itemIds) {
      try {
        const updated = await this.updateDiscussion(courseId, announcementId, updates);
        results.push({ id: announcementId, success: true, data: updated });
      } catch (error: any) {
        results.push({ id: announcementId, success: false, error: error.message });
      }
    }

    return results;
  }

  async bulkUpdateModules(courseId: number, itemIds: number[], updates: Record<string, any>) {
    const results: Array<{ id: number; success: boolean; data?: any; error?: string }> = [];
    for (const moduleId of itemIds) {
      try {
        const data = await this.updateModule(courseId, moduleId, { ...updates });
        results.push({ id: moduleId, success: true, data });
      } catch (error: any) {
        results.push({ id: moduleId, success: false, error: error.message });
      }
    }
    return results;
  }

  async getBulkUserTags(courseId: number) {
    const { token, baseUrl } = await this.getAuthHeaders();
    const bulkTagsUrl = `${baseUrl}/courses/${courseId}/bulk_user_tags`;
    const response = await fetch(bulkTagsUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Canvas API Error: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    return await response.json();
  }

  async ensureAccommodationColumns(courseId: number) {
    console.log(`[COLUMN_CREATE] ===== Starting ensureAccommodationColumns for course ${courseId} =====`);
    const { token, baseUrl } = await this.getAuthHeaders();
    
    const columnTitle = 'Accommodations';

    try {
      console.log(`[COLUMN_CREATE] Fetching existing columns from: ${baseUrl}/courses/${courseId}/custom_gradebook_columns`);
      const columnsUrl = `${baseUrl}/courses/${courseId}/custom_gradebook_columns?per_page=100&include_hidden=true`;
      const existingColumns = await this.fetchPaginatedData(columnsUrl, token);
      console.log(`[COLUMN_CREATE] Found ${existingColumns.length} existing columns`);
      
      const existingColumn = existingColumns.find((col: any) => col.title === columnTitle);
      
      if (existingColumn) {
        console.log(`[COLUMN_CREATE] Column "${columnTitle}" already exists (ID: ${existingColumn.id})`);
        console.log(`[COLUMN_CREATE] Current state - hidden: ${existingColumn.hidden}, position: ${existingColumn.position}`);
        
        if (existingColumn.hidden) {
          console.log(`[COLUMN_CREATE] Updating existing column "${columnTitle}" to hidden=false`);
          const updateUrl = `${baseUrl}/courses/${courseId}/custom_gradebook_columns/${existingColumn.id}`;
          console.log(`[COLUMN_CREATE] Update URL: ${updateUrl}`);
          
          const updateResponse = await fetch(updateUrl, {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              column: {
                title: columnTitle,
                position: 1,
                hidden: false
              }
            }),
          });

          if (!updateResponse.ok) {
            const errorText = await updateResponse.text();
            console.error(`[COLUMN_CREATE] Failed to update column "${columnTitle}": ${updateResponse.status} ${updateResponse.statusText} - ${errorText}`);
            throw new Error(`Failed to update column "${columnTitle}": ${updateResponse.status} ${updateResponse.statusText} - ${errorText}`);
          }

          const updatedColumn = await updateResponse.json();
          console.log(`[COLUMN_CREATE] Successfully updated column "${columnTitle}" (ID: ${updatedColumn.id}, hidden: ${updatedColumn.hidden})`);
          console.log(`[COLUMN_CREATE] ===== Completed ensureAccommodationColumns for course ${courseId} =====`);
          return { column: updatedColumn };
        } else {
          console.log(`[COLUMN_CREATE] Column "${columnTitle}" already has hidden=false, no update needed`);
          console.log(`[COLUMN_CREATE] ===== Completed ensureAccommodationColumns for course ${courseId} =====`);
          return { column: existingColumn };
        }
      }

      console.log(`[COLUMN_CREATE] Column "${columnTitle}" does not exist, creating new column`);
      const createUrl = `${baseUrl}/courses/${courseId}/custom_gradebook_columns`;
      console.log(`[COLUMN_CREATE] Create URL: ${createUrl}`);
      console.log(`[COLUMN_CREATE] Request body:`, JSON.stringify({
        column: {
          title: columnTitle,
          position: 1,
          hidden: false
        }
      }, null, 2));

      const response = await fetch(createUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          column: {
            title: columnTitle,
            position: 1,
            hidden: false
          }
        }),
      });

      console.log(`[COLUMN_CREATE] Create response status: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[COLUMN_CREATE] Failed to create column "${columnTitle}": ${response.status} ${response.statusText} - ${errorText}`);
        throw new Error(`Failed to create column "${columnTitle}": ${response.status} ${response.statusText} - ${errorText}`);
      }

      const newColumn = await response.json();
      console.log(`[COLUMN_CREATE] Successfully created column "${columnTitle}" (ID: ${newColumn.id}, hidden: ${newColumn.hidden}, position: ${newColumn.position})`);
      console.log(`[COLUMN_CREATE] ===== Completed ensureAccommodationColumns for course ${courseId} =====`);
      return { column: newColumn };
    } catch (error: any) {
      console.error(`[COLUMN_CREATE] Error ensuring accommodation columns:`, error);
      throw new Error(`Failed to ensure accommodation columns: ${error.message}`);
    }
  }

  async saveAccommodationValue(courseId: number, columnId: number, userId: number, content: string) {
    const { token, baseUrl } = await this.getAuthHeaders();
    
    const url = `${baseUrl}/courses/${courseId}/custom_gradebook_columns/${columnId}/data/${userId}`;
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        column_data: {
          content: content
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to save accommodation value: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return await response.json();
  }

  async getAccommodationData(courseId: number) {
    const { token, baseUrl } = await this.getAuthHeaders();
    
    try {
      const { column } = await this.ensureAccommodationColumns(courseId);
      
      const { token: studentToken, baseUrl: studentBaseUrl } = await this.getAuthHeaders();
      let allStudents: any[] = [];
      let url: string | null = `${studentBaseUrl}/courses/${courseId}/enrollments?per_page=100&type[]=StudentEnrollment&include[]=user`;

      while (url) {
        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${studentToken}` },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch students: ${response.status} ${response.statusText}`);
        }

        const chunk = await response.json();
        if (Array.isArray(chunk)) {
          allStudents.push(...chunk);
        }

        const linkHeader = response.headers.get('link');
        url = this.getNextUrl(linkHeader);
      }

      const studentMap = new Map<number, string>();
      allStudents.forEach(enrollment => {
        const userId = enrollment.user?.id || enrollment.user_id;
        if (userId) {
          const userName = enrollment.user?.name || enrollment.user?.display_name || 'Unknown';
          studentMap.set(userId, userName);
        }
      });

      const accommodationData: Record<string, string> = {};
      
      const dataUrl = `${baseUrl}/courses/${courseId}/custom_gradebook_columns/${column.id}/data`;
      let currentUrl: string | null = `${dataUrl}?per_page=100`;

      while (currentUrl) {
        const response = await fetch(currentUrl, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          if (response.status === 404) {
            break;
          }
          throw new Error(`Failed to fetch column data: ${response.status} ${response.statusText}`);
        }

        const chunk = await response.json();
        if (Array.isArray(chunk)) {
          chunk.forEach((item: any) => {
            if (item.user_id && item.content && item.content.trim()) {
              const userId = String(item.user_id);
              accommodationData[userId] = item.content.trim();
              const userName = studentMap.get(item.user_id) || 'Unknown';
              console.log(`[Request] ${userName}: "${item.content.trim()}"`);
            }
          });
        }

        const linkHeader = response.headers.get('link');
        currentUrl = this.getNextUrl(linkHeader);
      }

      studentMap.forEach((userName, userId) => {
        if (!accommodationData[String(userId)]) {
          console.log(`[Request] ${userName}: No accommodation`);
        }
      });

      return accommodationData;
    } catch (error: any) {
      console.error(`[getAccommodationData] Error:`, error);
      throw new Error(`Failed to fetch accommodation data: ${error.message}`);
    }
  }

  async getCustomGradebookColumns(courseId: number) {
    const { token, baseUrl } = await this.getAuthHeaders();
    
    console.log(`[TEST] Fetching all custom gradebook columns for course ${courseId}`);
    const columnsUrl = `${baseUrl}/courses/${courseId}/custom_gradebook_columns?per_page=100&include_hidden=true`;
    
    const columns = await this.fetchPaginatedData(columnsUrl, token);
    
    console.log(`[TEST] Found ${columns.length} custom gradebook columns`);
    columns.forEach((col: any) => {
      console.log(`[TEST] Column: "${col.title}" (ID: ${col.id}, hidden: ${col.hidden}, position: ${col.position}, teacher_notes: ${col.teacher_notes})`);
    });
    
    return columns;
  }

  // Delete methods
  async deleteAssignment(courseId: number, assignmentId: number) {
    const { token, baseUrl } = await this.getAuthHeaders();
    
    const response = await fetch(`${baseUrl}/courses/${courseId}/assignments/${assignmentId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to delete assignment: ${response.status} ${response.statusText} - ${errorText}`);
    }

    // DELETE endpoints typically return 200 OK with the deleted object, or 204 No Content
    if (response.status === 204) {
      return { success: true };
    }
    
    try {
      return await response.json();
    } catch {
      return { success: true };
    }
  }

  async deleteQuiz(courseId: number, quizId: number) {
    const { token, baseUrl } = await this.getAuthHeaders();
    
    const response = await fetch(`${baseUrl}/courses/${courseId}/quizzes/${quizId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to delete quiz: ${response.status} ${response.statusText} - ${errorText}`);
    }

    if (response.status === 204) {
      return { success: true };
    }
    
    try {
      return await response.json();
    } catch {
      return { success: true };
    }
  }

  async deleteDiscussion(courseId: number, discussionId: number) {
    const { token, baseUrl } = await this.getAuthHeaders();
    
    const response = await fetch(`${baseUrl}/courses/${courseId}/discussion_topics/${discussionId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to delete discussion: ${response.status} ${response.statusText} - ${errorText}`);
    }

    if (response.status === 204) {
      return { success: true };
    }
    
    try {
      return await response.json();
    } catch {
      return { success: true };
    }
  }

  async deletePage(courseId: number, pageUrl: string) {
    const { token, baseUrl } = await this.getAuthHeaders();
    
    const response = await fetch(`${baseUrl}/courses/${courseId}/pages/${encodeURIComponent(pageUrl)}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to delete page: ${response.status} ${response.statusText} - ${errorText}`);
    }

    if (response.status === 204) {
      return { success: true };
    }
    
    try {
      return await response.json();
    } catch {
      return { success: true };
    }
  }

  async deleteAnnouncement(courseId: number, announcementId: number) {
    // Announcements are discussions, so use the same endpoint
    return this.deleteDiscussion(courseId, announcementId);
  }

  // Content Export
  async createContentExport(courseId: number, exportType: string = 'common_cartridge') {
    const { token, baseUrl } = await this.getAuthHeaders();
    
    const response = await fetch(`${baseUrl}/courses/${courseId}/content_exports`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        export_type: exportType,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create content export: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return await response.json();
  }

  // Create methods (for duplication)
  async createAssignment(courseId: number, body: Record<string, any>) {
    const { token, baseUrl } = await this.getAuthHeaders();
    
    // Canvas API expects assignment data wrapped in "assignment" object
    const requestBody = body.assignment ? body : { assignment: body };
    
    const response = await fetch(`${baseUrl}/courses/${courseId}/assignments`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create assignment: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return await response.json();
  }

  async createQuiz(courseId: number, body: Record<string, any>) {
    const { token, baseUrl } = await this.getAuthHeaders();
    
    // Canvas API expects quiz data wrapped in "quiz" object
    const requestBody = body.quiz ? body : { quiz: body };
    
    const response = await fetch(`${baseUrl}/courses/${courseId}/quizzes`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create quiz: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return await response.json();
  }

  async createDiscussion(courseId: number, body: Record<string, any>) {
    const { token, baseUrl } = await this.getAuthHeaders();
    
    // Canvas API expects discussion data wrapped in "title" and other fields directly
    const response = await fetch(`${baseUrl}/courses/${courseId}/discussion_topics`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create discussion: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return await response.json();
  }

  async createPage(courseId: number, body: Record<string, any>) {
    const { token, baseUrl } = await this.getAuthHeaders();
    
    // Canvas API expects page data with "wiki_page" wrapper
    const requestBody = body.wiki_page ? body : { wiki_page: body };
    
    const response = await fetch(`${baseUrl}/courses/${courseId}/pages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create page: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return await response.json();
  }

  async createAnnouncement(courseId: number, body: Record<string, any>) {
    // Announcements are created as discussions with is_announcement flag
    const announcementBody = {
      ...body,
      is_announcement: true,
    };
    return this.createDiscussion(courseId, announcementBody);
  }

  async createQuizExtensions(courseId: number, quizId: number, extensions: Array<{ user_id: number; extra_time?: number; extra_attempts?: number }>) {
    const { token, baseUrl } = await this.getAuthHeaders();
    const url = `${baseUrl}/courses/${courseId}/quizzes/${quizId}/extensions`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ quiz_extensions: extensions }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Canvas API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return await response.json();
  }

  async getAssignmentOverrides(courseId: number, assignmentId: number) {
    const { token, baseUrl } = await this.getAuthHeaders();
    const url = `${baseUrl}/courses/${courseId}/assignments/${assignmentId}/overrides`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Canvas API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return await response.json();
  }

  async deleteAssignmentOverride(courseId: number, assignmentId: number, overrideId: number) {
    const { token, baseUrl } = await this.getAuthHeaders();
    const url = `${baseUrl}/courses/${courseId}/assignments/${assignmentId}/overrides/${overrideId}`;
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Canvas API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return await response.json();
  }

  async createAssignmentOverride(courseId: number, assignmentId: number, override: { student_ids?: number[]; due_at?: string; unlock_at?: string; lock_at?: string }) {
    const { token, baseUrl } = await this.getAuthHeaders();
    const url = `${baseUrl}/courses/${courseId}/assignments/${assignmentId}/overrides`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ assignment_override: override }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Canvas API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return await response.json();
  }

  async getModule(courseId: number, moduleId: number) {
    const { token, baseUrl } = await this.getAuthHeaders();
    
    // Retry logic for 404s (Canvas may need a moment to make the resource available)
    let lastError: Error | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      if (attempt > 0) {
        // Wait 500ms before retry
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      const response = await fetch(`${baseUrl}/courses/${courseId}/modules/${moduleId}?include[]=items`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        return await response.json();
      }
      
      if (response.status !== 404 || attempt === 2) {
        // If not 404, or this is the last attempt, throw the error
        const errorText = await response.text();
        lastError = new Error(`Failed to get module: ${response.status} ${response.statusText} - ${errorText}`);
        if (response.status !== 404) {
          throw lastError;
        }
      }
    }
    
    // If we get here, all retries failed with 404
    throw lastError || new Error(`Failed to get module: Resource not found after retries`);
  }

  async createModule(courseId: number, body: Record<string, any>) {
    const { token, baseUrl } = await this.getAuthHeaders();
    
    // Clean up body - remove null, undefined, and empty strings
    const cleanedBody: Record<string, any> = {};
    Object.keys(body).forEach(key => {
      const value = body[key];
      if (value !== null && value !== undefined && value !== '') {
        cleanedBody[key] = value;
      }
    });
    
    console.log(`Creating module in course ${courseId} with:`, cleanedBody);
    
    // Canvas API expects module data wrapped in "module" object
    const requestBody = body.module ? body : { module: cleanedBody };
    
    const response = await fetch(`${baseUrl}/courses/${courseId}/modules`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Module creation failed: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`Failed to create module: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return await response.json();
  }

  async deleteModule(courseId: number, moduleId: number) {
    const { token, baseUrl } = await this.getAuthHeaders();
    
    const response = await fetch(`${baseUrl}/courses/${courseId}/modules/${moduleId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to delete module: ${response.status} ${response.statusText} - ${errorText}`);
    }

    if (response.status === 204) {
      return { success: true };
    }
    
    try {
      return await response.json();
    } catch {
      return { success: true };
    }
  }

  async createModuleItem(courseId: number, moduleId: number, body: Record<string, any>) {
    const { token, baseUrl } = await this.getAuthHeaders();
    
    // Canvas API expects module item data wrapped in "module_item" object
    const requestBody = body.module_item ? body : { module_item: body };
    
    const response = await fetch(`${baseUrl}/courses/${courseId}/modules/${moduleId}/items`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create module item: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return await response.json();
  }

  async getModuleItems(courseId: number, moduleId: number) {
    const { token, baseUrl } = await this.getAuthHeaders();
    const url = `${baseUrl}/courses/${courseId}/modules/${moduleId}/items?per_page=100`;
    
    try {
      const items = await this.fetchPaginatedData(url, token);
      console.log(`[Service] Retrieved ${items.length} items for module ${moduleId} in course ${courseId}`);
      return items;
    } catch (error: any) {
      console.error(`[Service] Error in getModuleItems for module ${moduleId} in course ${courseId}:`, error);
      throw error;
    }
  }

  async deleteModuleItem(courseId: number, item: { type: string; content_id: number | string; title?: string }) {
    const { token, baseUrl } = await this.getAuthHeaders();
    
    try {
      let deleteUrl: string;
      
      if (item.type === 'Assignment') {
        deleteUrl = `${baseUrl}/courses/${courseId}/assignments/${item.content_id}`;
      } else if (item.type === 'Quiz') {
        deleteUrl = `${baseUrl}/courses/${courseId}/quizzes/${item.content_id}`;
      } else if (item.type === 'Page') {
        deleteUrl = `${baseUrl}/courses/${courseId}/pages/${encodeURIComponent(item.content_id as string)}`;
      } else if (item.type === 'Discussion') {
        deleteUrl = `${baseUrl}/courses/${courseId}/discussion_topics/${item.content_id}`;
      } else if (item.type === 'File' || item.type === 'Attachment') {
        deleteUrl = `${baseUrl}/courses/${courseId}/files/${item.content_id}`;
      } else {
        throw new Error(`Unsupported module item type: ${item.type}`);
      }
      
      const response = await fetch(deleteUrl, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to delete ${item.type} ${item.content_id}: ${response.status} ${response.statusText} - ${errorText}`);
      }

      if (response.status === 204) {
        return { success: true, type: item.type, content_id: item.content_id };
      }
      
      try {
        const result = await response.json();
        return { success: true, type: item.type, content_id: item.content_id, result };
      } catch {
        return { success: true, type: item.type, content_id: item.content_id };
      }
    } catch (error: any) {
      console.error(`[Service] Error deleting module item ${item.type} ${item.content_id}:`, error);
      throw error;
    }
  }

  private static readonly ACCREDITATION_PROFILE_PAGE_URL = 'accreditation-profile';
  private static readonly START_HERE_MODULE_NAME = 'Start Here';

  private static readonly ACCREDITATION_PRE_CLASS = 'accreditation-profile-data';

  private static readonly PROFILE_KEYS: Array<{ key: string; label: string }> = [
    { key: 'state', label: 'State' },
    { key: 'city', label: 'City' },
    { key: 'institutionName', label: 'Institution' },
    { key: 'institutionId', label: 'Institution ID' },
    { key: 'program', label: 'Program' },
    { key: 'programCip4', label: 'Program CIP4' },
    { key: 'programTitle', label: 'Program Title' },
    { key: 'programFocusCip6', label: 'Program Focus CIP6' },
    { key: 'selectedStandards', label: 'Selected Standards' },
  ];

  private static parseAccreditationBlock(body: string): Record<string, unknown> | null {
    const raw = body ?? '';
    const preRegex = new RegExp(`<pre[^>]*class=["'][^"']*${CanvasService.ACCREDITATION_PRE_CLASS}[^"']*["'][^>]*>([\\s\\S]*?)</pre>`, 'i');
    let text = raw.match(preRegex)?.[1]?.trim() ?? '';
    if (!text) {
      text = raw.replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>\s*<p[^>]*>/gi, '\n').replace(/<[^>]+>/g, '');
      if (!text) {
        const legacyMatch = raw.match(/<!--\s*accreditation:(.+?)\s*-->/s);
        if (legacyMatch) {
          try {
            const parsed = JSON.parse(legacyMatch[1].trim());
            return typeof parsed === 'object' && parsed !== null ? parsed : null;
          } catch { /* fall through */ }
        }
        return null;
      }
    }
    const profile: Record<string, unknown> = { v: 1 };
    for (const line of text.split(/\r?\n/)) {
      const m = line.match(/^([^:]+):\s*(.*)$/);
      if (!m) continue;
      const label = m[1].trim();
      const value = m[2].trim();
      const def = CanvasService.PROFILE_KEYS.find(d => d.label === label);
      if (!def || !value) continue;
      if (def.key === 'institutionId') profile[def.key] = parseInt(value, 10) || value;
      else if (def.key === 'programFocusCip6' || def.key === 'selectedStandards') profile[def.key] = value.split(',').map((s: string) => s.trim()).filter(Boolean);
      else profile[def.key] = value;
    }
    return profile;
  }

  private static buildAccreditationBlock(profile: Record<string, unknown>): string {
    const lines = CanvasService.PROFILE_KEYS.map(d => {
        const v = profile[d.key];
        if (v == null) return null;
        if ((d.key === 'programFocusCip6' || d.key === 'selectedStandards') && Array.isArray(v)) return v.length ? `${d.label}: ${v.join(',')}` : null;
        const s = String(v).trim();
        return s ? `${d.label}: ${s}` : null;
      })
      .filter(Boolean) as string[];
    const inner = lines.length ? lines.join('\n') : 'No profile data yet. Use the Standards Sync tab to set State, City, Institution, and Program.';
    return `<pre class="${CanvasService.ACCREDITATION_PRE_CLASS}">${inner}</pre>`;
  }

  private static mergeAccreditationBlockInBody(body: string, profile: Record<string, unknown>): string {
    const block = CanvasService.buildAccreditationBlock(profile);
    const preRegex = new RegExp(`<pre[^>]*class=["'][^"']*${CanvasService.ACCREDITATION_PRE_CLASS}[^"']*["'][^>]*>[\\s\\S]*?</pre>`, 'gi');
    const legacyRegex = /<!--\s*accreditation:.+?\s*-->/s;
    let out = body ?? '';
    if (preRegex.test(out)) {
      out = out.replace(preRegex, block);
    } else if (legacyRegex.test(out)) {
      out = out.replace(legacyRegex, block);
    } else {
      out = out.trim() ? `${block}\n\n${out}` : block;
    }
    return out.trim();
  }

  async ensureStartHereModule(courseId: number) {
    const modules = await this.getCourseModules(courseId);
    const existing = modules.find((m: { name?: string }) =>
      (m.name ?? '').trim().toLowerCase() === CanvasService.START_HERE_MODULE_NAME.toLowerCase()
    );
    if (existing) return existing;
    return this.createModule(courseId, { name: CanvasService.START_HERE_MODULE_NAME });
  }

  async getOrCreateAccreditationProfilePage(courseId: number) {
    const startHere = await this.ensureStartHereModule(courseId);
    const pages = await this.getCoursePages(courseId);
    const existing = pages.find(
      (p: { url?: string }) => (p.url ?? '').toLowerCase() === CanvasService.ACCREDITATION_PROFILE_PAGE_URL.toLowerCase()
    );
    if (existing) {
      const items = await this.getModuleItems(courseId, startHere.id);
      const inModule = items.some(
        (i: { type?: string; page_url?: string }) =>
          i.type === 'Page' && (i.page_url ?? '').toLowerCase() === CanvasService.ACCREDITATION_PROFILE_PAGE_URL.toLowerCase()
      );
      if (!inModule) {
        await this.createModuleItem(courseId, startHere.id, {
          type: 'Page',
          page_url: existing.url || CanvasService.ACCREDITATION_PROFILE_PAGE_URL,
        });
      }
      return { page: existing, module: startHere };
    }
    const initialBody = CanvasService.buildAccreditationBlock({ v: 1 });
    const created = await this.createPage(courseId, {
      wiki_page: { title: 'Accreditation Profile', body: initialBody },
    });
    const pageUrl = created.url ?? CanvasService.ACCREDITATION_PROFILE_PAGE_URL;
    await this.createModuleItem(courseId, startHere.id, { type: 'Page', page_url: pageUrl });
    return { page: created, module: startHere };
  }

  async getAccreditationProfile(courseId: number) {
    await this.getOrCreateAccreditationProfilePage(courseId);
    const page = await this.getPage(courseId, CanvasService.ACCREDITATION_PROFILE_PAGE_URL);
    const body = page?.body ?? '';
    const profile = CanvasService.parseAccreditationBlock(body);
    return profile ?? { v: 1 };
  }

  async saveAccreditationProfile(courseId: number, profile: Record<string, unknown>) {
    await this.getOrCreateAccreditationProfilePage(courseId);
    const pageUrl = CanvasService.ACCREDITATION_PROFILE_PAGE_URL;
    const page = await this.getPage(courseId, pageUrl);
    const merged = CanvasService.mergeAccreditationBlockInBody(page?.body ?? '', profile);
    return this.updatePage(courseId, pageUrl, { wiki_page: { body: merged } });
  }

  private static readonly GENERAL_ACCREDITORS: Array<{ id: string; name: string; abbreviation?: string }> = [
    { id: 'QM', abbreviation: 'QM', name: 'Quality Matters' },
    { id: 'SACSCOC', abbreviation: 'SACSCOC', name: 'Southern Association of Colleges and Schools Commission on Colleges' },
  ];

  private static readonly STUB_ACCREDITORS_BY_CIP: Record<string, Array<{ id: string; name: string; abbreviation?: string }>> = {
    '16.16': [
      { id: 'ACTFL', abbreviation: 'ACTFL', name: 'American Council on the Teaching of Foreign Languages' },
      { id: 'ASLTA', abbreviation: 'ASLTA', name: 'American Sign Language Teachers Association / NCIEC' },
      { id: 'CCIE', abbreviation: 'CCIE', name: 'Commission on Collegiate Interpreter Education' },
      { id: 'CED', abbreviation: 'CED', name: 'Council on Education of the Deaf' },
      { id: 'CEC', abbreviation: 'CEC', name: 'Council for Exceptional Children' },
      { id: 'BEI', abbreviation: 'BEI', name: 'Board for Evaluation of Interpreters (Texas)' },
      { id: 'RID', abbreviation: 'RID', name: 'Registry of Interpreters for the Deaf' },
    ],
  };

  private static readonly STUB_STANDARDS_BY_ORG: Record<string, AccreditationStandardNode[]> = {
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

  private static mergeWithGeneralAccreditors(list: Array<{ id: string; name: string; abbreviation?: string }>): Array<{ id: string; name: string; abbreviation?: string }> {
    const ids = new Set(list.map(a => a.id));
    const general = CanvasService.GENERAL_ACCREDITORS.filter(a => !ids.has(a.id));
    return [...general, ...list];
  }

  async getAccreditorsForCourse(
    courseId: number,
    cip?: string,
    degreeLevel?: string
  ): Promise<{ accreditors: Array<{ id: string; name: string; abbreviation?: string }>; source: 'lookup_service' | 'stub' }> {
    let cipParam = (cip || '').trim();
    if (!cipParam) {
      const profile = await this.getAccreditationProfile(courseId);
      const p = profile as Record<string, unknown>;
      cipParam = (p?.programCip4 as string) || (p?.program as string) || '';
      console.log('[Accreditation] cip from profile fallback:', { cipParam, programCip4: p?.programCip4, program: p?.program, programFocusCip6: p?.programFocusCip6 });
    } else {
      console.log('[Accreditation] cip from query param:', cipParam);
    }
    if (!cipParam) {
      const general = CanvasService.mergeWithGeneralAccreditors([]);
      return { accreditors: general, source: 'stub' };
    }
    const cipKey = cipParam.includes('.') ? cipParam : cipParam.replace(/^(\d{2})(\d{2})$/, '$1.$2');
    const base = (this.config.get<string>('ACCREDITATION_LOOKUP_URL') || '').replace(/\/$/, '');
    console.log('[Accreditation] Lookup config:', { base: base ? base + ' (set)' : '(not set)', cipParam, cipKey });
    if (base) {
      const params = new URLSearchParams({ cip: cipParam });
      const deg = (degreeLevel || '').trim();
      if (deg) params.set('degree_level', deg);
      const url = `${base}/accreditors?${params}`;
      try {
        console.log('[Accreditation] Fetching lookup service:', url);
        const res = await fetch(url);
        const data = (await res.json()) as { accreditors?: Array<{ id: string; name: string; abbreviation?: string }> };
        const list = Array.isArray(data?.accreditors) ? data.accreditors : [];
        console.log('[Accreditation] Lookup response:', { status: res.status, ok: res.ok, count: list.length, accreditors: list });
        if (res.ok && list.length) {
          const merged = CanvasService.mergeWithGeneralAccreditors(list);
          return { accreditors: merged, source: 'lookup_service' };
        }
        if (res.ok && list.length === 0) {
          console.log('[Accreditation] Lookup returned empty, falling back to stub');
        }
      } catch (e) {
        console.warn('[Accreditation] Lookup service fetch failed:', e);
      }
    } else {
      console.log('[Accreditation] ACCREDITATION_LOOKUP_URL not set, using stub');
    }
    const cip4Key = cipKey.includes('.') ? cipKey.slice(0, 5) : cipKey;
    const stub = CanvasService.STUB_ACCREDITORS_BY_CIP[cipKey] ?? CanvasService.STUB_ACCREDITORS_BY_CIP[cip4Key] ?? [];
    const merged = CanvasService.mergeWithGeneralAccreditors(stub);
    console.log('[Accreditation] Using stub:', { cipKey, cip4Key, stubCount: stub.length });
    return { accreditors: merged, source: 'stub' };
  }

  private static normalizeOrgId(orgId: string): string {
    return String(orgId || '')
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9._-]/g, '');
  }

  private async getEffectiveCip(courseId: number, cip?: string): Promise<string> {
    const requested = (cip || '').trim();
    if (requested) return requested;
    const profile = await this.getAccreditationProfile(courseId);
    const p = profile as Record<string, unknown>;
    return ((p?.programCip4 as string) || (p?.program as string) || '').trim();
  }

  private static normalizeStandardsNodes(
    raw: any[],
    sourceType: 'db' | 'api' | 'file' | 'scrape' | 'ai',
    sourceUri?: string | null,
    defaultConfidence = 0.9,
  ): AccreditationStandardNode[] {
    const now = new Date().toISOString();
    const out: AccreditationStandardNode[] = [];
    for (const item of raw || []) {
      const id = String(item?.id ?? item?.standardId ?? item?.code ?? '').trim();
      const title = String(item?.title ?? item?.name ?? item?.label ?? '').trim();
      if (!id || !title) continue;
      out.push({
        id,
        title,
        description: item?.description ? String(item.description) : null,
        version: item?.version ? String(item.version) : null,
        effectiveDate: item?.effectiveDate ? String(item.effectiveDate) : null,
        parentId: item?.parentId ? String(item.parentId) : null,
        sourceType,
        sourceUri: sourceUri ?? null,
        confidence: typeof item?.confidence === 'number' ? item.confidence : defaultConfidence,
        retrievedAt: now,
      });
    }
    return out;
  }

  private async resolveStandardsFromLookupDb(
    orgId: string,
    cip?: string,
    degreeLevel?: string,
  ): Promise<{ standards: AccreditationStandardNode[]; sourceUri?: string }> {
    const base = (this.config.get<string>('ACCREDITATION_LOOKUP_URL') || '').replace(/\/$/, '');
    if (!base) return { standards: [] };
    const params = new URLSearchParams({ org: orgId });
    if (cip) params.set('cip', cip);
    if (degreeLevel) params.set('degree_level', degreeLevel);
    const url = `${base}/standards?${params.toString()}`;
    const res = await fetch(url);
    if (!res.ok) return { standards: [] };
    const payload = await res.json();
    const arr = Array.isArray(payload?.standards) ? payload.standards : (Array.isArray(payload) ? payload : []);
    return { standards: CanvasService.normalizeStandardsNodes(arr, 'db', url, 0.95), sourceUri: url };
  }

  private async resolveStandardsFromApi(
    orgId: string,
    cip?: string,
    degreeLevel?: string,
  ): Promise<{ standards: AccreditationStandardNode[]; sourceUri?: string }> {
    const template = (this.config.get<string>('ACCREDITATION_STANDARDS_API_TEMPLATE') || '').trim();
    if (!template) return { standards: [] };
    const url = template
      .replace(/\{org\}/g, encodeURIComponent(orgId))
      .replace(/\{cip\}/g, encodeURIComponent(cip || ''))
      .replace(/\{degree_level\}/g, encodeURIComponent(degreeLevel || ''));
    const res = await fetch(url);
    if (!res.ok) return { standards: [] };
    const payload = await res.json();
    const arr = Array.isArray(payload?.standards) ? payload.standards : (Array.isArray(payload) ? payload : []);
    return { standards: CanvasService.normalizeStandardsNodes(arr, 'api', url, 0.9), sourceUri: url };
  }

  private async resolveStandardsFromFile(orgId: string): Promise<{ standards: AccreditationStandardNode[]; sourceUri?: string }> {
    const configured = (this.config.get<string>('ACCREDITATION_STANDARDS_FILE') || '').trim();
    const candidatePaths = [
      configured,
      path.join(process.cwd(), 'data', 'accreditation-standards.json'),
      path.join(process.cwd(), 'services', 'accreditation-lookup', 'data', 'standards.json'),
    ].filter(Boolean);
    for (const filePath of candidatePaths) {
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        const payload = JSON.parse(content);
        let arr: any[] = [];
        if (Array.isArray(payload?.standards)) {
          arr = payload.standards.filter((x: any) => CanvasService.normalizeOrgId(x?.orgId || x?.organization || '') === orgId);
        } else if (payload?.organizations && Array.isArray(payload.organizations?.[orgId])) {
          arr = payload.organizations[orgId];
        } else if (Array.isArray(payload?.[orgId])) {
          arr = payload[orgId];
        }
        const standards = CanvasService.normalizeStandardsNodes(arr, 'file', filePath, 0.85);
        if (standards.length) return { standards, sourceUri: filePath };
      } catch (_) {
        // ignore unreadable/missing files and continue fallback chain
      }
    }
    return { standards: [] };
  }

  private static extractStandardsFromText(
    orgId: string,
    text: string,
    sourceType: 'scrape' | 'ai',
    sourceUri?: string,
  ): AccreditationStandardNode[] {
    const lines = String(text || '')
      .split(/\r?\n/)
      .map((x) => x.trim())
      .filter(Boolean);
    const out: AccreditationStandardNode[] = [];
    for (const line of lines) {
      const m = line.match(/^([A-Z]{2,}[A-Z0-9._-]*\d*[A-Z0-9._-]*)\s*[:\-]\s*(.+)$/);
      if (m) {
        out.push({ id: m[1].trim(), title: m[2].trim(), sourceType, sourceUri: sourceUri ?? null, confidence: sourceType === 'ai' ? 0.5 : 0.7, retrievedAt: new Date().toISOString() });
      }
    }
    if (out.length) return out;
    // Fallback: treat sentence-like bullets as titles and synthesize IDs
    const bullets = lines.filter((x) => /^[-*•]\s+/.test(x)).slice(0, 20).map((x) => x.replace(/^[-*•]\s+/, '').trim());
    return bullets.map((title, idx) => ({
      id: `${orgId}-${idx + 1}`,
      title: title.slice(0, 200),
      sourceType,
      sourceUri: sourceUri ?? null,
      confidence: sourceType === 'ai' ? 0.45 : 0.6,
      retrievedAt: new Date().toISOString(),
    }));
  }

  private async resolveStandardsFromScrape(orgId: string): Promise<{ standards: AccreditationStandardNode[]; sourceUri?: string; rawText?: string }> {
    const template = (this.config.get<string>('ACCREDITATION_STANDARDS_SCRAPE_TEMPLATE') || '').trim();
    if (!template) return { standards: [] };
    const url = template.replace(/\{org\}/g, encodeURIComponent(orgId));
    const res = await fetch(url);
    if (!res.ok) return { standards: [] };
    const html = await res.text();
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, '\n')
      .replace(/\n{2,}/g, '\n');
    const standards = CanvasService.extractStandardsFromText(orgId, text, 'scrape', url);
    return { standards, sourceUri: url, rawText: text };
  }

  private static extractJsonBlock(text: string): string | null {
    const trimmed = String(text || '').trim();
    if (!trimmed) return null;
    const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fence?.[1]) return fence[1].trim();
    const arr = trimmed.match(/\[[\s\S]*\]/);
    if (arr?.[0]) return arr[0];
    const obj = trimmed.match(/\{[\s\S]*\}/);
    if (obj?.[0]) return obj[0];
    return null;
  }

  private async resolveStandardsWithAiFallback(
    orgId: string,
    orgName: string,
    cip?: string,
    contextText?: string,
  ): Promise<AccreditationStandardNode[]> {
    const key = (this.config.get<string>('ANTHROPIC_API_KEY') || '').trim();
    if (!key) return [];
    const model = (this.config.get<string>('CLAUDE_MODEL') || 'claude-sonnet-4-6').trim();
    const prompt = [
      'Return JSON only.',
      'Task: infer a minimal standards list for an accrediting body.',
      'Output schema: [{ "id": "ORG-1", "title": "Standard title", "description": "optional" }]',
      `Organization ID: ${orgId}`,
      `Organization Name: ${orgName}`,
      `CIP (if known): ${cip || '(unknown)'}`,
      `Context:\n${(contextText || '').slice(0, 12000) || '(none)'}`,
    ].join('\n');
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model,
        max_tokens: 1200,
        temperature: 0.1,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    if (!res.ok) return [];
    const payload = await res.json() as { content?: Array<{ type?: string; text?: string }> };
    const text = Array.isArray(payload?.content)
      ? payload.content.filter((c) => c?.type === 'text' && c?.text).map((c) => c.text).join('\n')
      : '';
    const jsonBlock = CanvasService.extractJsonBlock(text);
    if (!jsonBlock) return [];
    try {
      const parsed = JSON.parse(jsonBlock);
      const arr = Array.isArray(parsed) ? parsed : (Array.isArray((parsed as any)?.standards) ? (parsed as any).standards : []);
      return CanvasService.normalizeStandardsNodes(arr, 'ai', null, 0.5);
    } catch {
      return [];
    }
  }

  private async resolveStandardsForOrganization(
    org: { id: string; name: string; abbreviation?: string },
    cip?: string,
    degreeLevel?: string,
  ): Promise<StandardsResolutionResult> {
    const orgId = CanvasService.normalizeOrgId(org.id || org.abbreviation || org.name);
    const warnings: string[] = [];

    try {
      const db = await this.resolveStandardsFromLookupDb(orgId, cip, degreeLevel);
      if (db.standards.length) {
        return { sourceType: 'db', standards: db.standards, sourceUri: db.sourceUri ?? null, confidence: 0.95, usedAiFallback: false, warnings };
      }
    } catch (e: any) {
      warnings.push(`db lookup failed: ${e?.message || 'unknown error'}`);
    }

    try {
      const api = await this.resolveStandardsFromApi(orgId, cip, degreeLevel);
      if (api.standards.length) {
        return { sourceType: 'api', standards: api.standards, sourceUri: api.sourceUri ?? null, confidence: 0.9, usedAiFallback: false, warnings };
      }
    } catch (e: any) {
      warnings.push(`api lookup failed: ${e?.message || 'unknown error'}`);
    }

    try {
      const file = await this.resolveStandardsFromFile(orgId);
      if (file.standards.length) {
        return { sourceType: 'file', standards: file.standards, sourceUri: file.sourceUri ?? null, confidence: 0.85, usedAiFallback: false, warnings };
      }
    } catch (e: any) {
      warnings.push(`file lookup failed: ${e?.message || 'unknown error'}`);
    }

    let scrapeRawText = '';
    try {
      const scrape = await this.resolveStandardsFromScrape(orgId);
      if (scrape.standards.length) {
        return { sourceType: 'scrape', standards: scrape.standards, sourceUri: scrape.sourceUri ?? null, confidence: 0.7, usedAiFallback: false, warnings };
      }
      scrapeRawText = scrape.rawText || '';
    } catch (e: any) {
      warnings.push(`scrape lookup failed: ${e?.message || 'unknown error'}`);
    }

    try {
      const ai = await this.resolveStandardsWithAiFallback(orgId, org.name, cip, scrapeRawText);
      if (ai.length) {
        warnings.push('ai fallback used');
        return { sourceType: 'ai', standards: ai, sourceUri: null, confidence: 0.5, usedAiFallback: true, warnings };
      }
    } catch (e: any) {
      warnings.push(`ai fallback failed: ${e?.message || 'unknown error'}`);
    }

    const stub = CanvasService.STUB_STANDARDS_BY_ORG[orgId] || [];
    if (stub.length) {
      const standards = CanvasService.normalizeStandardsNodes(stub, 'file', 'stub', 0.4);
      warnings.push('stub standards used');
      return { sourceType: 'file', standards, sourceUri: 'stub', confidence: 0.4, usedAiFallback: false, warnings };
    }

    return { sourceType: 'none', standards: [], sourceUri: null, confidence: 0, usedAiFallback: false, warnings };
  }

  async getAccreditationStandardsForCourse(
    courseId: number,
    cip?: string,
    degreeLevel?: string,
  ) {
    const effectiveCip = await this.getEffectiveCip(courseId, cip);
    const accreditorsPayload = await this.getAccreditorsForCourse(courseId, effectiveCip || undefined, degreeLevel);
    const organizations = await Promise.all(
      (accreditorsPayload.accreditors || []).map(async (org) => {
        const resolved = await this.resolveStandardsForOrganization(org, effectiveCip || undefined, degreeLevel);
        return {
          id: org.id,
          name: org.name,
          abbreviation: org.abbreviation ?? null,
          standards_source: resolved.sourceType,
          standards_source_uri: resolved.sourceUri ?? null,
          standards_confidence: resolved.confidence,
          used_ai_fallback: resolved.usedAiFallback,
          warnings: resolved.warnings,
          standards: resolved.standards,
        };
      }),
    );
    const totalStandards = organizations.reduce((sum, org) => sum + (Array.isArray(org.standards) ? org.standards.length : 0), 0);
    return {
      cip: effectiveCip || null,
      accreditors_source: accreditorsPayload.source,
      organizations,
      total_standards: totalStandards,
    };
  }

  private static readonly STANDARDS_PREFIX_REGEX = /\|STANDARDS:([^|]+)\|/;

  private static parseStandardsFromDescription(description: string | null | undefined): string[] | null {
    if (!description || typeof description !== 'string') return null;
    const match = description.match(CanvasService.STANDARDS_PREFIX_REGEX);
    if (!match) return null;
    return match[1].split(',').map(s => s.trim()).filter(Boolean);
  }

  private static mergeStandardsIntoDescription(description: string | null | undefined, standards: string[]): string {
    const base = (description ?? '').trim();
    const block = standards.length ? `|STANDARDS:${standards.join(',')}|` : '';
    if (!block) {
      return base.replace(CanvasService.STANDARDS_PREFIX_REGEX, '').trim();
    }
    if (CanvasService.STANDARDS_PREFIX_REGEX.test(base)) {
      return base.replace(CanvasService.STANDARDS_PREFIX_REGEX, block).trim();
    }
    return base ? `${block} ${base}` : block;
  }

  async getCourseOutcomeLinks(courseId: number) {
    const { token, baseUrl } = await this.getAuthHeaders();
    const url = `${baseUrl}/courses/${courseId}/outcome_group_links?outcome_style=full&per_page=100`;
    const links = await this.fetchPaginatedData(url, token);
    return links.map((link: { outcome?: { id: number; title?: string; description?: string }; outcome_group?: { title?: string } }) => ({
      id: link.outcome?.id,
      title: link.outcome?.title ?? '',
      description: link.outcome?.description ?? '',
      groupTitle: link.outcome_group?.title ?? null,
      standards: CanvasService.parseStandardsFromDescription(link.outcome?.description) ?? [],
    }));
  }

  async updateOutcomeStandards(outcomeId: number, standards: string[]) {
    const { token, baseUrl } = await this.getAuthHeaders();
    const getRes = await fetch(`${baseUrl}/outcomes/${outcomeId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!getRes.ok) throw new Error(`Failed to fetch outcome: ${getRes.statusText}`);
    const outcome = await getRes.json();
    const merged = CanvasService.mergeStandardsIntoDescription(outcome.description, standards);
    const putRes = await fetch(`${baseUrl}/outcomes/${outcomeId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: merged }),
    });
    if (!putRes.ok) throw new Error(`Failed to update outcome: ${putRes.statusText}`);
    return putRes.json();
  }

  private static readonly ACCESSIBILITY_SUPPORTED_TYPES = ['pages', 'assignments', 'announcements', 'syllabus', 'discussions'] as const;

  private resolveAccessibilityResourceTypes(resourceTypes?: string[]): string[] {
    const allowed = new Set<string>(CanvasService.ACCESSIBILITY_SUPPORTED_TYPES as unknown as string[]);
    const requested = Array.isArray(resourceTypes) ? resourceTypes.map((x) => String(x || '').trim().toLowerCase()).filter(Boolean) : [];
    if (!requested.length) return Array.from(allowed);
    return requested.filter((x) => allowed.has(x));
  }

  private escapeCsvCell(value: unknown): string {
    const s = String(value ?? '');
    if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  }

  private snippet(text: string, max = 220): string {
    const t = String(text || '').replace(/\s+/g, ' ').trim();
    return t.length <= max ? t : `${t.slice(0, max - 1)}…`;
  }

  private addFinding(
    findings: AccessibilityFinding[],
    base: Omit<AccessibilityFinding, 'rule_id' | 'severity' | 'message' | 'snippet'>,
    rule_id: string,
    severity: AccessibilitySeverity,
    message: string,
    snippet?: string,
  ) {
    findings.push({
      ...base,
      rule_id,
      severity,
      message,
      snippet: snippet ? this.snippet(snippet) : null,
    });
  }

  private parseCssColor(input: string | null | undefined): { r: number; g: number; b: number } | null {
    const s = String(input || '').trim().toLowerCase();
    if (!s) return null;
    const hex = s.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
    if (hex) {
      const raw = hex[1];
      const full = raw.length === 3 ? raw.split('').map((c) => c + c).join('') : raw;
      return {
        r: parseInt(full.slice(0, 2), 16),
        g: parseInt(full.slice(2, 4), 16),
        b: parseInt(full.slice(4, 6), 16),
      };
    }
    const rgb = s.match(/^rgba?\(([^)]+)\)$/);
    if (rgb) {
      const parts = rgb[1].split(',').map((x) => Number(x.trim()));
      if (parts.length >= 3 && parts.slice(0, 3).every((n) => Number.isFinite(n))) {
        return { r: Math.max(0, Math.min(255, parts[0])), g: Math.max(0, Math.min(255, parts[1])), b: Math.max(0, Math.min(255, parts[2])) };
      }
    }
    return null;
  }

  private contrastRatio(fg: { r: number; g: number; b: number }, bg: { r: number; g: number; b: number }): number {
    const lum = (c: { r: number; g: number; b: number }) => {
      const channel = (v: number) => {
        const x = v / 255;
        return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
      };
      return 0.2126 * channel(c.r) + 0.7152 * channel(c.g) + 0.0722 * channel(c.b);
    };
    const l1 = lum(fg);
    const l2 = lum(bg);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
  }

  private evaluateAccessibilityTier1ForHtml(
    base: Omit<AccessibilityFinding, 'rule_id' | 'severity' | 'message' | 'snippet'>,
    html: string,
  ): AccessibilityFinding[] {
    const findings: AccessibilityFinding[] = [];
    const content = String(html || '');
    if (!content.trim()) return findings;

    // Images: missing alt / long alt / filename alt
    const imgTagRegex = /<img\b[^>]*>/gi;
    let imgMatch: RegExpExecArray | null;
    while ((imgMatch = imgTagRegex.exec(content))) {
      const tag = imgMatch[0];
      const altMatch = tag.match(/\balt\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
      const srcMatch = tag.match(/\bsrc\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
      const alt = (altMatch?.[2] ?? altMatch?.[3] ?? altMatch?.[4] ?? '').trim();
      const src = (srcMatch?.[2] ?? srcMatch?.[3] ?? srcMatch?.[4] ?? '').trim();
      if (!altMatch || !alt) {
        this.addFinding(findings, base, 'img_missing_alt', 'high', 'Image is missing descriptive alt text.', tag);
      } else {
        if (alt.length > 200) this.addFinding(findings, base, 'img_alt_too_long', 'medium', 'Image alt text exceeds 200 characters.', alt);
        if (/\.(png|jpe?g|gif|webp|svg|bmp|tiff?)$/i.test(alt) || (src && alt.toLowerCase() === src.split('/').pop()?.toLowerCase())) {
          this.addFinding(findings, base, 'img_alt_filename', 'medium', 'Image alt text appears to be a filename.', alt);
        }
      }
    }

    // Tables: header/caption/scope
    const tableRegex = /<table\b[\s\S]*?<\/table>/gi;
    let tableMatch: RegExpExecArray | null;
    while ((tableMatch = tableRegex.exec(content))) {
      const tableHtml = tableMatch[0];
      if (!/<th\b/i.test(tableHtml)) this.addFinding(findings, base, 'table_missing_header', 'high', 'Table does not include at least one header cell.', tableHtml);
      if (!/<caption\b[\s\S]*?<\/caption>/i.test(tableHtml)) this.addFinding(findings, base, 'table_missing_caption', 'medium', 'Table does not include a caption.', tableHtml);
      const thRegex = /<th\b[^>]*>/gi;
      let thMatch: RegExpExecArray | null;
      while ((thMatch = thRegex.exec(tableHtml))) {
        if (!/\bscope\s*=\s*("row"|"col"|'row'|'col'|row|col)/i.test(thMatch[0])) {
          this.addFinding(findings, base, 'table_header_scope_missing', 'medium', 'Table header is missing scope (row/col).', thMatch[0]);
        }
      }
    }

    // Headings: H1 in content, overlong heading, skipped levels
    const headingRegex = /<(h[1-6])\b[^>]*>([\s\S]*?)<\/\1>/gi;
    const levels: number[] = [];
    let headingMatch: RegExpExecArray | null;
    while ((headingMatch = headingRegex.exec(content))) {
      const tag = headingMatch[1].toLowerCase();
      const level = Number(tag.slice(1));
      const text = headingMatch[2].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
      levels.push(level);
      if (level === 1) this.addFinding(findings, base, 'heading_h1_in_body', 'medium', 'H1 heading appears in body content.', text || headingMatch[0]);
      if (text.length > 120) this.addFinding(findings, base, 'heading_too_long', 'low', 'Heading exceeds 120 characters.', text);
    }
    for (let i = 1; i < levels.length; i++) {
      if (levels[i] > levels[i - 1] + 1) {
        this.addFinding(findings, base, 'heading_skipped_level', 'medium', `Heading levels are skipped (h${levels[i - 1]} to h${levels[i]}).`);
      }
    }

    // Lists: visual bullets without semantic list
    if (!/<(?:ul|ol)\b/i.test(content) && /(?:^|<br[^>]*>|<\/p>)\s*(?:[-*•]|&bull;)\s+\S/i.test(content)) {
      this.addFinding(findings, base, 'list_not_semantic', 'medium', 'Content appears to be a list but is not marked up as ul/ol/li.');
    }

    // Links: adjacent duplicates / split links
    const adjacentAnchorRegex = /<a\b[^>]*href\s*=\s*("([^"]*)"|'([^']*)')[^>]*>[\s\S]*?<\/a>\s*(?:&nbsp;|\s|<span[^>]*>\s*<\/span>|<br[^>]*>)*<a\b[^>]*href\s*=\s*("([^"]*)"|'([^']*)')[^>]*>[\s\S]*?<\/a>/gi;
    let anchorMatch: RegExpExecArray | null;
    while ((anchorMatch = adjacentAnchorRegex.exec(content))) {
      const h1 = (anchorMatch[2] ?? anchorMatch[3] ?? '').trim();
      const h2 = (anchorMatch[5] ?? anchorMatch[6] ?? '').trim();
      if (h1 && h2 && h1 === h2) {
        this.addFinding(findings, base, 'adjacent_duplicate_links', 'low', 'Adjacent links point to the same URL and should be merged.', anchorMatch[0]);
      }
    }

    // Links: broken/split URLs rendered as plain text fragments
    const plainText = content
      .replace(/<a\b[\s\S]*?<\/a>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const splitUrlRegex = /\b(?:https?:\s*\/\s*\/\s*[\w.-]+(?:\s*\/\s*[\w\-./?%&=+#:]*)?|www\.\s*[\w.-]+\s*\.\s*[a-z]{2,}(?:\s*\/\s*[\w\-./?%&=+#:]*)?)\b/gi;
    let splitMatch: RegExpExecArray | null;
    while ((splitMatch = splitUrlRegex.exec(plainText))) {
      const token = splitMatch[0];
      if (/\s/.test(token)) {
        this.addFinding(findings, base, 'link_split_or_broken', 'medium', 'URL appears split/fractured in content and may not be clickable.', token);
      }
    }

    // Contrast (inline style only)
    const styleTagRegex = /<([a-z0-9]+)\b[^>]*style\s*=\s*("([^"]*)"|'([^']*)')[^>]*>/gi;
    let styleMatch: RegExpExecArray | null;
    while ((styleMatch = styleTagRegex.exec(content))) {
      const style = styleMatch[3] ?? styleMatch[4] ?? '';
      const colorMatch = style.match(/(?:^|;)\s*color\s*:\s*([^;]+)/i);
      const bgMatch = style.match(/(?:^|;)\s*background(?:-color)?\s*:\s*([^;]+)/i);
      if (!colorMatch || !bgMatch) continue;
      const fg = this.parseCssColor(colorMatch[1]);
      const bg = this.parseCssColor(bgMatch[1]);
      if (!fg || !bg) continue;
      const ratio = this.contrastRatio(fg, bg);
      const fsMatch = style.match(/(?:^|;)\s*font-size\s*:\s*([0-9.]+)px/i);
      const fwMatch = style.match(/(?:^|;)\s*font-weight\s*:\s*([^;]+)/i);
      const fontSizePx = fsMatch ? Number(fsMatch[1]) : 16;
      const fontWeightRaw = (fwMatch?.[1] || '').trim().toLowerCase();
      const isBold = fontWeightRaw === 'bold' || Number(fontWeightRaw) >= 700;
      const isLarge = fontSizePx >= 24 || (isBold && fontSizePx >= 18.67);
      if (isLarge && ratio < 3) {
        this.addFinding(findings, base, 'large_text_contrast', 'medium', `Large text contrast ratio ${ratio.toFixed(2)} is below 3:1.`, styleMatch[0]);
      } else if (!isLarge && ratio < 4.5) {
        this.addFinding(findings, base, 'small_text_contrast', 'high', `Small text contrast ratio ${ratio.toFixed(2)} is below 4.5:1.`, styleMatch[0]);
      }
    }

    return findings;
  }

  private evaluateAccessibilityTier2ForHtml(
    base: Omit<AccessibilityFinding, 'rule_id' | 'severity' | 'message' | 'snippet'>,
    html: string,
  ): AccessibilityFinding[] {
    const findings: AccessibilityFinding[] = [];
    const content = String(html || '');
    if (!content.trim()) return findings;
    const contentLower = content.toLowerCase();
    const stripTags = (s: string) => s.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/\s+/g, ' ').trim();
    const plainText = stripTags(content);
    const hasTranscriptWord = /\btranscript\b/i.test(plainText);

    const anchorRegex = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
    let aMatch: RegExpExecArray | null;
    while ((aMatch = anchorRegex.exec(content))) {
      const attrs = aMatch[1] || '';
      const text = stripTags(aMatch[2] || '');
      const hrefMatch = attrs.match(/\bhref\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
      const href = (hrefMatch?.[2] ?? hrefMatch?.[3] ?? hrefMatch?.[4] ?? '').trim();
      if (!text && !/\baria-label\s*=\s*["'][^"']+["']/i.test(attrs)) {
        this.addFinding(findings, base, 'link_empty_name', 'high', 'Link has no accessible name.', aMatch[0]);
      }
      if (/^(click here|read more|learn more|more|here)$/i.test(text)) {
        this.addFinding(findings, base, 'link_ambiguous_text', 'medium', 'Link text is ambiguous without context.', text);
      }
      if (/\btarget\s*=\s*["']_blank["']/i.test(attrs) && !/\b(new tab|opens in new tab)\b/i.test(text)) {
        this.addFinding(findings, base, 'link_new_tab_no_warning', 'low', 'Link opens in a new tab without warning text.', aMatch[0]);
      }
      if (/\.(pdf|docx?|pptx?|xlsx?|csv)(?:[?#].*)?$/i.test(href)) {
        if (!/\b(pdf|doc|word|ppt|powerpoint|xls|excel|csv)\b/i.test(text) || !/\b\d+\s?(kb|mb|gb)\b/i.test(text)) {
          this.addFinding(findings, base, 'link_file_missing_type_size_hint', 'low', 'File link is missing type and/or size hint.', `${text} ${href}`.trim());
        }
        if (/\.pdf(?:[?#].*)?$/i.test(href)) {
          this.addFinding(findings, base, 'doc_pdf_accessibility_unknown', 'low', 'Linked PDF accessibility (tags/text layer/title/lang) is unknown and should be verified.', href);
        } else if (/\.(docx?|pptx?)(?:[?#].*)?$/i.test(href)) {
          this.addFinding(findings, base, 'doc_office_structure_unknown', 'low', 'Linked Office file accessibility structure should be verified.', href);
        } else if (/\.(xlsx?|csv)(?:[?#].*)?$/i.test(href)) {
          this.addFinding(findings, base, 'doc_spreadsheet_headers_unknown', 'low', 'Linked spreadsheet should be checked for header/merge accessibility risks.', href);
        }
      }
    }

    const buttonRegex = /<button\b([^>]*)>([\s\S]*?)<\/button>/gi;
    let bMatch: RegExpExecArray | null;
    while ((bMatch = buttonRegex.exec(content))) {
      const attrs = bMatch[1] || '';
      const text = stripTags(bMatch[2] || '');
      if (!text && !/\baria-label\s*=\s*["'][^"']+["']/i.test(attrs) && !/\btitle\s*=\s*["'][^"']+["']/i.test(attrs)) {
        this.addFinding(findings, base, 'button_empty_name', 'high', 'Button has no accessible name.', bMatch[0]);
      }
    }

    const headingRegex = /<(h[1-6])\b[^>]*>([\s\S]*?)<\/\1>/gi;
    let h1Count = 0;
    let hMatch: RegExpExecArray | null;
    while ((hMatch = headingRegex.exec(content))) {
      const tag = (hMatch[1] || '').toLowerCase();
      const text = stripTags(hMatch[2] || '');
      if (tag === 'h1') h1Count++;
      if (!text) this.addFinding(findings, base, 'heading_empty', 'medium', 'Heading is empty.', hMatch[0]);
    }
    if (h1Count > 1) this.addFinding(findings, base, 'heading_duplicate_h1', 'medium', `Multiple H1 headings detected (${h1Count}).`);

    if (!/<h[1-6]\b/i.test(content) && /<(?:p|div|span)\b[^>]*style\s*=\s*["'][^"']*(?:font-size\s*:\s*(?:2[4-9]|[3-9]\d)px|font-weight\s*:\s*(?:700|800|900|bold))[^"']*["'][^>]*>/i.test(content)) {
      this.addFinding(findings, base, 'heading_visual_only_style', 'low', 'Visual heading style detected without semantic heading tags.');
    }

    if (plainText.length > 2500) {
      const hasMain = /<(main\b|[^>]+\brole\s*=\s*["']main["'])/i.test(content);
      const hasNav = /<(nav\b|[^>]+\brole\s*=\s*["']navigation["'])/i.test(content);
      const hasRegion = /\brole\s*=\s*["']region["']/i.test(content);
      if (!hasMain || !hasNav || !hasRegion) {
        this.addFinding(findings, base, 'landmark_structure_quality', 'low', 'Long content should include robust landmark structure (main/nav/region).');
      }
    }

    const emptyLiRegex = /<li\b[^>]*>\s*(?:&nbsp;|\s|<br[^>]*>|<\/?span[^>]*>)*<\/li>/gi;
    let liMatch: RegExpExecArray | null;
    while ((liMatch = emptyLiRegex.exec(content))) {
      this.addFinding(findings, base, 'list_empty_item', 'medium', 'List contains empty item.', liMatch[0]);
    }

    const tableRegex = /<table\b[\s\S]*?<\/table>/gi;
    let tMatch: RegExpExecArray | null;
    while ((tMatch = tableRegex.exec(content))) {
      const tableHtml = tMatch[0];
      const noHeaders = !/<th\b/i.test(tableHtml);
      const rowCount = (tableHtml.match(/<tr\b/gi) || []).length;
      const colCount = (tableHtml.match(/<t[dh]\b/gi) || []).length;
      if (noHeaders && rowCount > 2 && colCount > 4) {
        this.addFinding(findings, base, 'table_layout_heuristic', 'low', 'Table may be used for layout instead of data.', tableHtml);
      }
      if (/\b(rowspan|colspan)\s*=\s*["']?\d+/i.test(tableHtml) && !/\b(headers|scope)\s*=/i.test(tableHtml)) {
        this.addFinding(findings, base, 'table_complex_assoc_missing', 'medium', 'Complex table with rowspan/colspan lacks clear header associations.', tableHtml);
      }
    }

    const imgRegex = /<img\b([^>]*)>/gi;
    let imgMatch: RegExpExecArray | null;
    while ((imgMatch = imgRegex.exec(content))) {
      const attrs = imgMatch[1] || '';
      const altMatch = attrs.match(/\balt\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
      const srcMatch = attrs.match(/\bsrc\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
      const alt = (altMatch?.[2] ?? altMatch?.[3] ?? altMatch?.[4] ?? '').trim();
      const src = (srcMatch?.[2] ?? srcMatch?.[3] ?? srcMatch?.[4] ?? '').trim();
      const decorativeHint = /\b(decorative|spacer|divider|ornament|separator)\b/i.test(attrs + ' ' + src);
      if (decorativeHint && alt && !/\b(role\s*=\s*["']presentation["']|aria-hidden\s*=\s*["']true["'])/i.test(attrs)) {
        this.addFinding(findings, base, 'img_decorative_misuse', 'low', 'Decorative image appears to have meaningful alt text.', imgMatch[0]);
      }
      if (!decorativeHint && alt === '' && !/\b(role\s*=\s*["']presentation["']|aria-hidden\s*=\s*["']true["'])/i.test(attrs)) {
        this.addFinding(findings, base, 'img_meaningful_empty_alt', 'medium', 'Potentially meaningful image has empty alt text.', imgMatch[0]);
      }
      if (/\b(text|banner|header|poster|flyer|infographic)\b/i.test(src + ' ' + alt)) {
        this.addFinding(findings, base, 'img_text_in_image_warning', 'low', 'Image may contain meaningful text; verify readability and alt quality.', imgMatch[0]);
      }
      if (/\.gif(?:[?#].*)?$/i.test(src)) {
        this.addFinding(findings, base, 'motion_gif_warning', 'low', 'Animated GIF may create motion sensitivity concerns.', src);
      }
    }

    const videoRegex = /<video\b([^>]*)>([\s\S]*?)<\/video>/gi;
    let vMatch: RegExpExecArray | null;
    while ((vMatch = videoRegex.exec(content))) {
      const attrs = vMatch[1] || '';
      const body = vMatch[2] || '';
      if (!/<track\b[^>]*\bkind\s*=\s*["']?(captions|subtitles)["']?/i.test(body)) {
        this.addFinding(findings, base, 'video_missing_captions', 'high', 'Video is missing caption/subtitle track.', vMatch[0]);
      }
      if (/\bautoplay\b/i.test(attrs)) this.addFinding(findings, base, 'media_autoplay', 'medium', 'Media uses autoplay.', vMatch[0]);
    }
    const audioRegex = /<audio\b([^>]*)>([\s\S]*?)<\/audio>/gi;
    let auMatch: RegExpExecArray | null;
    while ((auMatch = audioRegex.exec(content))) {
      const attrs = auMatch[1] || '';
      if (!hasTranscriptWord) this.addFinding(findings, base, 'audio_missing_transcript', 'high', 'Audio content may be missing transcript.', auMatch[0]);
      if (/\bautoplay\b/i.test(attrs)) this.addFinding(findings, base, 'media_autoplay', 'medium', 'Media uses autoplay.', auMatch[0]);
    }
    if (/<iframe\b[^>]*\bsrc\s*=\s*["'][^"']*(youtube|vimeo)[^"']*["'][^>]*>/i.test(content) && !/\b(captions|cc_load_policy=1|subtitle)\b/i.test(contentLower)) {
      this.addFinding(findings, base, 'video_embed_caption_unknown', 'medium', 'Embedded video captions cannot be confirmed from markup.', 'iframe video embed');
    }

    const controlRegex = /<(input|select|textarea)\b([^>]*)>/gi;
    let cMatch: RegExpExecArray | null;
    while ((cMatch = controlRegex.exec(content))) {
      const tag = (cMatch[1] || '').toLowerCase();
      const attrs = cMatch[2] || '';
      const idMatch = attrs.match(/\bid\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
      const id = (idMatch?.[2] ?? idMatch?.[3] ?? idMatch?.[4] ?? '').trim();
      const hasLabelByFor = id ? new RegExp(`<label\\b[^>]*\\bfor\\s*=\\s*["']${id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'][^>]*>[\\s\\S]*?<\\/label>`, 'i').test(content) : false;
      const hasProgrammaticLabel = /\b(aria-label|aria-labelledby|title)\s*=\s*["'][^"']+["']/i.test(attrs);
      if (!hasLabelByFor && !hasProgrammaticLabel) {
        this.addFinding(findings, base, 'form_control_missing_label', 'high', `${tag} appears to be missing an accessible label.`, cMatch[0]);
      }
      if (/\bplaceholder\s*=\s*["'][^"']+["']/i.test(attrs) && !hasLabelByFor && !/\baria-label(ledby)?\b/i.test(attrs)) {
        this.addFinding(findings, base, 'form_placeholder_as_label', 'medium', 'Placeholder appears to be used as the only label.', cMatch[0]);
      }
      if (/\b(class|data-required)\s*=\s*["'][^"']*required[^"']*["']/i.test(attrs) && !/\b(required|aria-required)\b/i.test(attrs)) {
        this.addFinding(findings, base, 'form_required_not_programmatic', 'medium', 'Required state may be visual only and not programmatically conveyed.', cMatch[0]);
      }
      if (/\baria-invalid\s*=\s*["']true["']/i.test(attrs) && !/\baria-describedby\s*=\s*["'][^"']+["']/i.test(attrs)) {
        this.addFinding(findings, base, 'form_error_unassociated', 'medium', 'Invalid control lacks aria-describedby reference to error text.', cMatch[0]);
      }
    }

    const roleRegex = /\brole\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/gi;
    const validRoles = new Set([
      'alert', 'button', 'checkbox', 'dialog', 'grid', 'heading', 'img', 'link', 'list', 'listitem', 'main', 'menu', 'menubar', 'menuitem', 'navigation', 'option', 'presentation', 'progressbar', 'radio', 'radiogroup', 'region', 'row', 'rowgroup', 'rowheader', 'search', 'slider', 'spinbutton', 'status', 'switch', 'tab', 'table', 'tablist', 'tabpanel', 'textbox', 'timer', 'tooltip'
    ]);
    let rMatch: RegExpExecArray | null;
    while ((rMatch = roleRegex.exec(content))) {
      const roleVal = ((rMatch[2] ?? rMatch[3] ?? rMatch[4] ?? '').trim().toLowerCase());
      if (roleVal && !validRoles.has(roleVal)) {
        this.addFinding(findings, base, 'aria_invalid_role', 'medium', 'Element contains an invalid/unknown ARIA role.', roleVal);
      }
    }
    if (/\baria-hidden\s*=\s*["']true["'][^>]*\b(?:tabindex\s*=\s*["']?[0-9]+["']?|href=|onclick=)|<(a|button|input|select|textarea)\b[^>]*\baria-hidden\s*=\s*["']true["']/i.test(content)) {
      this.addFinding(findings, base, 'aria_hidden_focusable', 'high', 'Focusable interactive element is marked aria-hidden="true".');
    }
    const idRegex = /\bid\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/gi;
    const ids = new Map<string, number>();
    let idMatch: RegExpExecArray | null;
    while ((idMatch = idRegex.exec(content))) {
      const idVal = (idMatch[2] ?? idMatch[3] ?? idMatch[4] ?? '').trim();
      if (!idVal) continue;
      ids.set(idVal, (ids.get(idVal) || 0) + 1);
    }
    ids.forEach((count, idVal) => {
      if (count > 1) this.addFinding(findings, base, 'duplicate_id', 'high', `Duplicate id "${idVal}" appears ${count} times.`);
    });
    if (/\btabindex\s*=\s*["']?[1-9]\d*["']?/i.test(content) || /\bonkeydown\s*=\s*["'][^"']*preventDefault\(/i.test(content)) {
      this.addFinding(findings, base, 'keyboard_focus_trap_heuristic', 'low', 'Potential keyboard navigation/focus trap risk detected.');
    }

    return findings;
  }

  async getAccessibilityScan(courseId: number, options: AccessibilityScanOptions = {}) {
    const types = this.resolveAccessibilityResourceTypes(options.resourceTypes);
    const startedAt = Date.now();
    const timings: Record<string, number> = {};
    const warnings: string[] = [];

    const timed = async <T>(name: string, fn: () => Promise<T>): Promise<T> => {
      const t0 = Date.now();
      const out = await fn();
      timings[name] = Date.now() - t0;
      return out;
    };

    const fetchers: Array<Promise<{ type: string; items: Array<{ type: string; id: string; title: string; html: string; url?: string | null }> }>> = [];
    if (types.includes('pages')) {
      fetchers.push(timed('fetch_pages', async () => {
        const pages = await this.getCoursePages(courseId);
        const items = (Array.isArray(pages) ? pages : []).map((p: any) => ({
          type: 'pages',
          id: String(p?.id ?? p?.page_id ?? p?.url ?? ''),
          title: String(p?.title || p?.name || p?.url || 'Untitled Page'),
          html: String(p?.body || ''),
          url: p?.html_url || p?.url || null,
        })).filter((x: any) => x.id && x.html);
        return { type: 'pages', items };
      }).catch((e: any) => {
        warnings.push(`pages fetch failed: ${e?.message || 'unknown error'}`);
        return { type: 'pages', items: [] };
      }));
    }
    if (types.includes('assignments')) {
      fetchers.push(timed('fetch_assignments', async () => {
        const assignments = await this.getCourseAssignments(courseId);
        const items = (Array.isArray(assignments) ? assignments : []).map((a: any) => ({
          type: 'assignments',
          id: String(a?.id ?? ''),
          title: String(a?.name || a?.title || `Assignment ${a?.id ?? ''}`),
          html: String(a?.description || ''),
          url: a?.html_url || null,
        })).filter((x: any) => x.id && x.html);
        return { type: 'assignments', items };
      }).catch((e: any) => {
        warnings.push(`assignments fetch failed: ${e?.message || 'unknown error'}`);
        return { type: 'assignments', items: [] };
      }));
    }
    if (types.includes('announcements')) {
      fetchers.push(timed('fetch_announcements', async () => {
        const announcements = await this.getCourseAnnouncements(courseId);
        const items = (Array.isArray(announcements) ? announcements : []).map((a: any) => ({
          type: 'announcements',
          id: String(a?.id ?? ''),
          title: String(a?.title || `Announcement ${a?.id ?? ''}`),
          html: String(a?.message || ''),
          url: a?.html_url || null,
        })).filter((x: any) => x.id && x.html);
        return { type: 'announcements', items };
      }).catch((e: any) => {
        warnings.push(`announcements fetch failed: ${e?.message || 'unknown error'}`);
        return { type: 'announcements', items: [] };
      }));
    }
    if (types.includes('discussions')) {
      fetchers.push(timed('fetch_discussions', async () => {
        const discussions = await this.getCourseDiscussions(courseId);
        const items = (Array.isArray(discussions) ? discussions : []).map((d: any) => ({
          type: 'discussions',
          id: String(d?.id ?? ''),
          title: String(d?.title || `Discussion ${d?.id ?? ''}`),
          html: String(d?.message || ''),
          url: d?.html_url || null,
        })).filter((x: any) => x.id && x.html);
        return { type: 'discussions', items };
      }).catch((e: any) => {
        warnings.push(`discussions fetch failed: ${e?.message || 'unknown error'}`);
        return { type: 'discussions', items: [] };
      }));
    }
    if (types.includes('syllabus')) {
      fetchers.push(timed('fetch_syllabus', async () => {
        const course = await this.getCourseDetails(courseId);
        const html = String((course as any)?.syllabus_body || '');
        const items = html.trim() ? [{
          type: 'syllabus',
          id: String(courseId),
          title: 'Course Syllabus',
          html,
          url: (course as any)?.html_url || null,
        }] : [];
        return { type: 'syllabus', items };
      }).catch((e: any) => {
        warnings.push(`syllabus fetch failed: ${e?.message || 'unknown error'}`);
        return { type: 'syllabus', items: [] };
      }));
    }

    const fetched = await Promise.all(fetchers);
    const resources = fetched.flatMap((x) => x.items);

    const findings = await timed('evaluate_rules', async () => {
      const all: AccessibilityFinding[] = [];
      for (const resource of resources) {
        const base = {
          resource_type: resource.type,
          resource_id: resource.id,
          resource_title: resource.title,
          resource_url: resource.url ?? null,
        };
        all.push(...this.evaluateAccessibilityTier1ForHtml(base, resource.html));
        all.push(...this.evaluateAccessibilityTier2ForHtml(base, resource.html));
      }
      return all;
    });
    const requestedRuleIds = Array.isArray(options.ruleIds)
      ? options.ruleIds.map((x) => String(x || '').trim()).filter(Boolean)
      : [];
    const requestedRuleSet = new Set(requestedRuleIds);
    const effectiveFindings = requestedRuleSet.size
      ? findings.filter((f) => requestedRuleSet.has(f.rule_id))
      : findings;
    const enrichedFindings = effectiveFindings.map((f) => ({
      ...f,
      fix_strategy: ACCESSIBILITY_FIXABILITY_MAP[f.rule_id]?.fix_strategy ?? 'manual_only',
    }));

    const bySeverity = enrichedFindings.reduce((acc: Record<string, number>, f) => {
      acc[f.severity] = (acc[f.severity] || 0) + 1;
      return acc;
    }, {});
    const byRule = enrichedFindings.reduce((acc: Record<string, number>, f) => {
      acc[f.rule_id] = (acc[f.rule_id] || 0) + 1;
      return acc;
    }, {});
    const byResourceType = enrichedFindings.reduce((acc: Record<string, number>, f) => {
      acc[f.resource_type] = (acc[f.resource_type] || 0) + 1;
      return acc;
    }, {});
    const resourcesScannedByType = resources.reduce((acc: Record<string, number>, r) => {
      acc[r.type] = (acc[r.type] || 0) + 1;
      return acc;
    }, {});
    const totalMs = Date.now() - startedAt;
    const baseline = Number(options.canvasNativeBaselineMs);
    const hasBaseline = Number.isFinite(baseline) && baseline > 0;

    return {
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
        ratio_vs_canvas: hasBaseline ? Number((totalMs / baseline).toFixed(3)) : null,
      },
      findings: enrichedFindings,
      warnings,
      rule_version: 'tier2-v1',
    };
  }

  buildAccessibilityCsv(report: any): string {
    const rows = Array.isArray(report?.findings) ? report.findings : [];
    const headers = [
      'resource_type',
      'resource_id',
      'resource_title',
      'resource_url',
      'rule_id',
      'severity',
      'message',
      'snippet',
      'rule_version',
      'scanned_at',
    ];
    const nowIso = new Date().toISOString();
    const lines = [headers.join(',')];
    for (const r of rows) {
      const row = [
        this.escapeCsvCell(r?.resource_type ?? ''),
        this.escapeCsvCell(r?.resource_id ?? ''),
        this.escapeCsvCell(r?.resource_title ?? ''),
        this.escapeCsvCell(r?.resource_url ?? ''),
        this.escapeCsvCell(r?.rule_id ?? ''),
        this.escapeCsvCell(r?.severity ?? ''),
        this.escapeCsvCell(r?.message ?? ''),
        this.escapeCsvCell(r?.snippet ?? ''),
        this.escapeCsvCell(report?.rule_version ?? 'tier1-v1'),
        this.escapeCsvCell(nowIso),
      ];
      lines.push(row.join(','));
    }
    return lines.join('\n');
  }

  private async fetchAccessibilityResourceContent(
    courseId: number,
    resourceType: string,
    resourceId: string,
  ): Promise<{ html: string; updateKey: string; resourceTitle: string } | null> {
    if (resourceType === 'pages') {
      const pages = await this.getCoursePages(courseId);
      const page = (Array.isArray(pages) ? pages : []).find(
        (p: any) => String(p?.id ?? p?.page_id ?? '') === resourceId || (p?.url ?? '') === resourceId,
      );
      if (!page?.url) return null;
      const full = await this.getPage(courseId, page.url);
      const { token, baseUrl } = await this.getAuthHeaders();
      const body = await this.resolveWikiPageBodyForGrid(courseId, page.url, full, token, baseUrl);
      const html = typeof body === 'string' ? body : String(full?.body ?? '');
      return { html, updateKey: page.url, resourceTitle: page.title || page.url };
    }
    if (resourceType === 'assignments') {
      const a = await this.getAssignment(courseId, Number(resourceId));
      const html = String(a?.description ?? '');
      return html ? { html, updateKey: resourceId, resourceTitle: a?.name ?? '' } : null;
    }
    if (resourceType === 'announcements' || resourceType === 'discussions') {
      const d = await this.getDiscussion(courseId, Number(resourceId));
      const html = String(d?.message ?? '');
      return html ? { html, updateKey: resourceId, resourceTitle: d?.title ?? '' } : null;
    }
    if (resourceType === 'syllabus') {
      const course = await this.getCourseDetails(courseId);
      const html = String((course as any)?.syllabus_body ?? '');
      return html ? { html, updateKey: String(courseId), resourceTitle: 'Course Syllabus' } : null;
    }
    return null;
  }

  private looksNonEnglishText(text: string): boolean {
    const sample = String(text || '').slice(0, 4000);
    if (!sample.trim()) return false;
    if (/[^\u0000-\u007F]/.test(sample)) return true;
    const lower = sample.toLowerCase();
    const nonEnglishSignals = [
      /\b(hola|bonjour|merci|gracias|adios|por favor|guten tag|danke|ciao|buongiorno|obrigado|ol[aá]|namaste|privet)\b/i,
      /\b(el|la|los|las|le|les|des|und|der|die|das|que|qui|pour|con|sin)\b/i,
    ];
    return nonEnglishSignals.some((rx) => rx.test(lower));
  }

  private static claudeCache = new Map<string, string>();
  private static readonly CLAUDE_CACHE_MAX = 500;

  private async callClaudeWithRetry(prompt: string, maxTokens: number): Promise<string> {
    const crypto = await import('crypto');
    const hash = crypto.createHash('sha256').update(prompt).digest('hex').slice(0, 32);
    const cached = CanvasService.claudeCache.get(hash);
    if (cached != null) return cached;
    let lastErr: Error | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const out = await this.callClaudeSingleLine(prompt, maxTokens);
        if (CanvasService.claudeCache.size >= CanvasService.CLAUDE_CACHE_MAX) {
          const first = CanvasService.claudeCache.keys().next().value;
          if (first) CanvasService.claudeCache.delete(first);
        }
        CanvasService.claudeCache.set(hash, out);
        return out;
      } catch (e: any) {
        lastErr = e;
        if (e?.message?.includes('429') && attempt < 2) {
          const jitter = 1000 + Math.random() * 2000;
          await new Promise((r) => setTimeout(r, jitter));
        } else {
          throw e;
        }
      }
    }
    throw lastErr || new Error('Claude request failed');
  }

  private async callClaudeSingleLine(prompt: string, maxTokens: number): Promise<string> {
    const key = (this.config.get<string>('ANTHROPIC_API_KEY') || '').trim();
    if (!key) throw new Error('ANTHROPIC_API_KEY not configured');
    const model = (this.config.get<string>('CLAUDE_MODEL') || 'claude-sonnet-4-6').trim();
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        temperature: 0.1,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText);
      throw new Error(`Claude API failed (${res.status}): ${String(text).slice(0, 300)}`);
    }
    const payload = await res.json() as { content?: Array<{ type?: string; text?: string }> };
    const text = Array.isArray(payload?.content)
      ? payload.content.filter((c) => c?.type === 'text' && c?.text).map((c) => c.text || '').join('\n')
      : '';
    const line = String(text || '').replace(/```[\s\S]*?```/g, '').replace(/\s+/g, ' ').trim();
    if (!line) throw new Error('Claude returned empty response');
    return line;
  }

  private applySetHtmlLang(html: string): { newHtml: string; changes: Array<{ before: string; after: string }>; errorNote?: string } {
    const match = html.match(/<html\b[^>]*>/i);
    if (!match) return { newHtml: html, changes: [], errorNote: 'No root <html> element found in content.' };
    const before = match[0];
    if (/\blang\s*=\s*["'][^"']+["']/i.test(before)) return { newHtml: html, changes: [] };
    const after = before.replace(/<html\b/i, '<html lang="en"');
    return { newHtml: html.replace(before, after), changes: [{ before, after }] };
  }

  private applyRemoveTextJustify(html: string): { newHtml: string; changes: Array<{ before: string; after: string }> } {
    const changes: Array<{ before: string; after: string }> = [];
    const styleAttrRegex = /\bstyle\s*=\s*("([^"]*)"|'([^']*)')/gi;
    let newHtml = html;
    let m: RegExpExecArray | null;
    while ((m = styleAttrRegex.exec(html)) !== null) {
      const fullAttr = m[0];
      const styleValue = (m[2] ?? m[3] ?? '').trim();
      if (!/text-align\s*:\s*justify/i.test(styleValue)) continue;
      const updatedStyle = styleValue
        .replace(/(?:^|;)\s*text-align\s*:\s*justify\s*;?/gi, ';')
        .replace(/;;+/g, ';')
        .replace(/^\s*;\s*|\s*;\s*$/g, '')
        .trim();
      const after = updatedStyle ? `style="${updatedStyle}"` : '';
      changes.push({ before: fullAttr, after: after || '(style removed)' });
      newHtml = after
        ? newHtml.replace(fullAttr, after)
        : newHtml.replace(/\s+\bstyle\s*=\s*("([^"]*)"|'([^']*)')/i, '');
    }
    return { newHtml, changes };
  }

  private applyImgAltFilenameSuggest(html: string): { newHtml: string; changes: Array<{ before: string; after: string }>; errorNote?: string } {
    const imgRegex = /<img\b[^>]*>/gi;
    const changes: Array<{ before: string; after: string }> = [];
    let newHtml = html;
    let m: RegExpExecArray | null;
    while ((m = imgRegex.exec(html)) !== null) {
      const tag = m[0];
      const altMatch = tag.match(/\balt\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
      const alt = (altMatch?.[2] ?? altMatch?.[3] ?? altMatch?.[4] ?? '').trim();
      if (!alt) continue;
      const isFilename = /\.(jpg|jpeg|png|gif|svg|webp|bmp|tiff?)$/i.test(alt) || (/[_-]/.test(alt) && !/\s/.test(alt));
      if (!isFilename) continue;
      let suggested = alt.replace(/\.(jpg|jpeg|png|gif|svg|webp|bmp|tiff?)$/i, '').replace(/[_-]+/g, ' ').trim();
      suggested = suggested.split(/\s+/).map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
      if (!suggested) suggested = 'Image';
      const withAlt = tag.replace(/\balt\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i, `alt="${suggested.replace(/"/g, '&quot;')}"`);
      changes.push({ before: tag, after: withAlt });
      newHtml = newHtml.replace(tag, withAlt);
    }
    return { newHtml, changes };
  }

  private applyImgAltTruncate(html: string): { newHtml: string; changes: Array<{ before: string; after: string }>; errorNote?: string } {
    const imgRegex = /<img\b[^>]*>/gi;
    const changes: Array<{ before: string; after: string }> = [];
    let newHtml = html;
    let m: RegExpExecArray | null;
    while ((m = imgRegex.exec(html)) !== null) {
      const tag = m[0];
      const altMatch = tag.match(/\balt\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
      const alt = (altMatch?.[2] ?? altMatch?.[3] ?? altMatch?.[4] ?? '').trim();
      if (alt.length <= 125) continue;
      let truncated = alt.slice(0, 124);
      const lastSpace = truncated.lastIndexOf(' ');
      if (lastSpace > 80) truncated = truncated.slice(0, lastSpace);
      truncated = truncated.trim() + '…';
      const withAlt = tag.replace(/\balt\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i, `alt="${truncated.replace(/"/g, '&quot;')}"`);
      changes.push({ before: tag, after: withAlt });
      newHtml = newHtml.replace(tag, withAlt);
    }
    return { newHtml, changes };
  }

  private applyHeadingH1Demote(html: string): { newHtml: string; changes: Array<{ before: string; after: string }>; errorNote?: string } {
    const changes: Array<{ before: string; after: string }> = [];
    let newHtml = html;
    const regex = /<h1\b([^>]*)>([\s\S]*?)<\/h1>/gi;
    let mat: RegExpExecArray | null;
    const matches: { full: string; replacement: string }[] = [];
    while ((mat = regex.exec(html)) !== null) {
      const full = mat[0];
      const repl = full.replace(/<h1\b/gi, '<h2').replace(/<\/h1>/gi, '</h2>');
      matches.push({ full, replacement: repl });
    }
    for (const { full, replacement } of matches) {
      changes.push({ before: full, after: replacement });
      newHtml = newHtml.replace(full, replacement);
    }
    return { newHtml, changes };
  }

  private applyHeadingDuplicateH1Demote(html: string): { newHtml: string; changes: Array<{ before: string; after: string }>; errorNote?: string } {
    const changes: Array<{ before: string; after: string }> = [];
    let newHtml = html;
    const regex = /<h1\b([^>]*)>([\s\S]*?)<\/h1>/gi;
    const matches: { full: string; replacement: string }[] = [];
    let first = true;
    let mat: RegExpExecArray | null;
    while ((mat = regex.exec(html)) !== null) {
      const full = mat[0];
      if (first) {
        first = false;
        continue;
      }
      const repl = full.replace(/<h1\b/gi, '<h2').replace(/<\/h1>/gi, '</h2>');
      matches.push({ full, replacement: repl });
    }
    for (const { full, replacement } of matches) {
      changes.push({ before: full, after: replacement });
      newHtml = newHtml.replace(full, replacement);
    }
    return { newHtml, changes };
  }

  private applyIframeTitleSuggest(html: string): { newHtml: string; changes: Array<{ before: string; after: string }>; errorNote?: string } {
    const changes: Array<{ before: string; after: string }> = [];
    let newHtml = html;
    const iframeRegex = /<iframe\b([^>]*)>/gi;
    let m: RegExpExecArray | null;
    while ((m = iframeRegex.exec(html)) !== null) {
      const tag = m[0];
      if (/\btitle\s*=\s*["'][^"']+["']/i.test(tag)) continue;
      const srcMatch = tag.match(/\bsrc\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
      const src = (srcMatch?.[2] ?? srcMatch?.[3] ?? srcMatch?.[4] ?? '').trim();
      let domain = 'unknown';
      try {
        if (src.startsWith('//')) {
          const u = new URL('https:' + src);
          domain = u.hostname;
        } else if (/^https?:\/\//i.test(src)) {
          domain = new URL(src).hostname;
        } else if (src) {
          domain = src.split(/[/?#]/)[0] || 'content';
        }
      } catch {
        domain = src ? src.split(/[/?#]/)[0] || 'content' : 'unknown';
      }
      const title = `Embedded content from ${domain}`;
      const withTitle = tag.replace(/<iframe\b/i, `<iframe title="${title.replace(/"/g, '&quot;')}"`);
      changes.push({ before: tag, after: withTitle });
      newHtml = newHtml.replace(tag, withTitle);
    }
    return { newHtml, changes };
  }

  private async buildAiAltTextFix(
    html: string,
    resourceTitle: string,
  ): Promise<{ newHtml: string; changes: Array<{ before: string; after: string }>; errorNote?: string }> {
    const imgRegex = /<img\b[^>]*>/i;
    const img = imgRegex.exec(html);
    if (!img) return { newHtml: html, changes: [], errorNote: 'No image tag found for missing alt text.' };
    const imgTag = img[0];
    if (/\balt\s*=\s*("([^"]*)"|'([^']*)'|[^\s>]+)/i.test(imgTag)) return { newHtml: html, changes: [] };
    const srcMatch = imgTag.match(/\bsrc\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
    const src = (srcMatch?.[2] ?? srcMatch?.[3] ?? srcMatch?.[4] ?? '').trim();
    if (!src || !/^https?:\/\//i.test(src)) {
      return { newHtml: html, changes: [], errorNote: 'Image src is not accessible for AI alt-text generation.' };
    }
    try {
      const check = await fetch(src, { method: 'GET' });
      if (!check.ok) return { newHtml: html, changes: [], errorNote: `Image src returned HTTP ${check.status}.` };
    } catch (e: any) {
      return { newHtml: html, changes: [], errorNote: `Image src fetch failed: ${e?.message || 'unknown error'}` };
    }

    const contextWindow = html.slice(Math.max(0, img.index - 300), Math.min(html.length, img.index + imgTag.length + 300));
    const contextText = contextWindow.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const prompt = [
      'Return plain text only.',
      'Generate a single alt text string under 125 characters.',
      'Be descriptive and specific for WCAG 2.1 AA course content.',
      'No quotes. No preamble.',
      `Image src: ${src}`,
      `Page or assignment title: ${resourceTitle || '(unknown)'}`,
      `Surrounding context: ${contextText || '(none)'}`,
    ].join('\n');

    try {
      let alt = await this.callClaudeWithRetry(prompt, 120);
      alt = alt.replace(/^["']|["']$/g, '').trim();
      if (alt.length > 125) alt = alt.slice(0, 125).trim();
      if (!alt) return { newHtml: html, changes: [], errorNote: 'Claude returned empty alt text.' };
      const withAlt = imgTag.replace(/<img\b/i, `<img alt="${alt.replace(/"/g, '&quot;')}"`);
      return { newHtml: html.replace(imgTag, withAlt), changes: [{ before: imgTag, after: withAlt }] };
    } catch (e: any) {
      return { newHtml: html, changes: [], errorNote: e?.message || 'Claude alt-text generation failed.' };
    }
  }

  private async buildAiAmbiguousLinkFix(
    html: string,
  ): Promise<{ newHtml: string; changes: Array<{ before: string; after: string }>; errorNote?: string }> {
    const ambiguous = /^(click here|read more|learn more|more|here|this link)$/i;
    const linkRegex = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
    let m: RegExpExecArray | null;
    while ((m = linkRegex.exec(html)) !== null) {
      const attrs = m[1] || '';
      const inner = m[2] || '';
      const text = inner.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      if (!ambiguous.test(text)) continue;
      const hrefMatch = attrs.match(/\bhref\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
      const href = (hrefMatch?.[2] ?? hrefMatch?.[3] ?? hrefMatch?.[4] ?? '').trim();
      const contextWindow = html.slice(Math.max(0, m.index - 300), Math.min(html.length, m.index + m[0].length + 300));
      const contextText = contextWindow.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      const prompt = [
        'Return plain text only.',
        'Return one suggested link text string under 80 characters.',
        'No quotes. No preamble.',
        `Current link text: ${text}`,
        `Link href: ${href || '(missing)'}`,
        `Surrounding context: ${contextText || '(none)'}`,
      ].join('\n');
      try {
        let suggested = await this.callClaudeWithRetry(prompt, 80);
        suggested = suggested.replace(/^["']|["']$/g, '').trim();
        if (suggested.length > 80) suggested = suggested.slice(0, 80).trim();
        if (!suggested) return { newHtml: html, changes: [], errorNote: 'Claude returned empty link text.' };
        const before = m[0];
        const after = `<a${attrs}>${suggested}</a>`;
        return { newHtml: html.replace(before, after), changes: [{ before, after }] };
      } catch (e: any) {
        return { newHtml: html, changes: [], errorNote: e?.message || 'Claude link-text generation failed.' };
      }
    }
    return { newHtml: html, changes: [], errorNote: 'No ambiguous link text found in content.' };
  }

  private async buildAiLinkEmptyNameFix(html: string, resourceTitle: string): Promise<{ newHtml: string; changes: Array<{ before: string; after: string }>; errorNote?: string }> {
    const linkRegex = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
    const stripTags = (s: string) => s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    let m: RegExpExecArray | null;
    while ((m = linkRegex.exec(html)) !== null) {
      const attrs = m[1] || '';
      const text = stripTags(m[2] || '');
      if (text || /\baria-label\s*=\s*["'][^"']+["']/i.test(attrs)) continue;
      const hrefMatch = attrs.match(/\bhref\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
      const href = (hrefMatch?.[2] ?? hrefMatch?.[3] ?? hrefMatch?.[4] ?? '').trim();
      const ctx = html.slice(Math.max(0, m.index - 200), Math.min(html.length, m.index + m[0].length + 200)).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      const prompt = `This link has no descriptive text. Based on the href URL and surrounding context, suggest a short descriptive link text under 60 characters. Return plain text only.\n\nhref: ${href}\nContext: ${ctx}\nPage: ${resourceTitle}`;
      try {
        let suggested = await this.callClaudeWithRetry(prompt, 60);
        suggested = suggested.replace(/^["']|["']$/g, '').trim().slice(0, 60);
        if (!suggested) continue;
        const before = m[0];
        const after = `<a${attrs}>${suggested}</a>`;
        return { newHtml: html.replace(before, after), changes: [{ before, after }] };
      } catch (e: any) {
        return { newHtml: html, changes: [], errorNote: e?.message || 'Claude failed.' };
      }
    }
    return { newHtml: html, changes: [], errorNote: 'No empty-name link found.' };
  }

  private async buildAiLinkFileHintFix(html: string, resourceTitle: string): Promise<{ newHtml: string; changes: Array<{ before: string; after: string }>; errorNote?: string }> {
    const linkRegex = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
    const stripTags = (s: string) => s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    let m: RegExpExecArray | null;
    while ((m = linkRegex.exec(html)) !== null) {
      const attrs = m[1] || '';
      const text = stripTags(m[2] || '');
      const hrefMatch = attrs.match(/\bhref\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
      const href = (hrefMatch?.[2] ?? hrefMatch?.[3] ?? hrefMatch?.[4] ?? '').trim();
      const ext = href.match(/\.(pdf|docx?|pptx?|xlsx?|csv)(?:[?#].*)?$/i)?.[1]?.toUpperCase() || 'file';
      if (!/\.(pdf|docx?|pptx?|xlsx?|csv)(?:[?#].*)?$/i.test(href)) continue;
      if (/\b(pdf|doc|word|ppt|powerpoint|xls|excel|csv)\b/i.test(text)) continue;
      const ctx = html.slice(Math.max(0, m.index - 150), m.index + m[0].length + 150).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      const prompt = `This link points to a ${ext} file but does not tell the user. Suggest updated link text that naturally incorporates the file type, e.g. "Course Syllabus (PDF)". Return plain text only, under 80 characters.\n\nCurrent text: ${text}\nPage: ${resourceTitle}\nContext: ${ctx}`;
      try {
        let suggested = await this.callClaudeWithRetry(prompt, 80);
        suggested = suggested.replace(/^["']|["']$/g, '').trim().slice(0, 80);
        if (!suggested) continue;
        const before = m[0];
        const after = `<a${attrs}>${suggested}</a>`;
        return { newHtml: html.replace(before, after), changes: [{ before, after }] };
      } catch (e: any) {
        return { newHtml: html, changes: [], errorNote: e?.message || 'Claude failed.' };
      }
    }
    return { newHtml: html, changes: [], errorNote: 'No file link without type hint found.' };
  }

  private async buildAiHeadingShortenFix(html: string, resourceTitle: string): Promise<{ newHtml: string; changes: Array<{ before: string; after: string }>; errorNote?: string }> {
    const headingRegex = /<(h[1-6])\b([^>]*)>([\s\S]*?)<\/\1>/gi;
    const stripTags = (s: string) => s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    let m: RegExpExecArray | null;
    while ((m = headingRegex.exec(html)) !== null) {
      const level = m[1];
      const attrs = m[2] || '';
      const text = stripTags(m[3] || '');
      if (text.length <= 120) continue;
      const ctx = html.slice(Math.max(0, m.index - 100), m.index + m[0].length + 300).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      const prompt = `This heading is too long for accessibility. Suggest a shortened version under 80 characters that preserves the core meaning. Return plain text only.\n\nHeading: ${text}\nSection context: ${ctx}\nPage: ${resourceTitle}`;
      try {
        let suggested = await this.callClaudeWithRetry(prompt, 80);
        suggested = suggested.replace(/^["']|["']$/g, '').trim().slice(0, 80);
        if (!suggested) continue;
        const before = m[0];
        const after = `<${level}${attrs}>${suggested}</${level}>`;
        return { newHtml: html.replace(before, after), changes: [{ before, after }] };
      } catch (e: any) {
        return { newHtml: html, changes: [], errorNote: e?.message || 'Claude failed.' };
      }
    }
    return { newHtml: html, changes: [], errorNote: 'No long heading found.' };
  }

  private async buildAiHeadingVisualFix(html: string, resourceTitle: string): Promise<{ newHtml: string; changes: Array<{ before: string; after: string }>; errorNote?: string }> {
    const styledRegex = /<(?:p|div|span)\b[^>]*style\s*=\s*["'][^"']*(?:font-size\s*:\s*(?:2[4-9]|[3-9]\d)px|font-weight\s*:\s*(?:700|800|900|bold))[^"']*["'][^>]*>([\s\S]*?)<\/(?:p|div|span)>/gi;
    let m: RegExpExecArray | null;
    while ((m = styledRegex.exec(html)) !== null) {
      const inner = m[1] || '';
      const ctx = html.slice(Math.max(0, m.index - 150), m.index + m[0].length + 150).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      const prompt = `This text appears to be used as a heading based on its styling but is not marked up semantically. Suggest the appropriate heading level (H2, H3, or H4) and return only the corrected heading HTML tag wrapping the original text.\n\nText: ${inner}\nContext: ${ctx}\nPage: ${resourceTitle}`;
      try {
        let out = await this.callClaudeWithRetry(prompt, 200);
        out = out.replace(/```\w*\n?|\n?```/g, '').trim();
        const tagMatch = out.match(/<h[2-4]\b[^>]*>[\s\S]*<\/h[2-4]>/i);
        if (!tagMatch) continue;
        const before = m[0];
        const after = tagMatch[0];
        return { newHtml: html.replace(before, after), changes: [{ before, after }] };
      } catch (e: any) {
        return { newHtml: html, changes: [], errorNote: e?.message || 'Claude failed.' };
      }
    }
    return { newHtml: html, changes: [], errorNote: 'No visual-only heading found.' };
  }

  private async buildAiListSemanticFix(html: string, resourceTitle: string): Promise<{ newHtml: string; changes: Array<{ before: string; after: string }>; errorNote?: string }> {
    const bulletLine = /^[\s]*[-*•]\s+.+$/gm;
    const numLine = /^[\s]*\d+[.)]\s+.+$/gm;
    const block = html.match(/(?:<p\b[^>]*>|<div\b[^>]*>)[\s\S]*?(?:[-*•]\s+.+|\d+[.)]\s+.+)[\s\S]*?<\/(?:p|div)>/i) || html.match(/([-*•]\s+.+(\n[-*•]\s+.+)+)/m);
    const text = block ? (Array.isArray(block) ? block[1] || block[0] : block[0]) : '';
    if (!text || (!bulletLine.test(text) && !numLine.test(text))) return { newHtml: html, changes: [], errorNote: 'No list-like content found.' };
    const prompt = `This text appears to be a list but is not marked up as HTML. Convert it to a properly structured <ul> or <ol> with <li> items as appropriate. Return only the corrected HTML list.\n\nText:\n${text}\nPage: ${resourceTitle}`;
    try {
      let out = await this.callClaudeWithRetry(prompt, 400);
      out = out.replace(/```\w*\n?|\n?```/g, '').trim();
      if (!/<(?:ul|ol)\b/i.test(out)) return { newHtml: html, changes: [], errorNote: 'Claude did not return valid list HTML.' };
      const before = block ? (Array.isArray(block) ? block[0] : block) : text;
      if (!html.includes(String(before))) return { newHtml: html, changes: [], errorNote: 'Matching block not found in content.' };
      return { newHtml: html.replace(String(before), out), changes: [{ before: String(before), after: out }] };
    } catch (e: any) {
      return { newHtml: html, changes: [], errorNote: e?.message || 'Claude failed.' };
    }
  }

  private async buildAiImgDecorativeFix(html: string, resourceTitle: string): Promise<{ newHtml: string; changes: Array<{ before: string; after: string }>; errorNote?: string }> {
    const imgRegex = /<img\b([^>]*)>/gi;
    let m: RegExpExecArray | null;
    while ((m = imgRegex.exec(html)) !== null) {
      const attrs = m[1] || '';
      const altMatch = attrs.match(/\balt\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
      const alt = (altMatch?.[2] ?? altMatch?.[3] ?? altMatch?.[4] ?? '').trim();
      const srcMatch = attrs.match(/\bsrc\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
      const src = (srcMatch?.[2] ?? srcMatch?.[3] ?? srcMatch?.[4] ?? '').trim();
      const ctx = html.slice(Math.max(0, m.index - 200), m.index + m[0].length + 200).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      const prompt = `Based on the image URL and surrounding content, determine whether this image is decorative or informational. If informational, suggest a short descriptive alt text under 125 characters. Return either the word DECORATIVE or the suggested alt text only.\n\nsrc: ${src}\nContext: ${ctx}\nPage: ${resourceTitle}`;
      try {
        let out = await this.callClaudeWithRetry(prompt, 130);
        out = out.replace(/^["']|["']$/g, '').trim().toUpperCase();
        const tag = m[0];
        if (out === 'DECORATIVE' || out.startsWith('DECORATIVE')) {
          const final = /\balt\s*=/.test(tag) ? tag.replace(/\balt\s*=\s*["'][^"']*["']/i, 'alt=""') : tag.replace(/<img\b/i, '<img alt=""');
          return { newHtml: html.replace(tag, final), changes: [{ before: tag, after: final }] };
        }
        const suggested = out.length > 125 ? out.slice(0, 125).trim() : out;
        const withAlt = /\balt\s*=/.test(tag) ? tag.replace(/\balt\s*=\s*["'][^"']*["']/i, `alt="${suggested.replace(/"/g, '&quot;')}"`) : tag.replace(/<img\b/i, `<img alt="${suggested.replace(/"/g, '&quot;')}"`);
        return { newHtml: html.replace(tag, withAlt), changes: [{ before: tag, after: withAlt }] };
      } catch (e: any) {
        return { newHtml: html, changes: [], errorNote: e?.message || 'Claude failed.' };
      }
    }
    return { newHtml: html, changes: [], errorNote: 'No image found.' };
  }

  private async buildAiImgMeaningfulAltFix(html: string, resourceTitle: string): Promise<{ newHtml: string; changes: Array<{ before: string; after: string }>; errorNote?: string }> {
    const imgRegex = /<img\b([^>]*)>/gi;
    let m: RegExpExecArray | null;
    while ((m = imgRegex.exec(html)) !== null) {
      const attrs = m[1] || '';
      const altMatch = attrs.match(/\balt\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
      const alt = (altMatch?.[2] ?? altMatch?.[3] ?? altMatch?.[4] ?? '').trim();
      if (alt || /\b(role\s*=\s*["']presentation["']|aria-hidden\s*=\s*["']true["'])/i.test(attrs)) continue;
      const srcMatch = attrs.match(/\bsrc\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
      const src = (srcMatch?.[2] ?? srcMatch?.[3] ?? srcMatch?.[4] ?? '').trim();
      const ctx = html.slice(Math.max(0, m.index - 200), m.index + m[0].length + 200).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      const prompt = `This image appears to be meaningful but has no alt text. Based on the image URL and surrounding context, suggest a short descriptive alt text under 125 characters. Return plain text only.\n\nsrc: ${src}\nContext: ${ctx}\nPage: ${resourceTitle}`;
      try {
        let suggested = await this.callClaudeWithRetry(prompt, 130);
        suggested = suggested.replace(/^["']|["']$/g, '').trim().slice(0, 125);
        if (!suggested) continue;
        const tag = m[0];
        const withAlt = tag.replace(/<img\b/i, `<img alt="${suggested.replace(/"/g, '&quot;')}"`);
        return { newHtml: html.replace(tag, withAlt), changes: [{ before: tag, after: withAlt }] };
      } catch (e: any) {
        return { newHtml: html, changes: [], errorNote: e?.message || 'Claude failed.' };
      }
    }
    return { newHtml: html, changes: [], errorNote: 'No meaningful image with empty alt found.' };
  }

  private async buildAiButtonLabelFix(html: string, resourceTitle: string): Promise<{ newHtml: string; changes: Array<{ before: string; after: string }>; errorNote?: string }> {
    const btnRegex = /<button\b([^>]*)>([\s\S]*?)<\/button>/gi;
    const stripTags = (s: string) => s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    let m: RegExpExecArray | null;
    while ((m = btnRegex.exec(html)) !== null) {
      const attrs = m[1] || '';
      const text = stripTags(m[2] || '');
      if (text || /\baria-label\s*=\s*["'][^"']+["']/i.test(attrs)) continue;
      const ctx = html.slice(Math.max(0, m.index - 150), m.index + m[0].length + 150).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      const iconClasses = (attrs.match(/\bclass\s*=\s*["']([^"']*)["']/i) || [])[1] || '';
      const prompt = `This button has no accessible name. Based on its context, icon classes, or surrounding content, suggest a short descriptive label under 40 characters. Return plain text only.\n\nButton attrs: ${attrs}\nIcon classes: ${iconClasses}\nContext: ${ctx}\nPage: ${resourceTitle}`;
      try {
        let suggested = await this.callClaudeWithRetry(prompt, 40);
        suggested = suggested.replace(/^["']|["']$/g, '').trim().slice(0, 40);
        if (!suggested) continue;
        const before = m[0];
        const after = `<button${attrs} aria-label="${suggested.replace(/"/g, '&quot;')}">${m[2] || ''}</button>`;
        return { newHtml: html.replace(before, after), changes: [{ before, after }] };
      } catch (e: any) {
        return { newHtml: html, changes: [], errorNote: e?.message || 'Claude failed.' };
      }
    }
    return { newHtml: html, changes: [], errorNote: 'No empty-name button found.' };
  }

  private async buildAiFormLabelFix(html: string, resourceTitle: string): Promise<{ newHtml: string; changes: Array<{ before: string; after: string }>; errorNote?: string }> {
    const controlRegex = /<(input|select|textarea)\b([^>]*)>/gi;
    let m: RegExpExecArray | null;
    while ((m = controlRegex.exec(html)) !== null) {
      const attrs = m[2] || '';
      if (/\b(aria-label|aria-labelledby|title)\s*=\s*["'][^"']+["']/i.test(attrs)) continue;
      const idMatch = attrs.match(/\bid\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
      const id = (idMatch?.[2] ?? idMatch?.[3] ?? idMatch?.[4] ?? '').trim();
      const hasLabel = id && new RegExp(`<label\\b[^>]*\\bfor\\s*=\\s*["']${(id || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`, 'i').test(html);
      if (hasLabel) continue;
      const nameMatch = attrs.match(/\bname\s*=\s*["']([^"']*)["']/i);
      const placeholderMatch = attrs.match(/\bplaceholder\s*=\s*["']([^"']*)["']/i);
      const typeMatch = attrs.match(/\btype\s*=\s*["']?([^"'\s>]+)/i);
      const ctx = html.slice(Math.max(0, m.index - 150), m.index + m[0].length + 150).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      const prompt = `This form control has no label. Based on its type, name, placeholder, and surrounding form context, suggest an appropriate short label text under 40 characters. Return plain text only.\n\nControl: ${m[0]}\nContext: ${ctx}\nPage: ${resourceTitle}`;
      try {
        let suggested = await this.callClaudeWithRetry(prompt, 40);
        suggested = suggested.replace(/^["']|["']$/g, '').trim().slice(0, 40);
        if (!suggested) continue;
        let fullTag = m[0];
        let elId = id || `label-${Math.random().toString(36).slice(2, 10)}`;
        if (!id) fullTag = fullTag.replace(/<(input|select|textarea)\b/i, `<$1 id="${elId}" `);
        const labelHtml = `<label for="${elId}">${suggested.replace(/</g, '&lt;').replace(/"/g, '&quot;')}</label> `;
        const before = m[0];
        const after = labelHtml + (id ? m[0] : fullTag);
        return { newHtml: html.replace(before, after), changes: [{ before, after }] };
      } catch (e: any) {
        return { newHtml: html, changes: [], errorNote: e?.message || 'Claude failed.' };
      }
    }
    return { newHtml: html, changes: [], errorNote: 'No unlabelled form control found.' };
  }

  private async buildAiTableCaptionFix(html: string, resourceTitle: string): Promise<{ newHtml: string; changes: Array<{ before: string; after: string }>; errorNote?: string }> {
    const tableRegex = /<table\b([^>]*)>([\s\S]*?)<\/table>/gi;
    let m: RegExpExecArray | null;
    while ((m = tableRegex.exec(html)) !== null) {
      const tableHtml = m[0];
      if (/<caption\b/i.test(tableHtml)) continue;
      const ctx = html.slice(Math.max(0, m.index - 100), m.index + tableHtml.length + 100).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      const prompt = `This table has no caption. Based on the table content and surrounding text, suggest a short descriptive caption under 80 characters. Return plain text only.\n\nTable: ${tableHtml.slice(0, 500)}\nContext: ${ctx}\nPage: ${resourceTitle}`;
      try {
        let suggested = await this.callClaudeWithRetry(prompt, 80);
        suggested = suggested.replace(/^["']|["']$/g, '').trim().slice(0, 80);
        if (!suggested) continue;
        const openTag = tableHtml.match(/<table\b[^>]*>/)?.[0] || '<table>';
        const withCaption = openTag + `<caption>${suggested.replace(/</g, '&lt;')}</caption>`;
        const newTableHtml = tableHtml.replace(openTag, withCaption);
        return { newHtml: html.replace(tableHtml, newTableHtml), changes: [{ before: openTag, after: withCaption }] };
      } catch (e: any) {
        return { newHtml: html, changes: [], errorNote: e?.message || 'Claude failed.' };
      }
    }
    return { newHtml: html, changes: [], errorNote: 'No table without caption found.' };
  }

  private async buildAiTableHeaderFix(html: string, resourceTitle: string): Promise<{ newHtml: string; changes: Array<{ before: string; after: string }>; errorNote?: string }> {
    const tableRegex = /<table\b[\s\S]*?<\/table>/gi;
    let m: RegExpExecArray | null;
    while ((m = tableRegex.exec(html)) !== null) {
      const tableHtml = m[0];
      if (/<th\b/i.test(tableHtml)) continue;
      const prompt = `This table has no header row. Based on the column content, suggest which row should be the header row and return the corrected table HTML with <th> elements replacing the appropriate <td> elements in that row. Return only the corrected table HTML.\n\nTable:\n${tableHtml}\nPage: ${resourceTitle}`;
      try {
        let out = await this.callClaudeWithRetry(prompt, 800);
        out = out.replace(/```\w*\n?|\n?```/g, '').trim();
        if (!/<th\b/i.test(out)) continue;
        return { newHtml: html.replace(tableHtml, out), changes: [{ before: tableHtml, after: out }] };
      } catch (e: any) {
        return { newHtml: html, changes: [], errorNote: e?.message || 'Claude failed.' };
      }
    }
    return { newHtml: html, changes: [], errorNote: 'No table without header found.' };
  }

  private async buildAiLinkBrokenFix(html: string, resourceTitle: string, courseId: number): Promise<{ newHtml: string; changes: Array<{ before: string; after: string }>; errorNote?: string }> {
    const linkRegex = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
    const stripTags = (s: string) => s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    let m: RegExpExecArray | null;
    while ((m = linkRegex.exec(html)) !== null) {
      const attrs = m[1] || '';
      const text = stripTags(m[2] || '');
      const hrefMatch = attrs.match(/\bhref\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
      const href = (hrefMatch?.[2] ?? hrefMatch?.[3] ?? hrefMatch?.[4] ?? '').trim();
      if (!href || !/^https?:\/\//i.test(href)) continue;
      try {
        const res = await fetch(href, { method: 'HEAD', redirect: 'follow' });
        if (res.ok) continue;
      } catch {
        null;
      }
      const ctx = html.slice(Math.max(0, m.index - 200), m.index + m[0].length + 200).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      const prompt = `This link is broken. Based on the link text and surrounding context, suggest the single most likely replacement URL. Return only the URL, nothing else. If you cannot determine a replacement with reasonable confidence, return the word UNKNOWN.\n\nLink text: ${text}\nhref: ${href}\nContext: ${ctx}\nPage: ${resourceTitle}`;
      try {
        let suggested = await this.callClaudeWithRetry(prompt, 200);
        suggested = suggested.replace(/^["']|["']$/g, '').trim();
        if (suggested.toUpperCase() === 'UNKNOWN' || !suggested) {
          return { newHtml: html, changes: [], errorNote: 'Could not determine replacement URL. Manual review required.' };
        }
        const before = m[0];
        const newAttrs = attrs.replace(/\bhref\s*=\s*["'][^"']*["']/i, `href="${suggested.replace(/"/g, '&quot;')}"`);
        const after = `<a ${newAttrs}>${m[2] || ''}</a>`;
        return { newHtml: html.replace(before, after), changes: [{ before, after }] };
      } catch (e: any) {
        return { newHtml: html, changes: [], errorNote: e?.message || 'Claude failed.' };
      }
    }
    return { newHtml: html, changes: [], errorNote: 'No broken link found.' };
  }

  private async buildAiLinkSplitFix(html: string, resourceTitle: string): Promise<{ newHtml: string; changes: Array<{ before: string; after: string }>; errorNote?: string }> {
    const ctx = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 500);
    const splitUrlRegex = /\b(?:https?:\s*\/\s*\/\s*[\w.-]+(?:\s*\/\s*[\w\-./?%&=+#:]*)?|www\.\s*[\w.-]+\s*\.\s*[a-z]{2,}(?:\s*\/\s*[\w\-./?%&=+#:]*)?)\b/gi;
    const match = ctx.match(splitUrlRegex);
    if (!match || !match.find((u) => /\s/.test(u))) return { newHtml: html, changes: [], errorNote: 'No split URL found.' };
    const fragmented = match.find((u) => /\s/.test(u)) || '';
    const prompt = `This link appears to be split or broken by formatting. Reconstruct it as a single clean <a> tag with correct href and descriptive link text. Return only the corrected <a> tag HTML.\n\nFragmented URL: ${fragmented}\nContext: ${ctx}\nPage: ${resourceTitle}`;
    try {
      let out = await this.callClaudeWithRetry(prompt, 300);
      out = out.replace(/```\w*\n?|\n?```/g, '').trim();
      if (!/<a\b/i.test(out)) return { newHtml: html, changes: [], errorNote: 'Claude did not return valid link HTML.' };
      const href = fragmented.replace(/\s+/g, '');
      const before = fragmented;
      const after = out.replace(/href\s*=\s*["'][^"']*["']/i, `href="${href}"`);
      if (!html.includes(fragmented)) return { newHtml: html, changes: [], errorNote: 'Fragmented URL not found in content.' };
      return { newHtml: html.replace(fragmented, after), changes: [{ before: fragmented, after }] };
    } catch (e: any) {
      return { newHtml: html, changes: [], errorNote: e?.message || 'Claude failed.' };
    }
  }

  private applyMergeDuplicateLinks(html: string): { newHtml: string; changes: Array<{ before: string; after: string }> } {
    const changes: Array<{ before: string; after: string }> = [];
    const regex = /<a\b([^>]*href\s*=\s*("([^"]*)"|'([^']*)')[^>]*)>([\s\S]*?)<\/a>\s*(?:&nbsp;|\s|<span[^>]*>\s*<\/span>|<br[^>]*>)*<a\b([^>]*href\s*=\s*("([^"]*)"|'([^']*)')[^>]*)>([\s\S]*?)<\/a>/gi;
    let newHtml = html;
    let m: RegExpExecArray | null;
    while ((m = regex.exec(html)) !== null) {
      const h1 = (m[3] ?? m[4] ?? '').trim();
      const h2 = (m[8] ?? m[9] ?? '').trim();
      if (h1 && h2 && h1 === h2) {
        const fullMatch = m[0];
        const inner1 = (m[5] ?? '').trim();
        const merged = `<a ${m[1].trim()}>${inner1}</a>`;
        changes.push({ before: fullMatch, after: merged });
        newHtml = newHtml.replace(fullMatch, merged);
      }
    }
    return { newHtml, changes };
  }

  private applyRemoveEmptyLi(html: string): { newHtml: string; changes: Array<{ before: string; after: string }> } {
    const changes: Array<{ before: string; after: string }> = [];
    let newHtml = html;
    const emptyLiRegex = /<li\b[^>]*>\s*(?:&nbsp;|\s|<br[^>]*>|<\/?span[^>]*>)*<\/li>/gi;
    let m: RegExpExecArray | null;
    const emptyLis: string[] = [];
    while ((m = emptyLiRegex.exec(html)) !== null) emptyLis.push(m[0]);
    for (const li of emptyLis) {
      changes.push({ before: li, after: '(removed)' });
      newHtml = newHtml.replace(li, '');
    }
    const emptyListRegex = /<(ul|ol)\b[^>]*>\s*(?:&nbsp;|\s)*<\/\1>/gi;
    while ((m = emptyListRegex.exec(newHtml)) !== null) {
      changes.push({ before: m[0], after: '(removed)' });
      newHtml = newHtml.replace(m[0], '');
    }
    return { newHtml, changes };
  }

  private applyRemoveEmptyHeading(html: string): { newHtml: string; changes: Array<{ before: string; after: string }> } {
    const changes: Array<{ before: string; after: string }> = [];
    let newHtml = html;
    const regex = /<(h[1-6])\b[^>]*>\s*(?:&nbsp;|\s)*<\/\1>/gi;
    const matches: string[] = [];
    let m: RegExpExecArray | null;
    while ((m = regex.exec(html)) !== null) matches.push(m[0]);
    for (const tag of matches) {
      changes.push({ before: tag, after: '(removed)' });
      newHtml = newHtml.replace(tag, '');
    }
    newHtml = newHtml.replace(/(\s*<(?:p|div)\b[^>]*>\s*<\/\1>\s*)+/gi, ' ').replace(/\n{3,}/g, '\n\n').trim();
    return { newHtml, changes };
  }

  private applyAppendNewTabWarning(html: string): { newHtml: string; changes: Array<{ before: string; after: string }> } {
    const changes: Array<{ before: string; after: string }> = [];
    const regex = /<a\b([^>]*)\btarget\s*=\s*["']_blank["'][^>]*>([\s\S]*?)<\/a>/gi;
    const suffix = '<span class="sr-only"> (opens in new tab)</span>';
    let newHtml = html;
    let m: RegExpExecArray | null;
    while ((m = regex.exec(html)) !== null) {
      const full = m[0];
      const inner = m[2] ?? '';
      if (!/\b(new tab|opens in new tab|sr-only)\b/i.test(inner)) {
        const after = full.replace(/([\s\S]*?)<\/a>$/i, `$1${suffix}</a>`);
        changes.push({ before: full, after });
        newHtml = newHtml.replace(full, after);
      }
    }
    return { newHtml, changes };
  }

  private applyFontSizeMin12(html: string): { newHtml: string; changes: Array<{ before: string; after: string }> } {
    const changes: Array<{ before: string; after: string }> = [];
    const styleAttrRegex = /\bstyle\s*=\s*("([^"]*)"|'([^']*)')/gi;
    let newHtml = html;
    let m: RegExpExecArray | null;
    while ((m = styleAttrRegex.exec(html)) !== null) {
      const fullAttr = m[0];
      const styleValue = (m[2] ?? m[3] ?? '').trim();
      const fsMatch = styleValue.match(/(?:^|;)\s*font-size\s*:\s*([0-9.]+)px/i);
      if (!fsMatch) continue;
      const px = Number(fsMatch[1]);
      if (px >= 12) continue;
      const updatedStyle = styleValue.replace(/(?:^|;)\s*font-size\s*:\s*[0-9.]+px/gi, (x) => x.replace(/[0-9.]+(?=px)/i, '12'));
      const quote = m[3] !== undefined ? "'" : '"';
      const after = `style=${quote}${updatedStyle}${quote}`;
      changes.push({ before: fullAttr, after });
      newHtml = newHtml.replace(fullAttr, after);
    }
    return { newHtml, changes };
  }

  private runFixExecutor(html: string, fixType: string): { newHtml: string; changes: Array<{ before: string; after: string }> } | null {
    switch (fixType) {
      case 'merge_duplicate_links':
        return this.applyMergeDuplicateLinks(html);
      case 'remove_empty_li':
        return this.applyRemoveEmptyLi(html);
      case 'remove_empty_heading':
        return this.applyRemoveEmptyHeading(html);
      case 'append_new_tab_warning':
        return this.applyAppendNewTabWarning(html);
      case 'set_html_lang': {
        const r = this.applySetHtmlLang(html);
        return { newHtml: r.newHtml, changes: r.changes };
      }
      case 'remove_text_justify':
        return this.applyRemoveTextJustify(html);
      case 'font_size_min_12':
        return this.applyFontSizeMin12(html);
      case 'img_alt_filename_suggest': {
        const r = this.applyImgAltFilenameSuggest(html);
        return { newHtml: r.newHtml, changes: r.changes };
      }
      case 'img_alt_truncate': {
        const r = this.applyImgAltTruncate(html);
        return { newHtml: r.newHtml, changes: r.changes };
      }
      case 'heading_h1_demote': {
        const r = this.applyHeadingH1Demote(html);
        return { newHtml: r.newHtml, changes: r.changes };
      }
      case 'heading_duplicate_h1_demote': {
        const r = this.applyHeadingDuplicateH1Demote(html);
        return { newHtml: r.newHtml, changes: r.changes };
      }
      case 'iframe_title_suggest': {
        const r = this.applyIframeTitleSuggest(html);
        return { newHtml: r.newHtml, changes: r.changes };
      }
      case 'duplicate_id_suffix': {
        const r = this.applyDuplicateIdSuffix(html);
        return r ? { newHtml: r.newHtml, changes: r.changes } : null;
      }
      case 'form_placeholder_to_label': {
        const r = this.applyFormPlaceholderToLabel(html);
        return r ? { newHtml: r.newHtml, changes: r.changes } : null;
      }
      case 'table_scope_fix': {
        const r = this.applyTableScopeFix(html);
        return r ? { newHtml: r.newHtml, changes: r.changes } : null;
      }
      case 'heading_scope_fix': {
        const r = this.applyHeadingScopeFix(html);
        return r ? { newHtml: r.newHtml, changes: r.changes } : null;
      }
      default:
        return null;
    }
  }

  private applyDuplicateIdSuffix(html: string): { newHtml: string; changes: Array<{ before: string; after: string }> } | null {
    const idRegex = /\bid\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/gi;
    const occurrences: Array<{ id: string; full: string; index: number }> = [];
    let m: RegExpExecArray | null;
    while ((m = idRegex.exec(html)) !== null) {
      const idVal = (m[2] ?? m[3] ?? m[4] ?? '').trim();
      if (!idVal) continue;
      occurrences.push({ id: idVal, full: m[0], index: m.index });
    }
    const counts = new Map<string, number>();
    for (const o of occurrences) counts.set(o.id, (counts.get(o.id) || 0) + 1);
    const dupIds = new Set<string>();
    counts.forEach((c, id) => { if (c > 1) dupIds.add(id); });
    if (dupIds.size === 0) return null;
    const changes: Array<{ before: string; after: string }> = [];
    let newHtml = html;
    const nextSuffix = new Map<string, number>();
    const repls: Array<{ start: number; end: number; replacement: string }> = [];
    for (const { id, full, index } of occurrences) {
      if (!dupIds.has(id)) continue;
      const suffix = (nextSuffix.get(id) || 0) + 1;
      nextSuffix.set(id, suffix);
      if (suffix === 1) continue;
      const newId = `${id}-${suffix}`;
      const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const after = full.replace(new RegExp(`id\\s*=\\s*["']?${escaped}["']?`, 'i'), `id="${newId}"`);
      changes.push({ before: full, after });
      repls.push({ start: index, end: index + full.length, replacement: after });
    }
    const sorted = repls.sort((a, b) => b.start - a.start);
    for (const r of sorted) {
      newHtml = newHtml.slice(0, r.start) + r.replacement + newHtml.slice(r.end);
    }
    return { newHtml, changes };
  }

  private applyFormPlaceholderToLabel(html: string): { newHtml: string; changes: Array<{ before: string; after: string }> } | null {
    const controlRegex = /<(input|select|textarea)\b([^>]*)>/gi;
    const changes: Array<{ before: string; after: string }> = [];
    let newHtml = html;
    const matches: RegExpExecArray[] = [];
    let m: RegExpExecArray | null;
    while ((m = controlRegex.exec(html)) !== null) matches.push({ ...m } as RegExpExecArray);
    for (const match of matches) {
      const attrs = match[2] || '';
      const placeholderMatch = attrs.match(/\bplaceholder\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
      if (!placeholderMatch) continue;
      const placeholder = (placeholderMatch[2] ?? placeholderMatch[3] ?? placeholderMatch[4] ?? '').trim();
      if (!placeholder) continue;
      const idMatch = attrs.match(/\bid\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
      let id = (idMatch?.[2] ?? idMatch?.[3] ?? idMatch?.[4] ?? '').trim();
      let fullTag = match[0];
      if (!id) {
        id = `label-${Math.random().toString(36).slice(2, 10)}`;
        const withId = fullTag.replace(/<(input|select|textarea)\b/i, (x) => `${x} id="${id}" `);
        changes.push({ before: fullTag, after: withId });
        newHtml = newHtml.replace(fullTag, withId);
        fullTag = withId;
      }
      const labelHtml = `<label for="${id}">${placeholder.replace(/</g, '&lt;').replace(/"/g, '&quot;')}</label> `;
      if (!newHtml.includes(fullTag)) continue;
      changes.push({ before: fullTag, after: labelHtml + fullTag });
      newHtml = newHtml.replace(fullTag, labelHtml + fullTag);
    }
    return changes.length ? { newHtml, changes } : null;
  }

  private applyTableScopeFix(html: string): { newHtml: string; changes: Array<{ before: string; after: string }> } | null {
    const thRegex = /<th\b([^>]*)>/gi;
    const changes: Array<{ before: string; after: string }> = [];
    let newHtml = html;
    let m: RegExpExecArray | null;
    while ((m = thRegex.exec(html)) !== null) {
      const full = m[0];
      if (/\bscope\s*=/i.test(full)) continue;
      const inRow = html.slice(0, m.index).split(/<tr\b/i).length;
      const prevThInRow = (html.slice(0, m.index).match(/<th\b/gi) || []).length;
      const scope = prevThInRow === 0 ? 'row' : 'col';
      const withScope = full.replace(/<th\b/i, `<th scope="${scope}"`);
      changes.push({ before: full, after: withScope });
      newHtml = newHtml.replace(full, withScope);
    }
    return changes.length ? { newHtml, changes } : null;
  }

  private applyHeadingScopeFix(html: string): { newHtml: string; changes: Array<{ before: string; after: string }> } | null {
    const levels: number[] = [];
    const headingRegex = /<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi;
    let m: RegExpExecArray | null;
    while ((m = headingRegex.exec(html)) !== null) {
      levels.push(parseInt(m[1], 10));
    }
    let fixed = false;
    for (let i = 1; i < levels.length; i++) {
      if (levels[i] > levels[i - 1] + 1) {
        fixed = true;
        levels[i] = levels[i - 1] + 1;
      }
    }
    if (!fixed) return null;
    const changes: Array<{ before: string; after: string }> = [];
    let newHtml = html;
    const headingRegex2 = /<h([1-6])\b([^>]*)>([\s\S]*?)<\/h\1>/gi;
    let idx = 0;
    let mat: RegExpExecArray | null;
    while ((mat = headingRegex2.exec(html)) !== null && idx < levels.length) {
      const currentLevel = parseInt(mat[1], 10);
      const targetLevel = levels[idx];
      if (currentLevel !== targetLevel) {
        const full = mat[0];
        const repl = full.replace(new RegExp(`<h${currentLevel}\\b`, 'gi'), `<h${targetLevel}`).replace(new RegExp(`</h${currentLevel}>`, 'gi'), `</h${targetLevel}>`);
        changes.push({ before: full, after: repl });
        newHtml = newHtml.replace(full, repl);
      }
      idx++;
    }
    return changes.length ? { newHtml, changes } : null;
  }

  async getAccessibilityFixPreview(
    courseId: number,
    findings: Array<{
      resource_type: string;
      resource_id: string;
      resource_title?: string;
      rule_id: string;
      snippet?: string | null;
    }>,
  ): Promise<{
    actions: Array<{
      action_id: string;
      resource_type: string;
      resource_id: string;
      update_key: string;
      resource_title: string;
      rule_id: string;
      fix_type: string;
      fix_strategy: FixStrategy;
      risk: FixRisk;
      before_html: string;
      after_html: string;
      beforeHtml: string;
      afterHtml: string;
      before_snippet: string;
      after_snippet: string;
      content_hash: string;
      proposed_html?: string;
      error_note?: string;
    }>;
  }> {
    const seen = new Set<string>();
    const actions: Array<any> = [];
    const crypto = await import('crypto');
    const hash = (s: string) => crypto.createHash('sha256').update(s).digest('hex').slice(0, 16);

    for (const f of findings) {
      const contract = ACCESSIBILITY_FIXABILITY_MAP[f.rule_id];
      if (!contract?.supports_preview) continue;

      const key = `${f.resource_type}:${f.resource_id}:${f.rule_id}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const content = await this.fetchAccessibilityResourceContent(courseId, f.resource_type, f.resource_id);
      if (!content) continue;

      const resTitle = content.resourceTitle || f.resource_title || '';
      let result: { newHtml: string; changes: Array<{ before: string; after: string }>; errorNote?: string } | null = null;
      if (contract.fix_type === 'ai_generate_alt_text') {
        result = await this.buildAiAltTextFix(content.html, resTitle);
      } else if (contract.fix_type === 'ai_replace_ambiguous_link_text') {
        result = await this.buildAiAmbiguousLinkFix(content.html);
      } else if (contract.fix_type === 'ai_link_text') {
        result = await this.buildAiLinkEmptyNameFix(content.html, resTitle);
      } else if (contract.fix_type === 'ai_link_file_hint') {
        result = await this.buildAiLinkFileHintFix(content.html, resTitle);
      } else if (contract.fix_type === 'ai_heading_shorten') {
        result = await this.buildAiHeadingShortenFix(content.html, resTitle);
      } else if (contract.fix_type === 'ai_heading_visual') {
        result = await this.buildAiHeadingVisualFix(content.html, resTitle);
      } else if (contract.fix_type === 'ai_list_semantic') {
        result = await this.buildAiListSemanticFix(content.html, resTitle);
      } else if (contract.fix_type === 'ai_img_decorative') {
        result = await this.buildAiImgDecorativeFix(content.html, resTitle);
      } else if (contract.fix_type === 'ai_img_meaningful_alt') {
        result = await this.buildAiImgMeaningfulAltFix(content.html, resTitle);
      } else if (contract.fix_type === 'ai_button_label') {
        result = await this.buildAiButtonLabelFix(content.html, resTitle);
      } else if (contract.fix_type === 'ai_form_label') {
        result = await this.buildAiFormLabelFix(content.html, resTitle);
      } else if (contract.fix_type === 'ai_table_caption') {
        result = await this.buildAiTableCaptionFix(content.html, resTitle);
      } else if (contract.fix_type === 'ai_table_header') {
        result = await this.buildAiTableHeaderFix(content.html, resTitle);
      } else if (contract.fix_type === 'ai_link_broken') {
        result = await this.buildAiLinkBrokenFix(content.html, resTitle, courseId);
      } else if (contract.fix_type === 'ai_link_reconstruct') {
        result = await this.buildAiLinkSplitFix(content.html, resTitle);
      } else if (contract.fix_type === 'set_html_lang') {
        const nonEnglish = this.looksNonEnglishText(content.html.replace(/<[^>]+>/g, ' '));
        if (nonEnglish) {
          result = { newHtml: content.html, changes: [], errorNote: 'Possible non-English content detected. Human review required before setting a default language.' };
        } else {
          result = this.applySetHtmlLang(content.html);
        }
      } else {
        const syncResult = this.runFixExecutor(content.html, contract.fix_type);
        result = syncResult ? { ...syncResult } : null;
      }
      if (!result || (result.changes.length === 0 && !result.errorNote)) continue;

      const beforeSnippet = result.changes.map((c) => c.before).join('\n---\n');
      const afterSnippet = result.changes.map((c) => c.after).join('\n---\n');
      const actionId = `${hash(content.html)}:${f.resource_type}:${f.resource_id}:${f.rule_id}`;
      const hasError = !!result.errorNote;
      const effectiveStrategy: FixStrategy = hasError ? 'manual_only' : contract.fix_strategy;
      const beforeHtml = beforeSnippet;
      const afterHtml = hasError ? '' : afterSnippet;

      actions.push({
        action_id: actionId,
        resource_type: f.resource_type,
        resource_id: f.resource_id,
        update_key: content.updateKey,
        resource_title: content.resourceTitle || f.resource_title || '',
        rule_id: f.rule_id,
        fix_type: contract.fix_type,
        fix_strategy: effectiveStrategy,
        risk: contract.risk,
        before_html: beforeHtml,
        after_html: afterHtml,
        beforeHtml,
        afterHtml,
        before_snippet: (beforeHtml || (result.errorNote || '')).slice(0, 1000),
        after_snippet: (afterHtml || (result.errorNote || '')).slice(0, 1000),
        content_hash: hash(content.html),
        proposed_html: hasError ? undefined : result.newHtml,
        error_note: result.errorNote,
      });
    }

    return { actions };
  }

  async applyAccessibilityFixes(
    courseId: number,
    approvedActions: Array<{
      action_id: string;
      resource_type: string;
      resource_id: string;
      update_key: string;
      rule_id: string;
      content_hash: string;
      fix_strategy?: FixStrategy;
      before_html?: string;
      after_html?: string;
      proposed_html?: string;
      error_note?: string;
    }>,
  ): Promise<{
    fixed: number;
    skipped: number;
    failed: number;
    results: Array<{
      action_id: string;
      resource_type: string;
      resource_id: string;
      status: 'fixed' | 'skipped' | 'failed';
      error?: string;
    }>;
  }> {
    const crypto = await import('crypto');
    const hash = (s: string) => crypto.createHash('sha256').update(s).digest('hex').slice(0, 16);
    const results: Array<{ action_id: string; resource_type: string; resource_id: string; status: 'fixed' | 'skipped' | 'failed'; error?: string }> = [];
    let fixed = 0;
    let skipped = 0;
    let failed = 0;

    const byResource = new Map<string, { actions: typeof approvedActions; html: string; updateKey: string; resourceType: string }>();
    for (const a of approvedActions) {
      const key = `${a.resource_type}:${a.resource_id}`;
      if (!byResource.has(key)) {
        const content = await this.fetchAccessibilityResourceContent(courseId, a.resource_type, a.resource_id);
        if (!content) {
          results.push({ action_id: a.action_id, resource_type: a.resource_type, resource_id: a.resource_id, status: 'failed', error: 'Could not fetch resource content' });
          failed++;
          continue;
        }
        if (hash(content.html) !== a.content_hash) {
          results.push({ action_id: a.action_id, resource_type: a.resource_type, resource_id: a.resource_id, status: 'skipped', error: 'Content changed since preview' });
          skipped++;
          continue;
        }
        byResource.set(key, { actions: [], html: content.html, updateKey: content.updateKey, resourceType: a.resource_type });
      }
      const entry = byResource.get(key)!;
      if (hash(entry.html) !== a.content_hash) {
        results.push({ action_id: a.action_id, resource_type: a.resource_type, resource_id: a.resource_id, status: 'skipped', error: 'Content hash mismatch' });
        skipped++;
        continue;
      }
      entry.actions.push(a);
    }

    for (const [, entry] of byResource) {
      let html = entry.html;

      for (const a of entry.actions) {
        if (a.fix_strategy === 'manual_only') {
          results.push({ action_id: a.action_id, resource_type: a.resource_type, resource_id: a.resource_id, status: 'skipped', error: a.error_note || 'Marked manual_only in preview' });
          skipped++;
          continue;
        }
        const c = ACCESSIBILITY_FIXABILITY_MAP[a.rule_id];
        if (a.before_html && typeof a.after_html === 'string' && a.after_html !== '(removed)' && html.includes(a.before_html)) {
          html = html.replace(a.before_html, a.after_html);
          continue;
        }
        if (a.before_html && a.after_html === '(removed)' && html.includes(a.before_html)) {
          html = html.replace(a.before_html, '');
          continue;
        }
        if (typeof a.proposed_html === 'string' && a.proposed_html.trim()) {
          html = a.proposed_html;
          continue;
        }
        if (c?.fix_type) {
          const result = this.runFixExecutor(html, c.fix_type);
          if (result) html = result.newHtml;
        }
      }

      try {
        if (entry.resourceType === 'pages') {
          await this.updatePage(courseId, entry.updateKey, { wiki_page: { body: html } });
        } else if (entry.resourceType === 'assignments') {
          await this.updateAssignment(courseId, Number(entry.updateKey), { description: html });
        } else if (entry.resourceType === 'announcements' || entry.resourceType === 'discussions') {
          await this.updateDiscussion(courseId, Number(entry.updateKey), { message: html });
        } else if (entry.resourceType === 'syllabus') {
          const { token, baseUrl } = await this.getAuthHeaders();
          const r = await fetch(`${baseUrl}/courses/${courseId}`, {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ course: { syllabus_body: html } }),
          });
          if (!r.ok) throw new Error(`Syllabus update failed: ${r.status}`);
        } else {
          for (const a of entry.actions) {
            results.push({ action_id: a.action_id, resource_type: a.resource_type, resource_id: a.resource_id, status: 'failed', error: 'Unsupported resource type' });
            failed++;
          }
          continue;
        }
        for (const a of entry.actions) {
          results.push({ action_id: a.action_id, resource_type: a.resource_type, resource_id: a.resource_id, status: 'fixed' });
          fixed++;
        }
      } catch (e: any) {
        for (const a of entry.actions) {
          results.push({ action_id: a.action_id, resource_type: a.resource_type, resource_id: a.resource_id, status: 'failed', error: e?.message ?? 'Update failed' });
          failed++;
        }
      }
    }

    return { fixed, skipped, failed, results };
  }
}
