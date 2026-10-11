import { formatLocale } from '@/i18n';
import { translate, localize, useLocale } from '@/i18n';
import { useSearchParams } from 'react-router-dom';
import type { FeedState, MarketMode } from './types';
export function useMarketMode(): MarketMode {
  const [params] = useSearchParams();
  return params.get('mode') === 'demo' ? 'demo' : 'live';
}
export function MarketControls({
  feed
}: {
  feed: FeedState & {
    retry: () => void;
  };
}) {
  useLocale();
  const [params, setParams] = useSearchParams();
  const mode = useMarketMode();
  return (
    <div className="market-toolbar">
      <div className="activity-field">
        <label htmlFor="market-mode">{translate('Market data')}</label>
        <select
          id="market-mode"
          value={mode}
          onChange={(event) => {
            const next = new URLSearchParams(params);
            if (event.target.value === 'demo') next.set('mode', 'demo');
            else next.delete('mode');
            setParams(next);
          }}
        >
          <option value="live">{translate('Live \u00B7 Binance Spot')}</option>
          <option value="demo">{translate('Fixed demonstration')}</option>
        </select>
      </div>
      <div className="feed-status" role="status" data-status={feed.status}>
        <strong>{localize(feed.status === 'demo' ? 'Demonstration' : feed.status)}</strong>
        <span>
          {feed.publicMessage ? (
            <>
              {feed.publicMessage.rateLimited &&
                localize(
                  'The market service has limited requests. Retry after the displayed time.'
                )}{' '}
              {feed.publicMessage.code === 'retry'
                ? translate('Market recovery · retry at {{v0}} UTC. Last snapshot may be stale.', {
                    v0: new Date(feed.publicMessage.retryAt!).toISOString().slice(11, 19)
                  })
                : translate(
                    'Market unavailable. Retry the connection. Last snapshot may be stale.'
                  )}
            </>
          ) : (
            localize(feed.message)
          )}
        </span>
        {feed.updatedAt && (
          <small>
            {translate('Source time: {{v0}} UTC', {
              v0: localize(new Date(feed.updatedAt).toISOString().replace('T', ' ').slice(0, 19))
            })}
          </small>
        )}
      </div>
      {mode === 'live' && (
        <button className="button button-light" type="button" onClick={feed.retry}>
          {translate('Retry connection')}
        </button>
      )}
    </div>
  );
}
export function formatPrice(value: number, precision = 2): string {
  return value.toLocaleString(formatLocale(), {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision
  });
}
