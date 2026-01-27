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
  root(@Query('courseId') courseId?: string, @Req() req?: any) {
    // Determine deployment mode using the existing logic
    const deploymentMode = this.getDeploymentMode(req);
    
    switch (deploymentMode) {
      case 'local':
        // Local development - auto-load from .env
        return {
          courseId: courseId || null,
          deploymentMode: 'local',
          autoLoad: true,
          canvasUrl: process.env.CANVAS_BASE_URL || 'https://tjc.instructure.com/api/v1',
          canvasToken: process.env.CANVAS_TOKEN || null
        };
        
      case 'render':
        // Render deployment - show login modal
        const hasValidSession = req?.session?.canvasToken && req?.session?.canvasUrl;
        
        if (hasValidSession) {
          return {
            courseId: courseId || null,
            deploymentMode: 'render',
            autoLoad: false,
            canvasUrl: req.session.canvasUrl,
            canvasToken: req.session.canvasToken
          };
        } else {
          return {
            courseId: courseId || null,
            deploymentMode: 'render',
            autoLoad: false,
            showLoginModal: true,
            defaultCanvasUrl: 'https://tjc.instructure.com/api/v1'
          };
        }
        
      case 'lti':
        // LTI deployment - use LTI parameters
        const ltiCourseId = req?.body?.custom_canvas_course_id || req?.query?.custom_canvas_course_id;
        const ltiRoles = req?.body?.roles || req?.query?.roles;
        const isInstructor = ltiRoles && (ltiRoles.includes('Instructor') || ltiRoles.includes('ContentDeveloper'));
        
        if (!isInstructor) {
          return {
            deploymentMode: 'lti',
            error: 'Access Denied: Only instructors can access this tool.',
            courseId: null
          };
        }
        
        return {
          courseId: ltiCourseId || courseId || null,
          deploymentMode: 'lti',
          autoLoad: true,
          ltiVerified: true,
          canvasUrl: process.env.CANVAS_BASE_URL || 'https://tjc.instructure.com/api/v1',
          canvasToken: process.env.CANVAS_TOKEN || null,
          appName: 'Canvas Bulk Editor'
        };
        
      default:
        // Fallback to render mode
        return {
          courseId: courseId || null,
          deploymentMode: 'render',
          autoLoad: false,
          showLoginModal: true,
          defaultCanvasUrl: 'https://tjc.instructure.com/api/v1'
        };
    }
  }

  // Helper method to determine deployment mode
  private getDeploymentMode(req: any): string {
    // LTI: Check for LTI parameters in request body or query
    if (req?.body?.custom_canvas_course_id || 
        req?.query?.custom_canvas_course_id ||
        req?.body?.roles ||
        req?.query?.roles) {
      return 'lti';
    }
    
    // Render: Check for production environment OR no .env file access
    if (process.env.NODE_ENV === 'production' || 
        process.env.RENDER || 
        req?.get?.('x-render') ||
        !process.env.CANVAS_TOKEN) {
      return 'render';
    }
    
    // Local: Development environment with .env file
    return 'local';
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