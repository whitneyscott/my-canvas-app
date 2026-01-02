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

  @Get('courses/:id/accommodations/ensure-groups')
  async ensureAccommodationGroups(@Param('id', ParseIntPipe) id: number) {
    return this.canvasService.ensureAccommodationGroups(id);
  }

  @Get('courses/:id/accommodations/students')
  async getStudentAccommodations(@Param('id', ParseIntPipe) id: number) {
    return this.canvasService.getStudentAccommodations(id);
  }

  @Get('courses/:id/group_categories')
  async getGroupCategories(@Param('id', ParseIntPipe) id: number) {
    return this.canvasService.getGroupCategories(id);
  }

  @Get('group_categories/:categoryId/groups')
  async getGroupsInCategory(@Param('categoryId', ParseIntPipe) categoryId: number) {
    return this.canvasService.getGroupsInCategory(categoryId);
  }

  @Get('groups/:groupId/users')
  async getUsersInGroup(@Param('groupId', ParseIntPipe) groupId: number) {
    return this.canvasService.getUsersInGroup(groupId);
  }

  @Get('groups/:groupId/memberships')
  async getGroupMemberships(@Param('groupId', ParseIntPipe) groupId: number) {
    return this.canvasService.getGroupMemberships(groupId);
  }

  @Get('courses/:courseId/groups/:groupId/memberships')
  async getCourseGroupMemberships(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('groupId', ParseIntPipe) groupId: number
  ) {
    return this.canvasService.getGroupMemberships(groupId);
  }

  @Post('groups/:groupId/memberships')
  async addUserToGroup(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Body() body: { user_id: number }
  ) {
    return this.canvasService.addUserToGroup(groupId, body.user_id);
  }

  @Delete('groups/:groupId/users/:userId')
  async removeUserFromGroup(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Param('userId', ParseIntPipe) userId: number
  ) {
    return this.canvasService.removeUserFromGroup(groupId, userId);
  }

  @Get('courses/:id/users')
  async getCourseUsersWithGroups(@Param('id', ParseIntPipe) id: number) {
    return this.canvasService.getCourseUsersWithGroups(id);
  }

  @Get('courses/:id/bulk_user_tags')
  async getBulkUserTags(@Param('id', ParseIntPipe) id: number) {
    return this.canvasService.getBulkUserTags(id);
  }

  @Get('courses/:id/sync')
  async syncCourse(@Param('id', ParseIntPipe) id: number) {
    return this.canvasService.syncCourse(id);
  }

  @Get('courses/:id/accommodations/sync')
  async syncAccommodations(@Param('id', ParseIntPipe) id: number) {
    return this.canvasService.syncAccommodations(id);
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
