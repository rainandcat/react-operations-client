import { useSearchParams } from 'react-router-dom';
import type { FeedState, MarketMode } from './types';

export function useMarketMode(): MarketMode {
  const [params] = useSearchParams();
  return params.get('mode') === 'demo' ? 'demo' : 'live';
}
export function MarketControls({ feed }: { feed: FeedState & { retry: () => void } }) {
  const [params, setParams] = useSearchParams();
  const mode = useMarketMode();
  return (
    <div className="market-toolbar">
      <div className="activity-field">
        <label htmlFor="market-mode">Market data</label>
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
          <option value="live">Live · Binance Spot</option>
          <option value="demo">Fixed demonstration</option>
        </select>
      </div>
      <div className="feed-status" role="status" data-status={feed.status}>
        <strong>
          {feed.status === 'demo'
            ? 'Demonstration'
            : feed.status.charAt(0).toUpperCase() + feed.status.slice(1)}
        </strong>
        <span>{feed.message}</span>
        {feed.updatedAt && (
          <small>
            Source time: {new Date(feed.updatedAt).toISOString().replace('T', ' ').slice(0, 19)} UTC
          </small>
        )}
      </div>
      {mode === 'live' && (
        <button className="button button-light" type="button" onClick={feed.retry}>
          Retry connection
        </button>
      )}
    </div>
  );
}
export function formatPrice(value: number, precision = 2): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision
  });
}
