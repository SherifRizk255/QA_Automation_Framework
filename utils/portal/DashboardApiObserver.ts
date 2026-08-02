import type { Page, Response } from '@playwright/test';
import { ROUTES } from '../../config/resources.js';

type JsonRecord = Record<string, unknown>;

export interface DashboardCustomerProfile {
  readonly name: string;
  readonly customerId: string;
  readonly lastLoginTime: string;
}

export interface DashboardAccount {
  readonly accountNumber: string;
  readonly accountType: string;
  readonly accountName: string;
  readonly currency: string;
  readonly availableBalance: string;
  readonly holdAmount: string;
  readonly holdCurrency: string;
}

export interface DashboardCard {
  readonly cardIdentifier: string;
  readonly productName: string;
  readonly cardType: string;
  readonly currency: string;
  readonly cardLimit: string;
  readonly availableBalance: string;
  readonly availableLimit: string;
  readonly outstanding: string;
}

export interface DashboardDeposit {
  readonly productId: string;
  readonly productCode: string;
  readonly productName: string;
  readonly depositType: string;
  readonly interestRate: string;
  readonly maturityDate: string;
  readonly currency: string;
  readonly totalAmount: string;
}

export interface DashboardLoan {
  readonly loanId: string;
  readonly productCode: string;
  readonly productName: string;
  readonly currency: string;
  readonly loanAmount: string;
  readonly outstandingAmount: string;
}

export interface DashboardExchangeRate {
  readonly currency: string;
  readonly buyRate: string;
}

export interface DashboardApiSnapshot {
  readonly primaryAccount: string;
  readonly profile: DashboardCustomerProfile;
  readonly accounts: readonly DashboardAccount[];
  readonly cards: readonly DashboardCard[];
  readonly deposits: readonly DashboardDeposit[];
  readonly loans: readonly DashboardLoan[];
  readonly exchangeRates: readonly DashboardExchangeRate[];
}

function requireRecord(value: unknown, context: string): JsonRecord {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`${context} must be a JSON object.`);
  }

  return value as JsonRecord;
}

function requireArray(value: unknown, context: string): readonly unknown[] {
  if (!Array.isArray(value)) {
    throw new Error(`${context} must be a JSON array.`);
  }

  return value;
}

