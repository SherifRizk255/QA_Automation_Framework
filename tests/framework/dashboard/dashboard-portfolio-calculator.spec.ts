import {
  expect,
  test,
} from '@playwright/test';
import { decimalToString } from '../../../utils/financial/decimal.js';
import {
  calculateAssetPortfolio,
  calculateLiabilityPortfolio,
  type DashboardPortfolioCategoryExpectation,
  type DashboardPortfolioCategoryLabel,
  type DashboardPortfolioExpectation,
} from '../../../utils/portal/dashboard/DashboardPortfolioCalculator.js';
import type {
  DashboardAccount,
  DashboardApiSnapshot,
  DashboardDeposit,
  DashboardExchangeRate,
  DashboardLoan,
} from '../../../utils/portal/DashboardApiObserver.js';

type PortfolioSnapshotInput = Pick<
  DashboardApiSnapshot,
  'accounts' | 'deposits' | 'loans' | 'exchangeRates'
>;

function createSnapshot(
  input: Partial<PortfolioSnapshotInput> = {}
): DashboardApiSnapshot {
  return {
    profile: {
      name: 'Portfolio Test User',
      customerId: 'PORTFOLIO-TEST-CUSTOMER',
    },
    accounts: input.accounts ?? [],
    cards: [],
    deposits: input.deposits ?? [],
    loans: input.loans ?? [],
    exchangeRates: input.exchangeRates ?? [],
  };
}

function createAccount(
  availableBalance: string,
  currency = 'EGP'
): DashboardAccount {
  return {
    accountNumber: `ACCOUNT-${currency}-${availableBalance}`,
    accountType: 'TEST',
    accountName: 'Test Account',
    currency,
    availableBalance,
  };
}

function createDeposit(
  totalAmount: string,
  currency = 'EGP'
): DashboardDeposit {
  return {
    productId: `DEPOSIT-${currency}-${totalAmount}`,
    productCode: 'TD',
    productName: 'Test Deposit',
    depositType: 'TD',
    interestRate: '10',
    maturityDate: '2027-01-01',
    currency,
    totalAmount,
  };
}

function createLoan(
  outstandingAmount: string,
  currency = 'EGP'
): DashboardLoan {
  return {
    loanId: `LOAN-${currency}-${outstandingAmount}`,
    productCode: 'PL',
    productName: 'Test Loan',
    currency,
    loanAmount: outstandingAmount,
    outstandingAmount,
  };
}

function createRate(
  currency: string,
  buyRate: string
): DashboardExchangeRate {
  return {
    currency,
    buyRate,
  };
}

function getCategory(
  expectation: DashboardPortfolioExpectation,
  label: DashboardPortfolioCategoryLabel
): DashboardPortfolioCategoryExpectation {
  const category = expectation.categories.find(
    (candidate) => candidate.label === label
  );

  if (!category) {
    throw new Error(`Expected Portfolio category ${label} was not calculated.`);
  }

  return category;
}

