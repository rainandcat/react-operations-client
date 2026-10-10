import { QueryClient } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MarketApi, MarketRequestError } from './marketApi';

afterEach(() => vi.useRealTimers());
describe('market request boundaries', () => {
  it.each([429, 418])(
    'coordinates %s cooldown across different market requests and manual retry',
    async (status) => {
      vi.useFakeTimers();
      const fetcher = vi
        .fn<typeof fetch>()
        .mockResolvedValue(new Response('{}', { status, headers: { 'Retry-After': '30' } }));
      const api = new MarketApi(new QueryClient(), fetcher);
      await expect(api.instruments(['BTCUSDT'])).rejects.toBeInstanceOf(MarketRequestError);
      await expect(api.instruments(['ETHUSDT'])).rejects.toThrow(/paused/);
      expect(fetcher).toHaveBeenCalledTimes(1);
      await vi.advanceTimersByTimeAsync(30_001);
      await expect(api.instruments(['ETHUSDT'])).rejects.toThrow(/limited/);
      expect(fetcher).toHaveBeenCalledTimes(2);
    }
  );
  it('uses a conservative cooldown if Retry-After cannot be read', async () => {
    vi.useFakeTimers();
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response('{}', { status: 418 }));
    const api = new MarketApi(new QueryClient(), fetcher);
    await expect(api.instruments(['BTCUSDT'])).rejects.toThrow();
    await vi.advanceTimersByTimeAsync(60_000);
    await expect(api.instruments(['ETHUSDT'])).rejects.toThrow(/paused/);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it('keeps demonstration data separate and performs no network request', async () => {
    const fetcher = vi.fn<typeof fetch>();
    const api = new MarketApi(new QueryClient(), fetcher);
    const snapshot = await api.snapshot(
      'demo',
      ['BTCUSDT'],
      'BTCUSDT',
      new AbortController().signal
    );
    expect(snapshot.candles).toHaveLength(300);
    expect(fetcher).not.toHaveBeenCalled();
  });
  it('cancels the request and Query when the owning page leaves, then allows a fresh attempt', async () => {
    let requestSignal: AbortSignal | undefined;
    const fetcher = vi.fn<typeof fetch>().mockImplementation((_url, init) => {
      requestSignal = init?.signal ?? undefined;
      return new Promise((_resolve, reject) =>
        requestSignal?.addEventListener(
          'abort',
          () => reject(new DOMException('Aborted', 'AbortError')),
          { once: true }
        )
      );
    });
    const client = new QueryClient({ defaultOptions: { queries: { gcTime: 0 } } });
    const api = new MarketApi(client, fetcher);
    const controller = new AbortController();
    const request = api.instruments(['BTCUSDT'], controller.signal);
    const rejection = expect(request).rejects.toThrow();
    controller.abort();
    await rejection;
    expect(requestSignal?.aborted).toBe(true);
    fetcher.mockResolvedValueOnce(new Response(JSON.stringify({ symbols: [] })));
    expect(await api.instruments(['BTCUSDT'])).toEqual([]);
    expect(fetcher).toHaveBeenCalledTimes(2);
    client.clear();
  });
  it('honors HTTP-date Retry-After and rejects duplicate instrument metadata', async () => {
    vi.useFakeTimers();
    const time = Date.UTC(2026, 9, 10, 1);
    vi.setSystemTime(time);
    const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(
      new Response('{}', {
        status: 429,
        headers: { 'Retry-After': new Date(time + 45_000).toUTCString() }
      })
    );
    const api = new MarketApi(new QueryClient(), fetcher);
    await expect(api.instruments(['BTCUSDT'])).rejects.toMatchObject({ retryAt: time + 45_000 });
    await vi.advanceTimersByTimeAsync(45_001);
    const row = {
      symbol: 'BTCUSDT',
      baseAsset: 'BTC',
      quoteAsset: 'USDT',
      status: 'TRADING',
      isSpotTradingAllowed: true,
      filters: [{ filterType: 'PRICE_FILTER', tickSize: '0.01' }]
    };
    fetcher.mockResolvedValueOnce(new Response(JSON.stringify({ symbols: [row, row] })));
    await expect(api.instruments(['BTCUSDT'])).rejects.toThrow(/metadata/);
  });
});
