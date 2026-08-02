import {
  expect,
  test,
} from '@playwright/test';
import {
  absoluteDecimal,
  addDecimals,
  decimalsEqual,
  decimalToNumber,
  decimalToString,
  multiplyDecimals,
  parseDecimal,
  roundDecimal,
  subtractDecimals,
} from '../../../utils/financial/decimal.js';
import {
  extractPercentage,
  formatDashboardMoney,
  formatApiDate,
  formatLastLoginForCairo,
  isDashboardMoneyDisplay,
  normalizeDashboardAccountNumber,
  normalizeText,
} from '../../../utils/portal/dashboard/dashboardDisplayFormatter.js';

test.describe('Dashboard pure decimal logic', () => {
  test('UT-DASHBOARD-DECIMAL-001 | parses the existing decimal token formats', () => {
    expect(parseDecimal('225,500.00', 'amount')).toEqual({
      units: 22_550_000n,
      scale: 2,
    });
    expect(parseDecimal('-45,000.00', 'amount')).toEqual({
      units: -4_500_000n,
      scale: 2,
    });
    expect(parseDecimal('0', 'amount')).toEqual({ units: 0n, scale: 0 });
    expect(parseDecimal('0.00', 'amount')).toEqual({ units: 0n, scale: 2 });
    expect(parseDecimal('1.2300', 'amount')).toEqual({
      units: 12_300n,
      scale: 4,
    });
    expect(parseDecimal('Available balance: EGP 225,500.00 today', 'amount')).toEqual({
      units: 22_550_000n,
      scale: 2,
    });
    expect(() => parseDecimal('not available', 'account balance')).toThrow(
      'account balance does not contain a valid decimal value.'
    );
  });

  test('UT-DASHBOARD-DECIMAL-002 | compares decimals independently of scale', () => {
    expect(decimalsEqual(
      parseDecimal('1', 'left'),
      parseDecimal('1.0', 'right')
    )).toBe(true);
    expect(decimalsEqual(
      parseDecimal('1.0', 'left'),
      parseDecimal('1.00', 'right')
    )).toBe(true);
    expect(decimalsEqual(
      parseDecimal('1.01', 'left'),
      parseDecimal('1.02', 'right')
    )).toBe(false);
    expect(decimalsEqual(
      parseDecimal('-1', 'left'),
      parseDecimal('-1.01', 'right')
    )).toBe(false);
  });

  test('UT-DASHBOARD-DECIMAL-003 | adds equal and different decimal scales', () => {
    expect(addDecimals(
      parseDecimal('1.25', 'left'),
      parseDecimal('2.75', 'right')
    )).toEqual({ units: 400n, scale: 2 });
    expect(addDecimals(
      parseDecimal('1.2', 'left'),
      parseDecimal('0.03', 'right')
    )).toEqual({ units: 123n, scale: 2 });
    expect(addDecimals(
      parseDecimal('5', 'left'),
      parseDecimal('-2', 'right')
    )).toEqual({ units: 3n, scale: 0 });
    expect(addDecimals(
      parseDecimal('0', 'left'),
      parseDecimal('1.2300', 'right')
    )).toEqual({ units: 12_300n, scale: 4 });
  });

  test('UT-DASHBOARD-DECIMAL-004 | multiplies decimal values without floating-point arithmetic', () => {
    expect(multiplyDecimals(
      parseDecimal('2', 'left'),
      parseDecimal('1.5', 'right')
    )).toEqual({ units: 30n, scale: 1 });
    expect(multiplyDecimals(
      parseDecimal('1.2', 'left'),
      parseDecimal('2.50', 'right')
    )).toEqual({ units: 3_000n, scale: 3 });
    expect(multiplyDecimals(
      parseDecimal('-2', 'left'),
      parseDecimal('1.5', 'right')
    )).toEqual({ units: -30n, scale: 1 });
    expect(multiplyDecimals(
      parseDecimal('0', 'left'),
      parseDecimal('9.99', 'right')
    )).toEqual({ units: 0n, scale: 2 });
  });

  test('UT-DASHBOARD-DECIMAL-005 | returns absolute positive, negative, and zero values', () => {
    expect(absoluteDecimal(parseDecimal('12.30', 'value'))).toEqual({
      units: 1_230n,
      scale: 2,
    });
    expect(absoluteDecimal(parseDecimal('-12.30', 'value'))).toEqual({
      units: 1_230n,
      scale: 2,
    });
    expect(absoluteDecimal(parseDecimal('0.00', 'value'))).toEqual({
      units: 0n,
      scale: 2,
    });
  });

  test('UT-DASHBOARD-DECIMAL-006 | rounds halves away from zero and preserves target scale', () => {
    expect(roundDecimal(parseDecimal('1.49', 'value'), 0)).toEqual({
      units: 1n,
      scale: 0,
    });
    expect(roundDecimal(parseDecimal('1.50', 'value'), 0)).toEqual({
      units: 2n,
      scale: 0,
    });
    expect(roundDecimal(parseDecimal('1.51', 'value'), 0)).toEqual({
      units: 2n,
      scale: 0,
    });
    expect(roundDecimal(parseDecimal('-1.49', 'value'), 0)).toEqual({
      units: -1n,
      scale: 0,
    });
    expect(roundDecimal(parseDecimal('-1.50', 'value'), 0)).toEqual({
      units: -2n,
      scale: 0,
    });
    expect(roundDecimal(parseDecimal('-1.51', 'value'), 0)).toEqual({
      units: -2n,
      scale: 0,
    });
    expect(roundDecimal(parseDecimal('1.2', 'value'), 3)).toEqual({
      units: 1_200n,
      scale: 3,
    });
    expect(roundDecimal(parseDecimal('1.20', 'value'), 2)).toEqual({
      units: 120n,
      scale: 2,
    });
  });

  test('UT-DASHBOARD-DECIMAL-007 | converts decimals to normalized strings', () => {
    expect(decimalToString(parseDecimal('12', 'value'))).toBe('12');
    expect(decimalToString(parseDecimal('12.34', 'value'))).toBe('12.34');
    expect(decimalToString(parseDecimal('-12.34', 'value'))).toBe('-12.34');
    expect(decimalToString(parseDecimal('0.00', 'value'))).toBe('0');
    expect(decimalToString(parseDecimal('1.2300', 'value'))).toBe('1.23');
    expect(decimalToString(parseDecimal('0.05', 'value'))).toBe('0.05');
  });

  test('UT-DASHBOARD-DECIMAL-008 | converts decimals to numbers for percentage calculations', () => {
    expect(decimalToNumber(parseDecimal('52.5', 'percentage'))).toBe(52.5);
    expect(decimalToNumber(parseDecimal('-2', 'percentage'))).toBe(-2);
    expect(decimalToNumber(parseDecimal('0.05', 'percentage'))).toBe(0.05);
  });

  test('UT-DASHBOARD-DECIMAL-009 | subtracts decimal values with aligned scales', () => {
    expect(subtractDecimals(
      parseDecimal('100.00', 'left'),
      parseDecimal('25.5', 'right')
    )).toEqual({ units: 7_450n, scale: 2 });
    expect(subtractDecimals(
      parseDecimal('25.5', 'left'),
      parseDecimal('100.00', 'right')
    )).toEqual({ units: -7_450n, scale: 2 });
  });
});

