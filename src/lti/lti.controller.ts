import {
  Controller,
  All,
  Get,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { JwksService } from './jwks.service';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { randomBytes } from 'crypto';
import { LaunchVerifyService } from './launch.verify.service';
import { PlatformService } from './platform.service';
import { getState, setState } from './state.store';
import { log as debugLog, getLog } from './lti.debug';

@Controller('lti')
export class LtiController {
  constructor(
    private config: ConfigService,
    private launchVerify: LaunchVerifyService,
    private platform: PlatformService,
    private jwksService: JwksService
  ) {}

  @Get('jwks')
  async getJwks() {
    return this.jwksService.getJwksJson();
  }

  @Get('debug')
  async debug(@Query('error') error: string, @Res() res: Response) {
    return res.render('lti-debug', { log: getLog(), error: error ? decodeURIComponent(error) : null });
  }

  @All('login')
  async login(
    @Query('iss') qIss: string,
    @Query('login_hint') qLoginHint: string,
    @Query('target_link_uri') qTargetLinkUri: string,
    @Query('client_id') qClientId: string,
    @Req() req: Request,
    @Res() res: Response
  ) {
    const iss = qIss || req.body?.iss;
    const loginHint = qLoginHint || req.body?.login_hint;
    const targetLinkUri = qTargetLinkUri || req.body?.target_link_uri;
    const clientId = qClientId || req.body?.client_id;
    debugLog('login_received', { method: req.method, iss, loginHint: loginHint ? '[present]' : null, targetLinkUri: targetLinkUri || null, clientId });
    if (!iss || !loginHint || !clientId) {
      debugLog('login_error', { error: 'Missing OIDC params', hasIss: !!iss, hasLoginHint: !!loginHint, hasClientId: !!clientId });
      return res.redirect('/lti/debug?error=' + encodeURIComponent('Missing OIDC params'));
    }
    const expectedClientId = this.config.get<string>('LTI_CLIENT_ID');
    if (expectedClientId && clientId !== expectedClientId) {
      debugLog('login_error', { error: 'Invalid client_id', received: clientId, expected: expectedClientId });
      return res.redirect('/lti/debug?error=' + encodeURIComponent('Invalid client_id'));
    }

    const state = randomBytes(16).toString('hex');
    const nonce = randomBytes(16).toString('hex');
    const target = targetLinkUri || this.config.get<string>('APP_URL') || '/';
    setState(state, target, nonce);

    const authUrl = await this.platform.getOidcAuthUrl(iss);
    const redirectUri =
      (this.config.get<string>('APP_URL') || 'http://localhost:3000').replace(/\/$/, '') + '/lti/launch';
    debugLog('login_redirect', { state: state.slice(0, 8) + '...', target, redirectUri });
    const redirect =
      `${authUrl}?scope=openid` +
      `&response_type=id_token` +
      `&client_id=${encodeURIComponent(clientId)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&login_hint=${encodeURIComponent(loginHint)}` +
      `&state=${encodeURIComponent(state)}` +
      `&nonce=${encodeURIComponent(nonce)}` +
      `&response_mode=form_post`;
    return res.redirect(redirect);
  }

  @Post('launch')
  async launch(@Req() req: Request, @Res() res: Response) {
    const idToken =
      (typeof req.body?.id_token === 'string' && req.body.id_token) || null;
    const state =
      (typeof req.body?.state === 'string' && req.body.state) || null;
    debugLog('launch_received', { hasIdToken: !!idToken, hasState: !!state, statePreview: state ? state.slice(0, 8) + '...' : null });
    if (!idToken || !state) {
      debugLog('launch_error', { error: 'Missing id_token or state' });
      return res.redirect('/lti/debug?error=' + encodeURIComponent('Missing id_token or state'));
    }

    const stored = getState(state);
    if (!stored) {
      debugLog('launch_error', { error: 'Invalid or expired state', statePreview: state.slice(0, 8) + '...' });
      return res.redirect('/lti/debug?error=' + encodeURIComponent('Invalid or expired state'));
    }

    let claims;
    try {
      claims = await this.launchVerify.verify(idToken);
    } catch (err) {
      debugLog('launch_error', { error: String(err instanceof Error ? err.message : err) });
      return res.redirect('/lti/debug?error=' + encodeURIComponent(String(err instanceof Error ? err.message : err)));
    }
    if (claims.nonce && claims.nonce !== stored.nonce) {
      debugLog('launch_error', { error: 'Nonce mismatch' });
      return res.redirect('/lti/debug?error=' + encodeURIComponent('Nonce mismatch'));
    }

    const context = claims['https://purl.imsglobal.org/spec/lti/claim/context'] as { id?: string } | undefined;
    const custom =
      (claims['https://purl.imsglobal.org/spec/lti/claim/custom'] as Record<string, string>) || {};
    const roles =
      (claims['https://purl.imsglobal.org/spec/lti/claim/roles'] as string[]) || [];
    const courseId =
      String(context?.id || custom.custom_canvas_course_id || custom.canvas_course_id || '');
    const isInstructor =
      roles.some((r: string) =>
        /instructor|contentdeveloper|urn:lti:sysrole:ims\/lis\/teaching/i.test(r)
      );

    if (!isInstructor) {
      return res.redirect(
        '/?error=' + encodeURIComponent('Access Denied: Only instructors can use this tool.')
      );
    }

    const sess = req.session as import('express-session').Session & {
      ltiVerified?: boolean;
      courseId?: string;
      canvasApiDomain?: string;
      ltiSub?: string;
    };
    sess.ltiVerified = true;
    sess.courseId = courseId;
    sess.ltiSub = String(claims.sub || '');
    const aud = claims.aud;
    sess.ltiClientId = Array.isArray(aud) ? String(aud[0] || '') : String(aud || '');
    const rawDomain =
      custom.custom_canvas_api_domain ||
      custom.canvas_api_domain ||
      this.issToApiDomain(String(claims.iss || ''));
    sess.canvasApiDomain = rawDomain.startsWith('http')
      ? rawDomain
      : 'https://' + rawDomain.replace(/^\/+|\/+$/g, '');
    debugLog('launch_success', { courseId, canvasApiDomain: sess.canvasApiDomain, ltiClientId: sess.ltiClientId });

    return new Promise<void>((resolve, reject) => {
      (sess as import('express-session').Session).save((err) => {
        if (err) {
          reject(err);
          return;
        }
        res.redirect(
          stored.target +
            (stored.target.includes('?') ? '&' : '?') +
            'courseId=' +
            encodeURIComponent(courseId)
        );
        resolve();
      });
    });
  }

  private issToApiDomain(iss: string): string {
    const u = iss.replace(/\/$/, '');
    if (u.includes('canvas.instructure.com')) return 'https://canvas.instructure.com';
    return u;
  }
}
