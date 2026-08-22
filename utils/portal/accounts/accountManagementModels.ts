export type JsonRecord = Record<string, unknown>;

export interface AccountDetailsRequest {
  readonly accountNumber: string;
  readonly queryType: string;
  readonly language: string;
}

export interface AccountDetailsApi {
  readonly accountNumber: string;
  readonly iban: string;
  readonly productName: string;
  readonly accountType: string;
  readonly currency: string;
  readonly availableBalance: string;
  readonly actualBalance: string;
  readonly holdBalance: string;
  readonly branchName: string;
  readonly openingDate: string;
  readonly status: 'Active' | 'Dormant';
  readonly collateralAmount?: string;
}

export interface AccountDetailsCapture {
  readonly request: AccountDetailsRequest;
  readonly details: AccountDetailsApi;
}

export interface AccountStatementRequest {
  readonly accountNumber: string;
  readonly fromDate: string;
  readonly toDate: string;
  readonly transactionCount: number;
  readonly statementType: number;
}

export interface AccountStatementTransaction {
  readonly id: string;
  readonly reference: string;
  readonly description: string;
  readonly amount: string;
  readonly currency: string;
  readonly nature: string;
  readonly postingDate: string;
  readonly valueDate: string;
  readonly status: string;
  readonly runningBalance?: string;
  readonly partyName?: string;
}

export interface AccountSelectionApiCapture {
  readonly details: AccountDetailsCapture;
  readonly statementRequest: AccountStatementRequest;
  readonly transactions: readonly AccountStatementTransaction[];
}
