// @vitest-environment jsdom
import { StrictMode, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MarketProvider } from './MarketProvider';
import { MarketApi } from './marketApi';
import { fixtureSnapshot } from './fixtures';
import { useMarketFeed } from './useMarketFeed';
import type { MarketMode, MarketSnapshot, MarketSymbol } from './types';

class SocketProbe {
  static instances: SocketProbe[] = [];
  onmessage = null;
  onclose = null;
  onerror = null;
  onopen = null;
  closed = false;
  constructor(public url: string) {
    SocketProbe.instances.push(this);
  }
  close() {
    this.closed = true;
  }
}
const btc = ['BTCUSDT'] as const;
const eth = ['ETHUSDT'] as const;
const clients: QueryClient[] = [];
function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  clients.push(client);
  return (
    <StrictMode>
      <QueryClientProvider client={client}>
        <MarketProvider>{children}</MarketProvider>
      </QueryClientProvider>
    </StrictMode>
  );
}
afterEach(() => {
  cleanup();
  clients.forEach((client) => client.clear());
  clients.length = 0;
  SocketProbe.instances = [];
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
describe('React market lifecycle', () => {
  it('cleans StrictMode subscriptions, isolates symbols and ignores old responses', async () => {
    vi.stubGlobal('WebSocket', SocketProbe);
    vi.spyOn(MarketApi.prototype, 'instruments').mockImplementation(
      async (symbols) => fixtureSnapshot(symbols).instruments
    );
    let resolveBtc!: (value: MarketSnapshot) => void;
    let btcSignal!: AbortSignal;
    vi.spyOn(MarketApi.prototype, 'snapshot').mockImplementation(
      async (_mode, symbols, detail, signal) => {
        if (detail === 'BTCUSDT') {
          btcSignal = signal;
          return new Promise((resolve) => {
            resolveBtc = resolve;
          });
        }
        return fixtureSnapshot(symbols, detail);
      }
    );
    const { result, rerender, unmount } = renderHook(
      ({ symbols, detail }: { symbols: readonly MarketSymbol[]; detail: MarketSymbol }) =>
        useMarketFeed('live', symbols, detail),
      { initialProps: { symbols: btc, detail: 'BTCUSDT' }, wrapper }
    );
    await waitFor(() =>
      expect(SocketProbe.instances.filter((socket) => !socket.closed)).toHaveLength(1)
    );
    await waitFor(() => expect(resolveBtc).toBeTypeOf('function'));
    rerender({ symbols: eth, detail: 'ETHUSDT' });
    await waitFor(() => expect(result.current.tickers[0]?.symbol).toBe('ETHUSDT'));
    expect(btcSignal.aborted).toBe(true);
    await act(async () => {
      resolveBtc(fixtureSnapshot(btc, 'BTCUSDT'));
    });
    expect(result.current.tickers[0].symbol).toBe('ETHUSDT');
    expect(SocketProbe.instances.filter((socket) => !socket.closed)).toHaveLength(1);
    unmount();
    expect(SocketProbe.instances.every((socket) => socket.closed)).toBe(true);
  });
  it('closes live connections when switching to demonstration and cannot leak live prices into it', async () => {
    vi.stubGlobal('WebSocket', SocketProbe);
    vi.spyOn(MarketApi.prototype, 'instruments').mockImplementation(
      async (symbols) => fixtureSnapshot(symbols).instruments
    );
    vi.spyOn(MarketApi.prototype, 'snapshot').mockImplementation(
      async (_mode, symbols, detail) => ({
        ...fixtureSnapshot(symbols, detail),
        tickers: [
          { symbol: 'BTCUSDT', price: 99, change: 1, quoteVolume: 1, eventTime: Date.now() }
        ]
      })
    );
    const { result, rerender } = renderHook(
      ({ mode }: { mode: MarketMode }) => useMarketFeed(mode, btc, 'BTCUSDT'),
      { initialProps: { mode: 'live' as MarketMode }, wrapper }
    );
    await waitFor(() => expect(result.current.tickers[0]?.price).toBe(99));
    rerender({ mode: 'demo' });
    expect(result.current.status).toBe('demo');
    expect(result.current.tickers[0].price).toBe(62000);
    expect(SocketProbe.instances.every((socket) => socket.closed)).toBe(true);
  });
});
