import {
  absoluteDecimal,
  addDecimals,
  decimalToNumber,
  multiplyDecimals,
  parseDecimal,
  roundDecimal,
  type DecimalValue,
  ZERO_DECIMAL,
} from '../../financial/decimal.js';
import type {
  DashboardApiSnapshot,
  DashboardExchangeRate,
} from '../DashboardApiObserver.js';

export type DashboardPortfolioCategoryLabel =
  | 'Accounts'
  | 'Cards'
  | 'Deposits'
  | 'Loans'
  | 'Overdraft';

export type DashboardPortfolioCategoryExpectation = {
  readonly label: DashboardPortfolioCategoryLabel;
  readonly value: DecimalValue;
  readonly percentage: number;
};

export type DashboardPortfolioExpectation = {
  readonly categories: readonly DashboardPortfolioCategoryExpectation[];
  readonly total: DecimalValue;
  readonly roundedDisplayTotal: DecimalValue;
};

type DashboardPortfolioValueCategory = {
  readonly label: DashboardPortfolioCategoryLabel;
  readonly value: DecimalValue;
};

type DashboardPortfolioEntry = {
  readonly amount: string;
  readonly currency: string;
};

type DashboardPortfolioConversionMode =
  | 'positive'
  | 'negative-absolute'
  | 'absolute';

const EGP_EXCHANGE_RATE: DecimalValue = {
  units: 1n,
  scale: 0,
};

export function calculateAssetPortfolio(
  api: DashboardApiSnapshot
): DashboardPortfolioExpectation {
  return calculatePortfolio([
    {
      label: 'Accounts',
      value: sumConverted(
        api.accounts.map((account) => ({
          amount: account.availableBalance,
          currency: account.currency,
        })),
        api.exchangeRates,
        'positive'
      ),
    },
    {
      label: 'Deposits',
      value: sumConverted(
        api.deposits.map((deposit) => ({
          amount: deposit.totalAmount,
          currency: deposit.currency,
        })),
        api.exchangeRates,
        'positive'
      ),
    },
    {
      label: 'Cards',
      value: ZERO_DECIMAL,
    },
  ]);
}

export function calculateLiabilityPortfolio(
  api: DashboardApiSnapshot
): DashboardPortfolioExpectation {
  return calculatePortfolio([
    {
      label: 'Loans',
      value: sumConverted(
        api.loans.map((loan) => ({
          amount: loan.outstandingAmount,
          currency: loan.currency,
        })),
        api.exchangeRates,
        'absolute'
      ),
    },
    {
      label: 'Overdraft',
      value: sumConverted(
        api.accounts.map((account) => ({
          amount: account.availableBalance,
          currency: account.currency,
        })),
        api.exchangeRates,
        'negative-absolute'
      ),
    },
    {
      label: 'Cards',
      value: ZERO_DECIMAL,
    },
  ]);
}

function calculatePortfolio(
  categories: readonly DashboardPortfolioValueCategory[]
): DashboardPortfolioExpectation {
  const total = sumPortfolio(categories);

  return {
    categories: categories.map((category) => ({
      ...category,
      percentage: calculatePercentage(category.value, total),
    })),
    total,
    roundedDisplayTotal: roundDecimal(total, 0),
  };
}

function sumConverted(
  entries: readonly DashboardPortfolioEntry[],
  rates: readonly DashboardExchangeRate[],
  mode: DashboardPortfolioConversionMode
): DecimalValue {
  let total = ZERO_DECIMAL;

  for (const entry of entries) {
    const amount = parseDecimal(
      entry.amount,
      `${entry.currency} API portfolio amount`
    );
    const include =
      mode === 'absolute' ||
      (mode === 'positive' && amount.units > 0n) ||
      (mode === 'negative-absolute' && amount.units < 0n);

    if (!include) {
      continue;
    }

    const magnitude =
      mode === 'positive'
        ? amount
        : absoluteDecimal(amount);
    total = addDecimals(
      total,
      multiplyDecimals(
        magnitude,
        exchangeRate(entry.currency, rates)
      )
    );
  }

  return total;
}

function exchangeRate(
  currency: string,
  rates: readonly DashboardExchangeRate[]
): DecimalValue {
  if (currency === 'EGP') {
    return EGP_EXCHANGE_RATE;
  }

  const matches = rates.filter((rate) => rate.currency === currency);

  if (matches.length !== 1) {
    throw new Error(`One exchange rate must exist for ${currency}.`);
  }

  return parseDecimal(
    matches[0].buyRate,
    `${currency} buy exchange rate`
  );
}

function sumPortfolio(
  categories: readonly DashboardPortfolioValueCategory[]
): DecimalValue {
  return categories.reduce(
    (total, category) => addDecimals(total, category.value),
    ZERO_DECIMAL
  );
}

function calculatePercentage(
  value: DecimalValue,
  total: DecimalValue
): number {
  if (value.units === 0n || total.units === 0n) {
    return 0;
  }

  return (
    decimalToNumber(value) /
    decimalToNumber(total) *
    100
  );
}
