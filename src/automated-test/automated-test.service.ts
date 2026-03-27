import { Injectable } from '@nestjs/common';
import { TEST_CONFIG } from '../config/test-registry.config';

export interface TestResult {
  endpoint: string;
  parameter: string;
  result: string;
  errorMessage?: string;
}

@Injectable()
export class AutomatedTestService {
  private async getAuthHeaders(): Promise<{ token: string; baseUrl: string }> {
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
        throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
      }

      const chunk = await response.json();
      if (Array.isArray(chunk)) {
        allData.push(...chunk);
      } else if (chunk) {
        allData.push(chunk);
      }

      // Check for pagination
      const linkHeader = response.headers.get('link');
      if (linkHeader) {
        const nextMatch = linkHeader.match(/<([^>]+)>;\s*rel="next"/);
        currentUrl = nextMatch ? nextMatch[1] : null;
      } else {
        currentUrl = null;
      }
    }

    return allData;
  }

  async findExistingExampleItems(courseId: number): Promise<Array<{ type: string; id: string | number; name: string }>> {
    const { token, baseUrl } = await this.getAuthHeaders();
    const existingItems: Array<{ type: string; id: string | number; name: string }> = [];

    // Check each type for existing "Example" items
    for (const [type, config] of Object.entries(TEST_CONFIG)) {
      try {
        let items: any[] = [];

        if (type === 'assignments') {
          const url = `${baseUrl}/courses/${courseId}/assignments?per_page=100`;
          items = await this.fetchPaginatedData(url, token);
        } else if (type === 'quizzes') {
          const url = `${baseUrl}/courses/${courseId}/quizzes?per_page=100`;
          items = await this.fetchPaginatedData(url, token);
        } else if (type === 'pages') {
          const url = `${baseUrl}/courses/${courseId}/pages?per_page=100`;
          items = await this.fetchPaginatedData(url, token);
        } else if (type === 'discussions') {
          const url = `${baseUrl}/courses/${courseId}/discussion_topics?per_page=100`;
          items = await this.fetchPaginatedData(url, token);
        } else if (type === 'announcements') {
          const url = `${baseUrl}/courses/${courseId}/discussion_topics?only_announcements=true&per_page=100`;
          items = await this.fetchPaginatedData(url, token);
        } else if (type === 'modules') {
          const url = `${baseUrl}/courses/${courseId}/modules?per_page=100`;
          items = await this.fetchPaginatedData(url, token);
        }

        // Filter for items that start with "Example" (to catch both original and updated items)
        const exampleItems = items.filter((item: any) => {
          const name = item.name || item.title || item.url || '';
          return name.startsWith('Example');
        });

        exampleItems.forEach((item: any) => {
          existingItems.push({
            type,
            id: type === 'pages' ? item.url : item.id,
            name: item.name || item.title || item.url || 'Unknown',
          });
        });
      } catch (error) {
        // Log error but continue checking other types
        console.error(`Error checking for existing ${type} items:`, error);
      }
    }

    return existingItems;
  }

  async deleteExampleItems(courseId: number, itemsToDelete: Array<{ type: string; id: string | number }>): Promise<Array<{ type: string; id: string | number; success: boolean; error?: string }>> {
    const { token, baseUrl } = await this.getAuthHeaders();
    const results: Array<{ type: string; id: string | number; success: boolean; error?: string }> = [];

    for (const item of itemsToDelete) {
      try {
        const config = TEST_CONFIG[item.type as keyof typeof TEST_CONFIG] as { deletePath?: (c: number, i: string | number) => string };
        if (!config?.deletePath) {
          results.push({ type: item.type, id: item.id, success: false, error: config ? 'Unsupported type' : 'Unknown type' });
          continue;
        }
        const deleteUrl = `${baseUrl}${config.deletePath(courseId, item.id)}`;

        const response = await fetch(deleteUrl, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          const errorText = await response.text();
          const errorMsg = `${response.status} ${response.statusText}: ${errorText}`;
          console.error(`Failed to delete ${item.type} ${item.id}: ${errorMsg}`);
          results.push({ type: item.type, id: item.id, success: false, error: errorMsg });
        } else {
          results.push({ type: item.type, id: item.id, success: true });
        }
      } catch (error: any) {
        const errorMsg = error.message || String(error);
        console.error(`Error deleting ${item.type} ${item.id}:`, errorMsg);
        results.push({ type: item.type, id: item.id, success: false, error: errorMsg });
      }
    }

    return results;
  }

  async runTests(courseId: number, deleteExisting: boolean = false): Promise<TestResult[]> {
    const results: TestResult[] = [];
    const { token, baseUrl } = await this.getAuthHeaders();

    // If deleteExisting is true, find and delete existing Example items first
    if (deleteExisting) {
      const existingItems = await this.findExistingExampleItems(courseId);
      if (existingItems.length > 0) {
        const deleteResults = await this.deleteExampleItems(courseId, existingItems);
        const failed = deleteResults.filter(r => !r.success);
        if (failed.length > 0) {
          console.warn(`Failed to delete ${failed.length} items:`, failed);
        }
        // Wait a moment for deletions to complete
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    // Iterate through each type in TEST_CONFIG
    for (const [type, config] of Object.entries(TEST_CONFIG)) {
      try {
        // 1. Create a shell item prefixed 'Example'
        const createData = this.getCreateDataForType(type);
        const createUrl = `${baseUrl}${config.createPath(courseId)}`;
        
        let createdItem: any;
        let createdId: string | number;

        try {
          const createResponse = await fetch(createUrl, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(createData),
          });

          if (!createResponse.ok) {
            const errorText = await createResponse.text();
            results.push({
              endpoint: `${type} (create)`,
              parameter: 'create',
              result: 'failed',
              errorMessage: `${createResponse.status} ${createResponse.statusText}: ${errorText}`,
            });
            continue; // Skip this type if creation failed
          }

          createdItem = await createResponse.json();
          createdId = type === 'pages' ? createdItem.url : createdItem.id;

          results.push({
            endpoint: `${type} (create)`,
            parameter: 'create',
            result: 'success',
          });
        } catch (createError: any) {
          results.push({
            endpoint: `${type} (create)`,
            parameter: 'create',
            result: 'failed',
            errorMessage: createError.message || String(createError),
          });
          continue; // Skip this type if creation failed
        }

        // 2. Iterate through parameters and attempt to update each one individually
        for (const param of config.params) {
          try {
            const updateValue = this.getUpdateDataForParameter(param, type);
            const updateBody = this.getUpdateBodyForType(type, updateValue);
            const updateUrl = `${baseUrl}${config.updatePath(courseId, createdId)}`;

            const updateResponse = await fetch(updateUrl, {
              method: 'PUT',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(updateBody),
            });

            if (!updateResponse.ok) {
              const errorText = await updateResponse.text();
              results.push({
                endpoint: type,
                parameter: param,
                result: 'failed',
                errorMessage: `${updateResponse.status} ${updateResponse.statusText}: ${errorText}`,
              });
            } else {
              results.push({
                endpoint: type,
                parameter: param,
                result: 'success',
              });
            }
          } catch (updateError: any) {
            results.push({
              endpoint: type,
              parameter: param,
              result: 'failed',
              errorMessage: updateError.message || String(updateError),
            });
          }
        }
      } catch (typeError: any) {
        results.push({
          endpoint: type,
          parameter: 'all',
          result: 'failed',
          errorMessage: typeError.message || String(typeError),
        });
      }
    }

    return results;
  }

  private getExpectedNameForType(type: string): string {
    return `Example ${type.charAt(0).toUpperCase() + type.slice(1)}`;
  }

  private getCreateDataForType(type: string): Record<string, any> {
    const baseName = this.getExpectedNameForType(type);
    
    switch (type) {
      case 'assignments':
        return { assignment: { name: baseName } };
      case 'quizzes':
        return { quiz: { title: baseName } };
      case 'pages':
        return { wiki_page: { title: baseName, body: 'Test content' } };
      case 'discussions':
        return { title: baseName, message: 'Test discussion' };
      case 'announcements':
        return { title: baseName, message: 'Test announcement', is_announcement: true };
      case 'modules':
        return { module: { name: baseName } };
      default:
        return {};
    }
  }

  private getUpdateBodyForType(type: string, updateData: Record<string, any>): Record<string, any> {
    // Wrap in appropriate object for Canvas API based on type
    if (type === 'assignments') {
      return { assignment: updateData };
    } else if (type === 'quizzes') {
      return { quiz: updateData };
    } else if (type === 'modules') {
      return { module: updateData };
    } else {
      // discussions, pages, announcements use direct format
      return updateData;
    }
  }

  private getUpdateDataForParameter(param: string, type: string): Record<string, any> {
    // Return test values based on parameter type (without wrapping)
    const updateValue: Record<string, any> = {};
    
    switch (param) {
      case 'name':
      case 'title':
        // Preserve "Example" prefix so items can be found for deletion
        const expectedName = this.getExpectedNameForType(type);
        updateValue[param] = `${expectedName} - Updated ${param}`;
        break;
      case 'description':
      case 'message':
      case 'body':
        updateValue[param] = 'Updated content';
        break;
      case 'points_possible':
      case 'time_limit':
      case 'position':
        updateValue[param] = 100;
        break;
      case 'due_at':
      case 'unlock_at':
      case 'lock_at':
      case 'publish_at':
      case 'delayed_post_at':
      case 'show_correct_answers_at':
      case 'hide_correct_answers_at':
        updateValue[param] = new Date().toISOString();
        break;
      case 'published':
      case 'shuffle_answers':
      case 'require_sequential_progress':
        updateValue[param] = true;
        break;
      case 'discussion_type':
        updateValue[param] = 'threaded';
        break;
      case 'allow_rating':
      case 'published':
        updateValue[param] = true;
        break;
      case 'editing_roles':
        updateValue[param] = 'teachers';
        break;
      default:
        updateValue[param] = 'test_value';
    }

    return updateValue;
  }
}

