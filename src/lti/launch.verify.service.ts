import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jose from 'jose';
import { createPublicKey, verify } from 'crypto';

@Injectable()
export class LaunchVerifyService {
  constructor(private config: ConfigService) {}

  async verify(idToken: string): Promise<jose.JWTPayload & Record<string, unknown>> {
    const expectedClientId = this.config.get<string>('LTI_CLIENT_ID');

    const unprotected = jose.decodeProtectedHeader(idToken);
    if (!unprotected.alg || !unprotected.kid) throw new Error('Invalid JWT header');

    const payload = jose.decodeJwt(idToken) as jose.JWTPayload & Record<string, unknown>;
    const iss = payload.iss;
    if (!iss || typeof iss !== 'string') throw new Error('Missing iss');

    const jwksUrl = `${iss.replace(/\/$/, '')}/api/lti/security/jwks`;
    const jwksRes = await fetch(jwksUrl);
    if (!jwksRes.ok) throw new Error(`JWKS fetch failed: ${jwksRes.status}`);
    const jwks = (await jwksRes.json()) as jose.JSONWebKeySet;
    const jwk = jwks.keys?.find((k: { kid?: string }) => k.kid === unprotected.kid) || jwks.keys?.[0];
    if (!jwk) throw new Error('Could not resolve JWK');

    try {
      await jose.compactVerify(idToken, await jose.importJWK(jwk, unprotected.alg));
    } catch (err) {
      if (String(err).includes('2048') || String(err).includes('modulusLength')) {
        const key = createPublicKey({ key: jwk as import('crypto').JsonWebKey, format: 'jwk' });
        const [headerB64, payloadB64, sigB64] = idToken.split('.');
        const data = Buffer.from(`${headerB64}.${payloadB64}`, 'utf8');
        const sig = Buffer.from(sigB64, 'base64url');
        const ok = verify('RSA-SHA256', data, key, sig);
        if (!ok) throw new Error('Invalid signature');
      } else {
        throw err;
      }
    }

    if (expectedClientId) {
      const aud = payload.aud;
      const audienceOk = Array.isArray(aud)
        ? aud.includes(expectedClientId)
        : aud === expectedClientId;
      if (!audienceOk) throw new Error('Invalid audience');
    }

    return payload;
  }
}
