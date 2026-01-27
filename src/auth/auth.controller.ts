import { Controller, Get, Post, Req, Body, Res, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import type { Response } from 'express';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const oauthSignature = require('oauth-signature');

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('status')
  getStatus(@Req() req: any) {
    return this.authService.getAuthStatus(req);
  }

  @Post('set-token')
  async setToken(
    @Req() req: any,
    @Body() body: { token: string; canvasUrl: string },
    @Res() res: Response
  ) {
    const result = await this.authService.setToken(req, body.token, body.canvasUrl);
    
    if (result.success) {
      // Redirect back to the original URL or home
      const returnUrl = req.session.returnUrl || '/';
      delete req.session.returnUrl;
      return res.redirect(returnUrl);
    } else {
      return res.status(400).json(result);
    }
  }

  @Post('lti-launch')
  async handleLtiLaunch(@Req() req: any, @Res() res: Response) {
    // Verify OAuth1 signature for LTI launch
    // Prefer the original raw body when present (application/x-www-form-urlencoded from Canvas)
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

    // Remove oauth_signature when generating expected signature
    delete params.oauth_signature;

    // Resolve consumer secret from environment. Support two common patterns:
    // 1) single shared pair: LTI_CONSUMER_KEY and LTI_SHARED_SECRET
    // 2) legacy: LTI_CONSUMER_SECRET
    const providedConsumerKey = params.oauth_consumer_key || params.oauth_consumerkey || req.body?.oauth_consumer_key;

    let consumerSecret = '';

    const sharedSecret = process.env.LTI_SHARED_SECRET;
    const envConsumerKey = process.env.LTI_CONSUMER_KEY;

    if (sharedSecret) {
      // If a shared secret is provided in env, use it when either no consumer key is provided
      // or the provided key matches the configured env key (tolerant of misspelling).
      if (!providedConsumerKey || !envConsumerKey || providedConsumerKey === envConsumerKey) {
        consumerSecret = sharedSecret;
      }
    }

    // Fallback to legacy LTI_CONSUMER_SECRET env var if no shared secret applied
    if (!consumerSecret) {
      consumerSecret = process.env.LTI_CONSUMER_SECRET || '';
    }

    if (!consumerSecret) {
      throw new BadRequestException('LTI consumer secret not configured for provided consumer key');
    }

    const method = req.method || 'POST';
    const proto = req.get('x-forwarded-proto') || req.protocol;
    const host = req.get('x-forwarded-host') || req.get('host');
    const url = `${proto}://${host}${req.originalUrl}`;

    const expected = oauthSignature.generate(method, url, params, consumerSecret, undefined, {
      encodeSignature: false,
    });

    // Compare signatures (allow for URL-encoded provided signature)
    const decodedProvided = decodeURIComponent(providedSig);

    if (decodedProvided !== expected && providedSig !== expected) {
      return res.status(401).send('Invalid LTI signature');
    }

    // After signature verification, read LTI-provided fields from `req.body` (Canvas prepends `custom_`)
    const roles = req.body?.custom_canvas_roles || req.body?.roles || '';
    const isInstructor = roles.includes('Instructor') || roles.includes('ContentDeveloper');

    if (!isInstructor) {
      return res.status(403).send('Access Denied: Only instructors can launch this tool.');
    }

    const courseId = req.body?.custom_canvas_course_id || undefined;
    this.authService.setLtiSession(req, courseId);

    return res.redirect(`/?courseId=${courseId}`);
  }
}