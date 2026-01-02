import { Controller, Get, Post, Put, Delete, Param, ParseIntPipe, Body, HttpException, HttpStatus } from '@nestjs/common';
import { CanvasService } from './canvas.service';

@Controller('canvas')
export class CanvasController {
  constructor(private readonly canvasService: CanvasService) {}

  @Get('courses')
  async getCourses() {
    return this.canvasService.getCourses();
  }

  @Get('courses/:id')
  async getCourseDetails(@Param('id', ParseIntPipe) id: number) {
    return this.canvasService.getCourseDetails(id);
  }

  @Get('courses/:id/students')
  async getCourseStudents(@Param('id', ParseIntPipe) id: number) {
    return this.canvasService.getCourseStudents(id);
  }

  @Get('courses/:id/quizzes')
  async getCourseQuizzes(@Param('id', ParseIntPipe) id: number) {
    try {
      console.log(`[Controller] Getting quizzes for course ${id}`);
      const result = await this.canvasService.getCourseQuizzes(id);
      console.log(`[Controller] Successfully retrieved ${result.length} quizzes`);
      return result;
    } catch (error: any) {
      console.error(`[Controller] Error getting quizzes for course ${id}:`, error);
      console.error(`[Controller] Error message:`, error.message);
      console.error(`[Controller] Error stack:`, error.stack);
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: `Failed to load quizzes: ${error.message || 'Unknown error'}`,
          error: error.message || 'Internal server error'
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('courses/:id/assignments')
  async getCourseAssignments(@Param('id', ParseIntPipe) id: number) {
    return this.canvasService.getCourseAssignments(id);
  }

  @Get('courses/:id/assignment_groups')
  async getCourseAssignmentGroups(@Param('id', ParseIntPipe) id: number) {
    return this.canvasService.getCourseAssignmentGroups(id);
  }

  @Post('courses/:id/assignment_groups')
  async createAssignmentGroup(
    @Param('id', ParseIntPipe) courseId: number,
    @Body() body: { name: string }
  ) {
    return this.canvasService.createAssignmentGroup(courseId, body.name);
  }

  @Get('courses/:id/discussions')
  async getCourseDiscussions(@Param('id', ParseIntPipe) id: number) {
    return this.canvasService.getCourseDiscussions(id);
  }

  @Get('courses/:id/pages')
  async getCoursePages(@Param('id', ParseIntPipe) id: number) {
    return this.canvasService.getCoursePages(id);
  }

  @Get('courses/:id/announcements')
  async getCourseAnnouncements(@Param('id', ParseIntPipe) id: number) {
    return this.canvasService.getCourseAnnouncements(id);
  }

  @Get('courses/:id/modules')
  async getCourseModules(@Param('id', ParseIntPipe) id: number) {
    return this.canvasService.getCourseModules(id);
  }

  @Get('courses/:id/accommodations')
  async getCourseAccommodations(@Param('id', ParseIntPipe) id: number) {
    return this.canvasService.getCourseAccommodations(id);
  }

  @Get('courses/:id/accommodations/ensure-columns')
  async ensureAccommodationColumns(@Param('id', ParseIntPipe) id: number) {
    return this.canvasService.ensureAccommodationColumns(id);
  }

  @Get('courses/:id/accommodations/data')
  async getAccommodationData(@Param('id', ParseIntPipe) id: number) {
    return this.canvasService.getAccommodationData(id);
  }

  @Put('courses/:courseId/accommodations/columns/:columnId/users/:userId')
  async saveAccommodationValue(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('columnId', ParseIntPipe) columnId: number,
    @Param('userId', ParseIntPipe) userId: number,
    @Body() body: { content: string }
  ) {
    return this.canvasService.saveAccommodationValue(courseId, columnId, userId, body.content);
  }

  @Get('courses/:id/custom_gradebook_columns')
  async getCustomGradebookColumns(@Param('id', ParseIntPipe) id: number) {
    return this.canvasService.getCustomGradebookColumns(id);
  }

  @Get('courses/:id/bulk_user_tags')
  async getBulkUserTags(@Param('id', ParseIntPipe) id: number) {
    return this.canvasService.getBulkUserTags(id);
  }

  // Individual update endpoints (for inline editing)
  @Put('courses/:courseId/assignments/:id')
  async updateAssignment(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() updates: Record<string, any>
  ) {
    try {
      console.log(`[Controller] Updating assignment ${id} in course ${courseId}`);
      console.log(`[Controller] Updates received:`, JSON.stringify(updates, null, 2));
      const result = await this.canvasService.updateAssignment(courseId, id, updates);
      console.log(`[Controller] Assignment ${id} updated successfully`);
      console.log(`[Controller] Returning result to client:`, JSON.stringify(result, null, 2));
      return result;
    } catch (error: any) {
      console.error(`[Controller] Error updating assignment ${id} in course ${courseId}:`, error);
      console.error(`[Controller] Error message:`, error.message);
      console.error(`[Controller] Error stack:`, error.stack);
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: `Failed to update assignment: ${error.message || 'Unknown error'}`,
          error: error.message || 'Internal server error'
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Put('courses/:courseId/quizzes/:id')
  async updateQuiz(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() updates: Record<string, any>
  ) {
    try {
      console.log(`[Controller] Updating quiz ${id} in course ${courseId}`);
      console.log(`[Controller] Updates received:`, JSON.stringify(updates, null, 2));
      const result = await this.canvasService.updateQuiz(courseId, id, updates);
      console.log(`[Controller] Quiz ${id} updated successfully`);
      console.log(`[Controller] Returning result to client:`, JSON.stringify(result, null, 2));
      return result;
    } catch (error: any) {
      console.error(`[Controller] Error updating quiz ${id}:`, error);
      console.error(`[Controller] Error message:`, error.message);
      console.error(`[Controller] Error stack:`, error.stack);
      // Throw HttpException so NestJS handles it properly
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: `Failed to update quiz ${id}: ${error.message || 'Unknown error'}`,
          error: error.message || 'Internal server error'
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Put('courses/:courseId/discussions/:id')
  async updateDiscussion(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() updates: Record<string, any>
  ) {
    return this.canvasService.updateDiscussion(courseId, id, updates);
  }

  @Put('courses/:courseId/pages/:id')
  async updatePage(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('id') id: string,
    @Body() updates: Record<string, any>
  ) {
    return this.canvasService.updatePage(courseId, id, updates);
  }

  @Put('courses/:courseId/announcements/:id')
  async updateAnnouncement(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() updates: Record<string, any>
  ) {
    return this.canvasService.updateAnnouncement(courseId, id, updates);
  }

  @Put('courses/:courseId/modules/:id')
  async updateModule(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() updates: Record<string, any>
  ) {
    return this.canvasService.updateModule(courseId, id, updates);
  }

  // Bulk update endpoints (kept for future use)
  @Put('courses/:courseId/assignments/bulk')
  async bulkUpdateAssignments(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Body() body: { itemIds: number[]; updates: Record<string, any> }
  ) {
    return this.canvasService.bulkUpdateAssignments(courseId, body.itemIds, body.updates);
  }

  @Put('courses/:courseId/quizzes/bulk')
  async bulkUpdateQuizzes(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Body() body: { itemIds: number[]; updates: Record<string, any> }
  ) {
    return this.canvasService.bulkUpdateQuizzes(courseId, body.itemIds, body.updates);
  }

  @Put('courses/:courseId/discussions/bulk')
  async bulkUpdateDiscussions(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Body() body: { itemIds: number[]; updates: Record<string, any> }
  ) {
    return this.canvasService.bulkUpdateDiscussions(courseId, body.itemIds, body.updates);
  }

  @Put('courses/:courseId/pages/bulk')
  async bulkUpdatePages(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Body() body: { itemIds: string[]; updates: Record<string, any> }
  ) {
    return this.canvasService.bulkUpdatePages(courseId, body.itemIds, body.updates);
  }

  @Put('courses/:courseId/announcements/bulk')
  async bulkUpdateAnnouncements(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Body() body: { itemIds: number[]; updates: Record<string, any> }
  ) {
    return this.canvasService.bulkUpdateAnnouncements(courseId, body.itemIds, body.updates);
  }

  @Put('courses/:courseId/modules/bulk')
  async bulkUpdateModules(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Body() body: { itemIds: number[]; updates: Record<string, any> }
  ) {
    return this.canvasService.bulkUpdateModules(courseId, body.itemIds, body.updates);
  }
}
