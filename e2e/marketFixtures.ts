import type { Page, WebSocketRoute } from '@playwright/test';
import { MARKET_SYMBOLS } from '../src/features/markets/types';

export async function installMarketFixtures(page: Page) {
  const sockets: WebSocketRoute[] = [];
  const closed = new Set<WebSocketRoute>();
  await page.route('https://data-api.binance.vision/**', async (route) => {
    const url = new URL(route.request().url());
    const symbols = JSON.parse(url.searchParams.get('symbols') ?? '[]') as string[];
    const time = Math.floor(Date.now() / 60_000) * 60_000;
    let body: unknown;
    if (url.pathname.endsWith('exchangeInfo'))
      body = {
        symbols: symbols.map((symbol) => ({
          symbol,
          baseAsset: symbol.replace('USDT', ''),
          quoteAsset: 'USDT',
          status: 'TRADING',
          isSpotTradingAllowed: true,
          filters: [{ filterType: 'PRICE_FILTER', tickSize: '0.01000000' }]
        }))
      };
    else if (url.pathname.endsWith('ticker/24hr'))
      body = symbols.map((symbol) => ({
        symbol,
        lastPrice: '60000.00',
        priceChangePercent: '1.25',
        quoteVolume: '12345678.00',
        closeTime: Date.now()
      }));
    else if (url.pathname.endsWith('klines'))
      body = Array.from({ length: 300 }, (_, index) => {
        const open = time - (299 - index) * 60_000;
        return [
          open,
          '60000',
          '60010',
          '59990',
          '60002',
          '20',
          open + 59_999,
          '1200000',
          10,
          '10',
          '600000',
          '0'
        ];
      });
    else {
      await route.abort();
      return;
    }
    await route.fulfill({ json: body });
  });
  await page.routeWebSocket('wss://data-stream.binance.vision/**', (ws) => {
    sockets.push(ws);
    const url = new URL(ws.url());
    const streams = (url.searchParams.get('streams') ?? '').split('/');
    const timer = setInterval(() => {
      for (const symbol of MARKET_SYMBOLS) {
        if (streams.includes(`${symbol.toLowerCase()}@ticker`))
          ws.send(
            JSON.stringify({
              e: '24hrTicker',
              E: Date.now(),
              s: symbol,
              c: '60000',
              P: '1.25',
              q: '12345678'
            })
          );
        if (streams.includes(`${symbol.toLowerCase()}@kline_1m`)) {
          const time = Math.floor(Date.now() / 60_000) * 60_000;
          ws.send(
            JSON.stringify({
              e: 'kline',
              E: Date.now(),
              s: symbol,
              k: {
                t: time,
                T: time + 59_999,
                s: symbol,
                i: '1m',
                o: '60000',
                h: '60010',
                l: '59990',
                c: '60002',
                v: '20',
                x: false
              }
            })
          );
        }
      }
    }, 300);
    ws.onClose(() => {
      clearInterval(timer);
      closed.add(ws);
    });
  });
  return { sockets, closed };
}
