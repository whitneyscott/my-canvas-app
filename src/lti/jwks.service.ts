import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jose from 'jose';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

@Injectable()
export class JwksService {
  private jwkPromise: Promise<jose.JWK | null> | null = null;

  constructor(private config: ConfigService) {}

  private async loadJwk(): Promise<jose.JWK | null> {
    if (this.jwkPromise) return this.jwkPromise;
    this.jwkPromise = (async () => {
      const pemPath = this.config.get<string>('LTI_PRIVATE_KEY_PATH') ||
        join(process.cwd(), 'private-key.pem');
      if (!existsSync(pemPath)) return null;
      const pem = readFileSync(pemPath, 'utf8');
      const key = await jose.importPKCS8(pem, 'RS256');
      return jose.exportJWK(key);
    })();
    return this.jwkPromise;
  }

  async getJwksJson(): Promise<{ keys: jose.JWK[] }> {
    const jwk = await this.loadJwk();
    if (!jwk) return { keys: [] };
    const kid = this.config.get<string>('LTI_KEY_ID') || 'default';
    return { keys: [{ ...jwk, kid, alg: 'RS256', use: 'sig' }] };
  }
}