test.describe('Dashboard pure display formatting', () => {
  test('UT-DASHBOARD-FORMAT-001 | normalizes whitespace without changing normalized text', () => {
    expect(normalizeText('  Dashboard')).toBe('Dashboard');
    expect(normalizeText('Dashboard  ')).toBe('Dashboard');
    expect(normalizeText('Dashboard    summary')).toBe('Dashboard summary');
    expect(normalizeText('Dashboard\nsummary')).toBe('Dashboard summary');
    expect(normalizeText('Dashboard\tsummary')).toBe('Dashboard summary');
    expect(normalizeText('Dashboard summary')).toBe('Dashboard summary');
  });

  test('UT-DASHBOARD-FORMAT-002 | formats supported API dates with abbreviated English months', () => {
    expect(formatApiDate('2026-07-22')).toBe('22 Jul 2026');
    expect(formatApiDate('2026-01-02')).toBe('2 Jan 2026');
    expect(formatApiDate('2026-12-31')).toBe('31 Dec 2026');
    expect(() => formatApiDate('2026-13-01')).toThrow(
      'Unsupported API date format: 2026-13-01'
    );
    expect(() => formatApiDate('2026-01')).toThrow(
      'Unsupported API date format: 2026-01'
    );
  });

  test('UT-DASHBOARD-FORMAT-003 | extracts the existing integer, decimal, and negative percentage tokens', () => {
    expect(decimalToString(extractPercentage('52%', 'progress'))).toBe('52');
    expect(decimalToString(extractPercentage('52.5%', 'progress'))).toBe('52.5');
    expect(decimalToString(extractPercentage('-2%', 'progress'))).toBe('-2');
    expect(decimalToString(
      extractPercentage('Loan progress is 52.5% complete', 'progress')
    )).toBe('52.5');
    expect(() => extractPercentage('No progress value', 'loan progress')).toThrow(
      'loan progress was not found.'
    );
  });

  test('UT-DASHBOARD-FORMAT-004 | formats Dashboard monetary values as #,##0.00 without locale drift', () => {
    expect(formatDashboardMoney(parseDecimal('15000.54', 'value'))).toBe(
      '15,000.54'
    );
    expect(formatDashboardMoney(parseDecimal('1000', 'value'))).toBe(
      '1,000.00'
    );
    expect(formatDashboardMoney(parseDecimal('0.5', 'value'))).toBe('0.50');
    expect(formatDashboardMoney(parseDecimal('0', 'value'))).toBe('0.00');
    expect(formatDashboardMoney(parseDecimal('-15000.545', 'value'))).toBe(
      '-15,000.55'
    );
    expect(formatDashboardMoney(parseDecimal('-15000', 'value'))).toBe(
      '-15,000.00'
    );
  });

  test('UT-DASHBOARD-FORMAT-005 | recognizes only the approved visible Dashboard monetary format', () => {
    expect(isDashboardMoneyDisplay('15,000.54')).toBe(true);
    expect(isDashboardMoneyDisplay('1,000.00')).toBe(true);
    expect(isDashboardMoneyDisplay('0.50')).toBe(true);
    expect(isDashboardMoneyDisplay('0.00')).toBe(true);
    expect(isDashboardMoneyDisplay('-1,250.75')).toBe(true);
    expect(isDashboardMoneyDisplay('15000.50')).toBe(false);
    expect(isDashboardMoneyDisplay('15000.5')).toBe(false);
    expect(isDashboardMoneyDisplay('1000.00')).toBe(false);
    expect(isDashboardMoneyDisplay('15.000,54')).toBe(false);
    expect(isDashboardMoneyDisplay('1,000')).toBe(false);
    expect(isDashboardMoneyDisplay('1,000.0')).toBe(false);
    expect(isDashboardMoneyDisplay('1,000.000')).toBe(false);
    expect(isDashboardMoneyDisplay('1.000,00')).toBe(false);
  });

  test('UT-DASHBOARD-FORMAT-006 | formats Last Login through the Africa/Cairo timezone', () => {
    expect(formatLastLoginForCairo('2026-07-27T12:25:16Z')).toBe(
      'Last Login: 27 Jul 2026, 03:25PM'
    );
    expect(formatLastLoginForCairo('2026-01-15T12:25:59Z')).toBe(
      'Last Login: 15 Jan 2026, 02:25PM'
    );
    expect(formatLastLoginForCairo('2026-07-27T12:25:59.999Z')).toBe(
      'Last Login: 27 Jul 2026, 03:25PM'
    );
    expect(formatLastLoginForCairo('2026-01-14T22:00:00Z')).toBe(
      'Last Login: 15 Jan 2026, 12:00AM'
    );
    expect(formatLastLoginForCairo('2026-01-15T10:00:00Z')).toBe(
      'Last Login: 15 Jan 2026, 12:00PM'
    );
  });

  test('UT-DASHBOARD-FORMAT-007 | rejects unsupported Last Login timestamps', () => {
    expect(() => formatLastLoginForCairo('')).toThrow(
      'Unsupported LastLoginTime format: '
    );
    expect(() =>
      formatLastLoginForCairo('2026-07-27T12:25:16')
    ).toThrow(
      'Unsupported LastLoginTime format: 2026-07-27T12:25:16'
    );
    expect(() =>
      formatLastLoginForCairo('2026-13-27T12:25:16Z')
    ).toThrow(
      'Unsupported LastLoginTime format: 2026-13-27T12:25:16Z'
    );
  });

  test('UT-DASHBOARD-FORMAT-008 | normalizes Dashboard account numbers by whitespace only', () => {
    expect(normalizeDashboardAccountNumber('0280123456720300')).toBe(
      '0280123456720300'
    );
    expect(normalizeDashboardAccountNumber('0280 1234 5672 0300')).toBe(
      '0280123456720300'
    );
    expect(normalizeDashboardAccountNumber(' 0280\t1234\n5672 0300 ')).toBe(
      '0280123456720300'
    );
    expect(() => normalizeDashboardAccountNumber(' \t ')).toThrow(
      'Dashboard account number must contain a value.'
    );
  });
});
