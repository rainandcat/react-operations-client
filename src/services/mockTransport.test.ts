import { describe, expect, it, vi } from 'vitest';
import { ApiRequestError } from './apiTypes';
import { toApiRequestError, waitForMockResponse } from './mockTransport';
import { retryMockQuery } from './queryRetry';

describe('mock error policy', () => {
  it('cancels a delayed response and clears its timer on abort', async () => {
    vi.useFakeTimers();
    try {
      const controller = new AbortController();
      const pending = waitForMockResponse(controller.signal, 1000);
      controller.abort();
      await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });
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
