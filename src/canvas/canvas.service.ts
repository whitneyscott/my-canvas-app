import { Injectable, Scope, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { REQUEST } from '@nestjs/core';

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
    return rows;
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
    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const text = await res.text();
      let errMsg = text;
      try {
        const j = JSON.parse(text);
        errMsg = j.message || j.error || errMsg;
      } catch {
        /* ignore */
      }
      throw new Error(`New Quizzes API: ${errMsg}`);
    }
    const created = await res.json();
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
      console.log(`[Service] Retrieved ${result.length} quizzes`);
      return result;
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
    return pure;
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
    return await this.fetchPaginatedData(url, token);
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
    console.log(`[Service] Fetching announcements for course ${courseId} from: ${url}`);
    const announcements = await this.fetchPaginatedData(url, token);

    const withMessage = await Promise.all(
      announcements.map(async (row: any) => {
        if (!row?.id) return row;
        try {
          const full = await this.getDiscussion(courseId, row.id);
          return {
            ...row,
            message: full.message ?? row.message,
            title: full.title ?? row.title,
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
    const url = `${baseUrl}/courses/${courseId}/files?per_page=100`;
    const files = await this.fetchPaginatedData(url, token);
    
    const foldersUrl = `${baseUrl}/courses/${courseId}/folders?per_page=100`;
    const folders = await this.fetchPaginatedData(foldersUrl, token);
    const folderMap = new Map<number, string>();
    
    folders.forEach((folder: any) => {
      if (folder.id && folder.full_name) {
        folderMap.set(folder.id, folder.full_name);
      }
    });
    
    const filesWithUsage = await Promise.all(
      files.map(async (file) => {
        const usage = await this.getFileUsage(courseId, file.id);
        const folderPath = file.folder_id ? (folderMap.get(file.folder_id) || 'Unknown') : 'Root';
        return { ...file, usage, folder_path: folderPath, is_folder: false };
      })
    );
    
    const foldersWithCounts = await Promise.all(
      folders.map(async (folder: any) => {
        let fileCount = folder.files_count || 0;
        let folderCount = 0;
        
        try {
          const subfoldersUrl = `${baseUrl}/folders/${folder.id}/folders?per_page=100`;
          const subfolders = await this.fetchPaginatedData(subfoldersUrl, token);
          folderCount = subfolders.length;
        } catch (error) {
          console.error(`[Service] Error fetching subfolders for folder ${folder.id}:`, error);
        }
        
        const itemCount = fileCount + folderCount;
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
          item_count: itemCount,
          file_count: fileCount,
          folder_count: folderCount
        };
      })
    );
    
    return [...filesWithUsage, ...foldersWithCounts];
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

  async renameFile(courseId: number, fileId: number, newName: string) {
    try {
      const { token, baseUrl } = await this.getAuthHeaders();
      const url = `${baseUrl}/files/${fileId}`;

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newName }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Canvas API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      console.log(`[Service] Renamed file ${fileId} to ${newName}`);
      return result;
    } catch (error: any) {
      console.error(`[Service] Error renaming file ${fileId}:`, error);
      throw error;
    }
  }

  async renameFolder(folderId: number, newName: string) {
    try {
      const { token, baseUrl } = await this.getAuthHeaders();
      const url = `${baseUrl}/folders/${folderId}`;

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newName }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Canvas API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      console.log(`[Service] Renamed folder ${folderId} to ${newName}`);
      return result;
    } catch (error: any) {
      console.error(`[Service] Error renaming folder ${folderId}:`, error);
      throw error;
    }
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
        return await this.getAssignment(courseId, assignmentId);
      }
      
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
      
      const cleanedUpdates: Record<string, any> = {};
      Object.keys(updates).forEach(key => {
        const value = updates[key];
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
        throw new Error('No valid updates to send to Canvas API');
      }
      
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
    const cleanedUpdates = cleanContentUpdates(updates, { clearableTextFields: true });
    console.log(`Updating discussion ${discussionId} with:`, cleanedUpdates);
    
    const response = await fetch(`${baseUrl}/courses/${courseId}/discussion_topics/${discussionId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(cleanedUpdates),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Discussion update failed: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`Failed to update discussion: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return await response.json();
  }

  async updatePage(courseId: number, pageUrl: string, updates: Record<string, any>) {
    const { token, baseUrl } = await this.getAuthHeaders();
    const cleanedUpdates = cleanContentUpdates(updates, { clearableTextFields: true });

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
}
