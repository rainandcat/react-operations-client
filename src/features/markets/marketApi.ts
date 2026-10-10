import { QueryClient } from '@tanstack/react-query';
import { parseCandles, parseInstruments, parseTicker } from './parsers';
import { fixtureSnapshot } from './fixtures';
import type { MarketMode, MarketSnapshot, MarketSymbol } from './types';

export class MarketRequestError extends Error {
  constructor(
    message: string,
    public retryAt = 0,
    public terminal = false
  ) {
    super(message);
  }
}
export class MarketApi {
  private blockedUntil = 0;
  constructor(
    private queryClient: QueryClient,
    private fetcher: typeof fetch = (...args) => fetch(...args)
  ) {}

  private async query<T>(
    queryKey: readonly unknown[],
    load: (signal: AbortSignal) => Promise<T>,
    signal?: AbortSignal,
    staleTime = 0
  ): Promise<T> {
    signal?.throwIfAborted();
    const cancel = () => {
      void this.queryClient.cancelQueries({ queryKey, exact: true });
    };
    signal?.addEventListener('abort', cancel, { once: true });
    try {
      const result = await this.queryClient.fetchQuery({
        queryKey,
        queryFn: ({ signal }) => load(signal),
        staleTime,
        retry: false
      });
      signal?.throwIfAborted();
      return result;
    } finally {
      signal?.removeEventListener('abort', cancel);
    }
  }

  private async request(path: string, signal: AbortSignal): Promise<unknown> {
    if (Date.now() < this.blockedUntil)
      throw new MarketRequestError(
        'Market requests are paused by the service rate limit.',
        this.blockedUntil
      );
    const response = await this.fetcher(`https://data-api.binance.vision/api/v3/${path}`, {
      signal: AbortSignal.any([signal, AbortSignal.timeout(12_000)]),
      credentials: 'omit'
    });
    if (response.status === 429 || response.status === 418) {
      const header = response.headers.get('Retry-After');
      const seconds = header === null ? NaN : Number(header);
      const parsedDate = header === null ? NaN : Date.parse(header);
      const fallback = response.status === 418 ? 120_000 : 60_000;
      const wait =
        Number.isFinite(seconds) && seconds >= 0
          ? Math.max(1_000, seconds * 1000)
          : Number.isFinite(parsedDate)
            ? Math.max(1_000, parsedDate - Date.now())
            : fallback;
      this.blockedUntil = Math.max(this.blockedUntil, Date.now() + wait);
      throw new MarketRequestError(
        'The market service has limited requests. Retry after the displayed time.',
        this.blockedUntil
      );
    }
    if (!response.ok)
      throw new MarketRequestError(
        `Market service unavailable (HTTP ${response.status}).`,
        0,
        response.status >= 400 && response.status < 500
      );
    return response.json();
  }

  async instruments(symbols: readonly MarketSymbol[], signal?: AbortSignal) {
    return this.query(
      ['market', 'live', 'exchange', symbols.join(',')],
      (signal) =>
        this.request(
          `exchangeInfo?symbols=${encodeURIComponent(JSON.stringify(symbols))}`,
          signal
        ).then((data) => {
          const rows = parseInstruments(data);
          if (
            new Set(rows.map((row) => row.symbol)).size !== rows.length ||
            rows.some((row) => !symbols.includes(row.symbol))
          )
            throw new Error('Exchange metadata does not match requested instruments.');
          return rows;
        }),
      signal,
      300_000
    );
  }

  async snapshot(
    mode: MarketMode,
    symbols: readonly MarketSymbol[],
    detail: MarketSymbol | undefined,
    signal: AbortSignal
  ): Promise<MarketSnapshot> {
    if (mode === 'demo') return fixtureSnapshot(symbols, detail);
    const instruments = await this.instruments(symbols, signal);
    signal.throwIfAborted();
    const active = instruments.filter(
      (row) => symbols.includes(row.symbol) && row.status === 'TRADING' && row.spot
    );
    if (!active.length || (detail && !active.some((row) => row.symbol === detail)))
      return { instruments, tickers: [], candles: [] };
    const tickers = await this.query(
      ['market', mode, 'ticker', active.map((row) => row.symbol).join(',')],
      async (signal) => {
        const data = await this.request(
          `ticker/24hr?symbols=${encodeURIComponent(JSON.stringify(active.map((row) => row.symbol)))}`,
          signal
        );
        if (!Array.isArray(data)) throw new Error('Invalid ticker response.');
        const rows = data.map((row) => parseTicker(row));
        if (
          rows.length !== active.length ||
          new Set(rows.map((row) => row.symbol)).size !== rows.length ||
          rows.some((row) => !active.some((instrument) => instrument.symbol === row.symbol))
        )
          throw new Error('Ticker response does not match the requested instruments.');
        return rows;
      },
      signal
    );
    const candles = detail
      ? await this.query(
          ['market', mode, 'candles', detail, '1m', 300],
          (signal) =>
            this.request(`klines?symbol=${detail}&interval=1m&limit=300`, signal).then((data) =>
              parseCandles(data)
            ),
          signal
        )
      : [];
    signal.throwIfAborted();
    return { instruments, tickers, candles };
  }
}
