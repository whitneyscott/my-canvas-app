import { Controller, Get, Render, Query } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  @Render('index')
  root(@Query('course_id') courseId: string) {
    return { courseId };
  }
}