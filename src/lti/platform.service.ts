import { Injectable } from '@nestjs/common';

@Injectable()
export class PlatformService {
  async getOidcAuthUrl(issuer: string): Promise<string> {
    const base = issuer.replace(/\/$/, '');
    const discoveryUrl = `${base}/.well-known/openid-configuration`;
    const res = await fetch(discoveryUrl);
    if (!res.ok) throw new Error(`OIDC discovery failed: ${res.status}`);
    const doc = (await res.json()) as { authorization_endpoint?: string };
    const authUrl = doc.authorization_endpoint;
    if (!authUrl) throw new Error('No authorization_endpoint in OIDC discovery');
    return authUrl;
  }
}
