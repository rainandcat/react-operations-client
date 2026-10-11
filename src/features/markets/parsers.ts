import {
  isMarketSymbol,
  type Candle,
  type Instrument,
  type MarketEvent,
  type MarketTrade,
  type Ticker
} from './types';

export function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Invalid market payload.');
  return value as Record<string, unknown>;
}
export function numeric(value: unknown, minimum = -Infinity): number {
  if ((typeof value !== 'string' && typeof value !== 'number') || String(value).trim() === '')
    throw new Error('Invalid market number.');
  if (typeof value === 'string' && !/^-?\d+(\.\d+)?$/.test(value))
    throw new Error('Invalid decimal market number.');
  const result = Number(value);
  if (!Number.isFinite(result) || result < minimum) throw new Error('Invalid market number.');
  return result;
}
function timestamp(value: unknown): number {
  const result = numeric(value, 1);
  if (!Number.isSafeInteger(result) || result > 8_640_000_000_000_000)
    throw new Error('Invalid market timestamp.');
  return result;
}
export function parseInstruments(value: unknown): Instrument[] {
  const root = object(value);
  if (!Array.isArray(root.symbols)) throw new Error('Invalid exchange metadata.');
  return root.symbols.map((entry) => {
    const row = object(entry);
    if (typeof row.symbol !== 'string' || !isMarketSymbol(row.symbol))
      throw new Error('Unexpected instrument.');
    if (
      typeof row.baseAsset !== 'string' ||
      row.baseAsset !== row.symbol.replace(/USDT$/, '') ||
      row.quoteAsset !== 'USDT' ||
      typeof row.status !== 'string' ||
      typeof row.isSpotTradingAllowed !== 'boolean'
    )
      throw new Error('Invalid Spot instrument.');
    if (!Array.isArray(row.filters)) throw new Error('Missing price precision.');
    const priceFilter = row.filters
      .map(object)
      .find((filter) => filter.filterType === 'PRICE_FILTER');
    const tick = priceFilter?.tickSize;
    if (typeof tick !== 'string' || !/^\d+(\.\d+)?$/.test(tick) || numeric(tick, 0) === 0)
      throw new Error('Invalid tick precision.');
    const precision = (tick.replace(/0+$/, '').split('.')[1] ?? '').length;
    if (precision > 12) throw new Error('Unsupported price precision.');
    return {
      symbol: row.symbol,
      base: row.baseAsset,
      status: row.status,
      spot: row.isSpotTradingAllowed,
      precision
    };
  });
}
export function parseTicker(value: unknown, stream = false): Ticker {
  const row = object(value);
  const symbol = stream ? row.s : row.symbol;
  if (typeof symbol !== 'string' || !isMarketSymbol(symbol))
    throw new Error('Unexpected ticker symbol.');
  return {
    symbol,
    price: numeric(stream ? row.c : row.lastPrice, Number.MIN_VALUE),
    change: numeric(stream ? row.P : row.priceChangePercent),
    quoteVolume: numeric(stream ? row.q : row.quoteVolume, 0),
    eventTime: timestamp(stream ? row.E : row.closeTime)
  };
}
function validateCandle(candle: Candle): Candle {
  if (
    candle.openTime % 60_000 !== 0 ||
    candle.low > Math.min(candle.open, candle.close) ||
    candle.high < Math.max(candle.open, candle.close) ||
    candle.high < candle.low
  )
    throw new Error('Invalid one-minute candle.');
  return candle;
}
export function parseCandles(value: unknown, now = Date.now()): Candle[] {
  if (!Array.isArray(value) || value.length > 500) throw new Error('Invalid candle history.');
  const candles = value.map((row: unknown) => {
    if (!Array.isArray(row) || row.length < 7) throw new Error('Invalid candle history row.');
    const openTime = timestamp(row[0]);
    if (timestamp(row[6]) !== openTime + 59_999) throw new Error('Invalid candle close time.');
    return validateCandle({
      openTime,
      open: numeric(row[1], Number.MIN_VALUE),
      high: numeric(row[2], Number.MIN_VALUE),
      low: numeric(row[3], Number.MIN_VALUE),
      close: numeric(row[4], Number.MIN_VALUE),
      volume: numeric(row[5], 0),
      closed: Number(row[6]) < now,
      eventTime: 0
    });
  });
  for (let index = 1; index < candles.length; index++) {
    if (candles[index].openTime !== candles[index - 1].openTime + 60_000)
      throw new Error('Candle history has a gap or duplicate.');
  }
  return candles;
}
export function parseEvent(value: unknown): MarketEvent {
  const envelope = object(value);
  const row = 'data' in envelope ? object(envelope.data) : envelope;
  if (row.e === 'serverShutdown') return { type: 'shutdown' };
  if (row.e === '24hrTicker') return { type: 'ticker', ticker: parseTicker(row, true) };
  if (row.e === 'trade') {
    if (typeof row.s !== 'string' || !isMarketSymbol(row.s) || typeof row.m !== 'boolean')
      throw new Error('Invalid trade stream.');
    const id = numeric(row.t, 0);
    const tradeTime = timestamp(row.T);
    const eventTime = timestamp(row.E);
    if (!Number.isSafeInteger(id) || tradeTime > eventTime)
      throw new Error('Invalid trade identifier or time.');
    return {
      type: 'trade',
      symbol: row.s,
      trade: {
        symbol: row.s,
        id,
        price: numeric(row.p, Number.MIN_VALUE),
        quantity: numeric(row.q, Number.MIN_VALUE),
        tradeTime,
        eventTime,
        side: row.m ? 'sell' : 'buy'
      }
    };
  }
  if (row.e !== 'kline' || typeof row.s !== 'string' || !isMarketSymbol(row.s))
    throw new Error('Unexpected stream event.');
  const k = object(row.k);
  if (k.s !== row.s || k.i !== '1m' || typeof k.x !== 'boolean')
    throw new Error('Unexpected candle stream.');
  const openTime = timestamp(k.t);
  if (timestamp(k.T) !== openTime + 59_999) throw new Error('Invalid candle close time.');
  return {
    type: 'candle',
    symbol: row.s,
    candle: validateCandle({
      openTime,
      open: numeric(k.o, Number.MIN_VALUE),
      high: numeric(k.h, Number.MIN_VALUE),
      low: numeric(k.l, Number.MIN_VALUE),
      close: numeric(k.c, Number.MIN_VALUE),
      volume: numeric(k.v, 0),
      closed: k.x,
      eventTime: timestamp(row.E)
    })
  };
}
export const TRADE_LIMIT = 50;
export function mergeTrade(trades: MarketTrade[], next: MarketTrade): MarketTrade[] {
  if (trades.some((trade) => trade.symbol === next.symbol && trade.id === next.id)) return trades;
  return [...trades, next]
    .sort((a, b) => b.tradeTime - a.tradeTime || b.id - a.id)
    .slice(0, TRADE_LIMIT);
}
export function mergeCandle(candles: Candle[], next: Candle): Candle[] {
  const latest = candles.at(-1);
  if (latest && next.openTime > latest.openTime + 60_000)
    throw new Error('Candle gap: resynchronizing.');
  if (candles.length && next.openTime < candles[0].openTime) return candles;
  const existing = candles.find((row) => row.openTime === next.openTime);
  if (
    existing &&
    ((existing.closed && !next.closed) ||
      next.eventTime < existing.eventTime ||
      (next.eventTime === existing.eventTime && existing.closed))
  )
    return candles;
  return [...candles.filter((row) => row.openTime !== next.openTime), next]
    .sort((a, b) => a.openTime - b.openTime)
    .slice(-500);
}
