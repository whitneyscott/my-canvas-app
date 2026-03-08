import {
  Controller,
  Get,
  Query,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { randomBytes } from 'crypto';
import { getOAuthState, setOAuthState } from './oauth-state.store';

@Controller('oauth')
export class OAuthController {
  constructor(private config: ConfigService) {}

  @Get('canvas')
  canvasAuth(@Req() req: Request, @Res() res: Response) {
    const sess = req.session as import('express-session').Session & {
      ltiVerified?: boolean;
      canvasApiDomain?: string;
    };
    if (!sess.ltiVerified || !sess.canvasApiDomain) {
      throw new UnauthorizedException(
        'Launch via LTI first'
      );
    }

    const clientId =
      this.config.get<string>('CANVAS_OAUTH_CLIENT_ID') ||
      this.config.get<string>('LTI_CLIENT_ID');
    const appUrl = this.config.get<string>('APP_URL') || 'http://localhost:3000';
    if (!clientId)
      throw new UnauthorizedException('OAuth client ID not configured');

    const state = randomBytes(16).toString('hex');
    const returnUrl = (req.query.returnUrl as string) || '/';
    setOAuthState(state, returnUrl);

    const base = String(sess.canvasApiDomain).replace(/\/$/, '').replace(/\/api\/v1\/?$/, '');
    const redirectUri = `${appUrl.replace(/\/$/, '')}/oauth/canvas/callback`;
    const authUrl =
      `${base}/login/oauth2/auth` +
      `?client_id=${encodeURIComponent(clientId)}` +
      `&response_type=code` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&state=${encodeURIComponent(state)}`;
    return res.redirect(authUrl);
  }

  @Get('canvas/callback')
  async canvasCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Req() req: Request,
    @Res() res: Response
  ) {
    if (!code || !state)
      throw new UnauthorizedException('Missing code or state');

    const returnUrl = getOAuthState(state);
    if (!returnUrl)
      throw new UnauthorizedException('Invalid or expired state');

    const sess = req.session as import('express-session').Session & {
      canvasApiDomain?: string;
      canvasToken?: string;
      canvasUrl?: string;
    };
    if (!sess.canvasApiDomain)
      throw new UnauthorizedException('Session expired');

    const clientId =
      this.config.get<string>('CANVAS_OAUTH_CLIENT_ID') ||
      this.config.get<string>('LTI_CLIENT_ID');
    const clientSecret = this.config.get<string>('CANVAS_OAUTH_CLIENT_SECRET');
    const appUrl = this.config.get<string>('APP_URL') || 'http://localhost:3000';
    if (!clientId || !clientSecret)
      throw new UnauthorizedException('OAuth not configured');

    const base = String(sess.canvasApiDomain).replace(/\/$/, '').replace(/\/api\/v1\/?$/, '');
    const redirectUri = `${appUrl.replace(/\/$/, '')}/oauth/canvas/callback`;
    const tokenUrl = `${base}/login/oauth2/token`;
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      code,
    });

    const tokenRes = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      throw new UnauthorizedException(
        `Canvas OAuth token exchange failed: ${tokenRes.status} ${errText}`
      );
    }

    const data = (await tokenRes.json()) as { access_token?: string };
    const token = data?.access_token;
    if (!token)
      throw new UnauthorizedException('No access_token in Canvas response');

    sess.canvasToken = token;
    sess.canvasUrl = `${base}/api/v1`;

    return new Promise<void>((resolve, reject) => {
      (sess as import('express-session').Session).save((err) => {
        if (err) {
          reject(err);
          return;
        }
        res.redirect(returnUrl);
        resolve();
      });
    });
  }
}
