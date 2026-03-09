import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const BASE = 'https://api.data.gov/ed/collegescorecard/v1/schools';

@Injectable()
export class CollegeScorecardService {
  constructor(private config: ConfigService) {}

  private getApiKey(): string | null {
    return this.config.get<string>('COLLEGE_SCORECARD_API_KEY') || null;
  }

  private async fetchApi(params: Record<string, string>, retries = 2): Promise<{ results?: any[]; error?: string }> {
    const key = this.getApiKey();
    if (!key) {
      console.log('[CollegeScorecard] fetchApi: no API key');
      return { results: [], error: 'College Scorecard API key is not configured.' };
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
        await new Promise(r => setTimeout(r, delay));
      }
      const res = await fetch(fullUrl);
      lastText = await res.text();
      if (res.ok) {
        try {
          const data = JSON.parse(lastText);
          console.log('[CollegeScorecard] fetchApi response: results count=', data?.results?.length ?? 0);
          return data;
        } catch {
          return { results: [], error: 'Invalid response from College Scorecard.' };
        }
      }
      console.log('[CollegeScorecard] fetchApi error:', res.status, lastText.slice(0, 300));
      const isRetryable = [500, 502, 503].includes(res.status) && attempt < retries;
      if (!isRetryable) {
        const msg = res.status === 429 ? 'Too many requests. Try again in a moment.'
          : res.status >= 500 ? 'College Scorecard service is temporarily unavailable. Try again shortly.'
          : lastText.toLowerCase().includes('api key') || lastText.toLowerCase().includes('apikey')
            ? 'API key problem. Check COLLEGE_SCORECARD_API_KEY in .env.'
            : `Request failed (${res.status}).`;
        return { results: [], error: msg };
      }
    }
    return { results: [], error: 'College Scorecard service is temporarily unavailable. Try again shortly.' };
  }

  async getCitiesByState(state: string): Promise<string[] | { error: string }> {
    const stateTrim = (state || '').trim().toUpperCase().slice(0, 2);
    if (!stateTrim) return [];
    const cities = new Set<string>();
    let page = 0;
    const perPage = 100;
    let hasMore = true;
    while (hasMore) {
      if (page > 0) await new Promise(r => setTimeout(r, 150));
      const data = await this.fetchApi({
        'school.state': stateTrim,
        fields: 'id,school.city',
        page: String(page),
        per_page: String(perPage),
      });
      if (data.error) return { error: data.error };
      const results = data.results || [];
      results.forEach((r: any) => {
        const c = r?.['school.city'] ?? r?.school?.city;
        if (c && typeof c === 'string') cities.add(c.trim());
      });
      hasMore = results.length >= perPage;
      page++;
    }
    return Array.from(cities).sort();
  }

  async getInstitutionsByStateCity(state: string, city: string): Promise<Array<{ id: number; name: string }> | { error: string }> {
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
      .filter((r: any) => r?.id && (r?.['school.name'] ?? r?.school?.name))
      .map((r: any) => ({ id: r.id, name: String(r?.['school.name'] ?? r?.school?.name ?? '').trim() }))
      .sort((a: any, b: any) => a.name.localeCompare(b.name));
  }

  async getProgramsBySchoolId(schoolId: number): Promise<string[] | { error: string }> {
    if (!schoolId) return [];
    const titles = new Set<string>();
    let page = 0;
    const perPage = 100;
    let hasMore = true;
    while (hasMore) {
      if (page > 0) await new Promise(r => setTimeout(r, 150));
      const data = await this.fetchApi({
        id: String(schoolId),
        fields: 'latest.programs.cip_4_digit,latest.programs.cip_6_digit',
        page: String(page),
        per_page: String(perPage),
      });
      if (data.error) return { error: data.error };
      const results = data.results || [];
      const extract = (raw: any) => {
        if (Array.isArray(raw)) {
          raw.forEach((p: any) => {
            const t = p?.title ?? p?.['title'];
            if (t && typeof t === 'string') titles.add(String(t).trim());
          });
        } else if (raw && typeof raw === 'object') {
          const t = raw?.title ?? raw?.['title'];
          if (t && typeof t === 'string') titles.add(String(t).trim());
        }
      };
      results.forEach((r: any) => {
        extract(r?.['latest.programs.cip_4_digit'] ?? r?.latest?.programs?.cip_4_digit);
        extract(r?.['latest.programs.cip_6_digit'] ?? r?.latest?.programs?.cip_6_digit);
      });
      hasMore = results.length >= perPage;
      page++;
    }
    return Array.from(titles).sort();
  }
}
