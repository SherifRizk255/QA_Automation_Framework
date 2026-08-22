import { test, expect } from '@playwright/test';
import type { AccountStatementTransaction } from '../../../utils/portal/accounts/accountManagementModels.js';
import {
  apiMoney,
  expectedDisplayedAmount,
  normalizeDate,
  displayedMoney,
} from '../../../utils/portal/accounts/transactionNormalization.js';

const transaction: AccountStatementTransaction = {
  id: 'ST-1',
  reference: 'REF-1',
  description: 'Payment',
  amount: '1234.5',
  currency: 'EGP',
  nature: 'CR',
  postingDate: '2026-07-30T00:00:00Z',
  valueDate: '2026-07-29T00:00:00Z',
  status: '',
  runningBalance: '2500.75',
  partyName: 'Example Beneficiary',
};

test.describe('Accounts transaction formatting', () => {
  test('normalizes debit/credit money and exact display format', () => {
    expect(apiMoney(transaction)).toEqual({
      amount: 1234.5,
      currency: 'EGP',
      direction: 'credit',
    });
    expect(displayedMoney('+1,234.50 EGP')).toEqual(apiMoney(transaction));
    expect(expectedDisplayedAmount(transaction)).toBe('+1,234.50 EGP');
  });

  test('compares ISO and displayed calendar dates without timezone shifts', () => {
    expect(normalizeDate('2026-07-30T12:15:00Z', 'date')).toBe('2026-07-30');
    expect(normalizeDate('30 Jul 2026', 'date')).toBe('2026-07-30');
  });
});
