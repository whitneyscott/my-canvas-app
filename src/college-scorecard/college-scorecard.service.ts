import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getCip6Options } from './cip2020';

const BASE = 'https://api.data.gov/ed/collegescorecard/v1/schools';

@Injectable()
export class CollegeScorecardService {
  constructor(private config: ConfigService) {}

  private getApiKey(): string | null {
    return this.config.get<string>('COLLEGE_SCORECARD_API_KEY') || null;
  }

  private async fetchApi(
    params: Record<string, string>,
    retries = 2,
  ): Promise<{ results?: unknown[]; error?: string }> {
    const key = this.getApiKey();
    if (!key) {
      console.log('[CollegeScorecard] fetchApi: no API key');
      return {
        results: [],
        error: 'College Scorecard API key is not configured.',
      };
    }
    const q = new URLSearchParams({ api_key: key, per_page: '100', ...params });
    const url = `${BASE}?${q.toString().replace(/api_key=[^&]+/, 'api_key=***')}`;
    console.log('[CollegeScorecard] fetchApi URL:', url);
    const fullUrl = `${BASE}?${q}`;
    let lastText = '';
    for (let attempt = 0; attempt <= retries; attempt++) {
      if (attempt > 0) {
        const delay = attempt * 800;
        console.log('[CollegeScorecard] retry in', delay, 'ms');
        await new Promise((r) => setTimeout(r, delay));
      }
      const res = await fetch(fullUrl);
      lastText = await res.text();
      if (res.ok) {
        try {
          const parsed: unknown = JSON.parse(lastText);
          const data =
            parsed &&
            typeof parsed === 'object' &&
            !Array.isArray(parsed) &&
            parsed
              ? (parsed as Record<string, unknown>)
              : null;
          const rawResults = data?.results;
          const results = Array.isArray(rawResults) ? rawResults : [];
          const errField = data?.error;
          console.log(
            '[CollegeScorecard] fetchApi response: results count=',
            results.length,
          );
          return {
            results,
            ...(typeof errField === 'string' ? { error: errField } : {}),
          };
        } catch {
          return {
            results: [],
            error: 'Invalid response from College Scorecard.',
          };
        }
      }
      console.log(
        '[CollegeScorecard] fetchApi error:',
        res.status,
        lastText.slice(0, 300),
      );
      const isRetryable =
        [500, 502, 503].includes(res.status) && attempt < retries;
      if (!isRetryable) {
        const msg =
          res.status === 429
            ? 'Too many requests. Try again in a moment.'
            : res.status >= 500
              ? 'College Scorecard service is temporarily unavailable. Try again shortly.'
              : lastText.toLowerCase().includes('api key') ||
                  lastText.toLowerCase().includes('apikey')
                ? 'API key problem. Check COLLEGE_SCORECARD_API_KEY in .env.'
                : `Request failed (${res.status}).`;
        return { results: [], error: msg };
      }
    }
    return {
      results: [],
      error:
        'College Scorecard service is temporarily unavailable. Try again shortly.',
    };
  }

  async getCitiesByState(state: string): Promise<string[] | { error: string }> {
    const stateTrim = (state || '').trim().toUpperCase().slice(0, 2);
    if (!stateTrim) return [];
    const cities = new Set<string>();
    let page = 0;
    const perPage = 100;
    let hasMore = true;
    while (hasMore) {
      if (page > 0) await new Promise((r) => setTimeout(r, 150));
      const data = await this.fetchApi({
        'school.state': stateTrim,
        fields: 'id,school.city',
        page: String(page),
        per_page: String(perPage),
      });
      if (data.error) return { error: data.error };
      const results = data.results || [];
      results.forEach((r: unknown) => {
        if (!r || typeof r !== 'object') return;
        const rec = r as Record<string, unknown>;
        const school = rec.school;
        const nestedCity =
          school && typeof school === 'object' && !Array.isArray(school)
            ? (school as Record<string, unknown>).city
            : undefined;
        const c = rec['school.city'] ?? nestedCity;
        if (c && typeof c === 'string') cities.add(c.trim());
      });
      hasMore = results.length >= perPage;
      page++;
    }
    return Array.from(cities).sort();
  }

