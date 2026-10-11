# Public Spot market implementation

## Phase C: recent executions (2026-10-11)

Reviewed `firebit-member/src/views/trade/components/OrderBook.vue` trade panel: price, base quantity, execution time, scrolling rows and direction color. Reimplemented this hierarchy as a standalone React panel below the chart, with explicit Buy/Sell text and UTC; order book remains deferred.

The detail combined socket adds `<symbol>@trade`. Runtime validation covers symbol, safe integer ID, positive price/quantity, timestamps and buyer-maker boolean. Buyer maker means taker Sell. Deduplicate symbol/ID, sort execution time then ID descending, retain 50; pre-hydration trades have their own bounded list and do not fill the candle event buffer. Ongoing live publications batch at 250ms. Quiet trades do not participate in ticker/candle freshness requirements. Attempt cleanup cancels pending publications and ignores old callbacks. Failed connections retain labelled records; new connections reset them without gap backfill. Demo mode uses locally authored fixtures and no socket.

The list reserves a fixed 25rem viewport for empty, partial and full states to avoid row-count-driven layout shifts. The themed scrollbar keeps its gutter reserved, appears only during scrolling and hides after 800ms idle; unmount clears its timer. Reduced-motion and forced-color preferences are respected.

Checked the official [Trade Streams contract](https://github.com/binance/binance-spot-api-docs/blob/master/web-socket-streams.md#trade-streams). Verification: 60 Vitest tests and 18 desktop/mobile Chromium E2E cases; real BTCUSDT smoke reached live and received executions without page errors. See `market-smoke.json` for the dated local report.

Scope authorized on 2026-10-10: execute the Binance extension before external publication of the original portfolio. Manager and account features remain mock. Only Client market services use public, keyless Binance URLs. BTCUSDT, ETHUSDT and SOLUSDT are the initial allowlist.

## Source review

| Source / evidence                                                                                              | Adopted design                                                   | Required difference                                                                                               |
| -------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `Home.vue`, `HotTodaySection.vue`, mobile equivalent: hero followed by pair / price / change / volume          | Same information hierarchy, Client palette; searchable allowlist | Quote volume explicitly in USDT; rolling 24h, not today                                                           |
| `useHomeQuoteStats` in `composables/trade/useQuote.ts`: 5s polling paused while hidden, listener/timer cleanup | Pause in background, refresh on return                           | Native public WS; no internal polling endpoint                                                                    |
| `TradeChart.vue`: history applied asynchronously, realtime skipped while loading, pair watchers fetch history  | History initialization and same-candle updates                   | Buffer events before REST completes; abort and generation checks; reject stale events; bounded data               |
| `TradeChart.vue`: connect handler refetches history                                                            | Resynchronize after reconnect                                    | Require hydration plus all selected streams before live; detect gaps and stale streams                            |
| Source chart uses klinecharts, dispose and window resize                                                       | Interactive candles, disposal and resize lifecycle               | Lightweight Charts, Apache-2.0 with NOTICE/TradingView attribution; ResizeObserver; fixed 1m, no indicators       |
| `router/index.ts` requiresAuth redirects Home and opens login; `App.vue` hosts desktop/mobile login            | Public Home, shared dialog, protected wallet                     | Store validated destination in Home query, survive reload/back/forward, clear on cancel; no OTP/backend           |
| `WalletOverviewPage.vue`: prominent total followed by account/asset information                                | Prominent existing mock balance and account details              | One fictional account only; no invented wallets or transfer buttons                                               |
| Socket stores: Socket.IO retry and cross-tab leadership                                                        | Explicit connection ownership, bounded retries                   | One native socket per mounted market page per visible tab; no cross-tab singleton; 5 retries then manual recovery |
| Source uses internal payloads and lacks Binance fixture coverage                                               | Existing presentation only                                       | Runtime parsers, keyless allowlist, isolated fixture mode, deterministic CI                                       |

## Contracts

- Public `/`, `/markets/:symbol`; protected `/wallet/overview`, `/activity`, `/notifications`, `/preferences`. Removed `/overview` and `/sign-in` return 404. Demo authentication is unrelated to Binance.
- Default live; explicit URL `mode=demo` selects fixed locally authored data, never silently substitutes. Mode/symbol/interval are included in query keys. No websocket in demo mode.
- Exchange metadata must identify USDT Spot pairs; inactive or non-Spot instruments never subscribe. Prices use PRICE_FILTER tick precision, quote volume is USDT, chart axes/time are UTC, payload timestamps are milliseconds.
- Snapshot requests use TanStack Query (no Query retry). API context coordinates 429/418 cooldown across market calls in this app. No automatic REST retry; WS recovery is the sole retry owner. Retry-After seconds/date honored; conservative 60s/120s fallback if absent. Request timeout 12s. Cooldown does not bypass manual retry.
- Subscribe first, buffer at most 1,000 events, fetch 300 one-minute candles, merge by open time and event time, retain at most 500. Closed candles never reopen; invalid/nonfinite/OHLC-inconsistent data fail explicitly. Gaps trigger resynchronization. REST cannot replace newer buffered WS updates.
- Connecting → live only after snapshot and every selected stream has received a valid recent event. 15s stale threshold; reconnect with jitter at 1/2/4/8/16s (30s cap), 5 retries. Retry count resets only after 60s stable reception. serverShutdown, offline and visibility changes close subscriptions; foreground/online resynchronize. WS failure keeps snapshot labelled stale/unavailable.
- Each connection attempt owns abort controller, listeners, timers and epoch. Late responses cannot publish after restart/unmount. No application string ping; browser handles protocol control frames.
- Chart loads bounded history (no left pagination), supports pan/zoom and touch. Initial view fits; updates preserve user position; Follow latest explicitly restores following. Theme applies without recreating subscriptions. ResizeObserver/chart disposal run on unmount.

Official references checked 2026-10-10: [REST](https://github.com/binance/binance-spot-api-docs/blob/master/rest-api.md), [WS](https://github.com/binance/binance-spot-api-docs/blob/master/web-socket-streams.md), [chart docs](https://tradingview.github.io/lightweight-charts/docs). Fixture validation and real network smoke checks are recorded separately.
