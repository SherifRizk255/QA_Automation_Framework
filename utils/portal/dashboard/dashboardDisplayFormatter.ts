import {
  parseDecimal,
  roundDecimal,
  type DecimalValue,
} from '../../financial/decimal.js';

export function normalizeText(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

export function formatApiDate(value: string): string {
  const [year, month, day] = value.split('-');
  const monthIndex = Number(month) - 1;
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  const monthName = months[monthIndex];

  if (!year || !day || !monthName) {
    throw new Error(`Unsupported API date format: ${value}`);
  }

  return `${Number(day)} ${monthName} ${year}`;
}

export function extractPercentage(
  text: string,
  description: string
): DecimalValue {
  const percentage = text.match(/-?\d+(?:\.\d+)?\s*%/)?.[0];

  if (!percentage) {
    throw new Error(`${description} was not found.`);
  }

  return parseDecimal(percentage, description);
}

export function formatDashboardMoney(value: DecimalValue): string {
  const rounded = roundDecimal(value, 2);
  const negative = rounded.units < 0n;
  const magnitude = (negative ? -rounded.units : rounded.units)
    .toString()
    .padStart(3, '0');
  const integerPart = magnitude.slice(0, -2);
  const fractionalPart = magnitude.slice(-2);
  const groupedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  return `${negative ? '-' : ''}${groupedInteger}.${fractionalPart}`;
}

export function isDashboardMoneyDisplay(value: string): boolean {
  return /^-?(?:0|[1-9]\d{0,2}(?:,\d{3})*)\.\d{2}$/.test(value);
}
