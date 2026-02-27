export function normalizeText(s: string | undefined): string {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
}

export function stockStatusClass(status: string | undefined): string {
  if (!status) return 'stock-status--other';
  const s = status.toLowerCase();
  if (s.includes('limitato') || s.includes('tagli')) return 'stock-status--limited';
  if (s.includes('terminato') || s.includes('uscirà')) return 'stock-status--finished';
  return 'stock-status--other';
}
