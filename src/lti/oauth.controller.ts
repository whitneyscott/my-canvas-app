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
import { log as debugLog } from './lti.debug';

@Controller('oauth')
export class OAuthController {
  constructor(private config: ConfigService) {}

  @Get('canvas')
  canvasAuth(@Req() req: Request, @Res() res: Response) {
    const sess = req.session as import('express-session').Session & {
      ltiVerified?: boolean;
      canvasApiDomain?: string;
      ltiClientId?: string;
      ltiLaunchType?: '1.1' | '1.3';
    };
    if (!sess.ltiVerified || !sess.canvasApiDomain) {
      debugLog('oauth_error', { error: 'Launch via LTI first' });
      return res.redirect('/lti/debug?error=' + encodeURIComponent('Launch via LTI first'));
    }

    const apiKeyClientId = this.config.get<string>('CANVAS_OAUTH_CLIENT_ID');
    const apiKeyValid = apiKeyClientId && apiKeyClientId !== 'your_canvas_oauth_client_id';

    let clientId: string | null;
    if (sess.ltiLaunchType === '1.1') {
      if (!apiKeyValid) {
        debugLog('oauth_error', { error: 'LTI 1.1 requires CANVAS_OAUTH_CLIENT_ID (API key) for OAuth' });
        return res.redirect(
          '/lti/debug?error=' +
            encodeURIComponent('LTI 1.1 requires CANVAS_OAUTH_CLIENT_ID and CANVAS_OAUTH_CLIENT_SECRET on Render. Use an API Developer Key, not the LTI key.')
        );
      }
      clientId = apiKeyClientId;
    } else {
      clientId =
        (apiKeyValid ? apiKeyClientId : null) ||
        sess.ltiClientId ||
        this.config.get<string>('LTI_CLIENT_ID') ||
        null;
    }
    const appUrl = this.config.get<string>('APP_URL') || 'http://localhost:3000';
    if (!clientId) {
      debugLog('oauth_error', { error: 'OAuth client ID not configured' });
      return res.redirect('/lti/debug?error=' + encodeURIComponent('OAuth client ID not configured'));
    }

    const state = randomBytes(16).toString('hex');
    const returnUrl = (req.query.returnUrl as string) || '/';
    setOAuthState(state, returnUrl);

    const base = String(sess.canvasApiDomain).replace(/\/$/, '').replace(/\/api\/v1\/?$/, '');
    const redirectUri = `${appUrl.replace(/\/$/, '')}/oauth/canvas/callback`;
    debugLog('oauth_redirect', { clientId, ltiLaunchType: sess.ltiLaunchType, canvasBase: base, redirectUri });
    const forceConsent = req.query.retry === '1';
    const authUrl =
      `${base}/login/oauth2/auth` +
      `?client_id=${encodeURIComponent(clientId)}` +
      `&response_type=code` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&state=${encodeURIComponent(state)}` +
      (forceConsent ? '' : `&prompt=none`);
    return res.redirect(authUrl);
  }

  @Get('canvas/callback')
  async canvasCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') oauthError: string,
    @Query('error_description') oauthErrorDesc: string,
    @Req() req: Request,
    @Res() res: Response
  ) {
    debugLog('oauth_callback', { hasCode: !!code, hasState: !!state, oauthError: oauthError || null, oauthErrorDesc: oauthErrorDesc || null });
    if (oauthError) {
      const returnUrl = getOAuthState(state);
      if ((oauthError === 'interaction_required' || oauthError === 'login_required') && returnUrl) {
        return res.redirect(`/oauth/canvas?returnUrl=${encodeURIComponent(returnUrl)}&retry=1`);
      }
      return res.redirect('/lti/debug?error=' + encodeURIComponent(oauthErrorDesc || oauthError));
    }
    if (!code || !state) {
      return res.redirect('/lti/debug?error=' + encodeURIComponent('Missing code or state'));
    }

    const returnUrl = getOAuthState(state);
    if (!returnUrl) {
      debugLog('oauth_error', { error: 'Invalid or expired state' });
      return res.redirect('/lti/debug?error=' + encodeURIComponent('Invalid or expired state'));
    }

    const sess = req.session as import('express-session').Session & {
      canvasApiDomain?: string;
      canvasToken?: string;
      canvasUrl?: string;
      ltiClientId?: string;
      ltiLaunchType?: '1.1' | '1.3';
    };
    if (!sess.canvasApiDomain) {
      debugLog('oauth_error', { error: 'Session expired' });
      return res.redirect('/lti/debug?error=' + encodeURIComponent('Session expired'));
    }

    const apiKeyClientId = this.config.get<string>('CANVAS_OAUTH_CLIENT_ID');
    const apiKeyValid = apiKeyClientId && apiKeyClientId !== 'your_canvas_oauth_client_id';

    let clientId: string | null;
    if (sess.ltiLaunchType === '1.1') {
      clientId = apiKeyValid ? apiKeyClientId : null;
    } else {
      clientId =
        (apiKeyValid ? apiKeyClientId : null) ||
        sess.ltiClientId ||
        this.config.get<string>('LTI_CLIENT_ID') ||
        null;
    }
    const secretsJson = this.config.get<string>('CANVAS_OAUTH_CLIENT_SECRETS');
    const secretsMap = secretsJson ? (() => { try { return JSON.parse(secretsJson) as Record<string, string>; } catch { return null; } })() : null;
    const clientSecret = (secretsMap && clientId && secretsMap[clientId]) || this.config.get<string>('CANVAS_OAUTH_CLIENT_SECRET');
    const appUrl = this.config.get<string>('APP_URL') || 'http://localhost:3000';
    if (!clientId || !clientSecret) {
      debugLog('oauth_error', { error: 'OAuth not configured', hasClientId: !!clientId, hasClientSecret: !!clientSecret });
      return res.redirect('/lti/debug?error=' + encodeURIComponent('OAuth not configured'));
    }

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
      debugLog('oauth_error', { error: 'Token exchange failed', status: tokenRes.status, body: errText });
      return res.redirect('/lti/debug?error=' + encodeURIComponent(`Canvas OAuth token exchange failed: ${tokenRes.status} - ${errText}`));
    }

    const data = (await tokenRes.json()) as { access_token?: string };
    const token = data?.access_token;
    if (!token) {
      debugLog('oauth_error', { error: 'No access_token in Canvas response' });
      return res.redirect('/lti/debug?error=' + encodeURIComponent('No access_token in Canvas response'));
    }

    debugLog('oauth_success', { canvasUrl: `${base}/api/v1` });
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
