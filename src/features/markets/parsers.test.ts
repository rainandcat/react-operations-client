import { describe, expect, it } from 'vitest';
import {
  mergeCandle,
  mergeTrade,
  numeric,
  parseCandles,
  parseEvent,
  parseInstruments,
  parseTicker
} from './parsers';
import type { Candle } from './types';

const time = Date.UTC(2026, 9, 10, 1);
const candle: Candle = {
  openTime: time,
  open: 100,
  high: 105,
  low: 98,
  close: 102,
  volume: 10,
  closed: false,
  eventTime: time + 1000
};
describe('public market payload contracts', () => {
  it('parses raw trade ID, base quantity, UTC execution time and taker side', () => {
    const payload = {
      e: 'trade',
      E: time + 5,
      T: time,
      s: 'BTCUSDT',
      t: 7,
      p: '62000.01',
      q: '0.00001',
      m: true
    };
    const event = parseEvent({ stream: 'btcusdt@trade', data: payload });
    expect(event).toMatchObject({
      type: 'trade',
      symbol: 'BTCUSDT',
      trade: { id: 7, price: 62000.01, quantity: 0.00001, side: 'sell', tradeTime: time }
    });
    expect(parseEvent({ ...payload, m: false })).toMatchObject({ trade: { side: 'buy' } });
    for (const invalid of [
      { t: -1 },
      { t: 1.2 },
      { t: Number.MAX_SAFE_INTEGER + 1 },
      { q: '0' },
      { q: 'NaN' },
      { m: 'true' },
      { s: 'UNKNOWN' },
      { T: time + 10 }
    ])
      expect(() => parseEvent({ ...payload, ...invalid })).toThrow();
  });
  it('deduplicates and bounds trades, ordering by execution time with an ID tie-break', () => {
    const event = parseEvent({
      e: 'trade',
      E: time,
      T: time,
      s: 'BTCUSDT',
      t: 1,
      p: '100',
      q: '0.01',
      m: false
    });
    if (event.type !== 'trade') throw new Error('Expected trade.');
    const rows = Array.from({ length: 50 }, (_, index) => ({
      ...event.trade,
      id: index + 1,
      tradeTime: time - index
    }));
    expect(mergeTrade(rows, rows[0])).toBe(rows);
    const merged = mergeTrade(rows, { ...event.trade, id: 60 });
    expect(merged).toHaveLength(50);
    expect(merged[0].id).toBe(60);
    expect(merged[1].id).toBe(1);
    expect(mergeTrade(merged, { ...event.trade, id: 70, tradeTime: time - 1000 })).toEqual(merged);
  });
  it('rejects blank, nonfinite and invalid prices without inventing zero values', () => {
    for (const invalid of ['', ' ', null, true, {}, 'NaN', 'Infinity'])
      expect(() => numeric(invalid)).toThrow();
    expect(() =>
      parseTicker({
        symbol: 'BTCUSDT',
        lastPrice: '-1',
        priceChangePercent: '1',
        quoteVolume: '20',
        closeTime: time
      })
    ).toThrow();
    expect(() =>
      parseTicker({
        symbol: 'UNKNOWN',
        lastPrice: '10',
        priceChangePercent: '1',
        quoteVolume: '20',
        closeTime: time
      })
    ).toThrow();
  });
  it('validates Spot metadata and tick precision rather than trusting external types', () => {
    const row = {
      symbol: 'BTCUSDT',
      baseAsset: 'BTC',
      quoteAsset: 'USDT',
      status: 'TRADING',
      isSpotTradingAllowed: true,
      filters: [{ filterType: 'PRICE_FILTER', tickSize: '0.01000000' }]
    };
    expect(parseInstruments({ symbols: [row] })[0].precision).toBe(2);
    expect(() => parseInstruments({ symbols: [{ ...row, quoteAsset: 'BTC' }] })).toThrow();
    expect(() => parseInstruments({ symbols: [{ ...row, filters: [] }] })).toThrow();
    expect(
      parseInstruments({ symbols: [{ ...row, status: 'BREAK', isSpotTradingAllowed: false }] })[0]
        .spot
    ).toBe(false);
  });
  it('validates candle consistency, interval, timestamps and continuous history', () => {
    const row = [time, '100', '105', '98', '102', '10', time + 59_999];
    expect(parseCandles([row], time + 30_000)[0].closed).toBe(false);
    expect(() => parseCandles([row, row])).toThrow();
    expect(() => parseCandles([[time, '100', '99', '98', '102', '10', time + 59_999]])).toThrow();
    expect(() =>
      parseEvent({ e: 'kline', E: time, s: 'BTCUSDT', k: { i: '5m', s: 'BTCUSDT', x: false } })
    ).toThrow();
    expect(
      parseEvent({ stream: '!serverShutdown', data: { e: 'serverShutdown', E: time } })
    ).toEqual({ type: 'shutdown' });
  });
  it('merges same candles, ignores older events and never reopens a closed candle', () => {
    const updated = { ...candle, close: 104, eventTime: time + 2000 };
    expect(mergeCandle([candle], updated)).toEqual([updated]);
    expect(mergeCandle([updated], candle)).toEqual([updated]);
    const closed = { ...updated, closed: true };
    expect(mergeCandle([closed], { ...updated, eventTime: time + 3000 })).toEqual([closed]);
    expect(() => mergeCandle([candle], { ...candle, openTime: time + 120_000 })).toThrow(/gap/);
  });
  it('bounds history and does not reinsert events older than retained data', () => {
    const rows = Array.from({ length: 500 }, (_, index) => ({
      ...candle,
      openTime: time + index * 60_000
    }));
    const next = { ...candle, openTime: time + 500 * 60_000 };
    const merged = mergeCandle(rows, next);
    expect(merged).toHaveLength(500);
    expect(merged[0].openTime).toBe(time + 60_000);
    expect(mergeCandle(merged, candle)).toBe(merged);
  });
});
