import { describe, expect, it } from 'vitest';
import { ApiRequestError } from './apiTypes';
import { toApiRequestError } from './mockTransport';
import { retryMockQuery } from './queryRetry';

describe('mock error policy', () => {
  it('maps unexpected errors to a retryable API error', () => {
    expect(toApiRequestError(new Error('internal detail'))).toMatchObject({
      code: 'UNAVAILABLE',
      retryable: true
    });
  });

  it('retries only a retryable error once', () => {
    const unavailable = new ApiRequestError('UNAVAILABLE', 'Demo unavailable', true);
    const missing = new ApiRequestError('NOT_FOUND', 'Missing');
    expect(retryMockQuery(0, unavailable)).toBe(true);
    expect(retryMockQuery(1, unavailable)).toBe(false);
    expect(retryMockQuery(0, missing)).toBe(false);
    expect(retryMockQuery(0, new Error('Unknown'))).toBe(false);
  });
});
