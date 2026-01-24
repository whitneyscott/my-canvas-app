import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class CanvasService {
  private readonly logger = new Logger(CanvasService.name);
  private readonly baseUrl = process.env.CANVAS_BASE_URL || 'https://canvas.instructure.com/api/v1';

  private getHeaders(token: string) {
    const apiKey = token || process.env.CANVAS_API_KEY;
    return {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  private decodeNumericTerm(termId: number | string): string {
    const termStr = termId?.toString() || '';
    if (termStr.length >= 4) {
      const year = termStr.substring(0, 4);
      const code = termStr.substring(4);
      const seasons: Record<string, string> = { '01': 'Spring', '03': 'Summer', '05': 'Fall', '09': 'Winter' };
      return `${seasons[code] || 'Unknown'} ${year}`;
    }
    return `Term ${termId || 'Unknown'}`;
  }

  async getCourses(token: string) {
    const apiKey = token || process.env.CANVAS_API_KEY;
    if (!apiKey) {
      this.logger.error('No Canvas API token found in request or environment variables');
      return [];
    }
    try {
      const url = `${this.baseUrl}/courses?per_page=100&include[]=term&state[]=unpublished&state[]=available&state[]=completed&enrollment_type=teacher`;
      this.logger.log(`Fetching courses from: ${url}`);
      const response = await axios.get(url, { headers: this.getHeaders(apiKey) });
      if (!Array.isArray(response.data)) {
        this.logger.warn('Canvas returned non-array data for courses');
        return [];
      }
      const grouped = response.data.reduce((acc: any, course: any) => {
        if (!course.id || (!course.name && !course.course_code)) return acc;
        const termName = course.term?.name || this.decodeNumericTerm(course.enrollment_term_id);
        if (!acc[termName]) acc[termName] = { term: termName, courses: [] };
        acc[termName].courses.push({
          id: course.id,
          name: course.name || course.course_code,
          course_code: course.course_code,
          workflow_state: course.workflow_state,
          enrollment_term_id: course.enrollment_term_id,
          sis_course_id: course.sis_course_id,
          term: termName,
          is_published: course.workflow_state === 'available'
        });
        return acc;
      }, {});
      const sortedTerms = Object.values(grouped).sort((a: any, b: any) => {
        const getYear = (name: string) => {
          const match = name.match(/\d{4}/);
          return match ? parseInt(match[0]) : 0;
        };
        const yearA = getYear(a.term);
        const yearB = getYear(b.term);
        if (yearA !== yearB) return yearB - yearA;
        const seasonOrder: Record<string, number> = { 'Winter': 4, 'Fall': 3, 'Summer': 2, 'Spring': 1 };
        const seasonA = Object.keys(seasonOrder).find(s => a.term.includes(s)) || '';
        const seasonB = Object.keys(seasonOrder).find(s => b.term.includes(s)) || '';
        return (seasonOrder[seasonB] || 0) - (seasonOrder[seasonA] || 0);
      });
      sortedTerms.forEach((group: any) => group.courses.sort((a: any, b: any) => b.id - a.id));
      return sortedTerms;
    } catch (error: any) {
      this.logger.error(`Error fetching courses: ${error.message}`);
      if (error.response) {
        this.logger.error(`Status: ${error.response.status}`);
        this.logger.error(`Data: ${JSON.stringify(error.response.data)}`);
      }
      return [];
    }
  }

  async getCourseData(courseId: number, tabName: string, token: string) {
    let endpoint = (tabName === 'discussions' || tabName === 'announcements') ? 'discussion_topics' : tabName;
    try {
      const response = await axios.get(`${this.baseUrl}/courses/${courseId}/${endpoint}?per_page=100`, {
        headers: this.getHeaders(token),
      });
      let data = Array.isArray(response.data) ? response.data : [];
      if (tabName === 'announcements') data = data.filter((topic: any) => topic.is_announcement);
      return data.map(item => ({ ...item, _parentCourseId: courseId, _originTab: tabName }));
    } catch (error) {
      return [];
    }
  }

  async getModuleItems(courseId: number, moduleId: string, token: string) {
    try {
      const url = `${this.baseUrl}/courses/${courseId}/modules/${moduleId}/items?include[]=content_details&per_page=100`;
      const response = await axios.get(url, { headers: this.getHeaders(token) });
      return response.data;
    } catch (error: any) {
      return [];
    }
  }

  async createAssignment(courseId: number, data: any, token: string) {
    const payload = {
      assignment: {
        name: data.name || data.title || 'New Assignment',
        description: data.description || '',
        points_possible: data.points_possible || 0,
        due_at: data.due_at || null,
        lock_at: data.lock_at || null,
        unlock_at: data.unlock_at || null,
        grading_type: data.grading_type || 'points',
        assignment_group_id: data.assignment_group_id || null,
        published: data.published !== undefined ? data.published : true,
        submission_types: data.submission_types || ['none']
      }
    };
    const response = await axios.post(`${this.baseUrl}/courses/${courseId}/assignments`, payload, { headers: this.getHeaders(token) });
    return response.data;
  }

  async createQuiz(courseId: number, data: any, token: string) {
    const payload = {
      quiz: {
        title: data.title || data.name || 'New Quiz',
        published: true,
        ...data
      }
    };
    const response = await axios.post(`${this.baseUrl}/courses/${courseId}/quizzes`, payload, { headers: this.getHeaders(token) });
    return response.data;
  }

  async createPage(courseId: number, data: any, token: string) {
    const payload = {
      wiki_page: {
        title: data.title || data.name || 'New Page',
        body: data.body || data.message || '<p>Testing content</p>',
        published: true,
        ...data
      }
    };
    const response = await axios.post(`${this.baseUrl}/courses/${courseId}/pages`, payload, { headers: this.getHeaders(token) });
    return response.data;
  }

  async createDiscussion(courseId: number, data: any, token: string) {
    const payload = {
      title: data.title || data.name || 'New Discussion',
      message: data.message || data.body || 'Testing content',
      published: true
    };
    const response = await axios.post(`${this.baseUrl}/courses/${courseId}/discussion_topics`, payload, { headers: this.getHeaders(token) });
    return response.data;
  }

  async createAnnouncement(courseId: number, data: any, token: string) {
    const payload = {
      title: data.title || data.name || 'New Announcement',
      message: data.message || data.body || 'Testing content',
      published: true,
      is_announcement: true
    };
    const response = await axios.post(`${this.baseUrl}/courses/${courseId}/discussion_topics`, payload, { headers: this.getHeaders(token) });
    return response.data;
  }

  async createModule(courseId: number, name: string, token: string) {
    const response = await axios.post(`${this.baseUrl}/courses/${courseId}/modules`, { module: { name } }, { headers: this.getHeaders(token) });
    return response.data;
  }

  async addModuleItem(courseId: number, moduleId: number, data: any, token: string) {
    try {
      const response = await axios.post(`${this.baseUrl}/courses/${courseId}/modules/${moduleId}/items`, { module_item: data }, { headers: this.getHeaders(token) });
      return response.data;
    } catch (error: any) {
      return error.response?.data || { errors: [{ message: error.message }] };
    }
  }

  async createFolder(courseId: number, data: any, token: string) {
    const response = await axios.post(`${this.baseUrl}/courses/${courseId}/folders`, data, { headers: this.getHeaders(token) });
    return response.data;
  }

  async updateItem(courseId: number, tabName: string, itemId: string, data: any, token: string) {
    let endpoint = (tabName === 'discussions' || tabName === 'announcements') ? 'discussion_topics' : tabName;
    const wrapperMap: Record<string, string> = {
      'assignments': 'assignment',
      'quizzes': 'quiz',
      'pages': 'wiki_page'
    };
    const wrapper = wrapperMap[endpoint];
    const payload = (wrapper && !data[wrapper]) ? { [wrapper]: data } : data;
    const response = await axios.put(`${this.baseUrl}/courses/${courseId}/${endpoint}/${itemId}`, payload, { headers: this.getHeaders(token) });
    return response.data;
  }

  async deleteCanvasItem(type: string, courseId: number, id: string, token: string) {
    const normalizedType = type.toLowerCase();
    let endpoint = '';
    switch (normalizedType) {
      case 'assignments': endpoint = `courses/${courseId}/assignments/${id}`; break;
      case 'quizzes': endpoint = `courses/${courseId}/quizzes/${id}`; break;
      case 'pages': endpoint = `courses/${courseId}/pages/${id}`; break;
      case 'discussions':
      case 'discussion_topics': endpoint = `courses/${courseId}/discussion_topics/${id}`; break;
      case 'modules': endpoint = `courses/${courseId}/modules/${id}`; break;
      default: throw new Error(`Unsupported type: ${type}`);
    }
    const response = await axios.delete(`${this.baseUrl}/${endpoint}`, { headers: this.getHeaders(token) });
    return response.data;
  }
}