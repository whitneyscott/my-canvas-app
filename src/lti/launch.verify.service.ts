import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jose from 'jose';

@Injectable()
export class LaunchVerifyService {
  constructor(private config: ConfigService) {}

  async verify(idToken: string): Promise<jose.JWTPayload & Record<string, unknown>> {
    const clientId = this.config.get<string>('LTI_CLIENT_ID');
    if (!clientId) throw new Error('LTI_CLIENT_ID not configured');

    const unprotected = jose.decodeProtectedHeader(idToken);
    if (!unprotected.alg || !unprotected.kid) throw new Error('Invalid JWT header');

    const payload = jose.decodeJwt(idToken) as jose.JWTPayload & Record<string, unknown>;
    const iss = payload.iss;
    if (!iss || typeof iss !== 'string') throw new Error('Missing iss');

    const jwksUrl = `${iss.replace(/\/$/, '')}/api/lti/security/jwks`;
    const jwksRes = await fetch(jwksUrl);
    if (!jwksRes.ok) throw new Error(`JWKS fetch failed: ${jwksRes.status}`);
    const jwks = (await jwksRes.json()) as jose.JSONWebKeySet;
    const key = await jose.importJWK(
      jwks.keys.find((k) => k.kid === unprotected.kid) || jwks.keys[0],
      unprotected.alg
    );
    if (!key) throw new Error('Could not resolve JWK');

    await jose.compactVerify(idToken, key);

    const aud = payload.aud;
    const audienceOk = Array.isArray(aud)
      ? aud.includes(clientId)
      : aud === clientId;
    if (!audienceOk) throw new Error('Invalid audience');

    return payload;
  }
}
