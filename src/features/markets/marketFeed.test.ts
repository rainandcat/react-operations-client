// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MarketFeed } from './marketFeed';
import type { FeedState, MarketSnapshot } from './types';

class FakeSocket {
  onmessage: ((message: { data: string }) => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onopen: (() => void) | null = null;
  close = vi.fn();
  send(data: unknown) {
    this.onmessage?.({ data: JSON.stringify(data) });
  }
}
const time = Date.UTC(2026, 9, 10, 1);
function snapshot(): MarketSnapshot {
  return {
    instruments: [{ symbol: 'BTCUSDT', base: 'BTC', status: 'TRADING', spot: true, precision: 2 }],
    tickers: [{ symbol: 'BTCUSDT', price: 100, change: 1, quoteVolume: 200, eventTime: time }],
    candles: [
      {
        openTime: time,
        open: 100,
        high: 105,
        low: 98,
        close: 102,
        volume: 20,
        closed: false,
        eventTime: 0
      }
    ]
  };
}
function ticker(price = '104', eventTime = Date.now()) {
  return { e: '24hrTicker', E: eventTime, s: 'BTCUSDT', c: price, P: '2', q: '300' };
}
function kline(openTime = time, closed = false, eventTime = Date.now()) {
  return {
    e: 'kline',
    E: eventTime,
    s: 'BTCUSDT',
    k: {
      s: 'BTCUSDT',
      i: '1m',
      t: openTime,
      T: openTime + 59_999,
      o: '100',
      h: '105',
      l: '98',
      c: '104',
      v: '20',
      x: closed
    }
  };
}
const feeds: MarketFeed[] = [];
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(time + 5000);
  vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
});
afterEach(() => {
  feeds.forEach((feed) => feed.stop());
  feeds.length = 0;
  vi.restoreAllMocks();
  vi.useRealTimers();
});
function setup(
  load: (signal: AbortSignal) => Promise<MarketSnapshot> = async () => snapshot(),
  instruments = snapshot().instruments
) {
  const sockets: FakeSocket[] = [];
  const states: FeedState[] = [];
  const factory = vi.fn(() => {
    const ws = new FakeSocket();
    sockets.push(ws);
    return ws as unknown as WebSocket;
  });
  const feed = new MarketFeed({
    symbols: ['BTCUSDT'],
    detail: 'BTCUSDT',
    load,
    instruments: async () => instruments,
    socket: factory,
    publish: (state) => states.push(state)
  });
  feeds.push(feed);
  feed.start();
  return { feed, sockets, states, factory, latest: () => states.at(-1)! };
}
describe('market subscription lifecycle', () => {
  it('buffers WS before REST and preserves newer same-candle updates without duplicates', async () => {
    let resolve!: (value: MarketSnapshot) => void;
    const ctx = setup(
      () =>
        new Promise((done) => {
          resolve = done;
        })
    );
    await vi.advanceTimersByTimeAsync(0);
    ctx.sockets[0].send(ticker());
    ctx.sockets[0].send(kline());
    expect(ctx.latest().status).toBe('connecting');
    resolve(snapshot());
    await vi.advanceTimersByTimeAsync(0);
    expect(ctx.latest().status).toBe('live');
    expect(ctx.latest().tickers[0].price).toBe(104);
    expect(ctx.latest().candles).toHaveLength(1);
    expect(ctx.latest().candles[0].close).toBe(104);
    ctx.sockets[0].send(kline(time, true));
    ctx.sockets[0].send(kline(time, false, Date.now() + 1));
    expect(ctx.latest().candles[0].closed).toBe(true);
  });
  it('ignores late responses/messages and clears timers when stopped or remounted', async () => {
    let resolve!: (value: MarketSnapshot) => void;
    let signal!: AbortSignal;
    const ctx = setup((input) => {
      signal = input;
      return new Promise((done) => {
        resolve = done;
      });
    });
    await vi.advanceTimersByTimeAsync(0);
    const lateHandler = ctx.sockets[0].onmessage!;
    ctx.feed.stop();
    const count = ctx.states.length;
    resolve(snapshot());
    lateHandler({ data: JSON.stringify(ticker()) });
    await vi.advanceTimersByTimeAsync(60_000);
    expect(ctx.states).toHaveLength(count);
    expect(signal.aborted).toBe(true);
    expect(ctx.sockets[0].close).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
    const next = setup();
    await vi.advanceTimersByTimeAsync(0);
    expect(next.sockets).toHaveLength(1);
  });
  it('resynchronizes after a candle gap or server shutdown and waits for fresh streams', async () => {
    const load = vi.fn(async () => snapshot());
    const ctx = setup(load);
    await vi.advanceTimersByTimeAsync(0);
    ctx.sockets[0].send(ticker());
    ctx.sockets[0].send(kline(time + 120_000));
    expect(ctx.latest().status).toBe('reconnecting');
    await vi.advanceTimersByTimeAsync(1300);
    expect(load).toHaveBeenCalledTimes(2);
    expect(ctx.latest().status).toBe('connecting');
    ctx.sockets[1].send(ticker());
    ctx.sockets[1].send(kline());
    expect(ctx.latest().status).toBe('live');
    ctx.sockets[1].send({ e: 'serverShutdown' });
    expect(ctx.latest().status).toBe('reconnecting');
    expect(ctx.sockets[1].close).toHaveBeenCalled();
  });
  it('does not mark a snapshot live when WS fails and bounds retry attempts', async () => {
    const ctx = setup();
    await vi.advanceTimersByTimeAsync(0);
    expect(ctx.latest().status).toBe('connecting');
    for (let index = 0; index < 6; index++) {
      ctx.sockets[index].onerror?.();
      if (index < 5) await vi.advanceTimersToNextTimerAsync();
    }
    expect(ctx.latest().status).toBe('unavailable');
    expect(ctx.latest().tickers[0].price).toBe(100);
    expect(ctx.factory).toHaveBeenCalledTimes(6);
    expect(vi.getTimerCount()).toBe(0);
  });
  it('marks streams stale, pauses while hidden/offline and refetches on foreground', async () => {
    const load = vi.fn(async () => snapshot());
    const ctx = setup(load);
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(15_000);
    expect(ctx.latest().status).toBe('reconnecting');
    vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);
    document.dispatchEvent(new Event('visibilitychange'));
    expect(ctx.latest().status).toBe('stale');
    await vi.advanceTimersByTimeAsync(60_000);
    expect(ctx.factory).toHaveBeenCalledTimes(1);
    vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
    document.dispatchEvent(new Event('visibilitychange'));
    await vi.advanceTimersByTimeAsync(0);
    expect(load).toHaveBeenCalledTimes(2);
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    window.dispatchEvent(new Event('offline'));
    expect(ctx.latest().status).toBe('stale');
    expect(vi.getTimerCount()).toBe(0);
  });
  it('never subscribes to a suspended or non-Spot instrument', async () => {
    const ctx = setup(async () => snapshot(), [{ ...snapshot().instruments[0], status: 'BREAK' }]);
    await vi.advanceTimersByTimeAsync(0);
    expect(ctx.factory).not.toHaveBeenCalled();
    expect(ctx.latest().status).toBe('unavailable');
  });
  it('rejects malformed data and stale event timestamps instead of displaying invented values', async () => {
    const ctx = setup();
    await vi.advanceTimersByTimeAsync(0);
    ctx.sockets[0].send(ticker('NaN'));
    expect(ctx.latest().status).toBe('reconnecting');
    expect(ctx.latest().tickers[0].price).toBe(100);
    await vi.advanceTimersByTimeAsync(1300);
    ctx.sockets[1].send(ticker('104', time - 60_000));
    expect(ctx.latest().status).toBe('reconnecting');
  });
});
