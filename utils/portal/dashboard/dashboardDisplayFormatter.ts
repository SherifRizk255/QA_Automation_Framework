import {
  parseDecimal,
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
