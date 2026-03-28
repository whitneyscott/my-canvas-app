export function franc(text?: string): string {
  const s = String(text || '').toLowerCase();
  if (s.length < 20) return 'und';
  if (
    /\breconocimiento\b/.test(s) ||
    /\bnovelas\b/.test(s) ||
    /\btraduccion\b/.test(s) ||
    /\bcontemporaneos\b/.test(s)
  ) {
    return 'spa';
  }
  return 'und';
}
