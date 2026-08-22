import type { Page, Request, Response } from '@playwright/test';
import { ROUTES } from '../../../config/resources.js';
import type {
  AccountDetailsApi,
  AccountDetailsCapture,
  AccountDetailsRequest,
  AccountSelectionApiCapture,
  AccountStatementRequest,
  AccountStatementTransaction,
  JsonRecord,
} from './accountManagementModels.js';

function asRecord(value: unknown, context: string): JsonRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${context} must be a JSON object.`);
  }
  return value as JsonRecord;
}

function requiredText(source: JsonRecord, field: string, context: string): string {
  const value = source[field];
  if ((typeof value !== 'string' && typeof value !== 'number') || String(value).trim() === '') {
    throw new Error(`${context}.${field} must contain a value.`);
  }
  return String(value).trim();
}

function optionalText(source: JsonRecord, field: string): string {
  const value = source[field];
  return typeof value === 'string' || typeof value === 'number'
    ? String(value).trim()
    : '';
}

function requiredNumber(source: JsonRecord, field: string, context: string): number {
  const value = source[field];
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`${context}.${field} must be a finite number.`);
  }
  return value;
}

function requestData(request: Request, context: string): JsonRecord {
  return asRecord(request.postDataJSON() as unknown, `${context} request body`);
}

function parseDetailsRequest(request: Request): AccountDetailsRequest {
  const body = requestData(request, 'account-details');
  return {
    accountNumber: requiredText(body, 'AccountNumber', 'account-details request'),
    queryType: requiredText(body, 'QueryType', 'account-details request'),
    language: requiredText(body, 'Lang', 'account-details request'),
  };
}

function parseStatementRequest(request: Request): AccountStatementRequest {
  const body = requestData(request, 'accountstatement');
  return {
    accountNumber: requiredText(body, 'AccountNumber', 'accountstatement request'),
    fromDate: requiredText(body, 'fromDate', 'accountstatement request'),
    toDate: requiredText(body, 'toDate', 'accountstatement request'),
    transactionCount: requiredNumber(
      body,
      'NumberOfTransaction',
      'accountstatement request'
    ),
    statementType: requiredNumber(
      body,
      'AccountStatementType',
      'accountstatement request'
    ),
  };
}

async function responseData(response: Response, context: string): Promise<JsonRecord> {
  if (!response.ok()) throw new Error(`${context} returned HTTP ${response.status()}.`);
  const envelope = asRecord(await response.json() as unknown, `${context} response`);
  return asRecord(envelope.data, `${context} response.data`);
}

function amount(balance: JsonRecord, field: string): string {
  return requiredText(
    asRecord(balance[field], `account-details Balance.${field}`),
    'Amt',
    `account-details Balance.${field}`
  );
}

function findOptionalField(source: JsonRecord, pattern: RegExp): string | undefined {
  const matches = Object.entries(source)
    .filter(([key, value]) =>
      pattern.test(key)
      && (typeof value === 'string' || typeof value === 'number')
      && String(value).trim()
    )
    .map(([, value]) => String(value).trim());
  return [...new Set(matches)].length === 1 ? matches[0] : undefined;
}

function parseDetails(data: JsonRecord): AccountDetailsApi {
  const balance = asRecord(data.Balance, 'account-details Balance');
  return {
    accountNumber: requiredText(data, 'AccountNumber', 'account-details data'),
    iban: requiredText(data, 'IBAN', 'account-details data'),
    productName: requiredText(data, 'ProductCodeDescription', 'account-details data'),
    accountType: requiredText(data, 'ProductCodeDescription', 'account-details data'),
    currency: requiredText(data, 'CurrenyCode', 'account-details data'),
    availableBalance: amount(balance, 'Avail'),
    actualBalance: amount(balance, 'BookingBalance'),
    holdBalance: amount(balance, 'TotalHoldAmount'),
    branchName: requiredText(data, 'BranchDescription', 'account-details data'),
    openingDate: requiredText(data, 'OpeningDate', 'account-details data'),
    status: data.IsDormantAccount === true ? 'Dormant' : 'Active',
    collateralAmount: findOptionalField(data, /collateral/i),
  };
}

function discoverPartyName(source: JsonRecord): string | undefined {
  const matches: string[] = [];
  const visit = (value: unknown, key = ''): void => {
    if (typeof value === 'string' && /beneficiary|payer/i.test(key) && value.trim()) {
      matches.push(value.replace(/\s+/g, ' ').trim());
      return;
    }
    if (!value || typeof value !== 'object' || Array.isArray(value)) return;
    for (const [childKey, child] of Object.entries(value as JsonRecord)) {
      visit(child, childKey);
    }
  };
  visit(source);
  const unique = [...new Set(matches)];
  if (unique.length > 1) {
    throw new Error('Transaction contains multiple beneficiary/payer values.');
  }
  return unique[0];
}

function parseTransaction(value: unknown, index: number): AccountStatementTransaction {
  const source = asRecord(value, `AccountStatement[${index}]`);
  const transaction = asRecord(source.Transaction, `AccountStatement[${index}].Transaction`);
  const account = source.Account ? asRecord(source.Account, 'Transaction.Account') : undefined;
  const openingBalance = source.OpenBal
    ? asRecord(source.OpenBal, 'Transaction.OpenBal')
    : undefined;

  return {
    id: optionalText(source, 'StatementID'),
    reference: optionalText(transaction, 'Reference') || optionalText(source, 'StatementID'),
    description: optionalText(transaction, 'Description')
      || optionalText(transaction, 'Reference'),
    amount: requiredText(transaction, 'Amount', 'Transaction'),
    currency: requiredText(transaction, 'CurrenyCode', 'Transaction'),
    nature: requiredText(transaction, 'Nature', 'Transaction'),
    postingDate: requiredText(transaction, 'BookDate', 'Transaction'),
    valueDate: requiredText(transaction, 'ValueDate', 'Transaction'),
    status: optionalText(transaction, 'Status'),
    runningBalance: account
      ? optionalText(account, 'Balance') || undefined
      : openingBalance
        ? optionalText(openingBalance, 'Balance') || undefined
        : undefined,
    partyName: discoverPartyName(source),
  };
}

export class AccountManagementApiObserver {
  constructor(private readonly page: Page) {}

  async captureAccountDetails(action: () => Promise<void>): Promise<AccountDetailsCapture> {
    const responsePromise = this.page.waitForResponse((response) =>
      this.matches(response, ROUTES.portalApi.accountDetails)
    );
    const [response] = await Promise.all([responsePromise, action()]);
    return {
      request: parseDetailsRequest(response.request()),
      details: parseDetails(await responseData(response, 'account-details')),
    };
  }

  async captureAccountSelection(
    action: () => Promise<void>
  ): Promise<AccountSelectionApiCapture> {
    const detailsPromise = this.page.waitForResponse((response) =>
      this.matches(response, ROUTES.portalApi.accountDetails)
    );
    const statementPromise = this.page.waitForResponse((response) =>
      this.matches(response, ROUTES.portalApi.accountStatement)
    );
    const [detailsResponse, statementResponse] = await Promise.all([
      detailsPromise,
      statementPromise,
      action(),
    ]);
    await this.validateStatementRequest(statementResponse.request());
    const statementData = await responseData(statementResponse, 'accountstatement');
    if (!Array.isArray(statementData.AccountStatement)) {
      throw new Error('accountstatement response.data.AccountStatement must be an array.');
    }

    return {
      details: {
        request: parseDetailsRequest(detailsResponse.request()),
        details: parseDetails(await responseData(detailsResponse, 'account-details')),
      },
      statementRequest: parseStatementRequest(statementResponse.request()),
      transactions: statementData.AccountStatement.map(parseTransaction),
    };
  }

  private matches(response: Response, endpoint: string): boolean {
    return response.request().method() === 'POST'
      && new URL(response.url()).pathname.endsWith(endpoint);
  }

  private async validateStatementRequest(request: Request): Promise<void> {
    const headers = await request.allHeaders();
    const requestOrigin = new URL(request.url()).origin;
    const requiredHeaders: Readonly<Record<string, string>> = {
      'x-channel': '2',
    };

    for (const [name, expected] of Object.entries(requiredHeaders)) {
      if (headers[name]?.toLowerCase() !== expected) {
        throw new Error(`accountstatement request header ${name} must be ${expected}.`);
      }
    }
    if (!headers['content-type']?.toLowerCase().startsWith('application/json')) {
      throw new Error('accountstatement request Content-Type must be application/json.');
    }
    if (!headers.accept?.toLowerCase().includes('application/json')) {
      throw new Error('accountstatement request Accept header must include application/json.');
    }
    if (headers.origin !== requestOrigin) {
      throw new Error('accountstatement request Origin must match the API origin.');
    }
    if (!headers.referer?.startsWith(`${requestOrigin}/`)) {
      throw new Error('accountstatement request Referer must belong to the API origin.');
    }
    if (!headers['accept-language']?.toLowerCase().startsWith('en')) {
      throw new Error('accountstatement request Accept-Language must start with EN.');
    }
  }
}
