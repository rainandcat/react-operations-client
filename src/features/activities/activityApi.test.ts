import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { listActivities } from './activityApi';

const signal = () => new AbortController().signal;
const params = { page: 1, pageSize: 5 };

describe('fictional activity API', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('filters by activity type', async () => {
    const request = listActivities({ ...params, kind: 'transfer' }, signal());
    await vi.advanceTimersByTimeAsync(350);
    expect((await request).data.map((activity) => activity.kind)).toEqual([
      'transfer',
      'transfer',
      'transfer'
    ]);
  });

  it('paginates and exposes an empty demo state', async () => {
    const secondPage = listActivities({ ...params, page: 2 }, signal());
    const empty = listActivities(params, signal(), 'empty');
    await vi.advanceTimersByTimeAsync(350);
    expect((await secondPage).data).toHaveLength(3);
    expect((await empty).total).toBe(0);
  });

  it('exposes a repeatable service error', async () => {
    const request = listActivities(params, signal(), 'unavailable');
    const assertion = expect(request).rejects.toMatchObject({ code: 'UNAVAILABLE' });
    await vi.advanceTimersByTimeAsync(350);
    await assertion;
  });

  it('cancels the pending delay without returning a UI error', async () => {
    const controller = new AbortController();
    const request = listActivities(params, controller.signal);
    const assertion = expect(request).rejects.toMatchObject({ name: 'AbortError' });
    controller.abort();
    await assertion;
  });
});
