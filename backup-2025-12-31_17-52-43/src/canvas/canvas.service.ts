import { Injectable } from '@nestjs/common';

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

@Injectable()
export class CanvasService {
  async getCourses() {
    const { token, baseUrl } = await this.getAuthHeaders();

    const termMap = await this.getTermMap(baseUrl, token);
    
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
        // Find the date for this term if it exists in our map
        const termData = Object.values(termMap).find(t => t.name === term);
        
        // Use Term End Date > Course End Date > Created At > Epoch
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
        
        // Sorting by end_date (Newest/Latest end date at the top)
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

  private async getTermMap(baseUrl: string, token: string): Promise<Record<number, { name: string; end: string }>> {
    try {
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

  private async getAuthHeaders(): Promise<{ token: string; baseUrl: string }> {
    const token = process.env.CANVAS_TOKEN;
    const baseUrl = process.env.CANVAS_BASE_URL;

    if (!token || !baseUrl) {
      throw new Error('Missing CANVAS_TOKEN or CANVAS_BASE_URL in .env file');
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
    // Ensure accommodation groups exist before fetching students
    // This is non-blocking - if it fails, we still fetch students
    try {
      const result = await this.ensureAccommodationGroups(courseId);
      if (result === null) {
        console.warn(`[Service] Accommodation groups could not be created due to permissions. Students will still be fetched.`);
      }
    } catch (error: any) {
      // Log error but don't fail the student fetch if accommodation setup fails
      console.warn(`[Service] Failed to ensure accommodation groups before fetching students:`, error.message);
      console.warn(`[Service] Continuing to fetch students despite accommodation setup failure.`);
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

  async createAssignmentGroup(courseId: number, name: string) {
    try {
      const { token, baseUrl } = await this.getAuthHeaders();
      const url = `${baseUrl}/courses/${courseId}/assignment_groups`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name,
        }),
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
    
    const response = await fetch(`${baseUrl}/courses/${courseId}/modules/${moduleId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(cleanedUpdates),
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

  /**
   * Ensures the 'Accommodations' group set exists and contains the required groups.
   * Creates the group set and groups if they don't exist.
   */
  async ensureAccommodationGroups(courseId: number) {
    const { token, baseUrl } = await this.getAuthHeaders();
    
    // Required accommodation groups
    const requiredGroups = ['Time 1.25x', 'Time 1.5x', 'Time 2.0x', 'Extra Attempt'];
    
    try {
      // Step 1: Check if 'Accommodations' group set exists
      const groupSetsUrl = `${baseUrl}/courses/${courseId}/group_categories?per_page=100`;
      const groupSets = await this.fetchPaginatedData(groupSetsUrl, token);
      
      let accommodationsGroupSet = groupSets.find((gs: any) => gs.name === 'Accommodations');
      
      // Step 2: Create group set if it doesn't exist
      if (!accommodationsGroupSet) {
        console.log(`[Service] Creating 'Accommodations' group set for course ${courseId}`);
        const requestBody = {
          name: 'Accommodations',
          self_signup: false,
        };
        
        console.log(`[Service] Request body for group category:`, JSON.stringify(requestBody, null, 2));
        console.log(`[Service] POST URL: ${baseUrl}/courses/${courseId}/group_categories`);
        
        const createResponse = await fetch(`${baseUrl}/courses/${courseId}/group_categories`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });
        
        const responseText = await createResponse.text();
        console.log(`[Service] Group category creation response status: ${createResponse.status} ${createResponse.statusText}`);
        console.log(`[Service] Group category creation response body:`, responseText);
        
        if (!createResponse.ok) {
          throw new Error(`Failed to create Accommodations group set: ${createResponse.status} ${createResponse.statusText} - ${responseText}`);
        }
        
        try {
          accommodationsGroupSet = JSON.parse(responseText);
          console.log(`[Service] Created 'Accommodations' group set with ID: ${accommodationsGroupSet.id}`);
        } catch (parseError: any) {
          throw new Error(`Failed to parse response when creating group set: ${parseError.message} - Response: ${responseText}`);
        }
      } else {
        console.log(`[Service] Found existing 'Accommodations' group set with ID: ${accommodationsGroupSet.id}`);
      }
      
      const groupSetId = accommodationsGroupSet.id;
      
      // Step 3: Get existing groups in the set
      const groupsUrl = `${baseUrl}/group_categories/${groupSetId}/groups?per_page=100`;
      const existingGroups = await this.fetchPaginatedData(groupsUrl, token);
      const existingGroupNames = new Set(existingGroups.map((g: any) => g.name));
      
      // Step 4: Create missing groups
      const createdGroups: any[] = [];
      for (const groupName of requiredGroups) {
        if (!existingGroupNames.has(groupName)) {
          console.log(`[Service] Creating group '${groupName}' in Accommodations set`);
          const groupRequestBody = {
            name: groupName,
          };
          
          console.log(`[Service] Request body for group:`, JSON.stringify(groupRequestBody, null, 2));
          console.log(`[Service] POST URL: ${baseUrl}/group_categories/${groupSetId}/groups`);
          
          const createGroupResponse = await fetch(`${baseUrl}/group_categories/${groupSetId}/groups`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(groupRequestBody),
          });
          
          const groupResponseText = await createGroupResponse.text();
          console.log(`[Service] Group creation response status: ${createGroupResponse.status} ${createGroupResponse.statusText}`);
          console.log(`[Service] Group creation response body:`, groupResponseText);
          
          if (!createGroupResponse.ok) {
            console.error(`[Service] Failed to create group '${groupName}': ${createGroupResponse.status} ${createGroupResponse.statusText} - ${groupResponseText}`);
            // Continue with other groups even if one fails
            continue;
          }
          
          try {
            const newGroup = JSON.parse(groupResponseText);
            createdGroups.push(newGroup);
            console.log(`[Service] Created group '${groupName}' with ID: ${newGroup.id}`);
          } catch (parseError: any) {
            console.error(`[Service] Failed to parse response when creating group '${groupName}': ${parseError.message} - Response: ${groupResponseText}`);
            // Continue with other groups even if parsing fails
            continue;
          }
        } else {
          const existingGroup = existingGroups.find((g: any) => g.name === groupName);
          if (existingGroup) {
            createdGroups.push(existingGroup);
            console.log(`[Service] Group '${groupName}' already exists with ID: ${existingGroup.id}`);
          }
        }
      }
      
      return {
        groupSetId,
        groupSetName: accommodationsGroupSet.name,
        groups: createdGroups,
      };
    } catch (error: any) {
      console.error(`[Service] Error ensuring accommodation groups:`, error);
      
      // Check if it's a permissions error
      if (error.message && error.message.includes('403') || error.message.includes('unauthorized')) {
        const permissionError = new Error(
          `Permission denied: The API token does not have permission to create group categories. ` +
          `Please ensure your Canvas API token has the "Manage Groups" permission enabled. ` +
          `The accommodation groups will not be created automatically, but students can still be viewed.`
        );
        // Don't throw - just log and return null to indicate failure
        console.warn(`[Service] ${permissionError.message}`);
        return null;
      }
      
      // For other errors, still throw but with better message
      throw new Error(`Failed to ensure accommodation groups: ${error.message}`);
    }
  }

  /**
   * Fetches all group categories (group sets) for a course.
   */
  async getGroupCategories(courseId: number) {
    const { token, baseUrl } = await this.getAuthHeaders();
    const groupSetsUrl = `${baseUrl}/courses/${courseId}/group_categories?per_page=100`;
    return await this.fetchPaginatedData(groupSetsUrl, token);
  }

  /**
   * Fetches all groups within a specific group category.
   */
  async getGroupsInCategory(groupCategoryId: number) {
    const { token, baseUrl } = await this.getAuthHeaders();
    const groupsUrl = `${baseUrl}/group_categories/${groupCategoryId}/groups?per_page=100`;
    return await this.fetchPaginatedData(groupsUrl, token);
  }

  /**
   * Fetches all users (members) in a specific group.
   */
  async getUsersInGroup(groupId: number) {
    const { token, baseUrl } = await this.getAuthHeaders();
    const usersUrl = `${baseUrl}/groups/${groupId}/users?per_page=100`;
    return await this.fetchPaginatedData(usersUrl, token);
  }

  /**
   * Fetches all memberships for a specific group.
   * Returns membership objects that include user_id and other membership details.
   */
  async getGroupMemberships(groupId: number) {
    const { token, baseUrl } = await this.getAuthHeaders();
    const membershipsUrl = `${baseUrl}/groups/${groupId}/memberships?per_page=100`;
    return await this.fetchPaginatedData(membershipsUrl, token);
  }

  async addUserToGroup(groupId: number, userId: number) {
    const { token, baseUrl } = await this.getAuthHeaders();
    const url = `${baseUrl}/groups/${groupId}/memberships`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user_id: userId }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to add user to group: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return await response.json();
  }

  async removeUserFromGroup(groupId: number, userId: number) {
    const { token, baseUrl } = await this.getAuthHeaders();
    const url = `${baseUrl}/groups/${groupId}/users/${userId}`;
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to remove user from group: ${response.status} ${response.statusText} - ${errorText}`);
    }

    // DELETE requests may return 204 No Content, so handle empty responses
    if (response.status === 204) {
      return { success: true };
    }

    return await response.json();
  }

  /**
   * Fetches bulk user tags for a course.
   * Returns a dictionary-style object where student IDs are keys and their assigned groups/tags are values.
   */
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

  /**
   * Syncs accommodation data for a course.
   * Fetches all group categories, finds the 'Accommodations' category,
   * then for each group fetches its users and creates a map of studentId -> groupNames[].
   */
  async syncAccommodations(courseId: number): Promise<Record<string, string[]>> {
    const { token, baseUrl } = await this.getAuthHeaders();
    
    try {
      // Step 1: Fetch all group categories for the course
      console.log(`[syncAccommodations] Fetching group categories for course ${courseId}...`);
      const groupCategoriesUrl = `${baseUrl}/courses/${courseId}/group_categories?per_page=100`;
      const groupCategories = await this.fetchPaginatedData(groupCategoriesUrl, token);
      
      console.log(`[syncAccommodations] Found ${groupCategories.length} group categories`);
      
      // Step 2: Find the 'Accommodations' category
      const accommodationsCategory = groupCategories.find((cat: any) => cat.name === 'Accommodations');
      
      if (!accommodationsCategory) {
        console.log(`[syncAccommodations] 'Accommodations' category not found for course ${courseId}`);
        return {};
      }
      
      console.log(`[syncAccommodations] Found 'Accommodations' category with ID: ${accommodationsCategory.id}`);
      
      // Step 3: Fetch groups within the Accommodations category
      const groupsUrl = `${baseUrl}/group_categories/${accommodationsCategory.id}/groups?per_page=100`;
      const groups = await this.fetchPaginatedData(groupsUrl, token);
      
      console.log(`[syncAccommodations] Found ${groups.length} groups in Accommodations category`);
      
      // Step 4: Create a map of studentId -> groupNames[]
      const studentAccommodationsMap: Record<string, string[]> = {};
      
      // Step 5: For each group, fetch its users
      for (const group of groups) {
        const groupName = group.name;
        console.log(`[syncAccommodations] Fetching users for group: "${groupName}" (ID: ${group.id})`);
        
        try {
          const usersUrl = `${baseUrl}/groups/${group.id}/users?per_page=100`;
          const users = await this.fetchPaginatedData(usersUrl, token);
          
          console.log(`[syncAccommodations] Found ${users.length} user(s) in group "${groupName}"`);
          
          // Add each user to the map
          for (const user of users) {
            const studentId = String(user.id);
            if (!studentAccommodationsMap[studentId]) {
              studentAccommodationsMap[studentId] = [];
            }
            studentAccommodationsMap[studentId].push(groupName);
          }
        } catch (error: any) {
          console.error(`[syncAccommodations] Error fetching users for group ${group.id}:`, error.message);
          // Continue with other groups even if one fails
        }
      }
      
      const studentCount = Object.keys(studentAccommodationsMap).length;
      console.log(`[syncAccommodations] SUCCESS: Created accommodation map for ${studentCount} students`);
      
      return studentAccommodationsMap;
    } catch (error: any) {
      console.error(`[syncAccommodations] Error syncing accommodations for course ${courseId}:`, error);
      throw new Error(`Failed to sync accommodations: ${error.message}`);
    }
  }

  /**
   * Syncs course accommodation data by fetching course users with group_ids.
   * This is the most reliable course-level fetch.
   */
  async syncCourse(courseId: number) {
    const { token, baseUrl } = await this.getAuthHeaders();
    
    try {
      // Step 1: Fetch all group categories for the course
      console.log(`[syncCourse] Fetching group categories for course ${courseId}...`);
      const groupCategoriesUrl = `${baseUrl}/courses/${courseId}/group_categories?per_page=100`;
      const groupCategories = await this.fetchPaginatedData(groupCategoriesUrl, token);
      
      console.log(`[syncCourse] Found ${groupCategories.length} group categories`);
      
      // Step 2: Find the 'Accommodations' category dynamically (no hardcoded ID)
      const accommodationsCategory = groupCategories.find((cat: any) => cat.name === 'Accommodations');
      
      if (!accommodationsCategory) {
        console.log(`[syncCourse] 'Accommodations' category not found for course ${courseId}`);
        return {
          success: false,
          message: 'Accommodations category not found',
          studentsWithGroups: []
        };
      }
      
      console.log(`[syncCourse] Found 'Accommodations' category with ID: ${accommodationsCategory.id}`);
      
      // Step 3: Fetch course users with group_ids (most reliable course-level fetch)
      console.log(`[syncCourse] Fetching course users with group_ids...`);
      const usersUrl = `${baseUrl}/courses/${courseId}/users?include[]=group_ids&per_page=100`;
      const students = await this.fetchPaginatedData(usersUrl, token);
      
      console.log(`[syncCourse] Found ${students.length} students`);
      
      // Step 4: Check first few student objects for group_ids
      console.log(`[syncCourse] Checking first few student objects for group_ids...`);
      const firstFew = students.slice(0, 5);
      firstFew.forEach((student: any, index: number) => {
        console.log(`[syncCourse] Student ${index + 1}:`, student);
        if (student.group_ids && Array.isArray(student.group_ids) && student.group_ids.length > 0) {
          console.log(`[syncCourse] FOUND GROUPS FOR: ${student.name} IDs: ${student.group_ids.join(', ')}`);
        } else {
          console.log(`[syncCourse] No group_ids found for: ${student.name}`);
        }
      });
      
      // Step 5: Build student-to-tags mapping and log all students with groups
      const studentsWithGroups: Array<{ studentId: number; name: string; groupIds: number[] }> = [];
      
      students.forEach((student: any) => {
        if (student.group_ids && Array.isArray(student.group_ids) && student.group_ids.length > 0) {
          console.log(`[syncCourse] FOUND GROUPS FOR: ${student.name} IDs: ${student.group_ids.join(', ')}`);
          studentsWithGroups.push({
            studentId: student.id,
            name: student.name || 'Unknown',
            groupIds: student.group_ids
          });
        }
      });
      
      const count = studentsWithGroups.length;
      
      // Step 6: Print success message
      if (count > 0) {
        console.log(`[syncCourse] SUCCESS: Found ${count} students with accommodations`);
      } else {
        console.log(`[syncCourse] No students found with accommodations`);
      }
      
      return {
        success: true,
        accommodationsCategoryId: accommodationsCategory.id,
        studentsWithGroups,
        count
      };
    } catch (error: any) {
      console.error(`[syncCourse] Error syncing course ${courseId}:`, error);
      throw new Error(`Failed to sync course: ${error.message}`);
    }
  }

  /**
   * Fetches all users in a course with their group memberships.
   * Includes group_ids in the response to show which groups each user belongs to.
   */
  async getCourseUsersWithGroups(courseId: number) {
    const { token, baseUrl } = await this.getAuthHeaders();
    const usersUrl = `${baseUrl}/courses/${courseId}/users?per_page=100&include[]=group_ids`;
    return await this.fetchPaginatedData(usersUrl, token);
  }

  /**
   * Fetches all students and their group memberships for the 'Accommodations' set.
   * Returns a map where the key is studentId and the value is an array of their active accommodation group names.
   */
  async getStudentAccommodations(courseId: number): Promise<Record<number, string[]>> {
    const { token, baseUrl } = await this.getAuthHeaders();
    
    try {
      // Step 1: Find the 'Accommodations' group set
      const groupSetsUrl = `${baseUrl}/courses/${courseId}/group_categories?per_page=100`;
      const groupSets = await this.fetchPaginatedData(groupSetsUrl, token);
      
      const accommodationsGroupSet = groupSets.find((gs: any) => gs.name === 'Accommodations');
      
      if (!accommodationsGroupSet) {
        console.log(`[Service] No 'Accommodations' group set found for course ${courseId}`);
        return {};
      }
      
      const groupSetId = accommodationsGroupSet.id;
      
      // Step 2: Get all groups in the Accommodations set
      const groupsUrl = `${baseUrl}/group_categories/${groupSetId}/groups?per_page=100`;
      const groups = await this.fetchPaginatedData(groupsUrl, token);
      
      // Step 3: Build a map of groupId -> groupName for quick lookup
      const groupIdToName = new Map<number, string>();
      groups.forEach((group: any) => {
        groupIdToName.set(group.id, group.name);
      });
      
      // Step 4: For each group, get its memberships
      const studentAccommodations: Record<number, string[]> = {};
      
      for (const group of groups) {
        try {
          const membershipsUrl = `${baseUrl}/groups/${group.id}/memberships?per_page=100`;
          const memberships = await this.fetchPaginatedData(membershipsUrl, token);
          
          // Process each membership
          for (const membership of memberships) {
            // Only include active memberships (workflow_state === 'accepted')
            if (membership.workflow_state === 'accepted' && membership.user_id) {
              const studentId = membership.user_id;
              const groupName = group.name;
              
              if (!studentAccommodations[studentId]) {
                studentAccommodations[studentId] = [];
              }
              
              if (!studentAccommodations[studentId].includes(groupName)) {
                studentAccommodations[studentId].push(groupName);
              }
            }
          }
        } catch (error: any) {
          console.warn(`[Service] Failed to fetch memberships for group ${group.id} (${group.name}):`, error.message);
          // Continue with other groups even if one fails
        }
      }
      
      console.log(`[Service] Found accommodations for ${Object.keys(studentAccommodations).length} students`);
      return studentAccommodations;
    } catch (error: any) {
      console.error(`[Service] Error fetching student accommodations:`, error);
      throw new Error(`Failed to fetch student accommodations: ${error.message}`);
    }
  }
}
