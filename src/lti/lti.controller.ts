import {
  Controller,
  All,
  Get,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { JwksService } from './jwks.service';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { randomBytes } from 'crypto';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { LaunchVerifyService } from './launch.verify.service';
import { Lti11LaunchVerifyService } from './lti11-launch.verify.service';
import { PlatformService } from './platform.service';
import { getState, setState } from './state.store';
import { log as debugLog, getLog } from './lti.debug';

@Controller('lti')
export class LtiController {
  constructor(
    private config: ConfigService,
    private launchVerify: LaunchVerifyService,
    private lti11Verify: Lti11LaunchVerifyService,
    private platform: PlatformService,
    private jwksService: JwksService
  ) {}

  @Get('jwks')
  async getJwks() {
    return this.jwksService.getJwksJson();
  }

  @Get('debug')
  async debug(@Query('error') error: string, @Res() res: Response) {
    const log = getLog();
    const err = error ? decodeURIComponent(error) : null;
    try {
      writeFileSync(
        join(process.cwd(), 'lti-debug-output.json'),
        JSON.stringify({ error: err, log, ts: new Date().toISOString() }, null, 2)
      );
    } catch (_) {}
    return res.render('lti-debug', { log, error: err });
  }

  @All('login')
  async login(
    @Query('iss') qIss: string,
    @Query('login_hint') qLoginHint: string,
    @Query('target_link_uri') qTargetLinkUri: string,
    @Query('client_id') qClientId: string,
    @Query('lti_message_hint') qLtiMessageHint: string,
    @Req() req: Request,
    @Res() res: Response
  ) {
    try {
      const iss = qIss || req.body?.iss;
      const loginHint = qLoginHint || req.body?.login_hint;
      const targetLinkUri = qTargetLinkUri || req.body?.target_link_uri;
      const clientId = qClientId || req.body?.client_id;
      const ltiMessageHint = qLtiMessageHint || req.body?.lti_message_hint;
      debugLog('login_received', { method: req.method, iss, loginHint: loginHint ? '[present]' : null, targetLinkUri: targetLinkUri || null, clientId, ltiMessageHint: ltiMessageHint ? '[present]' : null });
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
      const params = new URLSearchParams({
        scope: 'openid',
        response_type: 'id_token',
        client_id: clientId,
        redirect_uri: redirectUri,
        login_hint: loginHint,
        state,
        nonce,
        response_mode: 'form_post',
        prompt: 'none',
      });
      if (ltiMessageHint) params.set('lti_message_hint', ltiMessageHint);
      const redirect = `${authUrl}?${params.toString()}`;
      return res.redirect(redirect);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      debugLog('login_error', { error: msg });
      return res.redirect('/lti/debug?error=' + encodeURIComponent(msg));
    }
  }

  @Post('launch')
  async launch(@Req() req: Request, @Res() res: Response) {
    const body = (req.body && typeof req.body === 'object' ? req.body : {}) as Record<
      string,
      unknown
    >;
    const idToken =
      (typeof body.id_token === 'string' && body.id_token) || null;
    const state = (typeof body.state === 'string' && body.state) || null;
    const oauthSig =
      (typeof body.oauth_signature === 'string' && body.oauth_signature) || null;
    const oauthKey =
      (typeof body.oauth_consumer_key === 'string' && body.oauth_consumer_key) || null;

    debugLog('launch_received', {
      hasIdToken: !!idToken,
      hasState: !!state,
      statePreview: state ? state.slice(0, 8) + '...' : null,
      lti11: !!(oauthKey && oauthSig),
    });

    if (idToken && state) {
      debugLog('lti_launch_branch', { chosen: '1.3', reason: 'id_token+state present' });
      return this.handleLti13Launch(req, res, idToken, state);
    }

    if (oauthKey && oauthSig) {
      debugLog('lti_launch_branch', {
        chosen: '1.1',
        reason: 'oauth_consumer_key+oauth_signature present',
        consumerKey: oauthKey,
      });
      return this.handleLti11Launch(req, res, body);
    }

    debugLog('launch_error', {
      error: 'Not LTI 1.3 (missing id_token/state) and not LTI 1.1 (missing OAuth 1.0a fields)',
    });
    return res.redirect(
      '/lti/debug?error=' +
        encodeURIComponent(
          'Unknown launch: need LTI 1.3 id_token+state or LTI 1.1 oauth_consumer_key+oauth_signature'
        )
    );
  }

  private async handleLti13Launch(
    req: Request,
    res: Response,
    idToken: string,
    state: string
  ): Promise<void> {
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
    const rawCourseId =
      String(context?.id || custom.custom_canvas_course_id || custom.canvas_course_id || '');
    const courseId = this.extractNumericCourseId(rawCourseId) || rawCourseId;
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
      ltiClientId?: string;
    };
    sess.ltiVerified = true;
    sess.ltiLaunchType = '1.3';
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
    debugLog('launch_success', {
      courseId,
      rawCourseId: rawCourseId !== courseId ? rawCourseId : undefined,
      canvasApiDomain: sess.canvasApiDomain,
      ltiClientId: sess.ltiClientId,
    });

    return new Promise<void>((resolve, reject) => {
      (sess as import('express-session').Session).save((err) => {
        if (err) {
          reject(err);
          return;
        }
        const returnPath = (stored.target || '/').replace(/\/$/, '') + '/?courseId=' + encodeURIComponent(courseId);
        res.redirect('/oauth/canvas?returnUrl=' + encodeURIComponent(returnPath));
        resolve();
      });
    });
  }

  private extractNumericCourseId(val: string): string | null {
    if (!val || typeof val !== 'string') return null;
    const s = val.trim();
    if (!s) return null;
    if (/^\d+$/.test(s)) return s;
    const m = s.match(/\/(\d+)(?:\?|$)/) || s.match(/(\d+)$/);
    return m ? m[1] : null;
  }

  private issToApiDomain(iss: string): string {
    const u = iss.replace(/\/$/, '');
    if (u.includes('canvas.instructure.com')) return 'https://canvas.instructure.com';
    return u;
  }

  private buildLaunchUrl(req: Request): string {
    const forwardedProto = req.get('x-forwarded-proto')?.split(',')[0]?.trim();
    const proto = forwardedProto || req.protocol || 'https';
    const host = (req.get('x-forwarded-host') || req.get('host') || '').split(',')[0]?.trim();
    if (!host) {
      const app = (this.config.get<string>('APP_URL') || '').replace(/\/$/, '');
      if (app.startsWith('http')) {
        return `${app}/lti/launch`;
      }
      throw new Error('Cannot determine launch URL host');
    }
    return `${proto}://${host}/lti/launch`;
  }

  private lti11RolesAllowInstructor(roles: string): boolean {
    const parts = roles
      .split(/[,;]/)
      .map((s) => s.trim())
      .filter(Boolean);
    return parts.some((r) =>
      /instructor|contentdeveloper|faculty|administrator|TeachingAssistant|teachingassistant|urn:lti:instrole:ims\/lis\/instructor|urn:lti:role:ims\/lis\/instructor|urn:lti:sysrole:ims\/lis\/teaching|urn:lti:role:ims\/lis\/TeachingAssistant/i.test(
        r
      )
    );
  }

  private async handleLti11Launch(
    req: Request,
    res: Response,
    body: Record<string, unknown>
  ): Promise<void> {
    let launchUrl: string;
    try {
      launchUrl = this.buildLaunchUrl(req);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      debugLog('launch_error', { error: msg, path: 'lti11' });
      return res.redirect('/lti/debug?error=' + encodeURIComponent(msg));
    }

    let extracted;
    try {
      extracted = this.lti11Verify.verifyAndExtract(body, launchUrl);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      debugLog('launch_error', { error: msg, path: 'lti11' });
      return res.redirect('/lti/debug?error=' + encodeURIComponent(msg));
    }

    if (!this.lti11RolesAllowInstructor(extracted.roles)) {
      return res.redirect(
        '/?error=' + encodeURIComponent('Access Denied: Only instructors can use this tool.')
      );
    }

    const sess = req.session as import('express-session').Session & {
      ltiVerified?: boolean;
      courseId?: string;
      canvasApiDomain?: string;
      ltiSub?: string;
      ltiClientId?: string;
    };
    sess.ltiVerified = true;
    sess.ltiLaunchType = '1.1';
    sess.courseId = extracted.courseId;
    sess.ltiSub = extracted.ltiSub || '';
    delete sess.ltiClientId;
    sess.canvasApiDomain = extracted.canvasApiDomain;

    debugLog('lti11_session_set', {
      ltiLaunchType: '1.1',
      courseId: extracted.courseId,
      canvasApiDomain: sess.canvasApiDomain,
      consumerKey: extracted.consumerKey,
      ltiClientId_deleted: true,
    });
    debugLog('launch_success', {
      path: 'lti11',
      courseId: extracted.courseId,
      canvasApiDomain: sess.canvasApiDomain,
      consumerKey: extracted.consumerKey,
    });

    const appBase = (this.config.get<string>('APP_URL') || '').replace(/\/$/, '') || '';
    const returnPath =
      (appBase ? `${appBase}/` : '/') +
      '?courseId=' +
      encodeURIComponent(extracted.courseId || '');

    return new Promise<void>((resolve, reject) => {
      (sess as import('express-session').Session).save((err) => {
        if (err) {
          reject(err);
          return;
        }
        res.redirect(returnPath);
        resolve();
      });
    });
  }
}
