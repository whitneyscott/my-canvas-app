import {
  Controller,
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

  @Get('login')
  async login(
    @Query('iss') iss: string,
    @Query('login_hint') loginHint: string,
    @Query('target_link_uri') targetLinkUri: string,
    @Query('client_id') clientId: string,
    @Res() res: Response
  ) {
    if (!iss || !loginHint || !clientId)
      throw new UnauthorizedException('Missing OIDC params');
    const expectedClientId = this.config.get<string>('LTI_CLIENT_ID');
    if (clientId !== expectedClientId)
      throw new UnauthorizedException('Invalid client_id');

    const state = randomBytes(16).toString('hex');
    const nonce = randomBytes(16).toString('hex');
    const target = targetLinkUri || this.config.get<string>('APP_URL') || '/';
    setState(state, target, nonce);

    const authUrl = await this.platform.getOidcAuthUrl(iss);
    const redirectUri =
      (this.config.get<string>('APP_URL') || 'http://localhost:3000').replace(/\/$/, '') + '/lti/launch';
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
    if (!idToken || !state)
      throw new UnauthorizedException('Missing id_token or state');

    const stored = getState(state);
    if (!stored)
      throw new UnauthorizedException('Invalid or expired state');

    const claims = await this.launchVerify.verify(idToken);
    if (claims.nonce && claims.nonce !== stored.nonce)
      throw new UnauthorizedException('Nonce mismatch');

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
    const rawDomain =
      custom.custom_canvas_api_domain ||
      custom.canvas_api_domain ||
      this.issToApiDomain(String(claims.iss || ''));
    sess.canvasApiDomain = rawDomain.startsWith('http')
      ? rawDomain
      : 'https://' + rawDomain.replace(/^\/+|\/+$/g, '');

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
