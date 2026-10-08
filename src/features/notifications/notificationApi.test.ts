import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { listNotifications } from './notificationApi';

const signal = () => new AbortController().signal;
const params = { page: 1, pageSize: 4 };

describe('fictional notification API', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('filters and paginates notifications', async () => {
    const activity = listNotifications({ ...params, kind: 'activity' }, signal());
    const next = listNotifications({ ...params, page: 2 }, signal());
    await vi.advanceTimersByTimeAsync(350);
    expect((await activity).data).toHaveLength(2);
    expect((await next).data[0]?.id).toBe('N-0005');
  });

  it('supports empty and error states', async () => {
    const empty = listNotifications(params, signal(), 'empty');
    const error = listNotifications(params, signal(), 'unavailable');
    const assertion = expect(error).rejects.toMatchObject({ code: 'UNAVAILABLE' });
    await vi.advanceTimersByTimeAsync(350);
    expect((await empty).total).toBe(0);
    await assertion;
  });
});
