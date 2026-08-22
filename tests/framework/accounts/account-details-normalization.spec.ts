import { test, expect } from '@playwright/test';
import {
  formatOpeningDate,
  normalizeBranchName,
  normalizeIban,
} from '../../../utils/portal/accounts/accountDetailsNormalization.js';

test.describe('SAIB-0059 Account Details formatting', () => {
  test('normalizes IBAN and branch display text', () => {
    expect(normalizeIban('eg38 0002 8001')).toBe('EG3800028001');
    expect(normalizeBranchName('Maadi Branch')).toBe('maadi');
    expect(normalizeBranchName('Maadi')).toBe('maadi');
  });

  test('formats OpeningDate like the verified Account Details UI', () => {
    expect(formatOpeningDate('2021-04-10T00:00:00Z')).toBe('April 10, 2021');
  });
});
