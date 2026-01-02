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
    const token = process.env.CANVAS_TOKEN;
    const baseUrl = process.env.CANVAS_BASE_URL;

    if (!token || !baseUrl) {
      throw new Error('Missing CANVAS_TOKEN or CANVAS_BASE_URL in .env file');
    }

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

  private async getAuthHeaders() {
    const token = process.env.CANVAS_TOKEN;
    const baseUrl = process.env.CANVAS_BASE_URL;
    if (!token || !baseUrl) {
      throw new Error('Missing CANVAS_TOKEN or CANVAS_BASE_URL in .env file');
    }
    return { token, baseUrl };
  }

  private async fetchPaginatedData(url: string, token: string): Promise<any[]> {
    const allData: any[] = [];
    let currentUrl: string | null = url;

    while (currentUrl) {
      const response = await fetch(currentUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error(`Canvas API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      if (Array.isArray(data)) {
        allData.push(...data);
      } else if (data) {
        allData.push(data);
      }

      const linkHeader = response.headers.get('link');
      currentUrl = this.getNextUrl(linkHeader);
    }

    return allData;
  }

  // Test item creation methods
  async createTestQuiz(courseId: number, index: number) {
    const { token, baseUrl } = await this.getAuthHeaders();
    const url = `${baseUrl}/courses/${courseId}/quizzes`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        quiz: {
          title: `[TEST] Quiz ${index}`,
          quiz_type: 'assignment',
          points_possible: 10,
          published: false
        }
      }),
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Canvas API Error: ${response.status} ${response.statusText} - ${errorText}`);
    }
    return await response.json();
  }

  async createTestAssignment(courseId: number, index: number) {
    const { token, baseUrl } = await this.getAuthHeaders();
    const url = `${baseUrl}/courses/${courseId}/assignments`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        assignment: {
          name: `[TEST] Assignment ${index}`,
          submission_types: ['online_text_entry'],
          points_possible: 10,
          published: false
        }
      }),
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Canvas API Error: ${response.status} ${response.statusText} - ${errorText}`);
    }
    return await response.json();
  }

  async createTestDiscussion(courseId: number, index: number) {
    const { token, baseUrl } = await this.getAuthHeaders();
    const url = `${baseUrl}/courses/${courseId}/discussion_topics`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: `[TEST] Discussion ${index}`,
        message: 'Test discussion content',
        published: false
      }),
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Canvas API Error: ${response.status} ${response.statusText} - ${errorText}`);
    }
    return await response.json();
  }

  async createTestPage(courseId: number, index: number) {
    const { token, baseUrl } = await this.getAuthHeaders();
    const url = `${baseUrl}/courses/${courseId}/pages`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        wiki_page: {
          title: `test-page-${index}`,
          body: 'Test page content',
          published: false
        }
      }),
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Canvas API Error: ${response.status} ${response.statusText} - ${errorText}`);
    }
    return await response.json();
  }

  async createTestModule(courseId: number, index: number) {
    const { token, baseUrl } = await this.getAuthHeaders();
    const url = `${baseUrl}/courses/${courseId}/modules`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        module: {
          name: `[TEST] Module ${index}`,
          published: false
        }
      }),
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Canvas API Error: ${response.status} ${response.statusText} - ${errorText}`);
    }
    return await response.json();
  }

  async createTestAnnouncement(courseId: number, index: number) {
    const { token, baseUrl } = await this.getAuthHeaders();
    const url = `${baseUrl}/courses/${courseId}/discussion_topics`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: `[TEST] Announcement ${index}`,
        message: 'Test announcement content',
        is_announcement: true,
        published: false
      }),
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Canvas API Error: ${response.status} ${response.statusText} - ${errorText}`);
    }
    return await response.json();
  }

  // Methods to fetch individual items for verification
  async getQuiz(courseId: number, quizId: number) {
    const { token, baseUrl } = await this.getAuthHeaders();
    const url = `${baseUrl}/courses/${courseId}/quizzes/${quizId}`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Canvas API Error: ${response.status} ${response.statusText} - ${errorText}`);
    }
    return await response.json();
  }

  async getAssignment(courseId: number, assignmentId: number) {
    const { token, baseUrl } = await this.getAuthHeaders();
    const url = `${baseUrl}/courses/${courseId}/assignments/${assignmentId}`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Canvas API Error: ${response.status} ${response.statusText} - ${errorText}`);
    }
    return await response.json();
  }

  async getDiscussion(courseId: number, discussionId: number) {
    const { token, baseUrl } = await this.getAuthHeaders();
    const url = `${baseUrl}/courses/${courseId}/discussion_topics/${discussionId}`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Canvas API Error: ${response.status} ${response.statusText} - ${errorText}`);
    }
    return await response.json();
  }

  async getPage(courseId: number, pageUrl: string) {
    const { token, baseUrl } = await this.getAuthHeaders();
    const encodedUrl = encodeURIComponent(pageUrl);
    const url = `${baseUrl}/courses/${courseId}/pages/${encodedUrl}`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Canvas API Error: ${response.status} ${response.statusText} - ${errorText}`);
    }
    return await response.json();
  }

  async getModule(courseId: number, moduleId: number) {
    const { token, baseUrl } = await this.getAuthHeaders();
    const url = `${baseUrl}/courses/${courseId}/modules/${moduleId}`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Canvas API Error: ${response.status} ${response.statusText} - ${errorText}`);
    }
    return await response.json();
  }

  // Helper to find existing test items
  async findTestItems(courseId: number) {
    const { token, baseUrl } = await this.getAuthHeaders();
    const testItems: Record<string, any> = {};

    try {
      // Find test quizzes
      const quizzes = await this.fetchPaginatedData(`${baseUrl}/courses/${courseId}/quizzes?per_page=100`, token);
      const testQuiz = quizzes.find((q: any) => q.title?.startsWith('[TEST]'));
      if (testQuiz) testItems.quiz = testQuiz;

      // Find test assignments
      const assignments = await this.fetchPaginatedData(`${baseUrl}/courses/${courseId}/assignments?per_page=100`, token);
      const testAssignment = assignments.find((a: any) => a.name?.startsWith('[TEST]'));
      if (testAssignment) testItems.assignment = testAssignment;

      // Find test discussions
      const discussions = await this.fetchPaginatedData(`${baseUrl}/courses/${courseId}/discussion_topics?per_page=100`, token);
      const testDiscussion = discussions.find((d: any) => d.title?.startsWith('[TEST]') && !d.is_announcement);
      if (testDiscussion) testItems.discussion = testDiscussion;

      // Find test pages
      const pages = await this.fetchPaginatedData(`${baseUrl}/courses/${courseId}/pages?per_page=100`, token);
      const testPage = pages.find((p: any) => p.title?.startsWith('test-page-'));
      if (testPage) testItems.page = testPage;

      // Find test modules
      const modules = await this.fetchPaginatedData(`${baseUrl}/courses/${courseId}/modules?per_page=100`, token);
      const testModule = modules.find((m: any) => m.name?.startsWith('[TEST]'));
      if (testModule) testItems.module = testModule;

      // Find test announcements
      const testAnnouncement = discussions.find((d: any) => d.title?.startsWith('[TEST]') && d.is_announcement);
      if (testAnnouncement) testItems.announcement = testAnnouncement;
    } catch (error) {
      console.error('Error finding test items:', error);
    }

    return testItems;
  }
}