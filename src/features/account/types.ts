export interface AccountOverview {
  accountId: string;
  displayName: string;
  totalBalance: string;
  currencyCode: string;
  updatedAt: string;
}

export interface MockClientSession {
  accountId: string;
  displayName: string;
}
