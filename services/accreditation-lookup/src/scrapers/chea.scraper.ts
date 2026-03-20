import { chromium, Browser } from 'playwright';
import { createHash } from 'crypto';

const CHEA_URL = 'https://chea.org/programmatic-accrediting-organizations';

export interface CheaAccreditor {
  name: string;
  abbreviation: string | null;
  raw_scope_text: string;
}

export interface CheaScrapeResult {
  accreditors: CheaAccreditor[];
  content_fingerprint: string;
}

function normalizeForFingerprint(accreditors: CheaAccreditor[]): string {
  return JSON.stringify(
    accreditors
      .map((a) => ({
        n: a.name.trim().toLowerCase(),
        abbr: (a.abbreviation || '').toLowerCase(),
        s: (a.raw_scope_text || '').trim().replace(/\s+/g, ' '),
      }))
      .sort((a, b) => a.n.localeCompare(b.n))
  );
}

function computeFingerprint(accreditors: CheaAccreditor[]): string {
  return createHash('sha256').update(normalizeForFingerprint(accreditors)).digest('hex');
}

export async function scrapeChea(): Promise<CheaScrapeResult> {
  let browser: Browser | undefined;
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(CHEA_URL, { waitUntil: 'networkidle', timeout: 30000 });
    const accreditors = await page.evaluate(() => {
      const items: { name: string; abbreviation: string | null; raw_scope_text: string }[] = [];
      const h3s = Array.from(document.querySelectorAll('h3'));
      const scopeRe = /CHEA-?Recognized Scope of Accreditation\s*(.+?)(?=\n|$)/is;
      for (const h3 of h3s) {
        const heading = (h3.textContent || '').trim();
        if (heading.length < 10 || heading.includes('Programmatic')) continue;
        const match = heading.match(/^(.+?)\s*\(([A-Z0-9\-]+)\)\s*$/);
        const name = match ? match[1].trim() : heading;
        const abbreviation = match ? match[2] : null;
        let raw_scope_text = '';
        let el: Element | null = h3.nextElementSibling;
        let block = '';
        while (el) {
          if (el.tagName === 'H3') break;
          block += (el.textContent || '') + '\n';
          el = el.nextElementSibling;
        }
        const scopeMatch = block.match(scopeRe);
        if (scopeMatch) raw_scope_text = scopeMatch[1].replace(/\s+/g, ' ').trim();
        items.push({ name, abbreviation, raw_scope_text });
      }
      return items;
    });
    const valid = accreditors.filter((a) => a.name.length > 10);
    const content_fingerprint = computeFingerprint(valid);
    return { accreditors: valid, content_fingerprint };
  } finally {
    await browser?.close();
  }
}
