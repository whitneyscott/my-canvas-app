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
root() {
  return {}; // Send nothing. EJS has nothing to trip over.
}

@Get('auth/status')
getStatus(@Req() req: any) {
  const isProduction = process.env.NODE_ENV === 'production';
  const hasToken = !!req.session?.canvasToken;
  const isLti = !!req.session?.ltiVerified;

  if (isProduction && !hasToken && !isLti) {
    return { needsToken: true };
  }

  if (!isProduction) {
    return { needsToken: false };
  }

  return { needsToken: !hasToken && !isLti };
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
  async setToken(@Body('token') token: string, @Req() req: any) {
    if (token && req.session) {
      req.session.canvasToken = token;
      
      // Explicitly saving the session ensures the next request sees the token
      return new Promise((resolve) => {
        req.session.save(() => {
          resolve({ success: true });
        });
      });
    }
    return { success: false, message: 'Invalid token or session' };
  }
}