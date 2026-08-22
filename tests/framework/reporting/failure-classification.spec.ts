import { test, expect } from '@playwright/test';
import { classifyFailureMessage } from '../../../utils/failureClassification.js';

test.describe('Cubic failure classification', () => {
  test('classifies explicit framework TEST_DATA failures as F3', () => {
    expect(
      classifyFailureMessage(
        'TEST_DATA: selected account has no visible recent transactions.'
      ).code
    ).toBe('F3');
  });

  test('classifies explicit application failures as F2', () => {
    expect(
      classifyFailureMessage(
        'APP_UI: transaction details is missing Running Balance.'
      ).code
    ).toBe('F2');
  });
});
