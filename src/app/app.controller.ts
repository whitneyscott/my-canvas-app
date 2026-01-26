import { Controller, Get, Post, Render, Query, Req, Res, Body } from '@nestjs/common';
import type { Response } from 'express';

@Controller()
export class AppController {

  @Get('test-path')
  testPath() {
    return { status: 'ok' };
  }

  @Get()
  @Render('index')
  root(@Query('courseId') courseId?: string) {
    return { courseId: courseId || null };
  }

  @Get('auth/status')
  getStatus(@Req() req: any) {
    const isProduction = process.env.NODE_ENV === 'production';
    const hasToken = !!req.session?.canvasToken;
    const hasUrl = !!req.session?.canvasUrl;
    const isLti = !!req.session?.ltiVerified;

    if (isProduction) {
      const authenticated = isLti || (hasToken && hasUrl);
      return { needsToken: !authenticated };
    }

    return { needsToken: false };
  }

  @Post('lti-launch')
  async handleLtiLaunch(@Req() req: any, @Res() res: Response) {
    const roles = req.body?.roles || '';
    const isInstructor = roles.includes('Instructor') || roles.includes('ContentDeveloper');

    if (!isInstructor) {
      return res.status(403).send('Access Denied: Only instructors can launch this tool.');
    }

    const courseId = req.body?.custom_canvas_course_id;
    
    if (req.session) {
      req.session.ltiVerified = true;
      req.session.courseId = courseId;
    }

    return res.redirect(`/?courseId=${courseId}`);
  }

  @Post('auth/set-token')
  async setToken(@Body() body: { token: string; canvasUrl: string }, @Req() req: any) {
    if (body.token && body.canvasUrl && req.session) {
      req.session.canvasToken = body.token;
      req.session.canvasUrl = body.canvasUrl.replace(/\/+$/, "");
      
      return new Promise((resolve) => {
        req.session.save((err) => {
          if (err) resolve({ success: false });
          resolve({ success: true });
        });
      });
    }
    return { success: false, message: 'Invalid credentials' };
  }
}