import { formatLocale } from '@/i18n';
import { translate, localize, useLocale } from '@/i18n';
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
  useLocale();
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
          <p className="eyebrow">{translate('Public executions')}</p>
          <h2 id="recent-trades-title">{translate('Recent trades')}</h2>
        </div>
        <p>
          {translate('{{v0}} \u00B7 Latest {{v1}}', {
            v0: localize(
              status === 'demo'
                ? 'Fixed demonstration'
                : paused
                  ? 'Updates paused · Records may be stale'
                  : 'Received in this connection'
            ),
            v1: localize(TRADE_LIMIT)
          })}
        </p>
      </div>
      <p className="muted">
        {translate(
          'Price in USDT, quantity in {{v0}}, time in UTC. Buy / Sell indicates the taker side. Disconnected periods are not backfilled; the list restarts on reconnection.',
          { v0: localize(base) }
        )}
      </p>
      <div className="trade-viewport">
        {trades.length ? (
          <div
            className="trade-scroll"
            onScroll={showScrollbar}
            tabIndex={0}
            role="region"
            aria-label={translate('Recent trades table, scroll for earlier executions')}
          >
            <table className="market-table trade-table">
              <caption className="sr-only">
                {translate('Recent {{v0}} / USDT executions, newest first', { v0: localize(base) })}
              </caption>
              <thead>
                <tr>
                  <th scope="col">{translate('Price \u00B7 USDT')}</th>
                  <th scope="col">{translate('Quantity \u00B7 {{v0}}', { v0: localize(base) })}</th>
                  <th scope="col">{translate('Time \u00B7 UTC')}</th>
                </tr>
              </thead>
              <tbody>
                {trades.map((trade) => (
                  <tr key={`${trade.symbol}:${trade.id}`} data-trade-id={trade.id}>
                    <td className={trade.side === 'buy' ? 'market-up' : 'market-down'}>
                      <span>{localize(formatPrice(trade.price, precision))}</span>
                      <small>{localize(trade.side === 'buy' ? 'Buy' : 'Sell')}</small>
                    </td>
                    <td>
                      {localize(
                        trade.quantity.toLocaleString(formatLocale(), {
                          maximumSignificantDigits: 12
                        })
                      )}
                    </td>
                    <td>
                      <time
                        dateTime={new Date(trade.tradeTime).toISOString()}
                        title={localize(new Date(trade.tradeTime).toISOString())}
                      >
                        {localize(new Date(trade.tradeTime).toISOString().slice(11, 23))}
                      </time>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="activity-message">
            {localize(
              paused
                ? 'Trade updates are paused. Retry the market connection to receive new executions.'
                : status === 'connecting'
                  ? 'Connecting to public trades…'
                  : 'Waiting for new executions. No trade history is loaded.'
            )}
          </p>
        )}
      </div>
    </section>
  );
}
