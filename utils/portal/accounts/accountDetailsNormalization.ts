export function normalizeAccountText(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

export function normalizeAccountName(value: string): string {
  return normalizeAccountText(value).toLocaleLowerCase('en-US');
}

export function normalizeIban(value: string): string {
  return value.replace(/\s+/g, '').toUpperCase();
}

export function normalizeBranchName(value: string): string {
  return normalizeAccountName(value)
    .replace(/\bbranch\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function formatOpeningDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error('OpeningDate must be a valid date.');
  }
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}
