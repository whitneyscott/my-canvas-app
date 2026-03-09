export type Cip6Option = { code: string; title: string };

const CIP4_TO_CIP6: Record<string, Cip6Option[]> = {
  '16.16': [
    { code: '16.1601', title: 'American Sign Language (ASL)/Langue des signes québécoise (LSQ)' },
    { code: '16.1602', title: 'Linguistics of ASL and Other Sign Languages' },
    { code: '16.1603', title: 'Sign Language Interpretation and Translation' },
  ],
};

function toCip4Key(s: string): string {
  const t = String(s || '').trim();
  if (!t) return '';
  if (t.includes('.')) return t;
  const m = t.match(/^(\d{2})(\d{2})$/);
  return m ? `${m[1]}.${m[2]}` : t;
}

export function getCip6Options(cip4: string): Cip6Option[] {
  const key = toCip4Key(cip4);
  return key ? (CIP4_TO_CIP6[key] ?? []) : [];
}
