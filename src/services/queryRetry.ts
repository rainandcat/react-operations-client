import { ApiRequestError } from './apiTypes';

export function retryMockQuery(failureCount: number, error: unknown): boolean {
  return error instanceof ApiRequestError && error.retryable && failureCount < 1;
}
