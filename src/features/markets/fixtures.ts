import { MARKET_SYMBOLS, type MarketSnapshot, type MarketSymbol, type MarketTrade } from './types';

// Locally authored, fixed demonstration data. Never a fallback for live requests.
const prices = { BTCUSDT: 62000, ETHUSDT: 3200, SOLUSDT: 145 };
export function fixtureTrades(symbol: MarketSymbol): MarketTrade[] {
  return Array.from({ length: 50 }, (_, index) => ({
    symbol,
    id: 1000 - index,
    price: prices[symbol] * (1 + Math.sin(index) * 0.0002),
    quantity: 0.001 * ((index % 8) + 1),
    tradeTime: Date.UTC(2026, 0, 15, 12, 59) - index * 1000,
    eventTime: Date.UTC(2026, 0, 15, 12, 59) - index * 1000,
    side: index % 2 ? 'sell' : 'buy'
  }));
}
export function fixtureSnapshot(
  symbols: readonly MarketSymbol[],
  detail?: MarketSymbol
): MarketSnapshot {
  const start = Date.UTC(2026, 0, 15, 8);
  return {
    instruments: MARKET_SYMBOLS.filter((symbol) => symbols.includes(symbol)).map((symbol) => ({
      symbol,
      base: symbol.replace(/USDT$/, ''),
      status: 'TRADING',
      spot: true,
      precision: 2
    })),
    tickers: symbols.map((symbol, index) => ({
      symbol,
      price: prices[symbol],
      change: [1.82, -0.74, 2.31][index],
      quoteVolume: 12_000_000 * (index + 1),
      eventTime: start + 299 * 60_000
    })),
    candles: detail
      ? Array.from({ length: 300 }, (_, index) => {
          const base = prices[detail];
          const open = base * (1 + Math.sin(index / 12) * 0.006 + index * 0.00001);
          const close = open + Math.sin(index + 1) * base * 0.0008;
          return {
            openTime: start + index * 60_000,
            open,
            high: Math.max(open, close) + base * 0.0004,
            low: Math.min(open, close) - base * 0.0004,
            close,
            volume: 10 + (index % 20),
            closed: true,
            eventTime: start + (index + 1) * 60_000
          };
        })
      : []
  };
}
