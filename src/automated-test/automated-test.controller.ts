import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { AutomatedTestService } from './automated-test.service';

@Controller('automated-test')
export class AutomatedTestController {
  constructor(private readonly automatedTestService: AutomatedTestService) {}

  @Get('courses/:courseId/find-existing')
  async findExisting(@Param('courseId', ParseIntPipe) courseId: number) {
    return this.automatedTestService.findExistingExampleItems(courseId);
  }

  @Get('courses/:courseId/run-tests')
  async runTests(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Query('deleteExisting') deleteExisting?: string,
  ) {
    const shouldDelete = deleteExisting === 'true';
    return this.automatedTestService.runTests(courseId, shouldDelete);
  }
}
