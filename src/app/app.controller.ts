import { Controller, Get, Post, Render, Query, Req, Res, Body, BadRequestException } from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from '../auth/auth.service';

@Controller()
export class AppController {
  constructor(private authService: AuthService) {}

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
        // LTI deployment - use LTI parameters (Canvas prepends `custom_` to keys defined in the XML)
        const ltiCourseId = req?.body?.custom_canvas_course_id || req?.query?.custom_canvas_course_id;
        const ltiRoles = req?.body?.custom_canvas_roles || req?.body?.roles || req?.query?.roles;
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
        req?.body?.custom_canvas_roles ||
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
  @Post('lti/launch')
  async handleLtiLaunch(@Req() req: any, @Res() res: Response) {
    console.log('LTI Launch Request Received at /lti/launch');
    console.log('LTI Launch Request Received at /lti-launch');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const oauthSignature = require('oauth-signature');

    // Prefer raw body for form-encoded LTI launches
    const contentType = (req.get('content-type') || '').toLowerCase();
    let params: Record<string, any> = {};
    if (req.rawBody && contentType.includes('application/x-www-form-urlencoded')) {
      params = Object.fromEntries(new URLSearchParams(req.rawBody));
    } else {
      params = { ...(req.body || {}) };
    }

    const providedSig = params.oauth_signature;
    if (!providedSig) {
      throw new BadRequestException('Missing oauth_signature');
    }
    delete params.oauth_signature;

    const providedConsumerKey = params.oauth_consumer_key || params.oauth_consumerkey || req.body?.oauth_consumer_key;
    let consumerSecret = '';
    const sharedSecret = process.env.LTI_SHARED_SECRET;
    const envConsumerKey = process.env.LTI_CONSUMER_KEY;
    if (sharedSecret) {
      // If an env consumer key is configured, require it to match the provided key.
      if (envConsumerKey) {
        if (providedConsumerKey && providedConsumerKey === envConsumerKey) {
          consumerSecret = sharedSecret;
        }
      } else {
        // No env consumer key configured -> use shared secret for any incoming key
        consumerSecret = sharedSecret;
      }
    }
    if (!consumerSecret) consumerSecret = process.env.LTI_CONSUMER_SECRET || '';
    if (!consumerSecret) throw new BadRequestException('LTI consumer secret not configured for provided consumer key');

    const method = req.method || 'POST';
    const host = req.get('x-forwarded-host') || req.get('host');
    const url = `https://${host}${req.originalUrl.split('?')[0]}`;

    const expected = oauthSignature.generate(method, url, params, consumerSecret, undefined, { encodeSignature: false });
    console.log('Signature Base String components:', { method, url });
    console.log('param keys:', Object.keys(params));
    console.log('expected signature:', expected);
    console.log('provided signature (raw):', providedSig);
    const decodedProvided = decodeURIComponent(providedSig);
    console.log('decoded provided signature:', decodedProvided);
    console.log('protocol & host:', req.protocol, req.get('host'));
    console.log('x-forwarded proto/host:', req.get('x-forwarded-proto'), req.get('x-forwarded-host'));
    if (decodedProvided !== expected && providedSig !== expected) {
      return res.status(401).send('Invalid LTI signature');
    }

    // Signature verified — now extract courseId and roles from req.body/rawBody
    const roles = (req.rawBody && contentType.includes('application/x-www-form-urlencoded'))
      ? (new URLSearchParams(req.rawBody).get('roles') || '')
      : (req.body?.roles || '');
    const isInstructor = roles.includes('Instructor') || roles.includes('ContentDeveloper');
    if (!isInstructor) return res.status(403).send('Access Denied: Only instructors can launch this tool.');

    const courseId = (req.rawBody && contentType.includes('application/x-www-form-urlencoded'))
      ? (new URLSearchParams(req.rawBody).get('custom_canvas_course_id') || undefined)
      : req.body?.custom_canvas_course_id;

    this.authService.setLtiSession(req, courseId);
    return res.redirect(`/?courseId=${courseId}`);
  }

  // Temporary debug endpoint to troubleshoot Canvas LTI POSTs.
  // Logs headers and raw body, returns 200. Remove after debugging.
  @Post('lti/launch-debug')
  async handleLtiLaunchDebug(@Req() req: any, @Res() res: Response) {
    try {
      const contentType = (req.get('content-type') || '').toLowerCase();
      const raw = req.rawBody && contentType.includes('application/x-www-form-urlencoded')
        ? req.rawBody
        : JSON.stringify(req.body || {});

      console.log('--- LTI DEBUG REQUEST ---');
      console.log('url:', (req.get('x-forwarded-proto') || req.protocol) + '://' + (req.get('x-forwarded-host') || req.get('host')) + req.originalUrl);
      console.log('headers:', JSON.stringify(req.headers, null, 2));
      console.log('req.body:', JSON.stringify(req.body || {}, null, 2));
      console.log('rawBody:', raw);
      console.log('--- END LTI DEBUG ---');

      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error('LTI debug handler error', err);
      return res.status(500).json({ ok: false, error: 'debug handler error' });
    }
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