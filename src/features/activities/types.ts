export type ActivityKind = 'credit' | 'debit' | 'transfer';
export type ActivityStatus = 'pending' | 'completed' | 'declined';

export interface ClientActivity {
  id: string;
  kind: ActivityKind;
  status: ActivityStatus;
  amount: string;
  currencyCode: string;
  occurredAt: string;
}

export interface ActivitySearchParams {
  kind?: ActivityKind;
  page: number;
  pageSize: number;
}
