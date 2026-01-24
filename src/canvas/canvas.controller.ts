import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import axios from 'axios';

@Controller('canvas')
export class CanvasController {
  private readonly baseUrl = process.env.CANVAS_BASE_URL || 'https://canvas.instructure.com/api/v1';
  private readonly canvasToken = process.env.CANVAS_TOKEN;

  private getHeaders(token?: string) {
    const authToken = token || this.canvasToken;
    if (!authToken) {
      throw new Error('Canvas token not available. Set CANVAS_TOKEN in Render or .env file.');
    }
    return {
      Authorization: `Bearer ${authToken}`,
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

  @Get('courses')
  async getCourses() {
    if (!this.canvasToken) {
      return { error: 'Backend Error: CANVAS_TOKEN is missing from environment variables.' };
    }
    try {
      const url = `${this.baseUrl}/courses?per_page=100&include[]=term&state[]=unpublished&state[]=available&state[]=completed&enrollment_type=teacher`;
      const response = await axios.get(url, { headers: this.getHeaders() });
      if (!Array.isArray(response.data)) return [];
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
      return { 
        error: 'Canvas API Error', 
        message: error.message, 
        details: error.response?.data || 'No additional details' 
      };
    }
  }

  @Get('courses/:courseId/:type')
  async getCourseData(
    @Param('courseId') courseId: string,
    @Param('type') type: string
  ) {
    if (!this.canvasToken) return { error: 'CANVAS_TOKEN not configured' };
    try {
      let endpoint = (type === 'discussions' || type === 'announcements') ? 'discussion_topics' : type;
      if (type === 'modules') {
        const url = `${this.baseUrl}/courses/${courseId}/${endpoint}?include[]=items&include[]=content_details&per_page=100`;
        const response = await axios.get(url, { headers: this.getHeaders() });
        let data = Array.isArray(response.data) ? response.data : [];
        return data.map(item => ({ ...item, _parentCourseId: courseId, _originTab: type }));
      } else {
        const response = await axios.get(`${this.baseUrl}/courses/${courseId}/${endpoint}?per_page=100`, {
          headers: this.getHeaders(),
        });
        let data = Array.isArray(response.data) ? response.data : [];
        if (type === 'announcements') data = data.filter((topic: any) => topic.is_announcement);
        return data.map(item => ({ ...item, _parentCourseId: courseId, _originTab: type }));
      }
    } catch (error: any) {
      return { error: `Failed to fetch ${type}`, message: error.message };
    }
  }

  @Get('modules/:courseId/:moduleId/items')
  async getModuleItems(
    @Param('courseId') courseId: string,
    @Param('moduleId') moduleId: string
  ) {
    if (!this.canvasToken) return { error: 'CANVAS_TOKEN not configured' };
    try {
      const url = `${this.baseUrl}/courses/${courseId}/modules/${moduleId}/items?include[]=content_details&per_page=100`;
      const response = await axios.get(url, { headers: this.getHeaders() });
      return response.data;
    } catch (error: any) {
      return { error: 'Failed to fetch module items', message: error.message };
    }
  }

  @Post('courses/:courseId/modules/:moduleId/items')
  async addModuleItem(
    @Param('courseId') courseId: string,
    @Param('moduleId') moduleId: string,
    @Body() body: any
  ) {
    if (!this.canvasToken) return { error: 'CANVAS_TOKEN not configured' };
    try {
      const response = await axios.post(
        `${this.baseUrl}/courses/${courseId}/modules/${moduleId}/items`,
        { module_item: body },
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error: any) {
      return error.response?.data || { error: error.message };
    }
  }

  @Post('courses/:courseId/:type')
  async createItem(
    @Param('courseId') courseId: string,
    @Param('type') type: string,
    @Body() body: any
  ) {
    if (!this.canvasToken) return { error: 'CANVAS_TOKEN not configured' };
    try {
      let endpoint = type === 'discussions' || type === 'announcements' ? 'discussion_topics' : type;
      let payload = body;
      if (type === 'modules') {
        payload = { module: { name: body.name || body.module?.name } };
      } else if (type === 'assignments' && !body.assignment) {
        payload = { assignment: body };
      } else if (type === 'quizzes' && !body.quiz) {
        payload = { quiz: body };
      } else if (type === 'pages' && !body.wiki_page) {
        payload = { wiki_page: body };
      }
      const response = await axios.post(
        `${this.baseUrl}/courses/${courseId}/${endpoint}`,
        payload,
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error: any) {
      return error.response?.data || { error: error.message };
    }
  }

  @Put('courses/:courseId/:type/:id')
  async updateItem(
    @Param('courseId') courseId: string,
    @Param('type') type: string,
    @Param('id') id: string,
    @Body() body: any
  ) {
    if (!this.canvasToken) return { error: 'CANVAS_TOKEN not configured' };
    try {
      let endpoint = type === 'discussions' || type === 'announcements' ? 'discussion_topics' : type;
      const wrapperMap: Record<string, string> = {
        'assignments': 'assignment',
        'quizzes': 'quiz',
        'pages': 'wiki_page'
      };
      const wrapper = wrapperMap[type];
      let payload = body;
      if (wrapper && !body[wrapper]) {
        payload = { [wrapper]: body };
      }
      const urlId = type === 'pages' ? encodeURIComponent(id) : id;
      const response = await axios.put(
        `${this.baseUrl}/courses/${courseId}/${endpoint}/${urlId}`,
        payload,
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error: any) {
      return error.response?.data || { error: error.message };
    }
  }

  @Delete('courses/:courseId/modules/:moduleId/full-delete')
  async fullDeleteModule(
    @Param('courseId') courseId: string,
    @Param('moduleId') moduleId: string
  ) {
    if (!this.canvasToken) return { error: 'CANVAS_TOKEN not configured' };
    try {
      const itemsUrl = `${this.baseUrl}/courses/${courseId}/modules/${moduleId}/items`;
      const itemsResponse = await axios.get(`${itemsUrl}?include[]=content_details&per_page=100`, { 
        headers: this.getHeaders() 
      });
      const items = Array.isArray(itemsResponse.data) ? itemsResponse.data : [];
      for (const item of items) {
        try {
          const type = item.type;
          const contentId = type === 'Page' ? (item.page_url || item.url) : item.content_id;
          if (contentId && !['ExternalTool', 'ExternalUrl', 'SubHeader'].includes(type)) {
            let typeEndpoint = '';
            switch (type) {
              case 'Assignment': typeEndpoint = 'assignments'; break;
              case 'Quiz': typeEndpoint = 'quizzes'; break;
              case 'Page': typeEndpoint = 'pages'; break;
              case 'DiscussionTopic': typeEndpoint = 'discussion_topics'; break;
            }
            if (typeEndpoint) {
              await axios.delete(`${this.baseUrl}/courses/${courseId}/${typeEndpoint}/${contentId}`, { 
                headers: this.getHeaders() 
              }).catch(() => null);
            }
          }
          await axios.delete(`${itemsUrl}/${item.id}`, { headers: this.getHeaders() });
        } catch (error: any) {}
      }
      const moduleResponse = await axios.delete(
        `${this.baseUrl}/courses/${courseId}/modules/${moduleId}`,
        { headers: this.getHeaders() }
      );
      return moduleResponse.data;
    } catch (error: any) {
      return { error: error.response?.data?.errors?.[0]?.message || error.message };
    }
  }

  @Delete(':type/:courseId/:id')
  async deleteItem(
    @Param('type') type: string,
    @Param('courseId') courseId: string,
    @Param('id') id: string
  ) {
    if (!this.canvasToken) return { error: 'CANVAS_TOKEN not configured' };
    try {
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
      const response = await axios.delete(`${this.baseUrl}/${endpoint}`, { headers: this.getHeaders() });
      return response.data;
    } catch (error: any) {
      return { error: error.message };
    }
  }
}