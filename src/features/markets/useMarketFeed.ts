import { useEffect, useState } from 'react';
import { MarketFeed, EMPTY_FEED } from './marketFeed';
import { useMarketApi } from './MarketProvider';
import { fixtureSnapshot } from './fixtures';
import { type FeedState, type MarketMode, type MarketSymbol } from './types';

export function useMarketFeed(
  mode: MarketMode,
  symbols: readonly MarketSymbol[],
  detail?: MarketSymbol
) {
  const api = useMarketApi();
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{ key: string; state: FeedState } | null>(null);
  const key = `${mode}:${symbols.join(',')}:${detail ?? ''}:${attempt}`;
  useEffect(() => {
    if (mode === 'demo') return;
    const feed = new MarketFeed({
      symbols,
      detail,
      instruments: (signal) => api.instruments(symbols, signal),
      load: (signal) => api.snapshot(mode, symbols, detail, signal),
      publish: (state) => setResult({ key, state })
    });
    feed.start();
    return () => feed.stop();
  }, [api, key, mode, symbols, detail]);
  const state: FeedState =
    mode === 'demo'
      ? {
          ...fixtureSnapshot(symbols, detail),
          status: 'demo',
          message: 'Fixed demonstration data · 15 Jan 2026 · No live connection',
          updatedAt: Date.UTC(2026, 0, 15, 12, 59)
        }
      : result?.key === key
        ? result.state
        : EMPTY_FEED;
  return { ...state, retry: () => setAttempt((value) => value + 1) };
}
