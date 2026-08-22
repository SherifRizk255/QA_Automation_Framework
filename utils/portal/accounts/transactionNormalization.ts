import type { AccountStatementTransaction } from './accountManagementModels.js';

export type NormalizedMoney = {
  readonly amount: number;
  readonly currency: string;
  readonly direction: 'credit' | 'debit';
};

export function normalizeText(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

export function normalizeIdentity(value: string): string {
  return value.replace(/\s+/g, '');
}

export function normalizeDate(value: string, context: string): string {
  const normalized = normalizeText(value);
  const isoDate = normalized.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoDate) return `${isoDate[1]}-${isoDate[2]}-${isoDate[3]}`;

  const displayDate = normalized.match(/^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})$/);
  if (displayDate) {
    const month = [
      'jan', 'feb', 'mar', 'apr', 'may', 'jun',
      'jul', 'aug', 'sep', 'oct', 'nov', 'dec',
    ].indexOf(displayDate[2].toLowerCase()) + 1;
    if (month === 0) throw new Error(`${context} has an unsupported month.`);
    return `${displayDate[3]}-${String(month).padStart(2, '0')}-${displayDate[1].padStart(2, '0')}`;
  }

  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) throw new Error(`${context} is not a valid date.`);
  return [
    parsed.getFullYear(),
    String(parsed.getMonth() + 1).padStart(2, '0'),
    String(parsed.getDate()).padStart(2, '0'),
  ].join('-');
}

export function parseNumber(value: string, context: string): number {
  const match = normalizeText(value).match(/[+-]?\s*([\d,]+(?:\.\d+)?)/);
  if (!match) throw new Error(`${context} must contain a number.`);
  const number = Number(match[1].replaceAll(',', ''));
  if (!Number.isFinite(number)) throw new Error(`${context} is invalid.`);
  return number;
}

export function displayedMoney(value: string): NormalizedMoney {
  const text = normalizeText(value);
  const currency = text.match(/\b([A-Z]{3})\b/)?.[1];
  if (!currency) throw new Error('Displayed amount must include an ISO currency.');
  return {
    amount: parseNumber(text, 'Displayed amount'),
    currency,
    direction: text.startsWith('+') ? 'credit' : 'debit',
  };
}

export function apiMoney(transaction: AccountStatementTransaction): NormalizedMoney {
  return {
    amount: Math.abs(parseNumber(transaction.amount, 'Transaction amount')),
    currency: transaction.currency,
    direction: transaction.nature.toUpperCase().startsWith('C') ? 'credit' : 'debit',
  };
}

export function expectedDisplayedAmount(transaction: AccountStatementTransaction): string {
  const money = apiMoney(transaction);
  const sign = money.direction === 'credit' ? '+' : '-';
  return `${sign}${money.amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${money.currency}`;
}
