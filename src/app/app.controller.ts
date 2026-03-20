import { Controller, Get, Post, Render, Query, Req, Res, Body } from '@nestjs/common';
import type { Response } from 'express';

@Controller()
export class AppController {
  @Get('test-path')
  testPath() {
    return { status: 'ok' };
  }

  @Get('debug-check')
  debugCheck() {
    return { status: 'AppController is alive' };
  }

  @Get()
  @Render('index')
  root(@Query('courseId') courseId?: string, @Query('error') error?: string, @Req() req?: any) {
    const ltiVerified = !!req?.session?.ltiVerified;
    const hasToken = !!req?.session?.canvasToken && !!req?.session?.canvasUrl;
    const ltiLaunchType = req?.session?.ltiLaunchType as '1.1' | '1.3' | undefined;
    const isProduction = process.env.NODE_ENV === 'production';

    if (error) {
      return {
        deploymentMode: 'lti',
        error: decodeURIComponent(error || ''),
        courseId: null,
        needsToken: false,
        modePassword: process.env.MODE_PASSWORD || 'dev2025'
      };
    }

    if (ltiVerified && !hasToken) {
      const needsOAuth = ltiLaunchType !== '1.1';
      return {
        deploymentMode: 'lti',
        ltiVerified: true,
        needsOAuth,
        courseId: req.session.courseId || courseId || null,
        modePassword: process.env.MODE_PASSWORD || 'dev2025'
      };
    }

    if (ltiVerified && hasToken) {
      return {
        deploymentMode: 'lti',
        ltiVerified: true,
        autoLoad: true,
        courseId: req.session.courseId || courseId || null,
        modePassword: process.env.MODE_PASSWORD || 'dev2025'
      };
    }

    if (isProduction || process.env.RENDER || req?.get?.('x-render')) {
      return {
        deploymentMode: 'render',
        courseId: courseId || null,
        autoLoad: false,
        showLoginModal: !hasToken,
        needsToken: !hasToken,
        defaultCanvasUrl: 'https://canvas.instructure.com/api/v1',
        modePassword: process.env.MODE_PASSWORD || 'dev2025'
      };
    }

    return {
      deploymentMode: 'local',
      courseId: courseId || null,
      autoLoad: false,
      showLoginModal: !hasToken,
      needsToken: !hasToken,
      defaultCanvasUrl: process.env.CANVAS_BASE_URL || 'https://canvas.instructure.com/api/v1',
      modePassword: process.env.MODE_PASSWORD || 'dev2025'
    };
  }

  @Get('auth/status')
  getStatus(@Req() req: any) {
    const ltiVerified = !!req.session?.ltiVerified;
    const hasToken = !!req.session?.canvasToken && !!req.session?.canvasUrl;
    const ltiLaunchType = req.session?.ltiLaunchType as '1.1' | '1.3' | undefined;
    const needsOAuth = ltiVerified && !hasToken && ltiLaunchType !== '1.1';
    const needsToken = !ltiVerified && !hasToken;
    const defaultUrl = req.session?.canvasApiDomain
      ? `${req.session.canvasApiDomain.replace(/\/api\/v1\/?$/, '')}/api/v1`
      : (process.env.CANVAS_BASE_URL || 'https://canvas.instructure.com/api/v1');

    return {
      needsToken: needsOAuth || needsToken,
      needsOAuth,
      ltiVerified,
      hasToken,
      defaultUrl
    };
  }

  @Post('auth/set-token')
  async setToken(@Body() body: { token: string; canvasUrl: string }, @Req() req: any) {
    if (body.token && body.canvasUrl && req.session) {
      req.session.canvasToken = body.token;
      req.session.canvasUrl = body.canvasUrl.replace(/\/+$/, '');
      if (!req.session.canvasUrl.endsWith('/api/v1')) {
        req.session.canvasUrl = req.session.canvasUrl.replace(/\/api\/v1\/?$/, '') + '/api/v1';
      }
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
