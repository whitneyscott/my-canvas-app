import { Injectable } from '@nestjs/common';

@Injectable()
export class PlatformService {
  async getOidcAuthUrl(issuer: string): Promise<string> {
    const base = issuer.replace(/\/$/, '');
    const discoveryUrl = `${base}/.well-known/openid-configuration`;
    const res = await fetch(discoveryUrl);
    if (res.ok) {
      const doc = (await res.json()) as { authorization_endpoint?: string };
      const authUrl = doc.authorization_endpoint;
      if (authUrl) return authUrl;
    }
    if (res.status === 404) {
      return `${base}/api/lti/authorize_redirect`;
    }
    throw new Error(`OIDC discovery failed: ${res.status}`);
  }
}