function requireString(record: JsonRecord, field: string, context: string): string {
  const value = record[field];

  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${context}.${field} must be a non-empty string.`);
  }

  return value.trim();
}

function optionalString(record: JsonRecord, field: string): string {
  const value = record[field];
  return typeof value === 'string' ? value.trim() : '';
}

function requireDecimalString(record: JsonRecord, field: string, context: string): string {
  const value = record[field];

  if (typeof value === 'number' && Number.isFinite(value)) {
    return value.toString();
  }

  return requireString(record, field, context);
}

async function responseData(response: Response, context: string): Promise<JsonRecord> {
  const body: unknown = await response.json();
  const envelope = requireRecord(body, context);
  return requireRecord(envelope.data, `${context}.data`);
}

function nestedRecord(record: JsonRecord, field: string, context: string): JsonRecord {
  return requireRecord(record[field], `${context}.${field}`);
}

function mapAccounts(data: JsonRecord): readonly DashboardAccount[] {
  return requireArray(data.AccountList, 'customer products AccountList').map((entry, index) => {
    const account = requireRecord(entry, `AccountList[${index}]`);
    const balance = nestedRecord(account, 'AcctBal', `AccountList[${index}]`);
    const holdInfo = nestedRecord(account, 'HoldInfoList', `AccountList[${index}]`);
    const holdAmount = nestedRecord(
      holdInfo,
      'HoldAmt',
      `AccountList[${index}].HoldInfoList`
    );

    return {
      accountNumber: requireString(account, 'AcctNum', `AccountList[${index}]`),
      accountType: requireString(account, 'AcctType', `AccountList[${index}]`),
      accountName: requireString(account, 'AcctTypeDesc', `AccountList[${index}]`),
      currency: requireString(account, 'CurCodeValue', `AccountList[${index}]`),
      availableBalance: requireString(balance, 'AccountBalance', `AccountList[${index}].AcctBal`),
      holdAmount: requireString(
        holdAmount,
        'Amt',
        `AccountList[${index}].HoldInfoList.HoldAmt`
      ),
      holdCurrency: requireString(
        holdAmount,
        'CurCodeValue',
        `AccountList[${index}].HoldInfoList.HoldAmt`
      ),
    };
  });
}

function mapDeposits(data: JsonRecord): readonly DashboardDeposit[] {
  return requireArray(data.DepositList, 'customer products DepositList').map((entry, index) => {
    const deposit = requireRecord(entry, `DepositList[${index}]`);
    const amount = nestedRecord(deposit, 'Amt', `DepositList[${index}]`);

    return {
      productId: requireString(deposit, 'ProductIdent', `DepositList[${index}]`),
      productCode: requireString(deposit, 'ProductType', `DepositList[${index}]`),
      productName: requireString(deposit, 'ProductTypeDesc', `DepositList[${index}]`),
      depositType: requireString(deposit, 'DepositProductType', `DepositList[${index}]`),
      interestRate: requireString(deposit, 'InterestRate', `DepositList[${index}]`),
      maturityDate: requireString(deposit, 'MaturityDt', `DepositList[${index}]`),
      currency: requireString(amount, 'CurCodeValue', `DepositList[${index}].Amt`),
      totalAmount: requireString(amount, 'Amt', `DepositList[${index}].Amt`),
    };
  });
}

function mapLoans(data: JsonRecord): readonly DashboardLoan[] {
  return requireArray(data.LoanList, 'customer products LoanList').map((entry, index) => {
    const loan = requireRecord(entry, `LoanList[${index}]`);
    const amount = nestedRecord(loan, 'LoanAmt', `LoanList[${index}]`);

    return {
      loanId: requireString(loan, 'ProductIdent', `LoanList[${index}]`),
      productCode: requireString(loan, 'ProductType', `LoanList[${index}]`),
      productName: requireString(loan, 'ProductTypeDesc', `LoanList[${index}]`),
      currency: requireString(amount, 'CurCodeValue', `LoanList[${index}].LoanAmt`),
      loanAmount: requireString(amount, 'Amt', `LoanList[${index}].LoanAmt`),
      outstandingAmount: requireString(loan, 'AccountBalance', `LoanList[${index}]`),
    };
  });
}

function mapCards(data: JsonRecord): readonly DashboardCard[] {
  return requireArray(data.Cards, 'customer cards Cards').map((entry, index) => {
    const card = requireRecord(entry, `Cards[${index}]`);
    const maskedPan = optionalString(card, 'MaskedPan');
    const cardNumber = requireString(card, 'CardNumber', `Cards[${index}]`);
    const availableToSpend = optionalString(card, 'AvailableBalanceToSpend');

    return {
      cardIdentifier: maskedPan || cardNumber,
      productName: requireString(card, 'ProductDescription', `Cards[${index}]`),
      cardType: requireString(card, 'CardType', `Cards[${index}]`),
      currency: requireString(card, 'CardCurrency', `Cards[${index}]`),
      cardLimit: requireString(card, 'CardLimit', `Cards[${index}]`),
      availableBalance: requireString(card, 'AvailableBalance', `Cards[${index}]`),
      availableLimit:
        availableToSpend || requireString(card, 'AvailableBalance', `Cards[${index}]`),
      outstanding: requireString(card, 'OutStandingBalance', `Cards[${index}]`),
    };
  });
}

function mapExchangeRates(data: JsonRecord): readonly DashboardExchangeRate[] {
  return requireArray(data.Rates, 'exchange rates Rates').map((entry, index) => {
    const rate = requireRecord(entry, `Rates[${index}]`);

    return {
      currency: requireString(rate, 'CurrencyCode', `Rates[${index}]`),
      buyRate: requireDecimalString(rate, 'BuyExchangeRate', `Rates[${index}]`),
    };
  });
}

export class DashboardApiObserver {
  private readonly authenticationResponses: Response[] = [];
  private profileResponse?: Response;
  private productsResponse?: Response;
  private cardsResponse?: Response;
  private exchangeRatesResponse?: Response;

  constructor(page: Page) {
    page.on('response', (response) => this.captureRelevantResponse(response));
  }

  async getSnapshot(): Promise<DashboardApiSnapshot> {
    const profileResponse = this.requiredResponse(
      this.profileResponse,
      'customer profile'
    );
    const productsResponse = this.requiredResponse(
      this.productsResponse,
      'customer products'
    );
    const cardsResponse = this.requiredResponse(this.cardsResponse, 'customer cards');
    const exchangeRatesResponse = this.requiredResponse(
      this.exchangeRatesResponse,
      'exchange rates'
    );
    const [
      authenticationData,
      profileData,
      productsData,
      cardsData,
      exchangeRatesData,
    ] = await Promise.all([
      Promise.all(
        this.authenticationResponses.map((response, index) =>
          responseData(response, `authentication response ${index + 1}`)
        )
      ),
      responseData(profileResponse, 'customer profile response'),
      responseData(productsResponse, 'customer products response'),
      responseData(cardsResponse, 'customer cards response'),
      responseData(exchangeRatesResponse, 'exchange rates response'),
    ]);
    const primaryAccounts = [
      ...new Set(
        authenticationData
          .map((data) => optionalString(data, 'PrimaryAccount'))
          .filter((value) => value.length > 0)
      ),
    ];

    if (primaryAccounts.length !== 1) {
      throw new Error(
        'Exactly one completed authentication response must expose PrimaryAccount.'
      );
    }

    return {
      primaryAccount: primaryAccounts[0],
      profile: {
        name: requireString(profileData, 'Name', 'customer profile data'),
        customerId: requireString(profileData, 'CIF', 'customer profile data'),
        lastLoginTime: requireString(
          profileData,
          'LastLoginTime',
          'customer profile data'
        ),
      },
      accounts: mapAccounts(productsData),
      cards: mapCards(cardsData),
      deposits: mapDeposits(productsData),
      loans: mapLoans(productsData),
      exchangeRates: mapExchangeRates(exchangeRatesData),
    };
  }

  private captureRelevantResponse(response: Response): void {
    if (!response.ok()) {
      return;
    }

    const path = new URL(response.url()).pathname;
    const method = response.request().method();

    if (
      method === 'POST' &&
      (
        path.endsWith(ROUTES.portalApi.login) ||
        path.endsWith(ROUTES.portalApi.terminateSession)
      )
    ) {
      this.authenticationResponses.push(response);
      return;
    }

    if (method !== 'GET') {
      return;
    }

    if (!this.profileResponse && path.endsWith(ROUTES.portalApi.customerProfile)) {
      this.profileResponse = response;
    }
    if (!this.productsResponse && path.endsWith(ROUTES.portalApi.customerProducts)) {
      this.productsResponse = response;
    }
    if (!this.cardsResponse && path.endsWith(ROUTES.portalApi.customerCards)) {
      this.cardsResponse = response;
    }
    if (!this.exchangeRatesResponse && path.endsWith(ROUTES.portalApi.exchangeRates)) {
      this.exchangeRatesResponse = response;
    }
  }

  private requiredResponse(response: Response | undefined, description: string): Response {
    if (!response) {
      throw new Error(`The ${description} API response was not captured during Dashboard load.`);
    }

    return response;
  }
}
