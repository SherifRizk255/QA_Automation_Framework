/**
 * Shared text-parsing helpers for account/amount strings rendered by the portal.
 *
 * Every regex the framework applies to on-screen text lives here as a named,
 * documented helper (skill 23 — no cryptic inline regex in page objects/specs).
 * All helpers are pure functions: text in, value out.
 */

/** Supported display currencies on the SAIB portal. */
export const CURRENCY_CODE_PATTERN = /\b(EGP|USD|EUR|GBP)\b/i;

/** Full (unmasked) account number: leading zero followed by 9+ digits. */
export const UNMASKED_ACCOUNT_PATTERN = /\b0\d{9,}\b/;

/**
 * Account-number pattern for Locator.filter({ hasText }): no \b anchors,
 * because hasText matches against textContent where sibling spans concatenate
 * without separators ("...INTR0220123456910500EGP..."), defeating word boundaries.
 */
export const ACCOUNT_NUMBER_FILTER_PATTERN = /0\d{9,}/;

/** Formatted money amount with 2 decimals, e.g. "1,234.56". */
const AMOUNT_PATTERN = /[\d,]+\.\d{2}/;

/** Masked account tail, e.g. "1234 ****56" / "****1234" (also x/• masking). */
const MASKED_ACCOUNT_PATTERN = /\d{4}\s*(?:\*{2,}|x{2,}|•{2,})\d{2,}/i;

/** Account identifier as pickers render it: masked (****1234 / 1234****) OR full 8+ digit number. */
export const MASKED_OR_FULL_ACCOUNT_PATTERN =
  /(?:\*{2,}|•{2,}|x{2,})\s*\d{2,}|(?:\d{2,}\s*(?:\*{2,}|•{2,}|x{2,}))|\b\d{8,}\b/i;

/** Partially masked identifier (mask characters adjacent to digits, either side). */
export const MASKED_IDENTIFIER_PATTERN =
  /(?:\*{2,}|x{2,}|•{2,})\s*\d{2,}|\d{2,}\s*(?:\*{2,}|x{2,}|•{2,})/i;

/** Account-type words the portal prints on account entries. */
export const ACCOUNT_TYPE_PATTERN =
  /\b(current|saving|savings|investment|account|overdraft|deposit|trst|adv|intr)\b/i;

/** Balance with its currency code on either side, e.g. "EGP 1,000.00" or "1,000.00 EGP". */
export const BALANCE_WITH_CURRENCY_PATTERN =
  /\b[A-Z]{3}\s*[+-]?\d{1,3}(?:,\d{3})*(?:\.\d{2})?\b|\b[+-]?\d{1,3}(?:,\d{3})*(?:\.\d{2})?\s*[A-Z]{3}\b/i;

/** Returns the first full account number (leading zero, 10+ digits) in the text, or null if none. */
export function extractAccountNumber(text: string): string | null {
  return text.match(UNMASKED_ACCOUNT_PATTERN)?.[0] ?? null;
}

/** Returns the first currency code (EGP/USD/EUR/GBP, uppercased) in the text, or null if none. */
export function extractCurrencyCode(text: string): string | null {
  return text.match(CURRENCY_CODE_PATTERN)?.[1]?.toUpperCase() ?? null;
}

/** Returns the first formatted amount (e.g. "12,345.67") in the text parsed as a number, or null if none. */
export function extractAmount(text: string): number | null {
  const match = text.match(AMOUNT_PATTERN);
  return match ? Number(match[0].replace(/,/g, '')) : null;
}

/**
 * Parses one account-picker row ("1234 ****56 Current EGP 1,000.00") into its parts.
 * `maskedAccount` falls back to the text before the currency code when no masked tail is shown.
 */
export function parseAccountOption(optionText: string): {
  rawText: string;
  maskedAccount: string;
  currency: string;
  balance: number;
} {
  const balanceText =
    optionText.match(/\b(?:EGP|USD|EUR|GBP)\s*([+-]?\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i)?.[1] ?? '0';
  return {
    rawText: optionText,
    maskedAccount:
      optionText.match(MASKED_ACCOUNT_PATTERN)?.[0] ??
      optionText.split(CURRENCY_CODE_PATTERN)[0].trim(),
    currency: extractCurrencyCode(optionText) ?? '',
    balance: Number(balanceText.replace(/,/g, '')),
  };
}

/** Builds a regex matching an EGP amount as the portal formats it, e.g. /EGP\s*1,234\.56/i. */
export function egpAmountPattern(amount: number): RegExp {
  const formatted = amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return new RegExp(`EGP\\s*${escapeRegExp(formatted)}`, 'i');
}

/** Escapes regex metacharacters so the value can be embedded in a RegExp literally. */
export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Collapses all whitespace runs to single spaces and trims. */
export function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}
