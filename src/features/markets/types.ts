export const MARKET_SYMBOLS = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'] as const;
export type MarketSymbol = (typeof MARKET_SYMBOLS)[number];
export type MarketMode = 'live' | 'demo';
export type FeedStatus = 'connecting' | 'live' | 'stale' | 'reconnecting' | 'unavailable' | 'demo';
export interface Instrument {
  symbol: MarketSymbol;
  base: string;
  status: string;
  spot: boolean;
  precision: number;
}
export interface Ticker {
  symbol: MarketSymbol;
  price: number;
  change: number;
  quoteVolume: number;
  eventTime: number;
}
export interface Candle {
  openTime: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  closed: boolean;
  eventTime: number;
}
export interface MarketTrade {
  symbol: MarketSymbol;
  id: number;
  price: number;
  quantity: number;
  tradeTime: number;
  eventTime: number;
  side: 'buy' | 'sell';
}
export interface MarketSnapshot {
  instruments: Instrument[];
  tickers: Ticker[];
  candles: Candle[];
}
export type MarketEvent =
  | { type: 'ticker'; ticker: Ticker }
  | { type: 'candle'; symbol: MarketSymbol; candle: Candle }
  | { type: 'trade'; symbol: MarketSymbol; trade: MarketTrade }
  | { type: 'shutdown' };
export interface FeedState extends MarketSnapshot {
  trades: MarketTrade[];
  status: FeedStatus;
  message: string;
  publicMessage?: { code: 'retry' | 'unavailable'; retryAt?: number; rateLimited: boolean };
  updatedAt: number | null;
}
export function isMarketSymbol(value: string): value is MarketSymbol {
  return MARKET_SYMBOLS.some((symbol) => symbol === value);
}