  async getInstitutionsByStateCity(
    state: string,
    city: string,
  ): Promise<Array<{ id: number; name: string }> | { error: string }> {
    const stateTrim = (state || '').trim().toUpperCase().slice(0, 2);
    const cityTrim = (city || '').trim();
    if (!stateTrim || !cityTrim) return [];
    const data = await this.fetchApi({
      'school.state': stateTrim,
      'school.city': cityTrim,
      fields: 'id,school.name',
    });
    if (data.error) return { error: data.error };
    return (data.results || [])
      .filter((r: unknown) => {
        if (!r || typeof r !== 'object') return false;
        const rec = r as Record<string, unknown>;
        const school = rec.school;
        const nestedName =
          school && typeof school === 'object' && !Array.isArray(school)
            ? (school as Record<string, unknown>).name
            : undefined;
        const name = rec['school.name'] ?? nestedName;
        return rec.id != null && name;
      })
      .map((r: unknown) => {
        const rec = r as Record<string, unknown>;
        const school = rec.school;
        const nestedName =
          school && typeof school === 'object' && !Array.isArray(school)
            ? (school as Record<string, unknown>).name
            : undefined;
        const rawName = rec['school.name'] ?? nestedName;
        const nameStr =
          typeof rawName === 'string'
            ? rawName
            : rawName != null &&
                (typeof rawName === 'number' || typeof rawName === 'boolean')
              ? String(rawName)
              : '';
        return {
          id: Number(rec.id),
          name: nameStr.trim(),
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async getProgramsBySchoolId(
    schoolId: number,
  ): Promise<string[] | { error: string }> {
    if (!schoolId) return [];
    const titles = new Set<string>();
    let page = 0;
    const perPage = 100;
    let hasMore = true;
    while (hasMore) {
      if (page > 0) await new Promise((r) => setTimeout(r, 150));
      const data = await this.fetchApi({
        id: String(schoolId),
        fields: 'latest.programs.cip_4_digit,latest.programs.cip_6_digit',
        page: String(page),
        per_page: String(perPage),
      });
      if (data.error) return { error: data.error };
      const results = data.results || [];
      const extract = (raw: unknown) => {
        if (Array.isArray(raw)) {
          raw.forEach((p: unknown) => {
            if (!p || typeof p !== 'object') return;
            const pr = p as Record<string, unknown>;
            const t = pr.title ?? pr['title'];
            if (t && typeof t === 'string') titles.add(String(t).trim());
          });
        } else if (raw && typeof raw === 'object') {
          const ro = raw as Record<string, unknown>;
          const t = ro.title ?? ro['title'];
          if (t && typeof t === 'string') titles.add(String(t).trim());
        }
      };
      results.forEach((r: unknown) => {
        if (r && typeof r === 'object') {
          const rec = r as Record<string, unknown>;
          const latest = rec.latest;
          const lat =
            latest && typeof latest === 'object' && !Array.isArray(latest)
              ? (latest as Record<string, unknown>)
              : undefined;
          const programs = lat?.programs as Record<string, unknown> | undefined;
          extract(rec['latest.programs.cip_4_digit'] ?? programs?.cip_4_digit);
          extract(rec['latest.programs.cip_6_digit'] ?? programs?.cip_6_digit);
        }
      });
      hasMore = results.length >= perPage;
      page++;
    }
    return Array.from(titles).sort();
  }

  async getProgramsCip4BySchoolId(
    schoolId: number,
  ): Promise<Array<{ cip4: string; title: string }> | { error: string }> {
    if (!schoolId) return [];
    const seen = new Map<string, string>();
    let page = 0;
    const perPage = 100;
    let hasMore = true;
    while (hasMore) {
      if (page > 0) await new Promise((r) => setTimeout(r, 150));
      const data = await this.fetchApi({
        id: String(schoolId),
        fields: 'latest.programs.cip_4_digit',
        page: String(page),
        per_page: String(perPage),
      });
      if (data.error) return { error: data.error };
      const results = data.results || [];
      results.forEach((r: unknown) => {
        if (!r || typeof r !== 'object') return;
        const rec = r as Record<string, unknown>;
        const latest = rec.latest;
        const lat =
          latest && typeof latest === 'object' && !Array.isArray(latest)
            ? (latest as Record<string, unknown>)
            : undefined;
        const programs = lat?.programs as Record<string, unknown> | undefined;
        const raw = rec['latest.programs.cip_4_digit'] ?? programs?.cip_4_digit;
        const arr = Array.isArray(raw)
          ? raw
          : raw && typeof raw === 'object'
            ? [raw]
            : [];
        arr.forEach((p: unknown) => {
          if (!p || typeof p !== 'object') return;
          const pr = p as Record<string, unknown>;
          const code = pr.code ?? pr.cip4 ?? pr['cip4'];
          const title = pr.title ?? pr['title'];
          if (code != null && title && typeof title === 'string') {
            const cip4 =
              typeof code === 'string'
                ? code.trim()
                : typeof code === 'number' || typeof code === 'boolean'
                  ? String(code).trim()
                  : '';
            if (cip4 && !seen.has(cip4)) seen.set(cip4, String(title).trim());
          }
        });
      });
      hasMore = results.length >= perPage;
      page++;
    }
    return Array.from(seen.entries())
      .map(([cip4, title]) => ({ cip4, title }))
      .sort((a, b) => a.title.localeCompare(b.title));
  }

  getCip6OptionsForCip4(cip4: string): {
    options: Array<{ code: string; title: string }>;
  } {
    return { options: getCip6Options(cip4) };
  }
}
