import { useEffect, useRef } from 'react';
import type { UIEvent } from 'react';
import { formatPrice } from './MarketControls';
import { TRADE_LIMIT } from './parsers';
import type { FeedStatus, MarketTrade } from './types';

export function RecentTrades({
  trades,
  base,
  precision,
  status
}: {
  trades: MarketTrade[];
  base: string;
  precision: number;
  status: FeedStatus;
}) {
  const scrollTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(scrollTimer.current), []);
  function showScrollbar(event: UIEvent<HTMLDivElement>) {
    const element = event.currentTarget;
    element.dataset.scrolling = 'true';
    clearTimeout(scrollTimer.current);
    scrollTimer.current = setTimeout(() => {
      delete element.dataset.scrolling;
    }, 800);
  }
  const paused = status === 'stale' || status === 'reconnecting' || status === 'unavailable';
  return (
    <section className="recent-trades" aria-labelledby="recent-trades-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Public executions</p>
          <h2 id="recent-trades-title">Recent trades</h2>
        </div>
        <p>
          {status === 'demo'
            ? 'Fixed demonstration'
            : paused
              ? 'Updates paused · Records may be stale'
              : 'Received in this connection'}{' '}
          · Latest {TRADE_LIMIT}
        </p>
      </div>
      <p className="muted">
        Price in USDT, quantity in {base}, time in UTC. Buy / Sell indicates the taker side.
        Disconnected periods are not backfilled; the list restarts on reconnection.
      </p>
      <div className="trade-viewport">
        {trades.length ? (
          <div
            className="trade-scroll"
            onScroll={showScrollbar}
            tabIndex={0}
            role="region"
            aria-label="Recent trades table, scroll for earlier executions"
          >
            <table className="market-table trade-table">
              <caption className="sr-only">Recent {base} / USDT executions, newest first</caption>
              <thead>
                <tr>
                  <th scope="col">Price · USDT</th>
                  <th scope="col">Quantity · {base}</th>
                  <th scope="col">Time · UTC</th>
                </tr>
              </thead>
              <tbody>
                {trades.map((trade) => (
                  <tr key={`${trade.symbol}:${trade.id}`} data-trade-id={trade.id}>
                    <td className={trade.side === 'buy' ? 'market-up' : 'market-down'}>
                      <span>{formatPrice(trade.price, precision)}</span>
                      <small>{trade.side === 'buy' ? 'Buy' : 'Sell'}</small>
                    </td>
                    <td>
                      {trade.quantity.toLocaleString('en-US', { maximumSignificantDigits: 12 })}
                    </td>
                    <td>
                      <time
                        dateTime={new Date(trade.tradeTime).toISOString()}
                        title={new Date(trade.tradeTime).toISOString()}
                      >
                        {new Date(trade.tradeTime).toISOString().slice(11, 23)}
                      </time>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="activity-message">
            {paused
              ? 'Trade updates are paused. Retry the market connection to receive new executions.'
              : status === 'connecting'
                ? 'Connecting to public trades…'
                : 'Waiting for new executions. No trade history is loaded.'}
          </p>
        )}
      </div>
    </section>
  );
}
