import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import axios from 'axios';

@Controller('canvas')
export class CanvasController {
  private readonly baseUrl = process.env.CANVAS_BASE_URL || 'https://canvas.instructure.com/api/v1';
  private readonly canvasToken = process.env.CANVAS_TOKEN;

  private getHeaders(token?: string) {
    const authToken = token || this.canvasToken;
    if (!authToken) {
      throw new Error('Canvas token not available. Set CANVAS_TOKEN in .env file.');
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
      console.error('CANVAS_TOKEN not set in .env file');
      return [];
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
      console.error('Error fetching courses from Canvas:', error.response?.data || error.message);
      return [];
    }
  }

  @Get('courses/:courseId/:type')
  async getCourseData(
    @Param('courseId') courseId: string,
    @Param('type') type: string
  ) {
    if (!this.canvasToken) {
      console.error('CANVAS_TOKEN not set in .env file');
      return [];
    }
    try {
      let endpoint = (type === 'discussions' || type === 'announcements') ? 'discussion_topics' : type;
      
      if (type === 'modules') {
        const url = `${this.baseUrl}/courses/${courseId}/${endpoint}?include[]=items&include[]=content_details&per_page=100`;
        console.log(`[Canvas API] Fetching modules for course ${courseId}`);
        console.log(`[Canvas API] URL: ${url}`);
        
        const response = await axios.get(url, {
          headers: this.getHeaders(),
        });
        
        console.log(`[Canvas API] Modules response status: ${response.status}`);
        console.log(`[Canvas API] Modules response data type: ${typeof response.data}, isArray: ${Array.isArray(response.data)}`);
        
        let data = Array.isArray(response.data) ? response.data : [];
        console.log(`[Canvas API] Fetched ${data.length} modules`);
        
        if (data.length > 0) {
          data.forEach((module: any, index: number) => {
            console.log(`[Canvas API] Module ${index + 1}: ${module.name} (ID: ${module.id})`);
            console.log(`[Canvas API]   - items_count: ${module.items_count}`);
            console.log(`[Canvas API]   - items array: ${Array.isArray(module.items) ? module.items.length + ' items' : 'not an array'}`);
            console.log(`[Canvas API]   - Module keys: ${Object.keys(module).join(', ')}`);
            
            if (Array.isArray(module.items) && module.items.length > 0) {
              console.log(`[Canvas API]   - First item: ${module.items[0].title} (${module.items[0].type})`);
              console.log(`[Canvas API]   - First item keys: ${Object.keys(module.items[0]).join(', ')}`);
              console.log(`[Canvas API]   - First item has content_details: ${!!module.items[0].content_details}`);
              if (module.items[0].content_details) {
                console.log(`[Canvas API]   - First item content_details keys: ${Object.keys(module.items[0].content_details).join(', ')}`);
              }
            } else {
              console.log(`[Canvas API]   - No items array or empty. Checking for content_details at module level...`);
              console.log(`[Canvas API]   - Module has content_details: ${!!module.content_details}`);
              if (module.content_details) {
                console.log(`[Canvas API]   - Module content_details:`, JSON.stringify(module.content_details, null, 2));
              }
            }
            
            console.log(`[Canvas API]   - Full module structure (first 1000 chars):`, JSON.stringify(module, null, 2).substring(0, 1000));
          });
        }
        
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
      console.error(`[Canvas API] Error fetching ${type} for course ${courseId}:`, error.message);
      if (error.response) {
        console.error(`[Canvas API] Error status: ${error.response.status}`);
        console.error(`[Canvas API] Error data:`, JSON.stringify(error.response.data, null, 2));
      }
      return [];
    }
  }

  @Get('modules/:courseId/:moduleId/items')
  async getModuleItems(
    @Param('courseId') courseId: string,
    @Param('moduleId') moduleId: string
  ) {
    if (!this.canvasToken) {
      console.error('CANVAS_TOKEN not set in .env file');
      return [];
    }
    try {
      console.log(`[Canvas API] Fetching module items for module ${moduleId} in course ${courseId}`);
      
      const moduleUrl = `${this.baseUrl}/courses/${courseId}/modules/${moduleId}`;
      console.log(`[Canvas API] First, checking module details: ${moduleUrl}`);
      const moduleResponse = await axios.get(moduleUrl, { headers: this.getHeaders() });
      console.log(`[Canvas API] Module details - name: ${moduleResponse.data?.name}, items_count: ${moduleResponse.data?.items_count}`);
      
      const itemsUrl = `${this.baseUrl}/courses/${courseId}/modules/${moduleId}/items`;
      console.log(`[Canvas API] Now fetching items from: ${itemsUrl}`);
      
      const url = `${itemsUrl}?include[]=content_details&per_page=100`;
      console.log(`[Canvas API] Full URL with params: ${url}`);
      
      const response = await axios.get(url, { 
        headers: this.getHeaders()
      });
      
      console.log(`[Canvas API] Response status: ${response.status}`);
      console.log(`[Canvas API] Actual request URL: ${response.config.url || response.request?.res?.responseUrl}`);
      console.log(`[Canvas API] Response data type: ${typeof response.data}, isArray: ${Array.isArray(response.data)}`);
      console.log(`[Canvas API] Response data length: ${Array.isArray(response.data) ? response.data.length : 'N/A'}`);
      
      if (!Array.isArray(response.data)) {
        console.error('[Canvas API] Module items response is not an array:', response.data);
        if (response.data && typeof response.data === 'object') {
          console.error('[Canvas API] Response object keys:', Object.keys(response.data));
          console.error('[Canvas API] Full response:', JSON.stringify(response.data, null, 2));
        }
        return [];
      }
      
      console.log(`[Canvas API] Fetched ${response.data.length} items for module ${moduleId}`);
      if (response.data.length > 0) {
        console.log(`[Canvas API] First item sample:`, JSON.stringify(response.data[0], null, 2));
        console.log(`[Canvas API] First item has content_details:`, !!response.data[0].content_details);
      } else {
        console.warn(`[Canvas API] WARNING: Module ${moduleId} returned 0 items but module.items_count is ${moduleResponse.data?.items_count}`);
        if (moduleResponse.data?.items_count > 0) {
          console.error(`[Canvas API] ERROR: Module has ${moduleResponse.data.items_count} items according to module data, but items endpoint returned 0!`);
        }
      }
      return response.data;
    } catch (error: any) {
      console.error(`[Canvas API] Error fetching module items for module ${moduleId}:`, error.message);
      if (error.response) {
        console.error(`[Canvas API] Error status: ${error.response.status}`);
        console.error(`[Canvas API] Error data:`, JSON.stringify(error.response.data, null, 2));
      }
      if (error.response?.status === 404) {
        console.error(`[Canvas API] Module ${moduleId} not found in course ${courseId}`);
      }
      return [];
    }
  }

  @Post('courses/:courseId/modules/:moduleId/items')
  async addModuleItem(
    @Param('courseId') courseId: string,
    @Param('moduleId') moduleId: string,
    @Body() body: any
  ) {
    if (!this.canvasToken) {
      console.error('CANVAS_TOKEN not set in .env file');
      return { error: 'CANVAS_TOKEN not configured' };
    }
    try {
      const response = await axios.post(
        `${this.baseUrl}/courses/${courseId}/modules/${moduleId}/items`,
        { module_item: body },
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error: any) {
      console.error(`Error adding module item:`, error.response?.data || error.message);
      return error.response?.data || { errors: [{ message: error.message }] };
    }
  }

  @Post('courses/:courseId/:type')
  async createItem(
    @Param('courseId') courseId: string,
    @Param('type') type: string,
    @Body() body: any
  ) {
    if (!this.canvasToken) {
      console.error('CANVAS_TOKEN not set in .env file');
      return { error: 'CANVAS_TOKEN not configured' };
    }
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
      console.error(`Error creating ${type}:`, error.response?.data || error.message);
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
    if (!this.canvasToken) {
      console.error('CANVAS_TOKEN not set in .env file');
      return { error: 'CANVAS_TOKEN not configured' };
    }
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
      console.error(`Error updating ${type}:`, error.response?.data || error.message);
      return error.response?.data || { error: error.message };
    }
  }

  @Delete('courses/:courseId/modules/:moduleId/full-delete')
  @Delete('courses/:courseId/modules/:moduleId/full-delete')
  async fullDeleteModule(
    @Param('courseId') courseId: string,
    @Param('moduleId') moduleId: string
  ) {
    if (!this.canvasToken) {
      console.error('CANVAS_TOKEN not set in .env file');
      return { error: 'CANVAS_TOKEN not configured' };
    }
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
              }).catch(e => console.error(`Underlying content delete failed: ${e.message}`));
            }
          }

          await axios.delete(`${itemsUrl}/${item.id}`, { headers: this.getHeaders() });
        } catch (error: any) {
          console.error(`Error deleting module item ${item.id}:`, error.message);
        }
      }
      
      const moduleResponse = await axios.delete(
        `${this.baseUrl}/courses/${courseId}/modules/${moduleId}`,
        { headers: this.getHeaders() }
      );
      return moduleResponse.data;
    } catch (error: any) {
      console.error(`Error full deleting module:`, error.response?.data || error.message);
      return { error: error.response?.data?.errors?.[0]?.message || error.message };
    }
  }

  @Delete(':type/:courseId/:id')
  async deleteItem(
    @Param('type') type: string,
    @Param('courseId') courseId: string,
    @Param('id') id: string
  ) {
    if (!this.canvasToken) {
      console.error('CANVAS_TOKEN not set in .env file');
      return { error: 'CANVAS_TOKEN not configured' };
    }
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