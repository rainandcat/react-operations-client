import { MarketRequestError } from './marketApi';
import { mergeCandle, mergeTrade, parseEvent } from './parsers';
import type { FeedState, Instrument, MarketEvent, MarketSnapshot, MarketSymbol } from './types';

export const EMPTY_FEED: FeedState = {
  instruments: [],
  tickers: [],
  candles: [],
  trades: [],
  status: 'connecting',
  message: 'Connecting to public market data…',
  updatedAt: null
};
interface FeedOptions {
  symbols: readonly MarketSymbol[];
  detail?: MarketSymbol;
  instruments: (signal: AbortSignal) => Promise<Instrument[]>;
  load: (signal: AbortSignal) => Promise<MarketSnapshot>;
  publish: (state: FeedState) => void;
  socket?: (url: string) => WebSocket;
}
export class MarketFeed {
  private state: FeedState = { ...EMPTY_FEED };
  private epoch = 0;
  private stopped = true;
  private attempts = 0;
  private controller?: AbortController;
  private ws?: WebSocket;
  private retryTimer?: ReturnType<typeof setTimeout>;
  private watchdog?: ReturnType<typeof setInterval>;
  private publishTimer?: ReturnType<typeof setTimeout>;
  private received = new Map<string, number>();
  private required: string[] = [];
  private stableSince = 0;
  private startedAt = 0;
  private hydrated = false;
  private buffer: MarketEvent[] = [];

