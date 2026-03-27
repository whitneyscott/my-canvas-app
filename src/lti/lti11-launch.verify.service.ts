/* eslint-disable @typescript-eslint/no-require-imports */
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'crypto';

type OauthGenerateFn = (
  httpMethod: string,
  url: string,
  parameters: Record<string, string>,
  consumerSecret: string,
  tokenSecret: string,
  options?: { encodeSignature?: boolean },
) => string;

const oauthGenerate = (
  require('oauth-signature') as { generate: OauthGenerateFn }
).generate;

export type Lti11LaunchResult = {
  courseId: string;
  canvasApiDomain: string;
  roles: string;
  ltiSub: string;
  consumerKey: string;
};

@Injectable()
export class Lti11LaunchVerifyService {
  constructor(private config: ConfigService) {}

  verifyAndExtract(
    body: Record<string, unknown>,
    launchUrl: string,
  ): Lti11LaunchResult {
    const params = this.flattenBody(body);
    const receivedSig = params.oauth_signature;
    if (!receivedSig) {
      throw new Error('Missing oauth_signature');
    }
    const { oauth_signature, ...signParams } = params;
    void oauth_signature;

    const method = (
      signParams.oauth_signature_method || 'HMAC-SHA1'
    ).toUpperCase();
    if (method !== 'HMAC-SHA1') {
      throw new Error(`Unsupported oauth_signature_method: ${method}`);
    }

    const ts = parseInt(signParams.oauth_timestamp || '0', 10);
    if (!ts || Number.isNaN(ts)) {
      throw new Error('Invalid oauth_timestamp');
    }
    const skewSec = 600;
    if (Math.abs(Math.floor(Date.now() / 1000) - ts) > skewSec) {
      throw new Error('oauth_timestamp out of range');
    }

    const consumerKey = signParams.oauth_consumer_key;
    if (!consumerKey) {
      throw new Error('Missing oauth_consumer_key');
    }

    const secret = this.resolveSecret(consumerKey);
    const expectedRaw = oauthGenerate(
      'POST',
      launchUrl,
      signParams,
      secret,
      '',
      {
        encodeSignature: false,
      },
    );

    const a = Buffer.from(expectedRaw, 'utf8');
    const b = Buffer.from(receivedSig, 'utf8');
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new Error('Invalid OAuth 1.0a signature');
    }

    const courseId = String(
      signParams.custom_canvas_course_id ||
        signParams.canvas_course_id ||
        signParams.context_id ||
        '',
    ).trim();

    const rawDomain =
      signParams.custom_canvas_api_base_url?.trim() ||
      signParams.custom_canvas_domain?.trim() ||
      signParams.tool_consumer_instance_url?.trim() ||
      '';
    if (!rawDomain) {
      throw new Error(
        'Missing Canvas host (add custom_canvas_api_base_url / custom_canvas_domain to the tool XML, or rely on tool_consumer_instance_url)',
      );
    }

    const canvasApiDomain = rawDomain.startsWith('http')
      ? rawDomain.replace(/\/+$/, '')
      : `https://${rawDomain.replace(/^\/+|\/+$/g, '')}`;

    const roles = signParams.roles || '';
    const ltiSub = String(
      signParams.user_id || signParams.lis_person_sourcedid || '',
    ).trim();

    return {
      courseId,
      canvasApiDomain,
      roles,
      ltiSub,
      consumerKey,
    };
  }

  private flattenBody(body: Record<string, unknown>): Record<string, string> {
    const out: Record<string, string> = {};
    for (const [key, value] of Object.entries(body)) {
      if (value === undefined || value === null) continue;
      const s = Array.isArray(value)
        ? String(value[0] as string | number | boolean)
        : String(value as string | number | boolean);
      out[key] = s;
    }
    return out;
  }

  private envTrim(key: string): string | undefined {
    const v = this.config.get<string>(key) ?? process.env[key];
    if (v == null) return undefined;
    const t = String(v)
      .trim()
      .replace(/^\uFEFF/, '');
    return t === '' ? undefined : t;
  }

  private resolveSecret(consumerKey: string): string {
    const mapJsonRaw =
      this.config.get<string>('LTI11_SECRETS_JSON') ??
      process.env['LTI11_SECRETS_JSON'];
    const mapJson = mapJsonRaw?.trim();
    if (mapJson) {
      let map: Record<string, string>;
      try {
        map = JSON.parse(mapJson) as Record<string, string>;
      } catch {
        throw new Error('LTI11_SECRETS_JSON is not valid JSON');
      }
      const s = map[consumerKey];
      if (s != null && String(s).trim() !== '') {
        return String(s)
          .trim()
          .replace(/^\uFEFF/, '');
      }
      throw new Error(
        `LTI11_SECRETS_JSON has no entry for oauth_consumer_key "${consumerKey}". ` +
          `Add {"${consumerKey}":"<shared-secret>"} or remove LTI11_SECRETS_JSON and set LTI11_SHARED_SECRET instead.`,
      );
    }

    const single =
      this.envTrim('LTI11_SHARED_SECRET') ??
      this.envTrim('LTI_1_1_SHARED_SECRET') ??
      this.envTrim('LTI1_SHARED_SECRET') ??
      this.envTrim('LTI_SHARED_SECRET');
    if (!single) {
      throw new Error(
        'No LTI 1.1 shared secret found. Set LTI11_SHARED_SECRET (preferred), LTI_1_1_SHARED_SECRET, LTI1_SHARED_SECRET, or LTI_SHARED_SECRET ' +
          'to the Canvas tool Shared Secret. If you use LTI11_SECRETS_JSON it must include this consumer key. ' +
          `Canvas sent oauth_consumer_key="${consumerKey}".`,
      );
    }

    const expectedKey =
      this.envTrim('LTI11_CONSUMER_KEY') ??
      this.envTrim('LTI_1_1_CONSUMER_KEY') ??
      this.envTrim('LTI1_CONSUMER_KEY') ??
      this.envTrim('LTI_CONSUMER_KEY');
    if (expectedKey && expectedKey !== consumerKey) {
      throw new Error('oauth_consumer_key does not match LTI11_CONSUMER_KEY');
    }

    return single;
  }
}
