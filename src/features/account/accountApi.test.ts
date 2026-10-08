import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getAccountOverview } from './accountApi';

const signal = () => new AbortController().signal;

describe('fictional account API', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('returns a demo snapshot and an empty scenario', async () => {
    const normal = getAccountOverview(signal());
    const empty = getAccountOverview(signal(), 'empty');
    await vi.advanceTimersByTimeAsync(350);
    expect((await normal).data?.accountId).toBe('AC-0001');
    expect((await empty).data).toBeNull();
  });

  it('returns a typed service error', async () => {
    const request = getAccountOverview(signal(), 'unavailable');
    const assertion = expect(request).rejects.toMatchObject({ code: 'UNAVAILABLE' });
    await vi.advanceTimersByTimeAsync(350);
    await assertion;
  });
});