  constructor(private options: FeedOptions) {}
  start() {
    this.stopped = false;
    document.addEventListener('visibilitychange', this.environmentChanged);
    window.addEventListener('online', this.environmentChanged);
    window.addEventListener('offline', this.environmentChanged);
    this.environmentChanged();
  }
  stop() {
    this.stopped = true;
    this.clearAttempt();
    document.removeEventListener('visibilitychange', this.environmentChanged);
    window.removeEventListener('online', this.environmentChanged);
    window.removeEventListener('offline', this.environmentChanged);
  }
  private emit(status = this.state.status, message = this.state.message) {
    clearTimeout(this.publishTimer);
    this.publishTimer = undefined;
    this.state = { ...this.state, status, message };
    this.options.publish(this.state);
  }
  private clearAttempt() {
    this.epoch++;
    this.controller?.abort();
    this.controller = undefined;
    clearTimeout(this.retryTimer);
    clearInterval(this.watchdog);
    clearTimeout(this.publishTimer);
    this.publishTimer = undefined;
    this.retryTimer = undefined;
    this.watchdog = undefined;
    if (this.ws) {
      this.ws.onopen = this.ws.onmessage = this.ws.onerror = this.ws.onclose = null;
      this.ws.close();
      this.ws = undefined;
    }
    this.buffer = [];
    this.hydrated = false;
    this.received.clear();
    this.stableSince = 0;
  }
  private environmentChanged = () => {
    if (this.stopped) return;
    if (document.hidden || !navigator.onLine) {
      this.clearAttempt();
      this.emit(
        'stale',
        document.hidden
          ? 'Updates paused while this tab is in the background.'
          : 'Offline. The last snapshot is stale.'
      );
    } else {
      this.attempts = 0;
      void this.connect();
    }
  };
  private fail(error: unknown) {
    if (this.stopped) return;
    const message = error instanceof Error ? error.message : 'Market connection interrupted.';
    const rate = error instanceof MarketRequestError ? error.retryAt : 0;
    const terminal = error instanceof MarketRequestError && error.terminal;
    this.clearAttempt();
    if (terminal || this.attempts >= 5) {
      this.emit(
        'unavailable',
        `${message} Use Retry connection to recover. Last snapshot may be stale.`
      );
      return;
    }
    const delay = Math.max(
      rate - Date.now(),
      Math.min(30_000, 1000 * 2 ** this.attempts) * (0.8 + Math.random() * 0.4)
    );
    this.attempts++;
    this.emit(
      'reconnecting',
      `${message} Retrying at ${new Date(Date.now() + delay).toLocaleTimeString()}. Last snapshot may be stale.`
    );
    this.retryTimer = setTimeout(
      () => {
        void this.connect();
      },
      Math.min(delay, 2_147_483_647)
    );
  }
  private apply(event: MarketEvent) {
    if (event.type === 'ticker') {
      const current = this.state.tickers.find((row) => row.symbol === event.ticker.symbol);
      if (current && event.ticker.eventTime < current.eventTime) return;
      this.state = {
        ...this.state,
        tickers: [
          ...this.state.tickers.filter((row) => row.symbol !== event.ticker.symbol),
          event.ticker
        ]
      };
    } else if (event.type === 'candle') {
      this.state = { ...this.state, candles: mergeCandle(this.state.candles, event.candle) };
    } else if (event.type === 'trade') {
      this.state = { ...this.state, trades: mergeTrade(this.state.trades, event.trade) };
    }
  }
  private checkFreshness() {
    const now = Date.now();
    const fresh = this.required.every((key) => now - (this.received.get(key) ?? 0) < 15_000);
    if (!fresh) {
      if (now - this.startedAt >= 15_000)
        this.fail(new Error('Stream data is stale. Resynchronizing.'));
      return;
    }
    if (!this.hydrated) return;
    if (!this.stableSince) this.stableSince = now;
    if (now - this.stableSince > 60_000) this.attempts = 0;
    if (this.state.status !== 'live') this.emit('live', 'Live · Binance Spot public market data');
    else if (!this.publishTimer) this.publishTimer = setTimeout(() => this.emit(), 250);
  }
  private async connect() {
    this.clearAttempt();
    if (this.stopped || document.hidden || !navigator.onLine) return;
    const epoch = this.epoch;
    const controller = new AbortController();
    this.controller = controller;
    this.startedAt = Date.now();
    this.state = { ...this.state, trades: [] };
    this.required = this.options.symbols.map((symbol) => `${symbol}:ticker`);
    if (this.options.detail) this.required.push(`${this.options.detail}:candle`);
    this.emit(this.attempts ? 'reconnecting' : 'connecting', 'Synchronizing public market data…');
    try {
      const instruments = await this.options.instruments(controller.signal);
      if (this.stopped || epoch !== this.epoch) return;
      const active = instruments
        .filter(
          (row) => this.options.symbols.includes(row.symbol) && row.status === 'TRADING' && row.spot
        )
        .map((row) => row.symbol);
      if (!active.length || (this.options.detail && !active.includes(this.options.detail))) {
        this.state = {
          instruments,
          tickers: [],
          candles: [],
          trades: [],
          status: 'unavailable',
          message: 'Selected pairs are unavailable for Spot trading.',
          updatedAt: null
        };
        this.emit();
        return;
      }
      this.required = active.map((symbol) => `${symbol}:ticker`);
      if (this.options.detail) this.required.push(`${this.options.detail}:candle`);
      this.startedAt = Date.now();
      const streams = active.map((symbol) => `${symbol.toLowerCase()}@ticker`);
      if (this.options.detail)
        streams.push(
          `${this.options.detail.toLowerCase()}@kline_1m`,
          `${this.options.detail.toLowerCase()}@trade`
        );
      const ws = (this.options.socket ?? ((url) => new WebSocket(url)))(
        `wss://data-stream.binance.vision:443/stream?streams=${streams.join('/')}`
      );
      this.ws = ws;
      ws.onmessage = (message) => {
        if (this.stopped || epoch !== this.epoch) return;
        try {
          const event = parseEvent(JSON.parse(String(message.data)));
          if (event.type === 'shutdown') {
            this.fail(new Error('Market service is restarting.'));
            return;
          }
          const symbol = event.type === 'ticker' ? event.ticker.symbol : event.symbol;
          if (
            !active.includes(symbol) ||
            ((event.type === 'candle' || event.type === 'trade') && symbol !== this.options.detail)
          )
            throw new Error('Unexpected subscription data.');
          const eventTime =
            event.type === 'ticker'
              ? event.ticker.eventTime
              : event.type === 'trade'
                ? event.trade.eventTime
                : event.candle.eventTime;
          if (Math.abs(Date.now() - eventTime) > 15_000)
            throw new Error('Stream timestamp is stale.');
          this.received.set(`${symbol}:${event.type}`, Date.now());
          if (event.type === 'trade') {
            this.apply(event);
            if (this.hydrated) this.checkFreshness();
            return;
          }
          if (!this.hydrated) {
            if (this.buffer.length >= 1000) throw new Error('Stream buffer full. Resynchronizing.');
            this.buffer.push(event);
          } else {
            this.apply(event);
            this.state = {
              ...this.state,
              updatedAt: Math.max(this.state.updatedAt ?? 0, eventTime)
            };
          }
          this.checkFreshness();
        } catch (error) {
          this.fail(error);
        }
      };
      ws.onclose = () => {
        if (epoch === this.epoch) this.fail(new Error('Market stream disconnected.'));
      };
      ws.onerror = () => {
        if (epoch === this.epoch) this.fail(new Error('Market stream unavailable.'));
      };
      this.watchdog = setInterval(() => this.checkFreshness(), 1000);
      const snapshot = await this.options.load(controller.signal);
      if (this.stopped || epoch !== this.epoch) return;
      this.state = {
        ...snapshot,
        trades: this.state.trades,
        status: 'connecting',
        message: 'Snapshot loaded. Waiting for live streams; prices may be stale.',
        updatedAt: Math.max(0, ...snapshot.tickers.map((row) => row.eventTime)) || null
      };
      for (const event of this.buffer) this.apply(event);
      this.buffer = [];
      this.hydrated = true;
      this.emit();
      this.checkFreshness();
    } catch (error) {
      if (!this.stopped && epoch === this.epoch) this.fail(error);
    }
  }
}