test.describe('Dashboard Portfolio calculator', () => {
  test('UT-DASHBOARD-PORTFOLIO-001 | classifies and sums asset categories in the approved order', () => {
    const result = calculateAssetPortfolio(createSnapshot({
      accounts: [
        createAccount('100.00'),
        createAccount('0.00'),
        createAccount('-25.00'),
        createAccount('50.00'),
      ],
      deposits: [
        createDeposit('200.00'),
        createDeposit('0.00'),
        createDeposit('-10.00'),
        createDeposit('50.00'),
      ],
    }));

    expect(result.categories.map((category) => category.label)).toEqual([
      'Accounts',
      'Deposits',
      'Cards',
    ]);
    expect(decimalToString(getCategory(result, 'Accounts').value)).toBe('150');
    expect(decimalToString(getCategory(result, 'Deposits').value)).toBe('250');
    expect(decimalToString(getCategory(result, 'Cards').value)).toBe('0');
    expect(decimalToString(result.total)).toBe('400');
    expect(getCategory(result, 'Accounts').percentage).toBe(37.5);
    expect(getCategory(result, 'Deposits').percentage).toBe(62.5);
    expect(getCategory(result, 'Cards').percentage).toBe(0);
  });

  test('UT-DASHBOARD-PORTFOLIO-002 | returns a zero-safe all-zero asset expectation', () => {
    const result = calculateAssetPortfolio(createSnapshot({
      accounts: [
        createAccount('0'),
        createAccount('-10'),
      ],
      deposits: [
        createDeposit('0'),
        createDeposit('-20'),
      ],
    }));

    expect(decimalToString(result.total)).toBe('0');
    expect(decimalToString(result.roundedDisplayTotal)).toBe('0');
    expect(result.categories.map((category) => category.percentage)).toEqual([
      0,
      0,
      0,
    ]);
  });

  test('UT-DASHBOARD-PORTFOLIO-003 | classifies absolute liabilities in the approved order', () => {
    const result = calculateLiabilityPortfolio(createSnapshot({
      loans: [
        createLoan('100.00'),
        createLoan('-50.00'),
        createLoan('0.00'),
      ],
      accounts: [
        createAccount('-25.00'),
        createAccount('-75.00'),
        createAccount('0.00'),
        createAccount('20.00'),
      ],
    }));

    expect(result.categories.map((category) => category.label)).toEqual([
      'Loans',
      'Overdraft',
      'Cards',
    ]);
    expect(decimalToString(getCategory(result, 'Loans').value)).toBe('150');
    expect(decimalToString(getCategory(result, 'Overdraft').value)).toBe('100');
    expect(decimalToString(getCategory(result, 'Cards').value)).toBe('0');
    expect(decimalToString(result.total)).toBe('250');
    expect(getCategory(result, 'Loans').percentage).toBe(60);
    expect(getCategory(result, 'Overdraft').percentage).toBe(40);
    expect(getCategory(result, 'Cards').percentage).toBe(0);
  });

  test('UT-DASHBOARD-PORTFOLIO-004 | returns a zero-safe all-zero liability expectation', () => {
    const result = calculateLiabilityPortfolio(createSnapshot({
      accounts: [
        createAccount('0'),
        createAccount('10'),
      ],
      loans: [
        createLoan('0'),
      ],
    }));

    expect(decimalToString(result.total)).toBe('0');
    expect(decimalToString(result.roundedDisplayTotal)).toBe('0');
    expect(result.categories.map((category) => category.percentage)).toEqual([
      0,
      0,
      0,
    ]);
  });

  test('UT-DASHBOARD-PORTFOLIO-005 | converts mixed asset currencies with precise buy rates', () => {
    const result = calculateAssetPortfolio(createSnapshot({
      accounts: [
        createAccount('5.00'),
        createAccount('10.00', 'USD'),
      ],
      deposits: [
        createDeposit('2.00', 'EUR'),
      ],
      exchangeRates: [
        createRate('USD', '30.125'),
        createRate('EUR', '50.25'),
        createRate('GBP', '60.00'),
      ],
    }));

    expect(decimalToString(getCategory(result, 'Accounts').value)).toBe(
      '306.25'
    );
    expect(decimalToString(getCategory(result, 'Deposits').value)).toBe(
      '100.5'
    );
    expect(decimalToString(result.total)).toBe('406.75');
  });

  test('UT-DASHBOARD-PORTFOLIO-006 | converts foreign loans and overdrafts with absolute values', () => {
    const result = calculateLiabilityPortfolio(createSnapshot({
      loans: [
        createLoan('2.00', 'USD'),
        createLoan('-1.00', 'EUR'),
      ],
      accounts: [
        createAccount('-3.00', 'USD'),
        createAccount('4.00', 'EUR'),
      ],
      exchangeRates: [
        createRate('USD', '30.125'),
        createRate('EUR', '50.25'),
        createRate('GBP', '60.00'),
      ],
    }));

    expect(decimalToString(getCategory(result, 'Loans').value)).toBe('110.5');
    expect(decimalToString(getCategory(result, 'Overdraft').value)).toBe(
      '90.375'
    );
    expect(decimalToString(result.total)).toBe('200.875');
  });

  test('UT-DASHBOARD-PORTFOLIO-007 | treats EGP as exact rate one without an API rate', () => {
    const assets = calculateAssetPortfolio(createSnapshot({
      accounts: [
        createAccount('25.50'),
      ],
      deposits: [
        createDeposit('74.50'),
      ],
    }));
    const liabilities = calculateLiabilityPortfolio(createSnapshot({
      accounts: [
        createAccount('-25.50'),
      ],
      loans: [
        createLoan('74.50'),
      ],
    }));

    expect(decimalToString(assets.total)).toBe('100');
    expect(decimalToString(liabilities.total)).toBe('100');
  });

  test('UT-DASHBOARD-PORTFOLIO-008 | rejects missing, duplicate, and unrelated exchange rates', () => {
    expect(() => calculateAssetPortfolio(createSnapshot({
      accounts: [
        createAccount('10', 'USD'),
      ],
    }))).toThrow('One exchange rate must exist for USD.');

    expect(() => calculateAssetPortfolio(createSnapshot({
      accounts: [
        createAccount('10', 'USD'),
      ],
      exchangeRates: [
        createRate('USD', '30'),
        createRate('USD', '31'),
      ],
    }))).toThrow('One exchange rate must exist for USD.');

    expect(() => calculateAssetPortfolio(createSnapshot({
      accounts: [
        createAccount('10', 'USD'),
      ],
      exchangeRates: [
        createRate('EUR', '50'),
      ],
    }))).toThrow('One exchange rate must exist for USD.');
  });

  test('UT-DASHBOARD-PORTFOLIO-009 | preserves exact totals and whole-unit rounding', () => {
    const exactInteger = calculateAssetPortfolio(createSnapshot({
      accounts: [
        createAccount('100'),
      ],
    }));
    const belowHalf = calculateAssetPortfolio(createSnapshot({
      accounts: [
        createAccount('1.49'),
      ],
    }));
    const exactHalf = calculateAssetPortfolio(createSnapshot({
      accounts: [
        createAccount('1.50'),
      ],
    }));
    const aboveHalf = calculateAssetPortfolio(createSnapshot({
      accounts: [
        createAccount('1.51'),
      ],
    }));
    const zero = calculateAssetPortfolio(createSnapshot());

    expect(decimalToString(exactInteger.total)).toBe('100');
    expect(decimalToString(exactInteger.roundedDisplayTotal)).toBe('100');
    expect(decimalToString(belowHalf.total)).toBe('1.49');
    expect(decimalToString(belowHalf.roundedDisplayTotal)).toBe('1');
    expect(decimalToString(exactHalf.roundedDisplayTotal)).toBe('2');
    expect(decimalToString(aboveHalf.roundedDisplayTotal)).toBe('2');
    expect(decimalToString(zero.roundedDisplayTotal)).toBe('0');
  });

  test('UT-DASHBOARD-PORTFOLIO-010 | calculates category percentages from the exact total', () => {
    const singleCategory = calculateAssetPortfolio(createSnapshot({
      accounts: [
        createAccount('100'),
      ],
    }));
    const equalCategories = calculateAssetPortfolio(createSnapshot({
      accounts: [
        createAccount('50'),
      ],
      deposits: [
        createDeposit('50'),
      ],
    }));
    const unequalCategories = calculateAssetPortfolio(createSnapshot({
      accounts: [
        createAccount('25'),
      ],
      deposits: [
        createDeposit('75'),
      ],
    }));
    const exactTotalDiffersFromDisplay = calculateAssetPortfolio(createSnapshot({
      accounts: [
        createAccount('1'),
      ],
      deposits: [
        createDeposit('0.49'),
      ],
    }));

    expect(getCategory(singleCategory, 'Accounts').percentage).toBe(100);
    expect(getCategory(singleCategory, 'Deposits').percentage).toBe(0);
    expect(getCategory(equalCategories, 'Accounts').percentage).toBe(50);
    expect(getCategory(equalCategories, 'Deposits').percentage).toBe(50);
    expect(getCategory(unequalCategories, 'Accounts').percentage).toBe(25);
    expect(getCategory(unequalCategories, 'Deposits').percentage).toBe(75);
    expect(decimalToString(exactTotalDiffersFromDisplay.total)).toBe('1.49');
    expect(
      decimalToString(exactTotalDiffersFromDisplay.roundedDisplayTotal)
    ).toBe('1');
    expect(
      getCategory(exactTotalDiffersFromDisplay, 'Accounts').percentage
    ).toBeCloseTo(67.1140939597, 10);
    expect(
      getCategory(exactTotalDiffersFromDisplay, 'Deposits').percentage
    ).toBeCloseTo(32.8859060403, 10);
    expect(getCategory(exactTotalDiffersFromDisplay, 'Cards').percentage).toBe(
      0
    );
  });
});
