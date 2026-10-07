export type ApiErrorCode =
  'UNAUTHORIZED' | 'NOT_FOUND' | 'VALIDATION_ERROR' | 'CONFLICT' | 'UNAVAILABLE';

export interface ApiResponse<TData> {
  data: TData;
  updatedAt: string;
}

export interface PaginatedResponse<TItem> extends ApiResponse<readonly TItem[]> {
  page: number;
  pageSize: number;
  total: number;
}

export class ApiRequestError extends Error {
  constructor(
    public readonly code: ApiErrorCode,
    message: string,
    public readonly retryable = false
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}
