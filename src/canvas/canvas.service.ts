import { Injectable, Scope, Inject } from '@nestjs/common';
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

@Injectable({ scope: Scope.REQUEST })
export class CanvasService {
  constructor(@Inject(REQUEST) private readonly req: any) {}
  
  
  async getCourses() {
    const { token, baseUrl } = await this.getAuthHeaders();

    const termMap = await this.getTermMap();
    
    let allCourses: CanvasCourse[] = [];
    let url: string | null = `${baseUrl}/users/self/courses?per_page=100&state=all`;

    while (url) {
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error(`Canvas API Error: ${response.statusText}`);

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
    let token = process.env.CANVAS_TOKEN;

    if (this.req && this.req.session && this.req.session.canvasToken) {
      token = this.req.session.canvasToken;
    }

    const baseUrl = process.env.CANVAS_BASE_URL || 'https://tjc.instructure.com/api/v1';

    if (!token) {
      throw new Error('Unauthorized: No Canvas token found.');
    }

    return { token, baseUrl };
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

  async getCourseAssignments(courseId: number) {
    const { token, baseUrl } = await this.getAuthHeaders();
    const url = `${baseUrl}/courses/${courseId}/assignments?per_page=100&include[]=submission`;
    return await this.fetchPaginatedData(url, token);
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

  async getCoursePages(courseId: number) {
    const { token, baseUrl } = await this.getAuthHeaders();
    const url = `${baseUrl}/courses/${courseId}/pages?per_page=100`;
    const pages = await this.fetchPaginatedData(url, token);
    
    // Fetch body content for each page (Canvas list endpoint doesn't include body)
    const pagesWithBody = await Promise.all(
      pages.map(async (page) => {
        if (page.url) {
          try {
            const pageUrl = `${baseUrl}/courses/${courseId}/pages/${encodeURIComponent(page.url)}`;
            const pageResponse = await fetch(pageUrl, {
              headers: { Authorization: `Bearer ${token}` },
            });
            
            if (pageResponse.ok) {
              const pageDetails = await pageResponse.json();
              return {
                ...page,
                body: pageDetails.body || null,
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
    // Use discussion_topics endpoint with only_announcements=true
    // This is more reliable than the global announcements endpoint
    const url = `${baseUrl}/courses/${courseId}/discussion_topics?only_announcements=true&per_page=100`;
    console.log(`[Service] Fetching announcements for course ${courseId} from: ${url}`);
    return await this.fetchPaginatedData(url, token);
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

  async getCourseAccommodations(courseId: number) {
    const { token, baseUrl } = await this.getAuthHeaders();
    
    // Fetch assignment overrides (accommodations/extensions)
    const assignments = await this.getCourseAssignments(courseId);
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
      
      // Clean up updates - Canvas API is picky about data types
      const cleanedUpdates: Record<string, any> = {};
      Object.keys(updates).forEach(key => {
        const value = updates[key];
        
        // Handle dates first - allow null to delete dates (Canvas API accepts null to clear dates)
        if (key.includes('_at') || key.includes('date')) {
          if (value === null) {
            // null is a valid value to send to Canvas to delete/clear a date field
            cleanedUpdates[key] = null;
          } else if (value !== undefined && value !== '') {
            try {
              const date = new Date(value);
              if (!isNaN(date.getTime())) {
                cleanedUpdates[key] = date.toISOString();
              } else {
                console.warn(`[Service] Invalid date for ${key}: ${value}`);
              }
            } catch (e) {
              console.warn(`[Service] Error parsing date for ${key}:`, value, e);
            }
          }
          return; // Date fields are handled, skip to next field
        }
        
        // Skip null, undefined, and empty strings for non-date fields
        if (value === null || value === undefined || value === '') {
          return;
        }
        
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
      
      // Check if we have any updates to send
      if (Object.keys(cleanedUpdates).length === 0) {
        throw new Error('No valid updates to send to Canvas API');
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
      
      // Clean up updates - Canvas API is picky about data types
      const cleanedUpdates: Record<string, any> = {};
      Object.keys(updates).forEach(key => {
        const value = updates[key];
        // Skip null, undefined, and empty strings
        if (value === null || value === undefined || value === '') {
          return;
        }
        
        // Handle boolean values - Canvas expects true/false, not strings
        if (typeof value === 'boolean') {
          cleanedUpdates[key] = value;
        }
        // Handle dates - ensure they're in ISO format
        else if (key.includes('_at') || key.includes('date')) {
          if (value) {
            try {
              const date = new Date(value);
              if (!isNaN(date.getTime())) {
                cleanedUpdates[key] = date.toISOString();
              } else {
                console.warn(`[Service] Invalid date for ${key}: ${value}`);
              }
            } catch (e) {
              console.warn(`[Service] Error parsing date for ${key}:`, value, e);
            }
          }
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
      
      // Check if we have any updates to send
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
      
      // For graded quizzes, the due date is stored on the associated assignment, not the quiz
      // If we updated due_at and the quiz has an assignment_id, also update the assignment
      if (cleanedUpdates.due_at && result.assignment_id) {
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
      } else if (cleanedUpdates.due_at && !result.assignment_id) {
        console.log(`[Service] Quiz does not have an assignment_id (likely a practice quiz or ungraded survey)`);
      }
      
      // Check if due_at was actually updated in the response
      if (cleanedUpdates.due_at) {
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
    
    // Clean up updates
    const cleanedUpdates: Record<string, any> = {};
    Object.keys(updates).forEach(key => {
      if (updates[key] !== null && updates[key] !== undefined && updates[key] !== '') {
        cleanedUpdates[key] = updates[key];
      }
    });
    
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
    
    // Clean up updates
    const cleanedUpdates: Record<string, any> = {};
    Object.keys(updates).forEach(key => {
      if (updates[key] !== null && updates[key] !== undefined && updates[key] !== '') {
        cleanedUpdates[key] = updates[key];
      }
    });
    
    console.log(`Updating page ${pageUrl} with:`, cleanedUpdates);
    
    const response = await fetch(`${baseUrl}/courses/${courseId}/pages/${encodeURIComponent(pageUrl)}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(cleanedUpdates),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Page update failed: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`Failed to update page: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return await response.json();
  }

  async updateAnnouncement(courseId: number, announcementId: number, updates: Record<string, any>) {
    const { token, baseUrl } = await this.getAuthHeaders();
    
    // Clean up updates
    const cleanedUpdates: Record<string, any> = {};
    Object.keys(updates).forEach(key => {
      if (updates[key] !== null && updates[key] !== undefined && updates[key] !== '') {
        cleanedUpdates[key] = updates[key];
      }
    });
    
    console.log(`Updating announcement ${announcementId} with:`, cleanedUpdates);
    
    const response = await fetch(`${baseUrl}/announcements/${announcementId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(cleanedUpdates),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Announcement update failed: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`Failed to update announcement: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return await response.json();
  }

  async updateModule(courseId: number, moduleId: number, updates: Record<string, any>) {
    const { token, baseUrl } = await this.getAuthHeaders();
    
    // Clean up updates
    const cleanedUpdates: Record<string, any> = {};
    Object.keys(updates).forEach(key => {
      if (updates[key] !== null && updates[key] !== undefined && updates[key] !== '') {
        cleanedUpdates[key] = updates[key];
      }
    });
    
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
    const { token, baseUrl } = await this.getAuthHeaders();
    const results: Array<{ id: number; success: boolean; data?: any; error?: string }> = [];

    for (const assignmentId of itemIds) {
      try {
        const response = await fetch(`${baseUrl}/courses/${courseId}/assignments/${assignmentId}`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updates),
        });

        if (!response.ok) {
          throw new Error(`Failed to update assignment ${assignmentId}: ${response.statusText}`);
        }

        const updated = await response.json();
        results.push({ id: assignmentId, success: true, data: updated });
      } catch (error: any) {
        results.push({ id: assignmentId, success: false, error: error.message });
      }
    }

    return results;
  }

  async bulkUpdateQuizzes(courseId: number, itemIds: number[], updates: Record<string, any>) {
    const { token, baseUrl } = await this.getAuthHeaders();
    const results: Array<{ id: number; success: boolean; data?: any; error?: string }> = [];

    for (const quizId of itemIds) {
      try {
        const response = await fetch(`${baseUrl}/courses/${courseId}/quizzes/${quizId}`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updates),
        });

        if (!response.ok) {
          throw new Error(`Failed to update quiz ${quizId}: ${response.statusText}`);
        }

        const updated = await response.json();
        results.push({ id: quizId, success: true, data: updated });
      } catch (error: any) {
        results.push({ id: quizId, success: false, error: error.message });
      }
    }

    return results;
  }

  async bulkUpdateDiscussions(courseId: number, itemIds: number[], updates: Record<string, any>) {
    const { token, baseUrl } = await this.getAuthHeaders();
    const results: Array<{ id: number; success: boolean; data?: any; error?: string }> = [];

    for (const discussionId of itemIds) {
      try {
        const response = await fetch(`${baseUrl}/courses/${courseId}/discussion_topics/${discussionId}`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updates),
        });

        if (!response.ok) {
          throw new Error(`Failed to update discussion ${discussionId}: ${response.statusText}`);
        }

        const updated = await response.json();
        results.push({ id: discussionId, success: true, data: updated });
      } catch (error: any) {
        results.push({ id: discussionId, success: false, error: error.message });
      }
    }

    return results;
  }

  async bulkUpdatePages(courseId: number, itemIds: string[], updates: Record<string, any>) {
    const { token, baseUrl } = await this.getAuthHeaders();
    const results: Array<{ id: string; success: boolean; data?: any; error?: string }> = [];

    for (const pageUrl of itemIds) {
      try {
        const response = await fetch(`${baseUrl}/courses/${courseId}/pages/${encodeURIComponent(pageUrl)}`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updates),
        });

        if (!response.ok) {
          throw new Error(`Failed to update page ${pageUrl}: ${response.statusText}`);
        }

        const updated = await response.json();
        results.push({ id: pageUrl, success: true, data: updated });
      } catch (error: any) {
        results.push({ id: pageUrl, success: false, error: error.message });
      }
    }

    return results;
  }

  async bulkUpdateAnnouncements(courseId: number, itemIds: number[], updates: Record<string, any>) {
    const { token, baseUrl } = await this.getAuthHeaders();
    const results: Array<{ id: number; success: boolean; data?: any; error?: string }> = [];

    for (const announcementId of itemIds) {
      try {
        const response = await fetch(`${baseUrl}/announcements/${announcementId}`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updates),
        });

        if (!response.ok) {
          throw new Error(`Failed to update announcement ${announcementId}: ${response.statusText}`);
        }

        const updated = await response.json();
        results.push({ id: announcementId, success: true, data: updated });
      } catch (error: any) {
        results.push({ id: announcementId, success: false, error: error.message });
      }
    }

    return results;
  }

  async bulkUpdateModules(courseId: number, itemIds: number[], updates: Record<string, any>) {
    const { token, baseUrl } = await this.getAuthHeaders();
    const results: Array<{ id: number; success: boolean; data?: any; error?: string }> = [];

    for (const moduleId of itemIds) {
      try {
        const response = await fetch(`${baseUrl}/courses/${courseId}/modules/${moduleId}`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updates),
        });

        if (!response.ok) {
          throw new Error(`Failed to update module ${moduleId}: ${response.statusText}`);
        }

        const updated = await response.json();
        results.push({ id: moduleId, success: true, data: updated });
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
}
