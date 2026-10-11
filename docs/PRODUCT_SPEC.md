# React Operations Client product specification

Implemented state as of 2026-10-11. Public market data and fictional accounts are separate domains. The application is read only and unofficial.

## Public routes

| Route                                              | Behavior                                                                                                                       |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `/`                                                | Hero followed by searchable four-column Spot watchlist: pair, price in USDT, rolling 24h percentage and quote volume in USDT   |
| `/markets/:symbol`                                 | Allowlisted pair summary and interactive UTC 1m candles; pair selection, source time, connection state, retry, fixed/live mode |
| Unknown routes, removed `/overview` and `/sign-in` | Explicit 404 and return to public markets                                                                                      |

Initial symbols: BTCUSDT, ETHUSDT, SOLUSDT. Metadata controls Spot eligibility, status and price precision. Unknown syntax, unsupported symbols and known inactive pairs have distinct messages. Inactive pairs do not subscribe.

Live is default. `mode=demo` explicitly selects fixed locally authored January 2026 data, making no market REST requests or sockets. Search/mode are URL-backed. There is no automatic mock fallback.

Connecting, live, stale/background/offline, reconnecting and unavailable are visible. A snapshot alone cannot claim live. Invalid payloads do not become zero prices. Users can retry or deliberately choose demonstration. Markets never show wallet ID or balance.

## Authentication

`/wallet/overview`, `/activity`, `/activity/:activityId`, `/notifications`, `/preferences` require a local demo session. Unauthenticated deep links replace the location with Home and an open dialog. Validated destination/query/hash survive reload. No mock account query mounts before login.

Header Sign in opens the shared dialog on the current page. Success stays there or returns to the protected destination. Cancel/Escape clears pending destination and restores focus. Tab stays inside; back/forward follow URL dialog state. Mobile uses a full-height dialog with the same form state. Sign out returns to `/`.

Demo account: member@demo.invalid / demo123. This is not Binance authentication or server authorization. Passcode is never persisted. Session storage contains a minimal fictional session.

## Fictional accounts

Wallet Overview shows the existing single fictional balance prominently, then account ID and update time; no invented wallets or financial actions. Activity and notification mock APIs remain independent. URL filters/pagination support loading/error/empty states; activity details preserve return filters. Notifications are read-only. Theme/list density persist in local storage and apply to public and protected pages.

## Market contracts

Detail includes a recent trades table: price in USDT, quantity in the base asset, execution time in UTC and explicit taker Buy/Sell. The shared socket subscribes to `@trade`; newest 50 executions are deduplicated by ID and sorted by execution time. Live publications batch at 250ms. No historical trade request or gap backfill occurs; reconnection restarts the list. Paused records are labelled, and a healthy quiet stream has an explicit waiting state. Fixed demonstration supplies separate locally authored executions.

REST initializes metadata, ticker and up to 300 1m candles. Native WS updates selected ticker/kline streams. Page-owned subscriptions buffer before history, discard late generations, merge same candles, bound memory, detect gaps and resynchronize. Hidden/offline closes streams; foreground reloads history. Each visible tab owns its socket. No keys, signed requests or private streams.

See [Market design](MARKET_DESIGN.md) for source review, thresholds, precision, cancellation, Retry-After and chart attribution. Unit/hook tests and fixture-backed Chromium journeys are separate from the [real-network smoke report](market-smoke.json). Public deployment and remote CI remain unverified.
