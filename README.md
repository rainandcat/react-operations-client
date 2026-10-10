# React Operations Client

A React + TypeScript portfolio app with a public Spot market notebook and a separate fictional account experience. Market data comes from keyless Binance endpoints; wallet, activity, notifications and authentication remain local mocks. This is an unofficial, read-only product.

## Explore

- Public `/`: searchable BTC/USDT, ETH/USDT and SOL/USDT watchlist with price, rolling 24h change and USDT quote volume.
- Public `/markets/:symbol`: 24h summary and interactive one-minute UTC candles, connection state and recovery.
- Shared demo sign-in dialog: stays on the current public page or returns to the requested protected URL. Cancel clears the destination; reload and browser history preserve dialog state.
- Protected `/wallet/overview`, `/activity`, `/activity/:activityId`, `/notifications`, `/preferences`: fictional balance/records, URL filters/pagination, persistent light/dark theme and list density.
- Removed `/overview` and `/sign-in` return 404.

## Run locally

Use Node.js 22.14 or newer in the Node 22 line.

```bash
npm ci
npm run dev
```

Home opens without authentication. Choose **Fixed demonstration** in Market data, or open `/?mode=demo`, to explore locally authored fixed fixtures without external connectivity. This is explicit, never a silent fallback for live data. Live requires browser access to `data-api.binance.vision` and `data-stream.binance.vision`.

Demo account: `member@demo.invalid`, passcode `demo123`. These are public fictional strings. Session lives in session storage; preferences in local storage. The dialog does not connect a Binance account.

## Preview

![Public market notebook on desktop, fixed demonstration data](docs/screenshots/market-home-desktop.png)

<img src="docs/screenshots/market-detail-mobile.png" width="390" alt="One-minute candles on mobile viewport, fixed demonstration data" />

These screenshots use explicit fixed demonstration mode. [Real connection evidence](docs/market-smoke.json) and the [live smoke screenshot](docs/screenshots/market-live-smoke.png) are separate dated artifacts.

Regenerate the fixed market screenshots with `npm run screenshots:markets` after UI changes.

## Architecture

```mermaid
flowchart LR
  Router[Public and protected routes] --> UI[Feature pages]
  UI --> Query[TanStack Query snapshots]
  Query --> REST[Public Binance REST]
  WS[Page-owned WebSocket] --> Merge[Buffered candle and ticker merge]
  Query --> Merge
  Merge --> UI
  Store[Zustand session and preferences] --> UI
  UI --> Mock[Fictional account APIs]
```

- Feature directories own UI, hooks, services, types and tests. No runtime imports from Manager.
- Query owns metadata and REST snapshots. One market API instance coordinates rate-limit cooldown; Query does not multiply retries. Requests cancel with their page/connection attempt.
- Each mounted market page owns one socket per visible tab. Background/offline closes it; foreground, reconnect and candle gaps resynchronize history before live.
- Events buffer while REST loads, with generation checks for late results. Candles merge by open time/event time and never reopen after closure. Limits: 300 initial candles, 500 retained, 1,000 buffered events.
- Every selected stream must be fresh before live. A 15s stale threshold and bounded jittered reconnect protect recovery. WS failure retains a labelled stale snapshot. 429/418 honor Retry-After, including manual retry.
- Live and fixture data stay separate. Invalid payloads fail rather than becoming zero prices. Metadata excludes non-Spot/inactive instruments.
- Charts support pan/zoom, Follow latest, themes and ResizeObserver cleanup. Lightweight Charts 5.2.1 uses Apache-2.0; creator/NOTICE attribution and TradingView link are displayed.
- URL owns mode/search and account filters. Query data is not mirrored into Zustand.

See [Market design](docs/MARKET_DESIGN.md) and [Product spec](docs/PRODUCT_SPEC.md). Selected legacy information hierarchy and interactions were reimplemented in React using the Client palette; no Vue source, styles, assets, private endpoints or account data were copied.

## Verification

```bash
npm run typecheck
npm run lint
npm run format:check
npm run test
npm run build
npx playwright install chromium
npm run test:e2e
```

Local verification on 2026-10-10: 52 Vitest tests and 16 Chromium E2E cases (eight journeys × desktop/mobile viewports). E2E uses fixed intercepted REST/WS payloads, independent of Binance availability. Cases cover markets, candles, rapid symbol/mode switching, login/history/focus, rate limits, inactive pairs, dark theme and existing account flows. Mobile means a viewport, not a physical device or Safari.

Optional real-network smoke check, separate from CI:

```bash
npm run test:market-smoke
```

It builds and opens production preview on port 4175, connects to public data and saves a dated JSON report and screenshot. The local BTCUSDT check on 2026-10-10 reached live with metadata/ticker/candles HTTP 200 and no page errors. This confirms that local environment at that time; deployment connectivity is not claimed.

## Limits

No keys, account integration, orders, order book, trade tape, token refresh or official affiliation. Mock wallet data is unrelated to public prices. Notifications remain read-only. No public deployment, remote CI result, performance benchmark, physical-device or Safari verification is claimed. No leftward historical pagination; charts show bounded recent history. Visible tabs each own their connection without cross-tab leadership. Static hosting must rewrite app routes to `index.html`.
