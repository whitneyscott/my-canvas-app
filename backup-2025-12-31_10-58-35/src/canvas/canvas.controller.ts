import { Controller, Get, Post, Param, Body, ParseIntPipe } from '@nestjs/common';
import { CanvasService } from './canvas.service';

@Controller('canvas')
export class CanvasController {
  constructor(private readonly canvasService: CanvasService) {}

  @Get('courses')
  async getCourses() {
    return this.canvasService.getCourses();
  }

  // Test item creation endpoints
  @Post('courses/:courseId/test-items/quiz/:index')
  async createTestQuiz(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('index', ParseIntPipe) index: number,
  ) {
    return this.canvasService.createTestQuiz(courseId, index);
  }

  @Post('courses/:courseId/test-items/assignment/:index')
  async createTestAssignment(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('index', ParseIntPipe) index: number,
  ) {
    return this.canvasService.createTestAssignment(courseId, index);
  }

  @Post('courses/:courseId/test-items/discussion/:index')
  async createTestDiscussion(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('index', ParseIntPipe) index: number,
  ) {
    return this.canvasService.createTestDiscussion(courseId, index);
  }

  @Post('courses/:courseId/test-items/page/:index')
  async createTestPage(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('index', ParseIntPipe) index: number,
  ) {
    return this.canvasService.createTestPage(courseId, index);
  }

  @Post('courses/:courseId/test-items/module/:index')
  async createTestModule(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('index', ParseIntPipe) index: number,
  ) {
    return this.canvasService.createTestModule(courseId, index);
  }

  @Post('courses/:courseId/test-items/announcement/:index')
  async createTestAnnouncement(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('index', ParseIntPipe) index: number,
  ) {
    return this.canvasService.createTestAnnouncement(courseId, index);
  }

  // Find existing test items
  @Get('courses/:courseId/test-items')
  async findTestItems(@Param('courseId', ParseIntPipe) courseId: number) {
    return this.canvasService.findTestItems(courseId);
  }

  // Verification endpoints - fetch individual items
  @Get('courses/:courseId/quizzes/:quizId')
  async getQuiz(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('quizId', ParseIntPipe) quizId: number,
  ) {
    return this.canvasService.getQuiz(courseId, quizId);
  }

  @Get('courses/:courseId/assignments/:assignmentId')
  async getAssignment(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('assignmentId', ParseIntPipe) assignmentId: number,
  ) {
    return this.canvasService.getAssignment(courseId, assignmentId);
  }

  @Get('courses/:courseId/discussions/:discussionId')
  async getDiscussion(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('discussionId', ParseIntPipe) discussionId: number,
  ) {
    return this.canvasService.getDiscussion(courseId, discussionId);
  }

  @Get('courses/:courseId/pages/:pageUrl')
  async getPage(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('pageUrl') pageUrl: string,
  ) {
    return this.canvasService.getPage(courseId, pageUrl);
  }

  @Get('courses/:courseId/modules/:moduleId')
  async getModule(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('moduleId', ParseIntPipe) moduleId: number,
  ) {
    return this.canvasService.getModule(courseId, moduleId);
  }
}