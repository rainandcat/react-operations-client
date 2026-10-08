export type ActivityKind = 'credit' | 'debit' | 'transfer';
export type ActivityStatus = 'pending' | 'completed' | 'declined';
export type ActivitySort = 'newest' | 'oldest';

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
  sort: ActivitySort;
  page: number;
  pageSize: number;
}
