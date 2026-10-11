import { formatLocale } from '@/i18n';
import { translate, localize, useLocale } from '@/i18n';
import { Link, useSearchParams } from 'react-router-dom';
import { MARKET_SYMBOLS } from './types';
import { useMarketFeed } from './useMarketFeed';
import { formatPrice, MarketControls, useMarketMode } from './MarketControls';
export default function HomePage() {
  useLocale();
  const mode = useMarketMode();
  const [params, setParams] = useSearchParams();
  const feed = useMarketFeed(mode, MARKET_SYMBOLS);
  const search = params.get('search') ?? '';
  const rows = MARKET_SYMBOLS.filter((symbol) =>
    symbol.toLowerCase().includes(search.trim().replace(/\s|\//g, '').toLowerCase())
  );
  return (
    <div className="page-stack">
      <section className="welcome-panel market-hero">
        <p className="eyebrow">{translate('Public market notebook')}</p>
        <h1>{translate('A clear view of Spot markets.')}</h1>
        <p>
          {translate(
            'Three pairs. A rolling 24-hour view. Explore prices and one-minute candles without signing in.'
          )}
        </p>
        <Link
          className="button button-light"
          to={`/markets/BTCUSDT${mode === 'demo' ? '?mode=demo' : ''}`}
        >
          {translate('Explore markets')}
          <span aria-hidden="true">↗</span>
        </Link>
        <p className="market-source">
          {translate('Binance Spot public market data \u00B7 Read only \u00B7 Unofficial product')}
        </p>
      </section>
      <section className="account-panel" id="market-watchlist" aria-labelledby="watchlist-title">
        <div className="account-panel-heading">
          <div>
            <p className="eyebrow">{translate('A focused watchlist')}</p>
            <h2 id="watchlist-title">{translate('Market overview')}</h2>
          </div>
          <div className="activity-field">
            <label htmlFor="market-search">{translate('Search pairs')}</label>
            <input
              id="market-search"
              value={search}
              placeholder={translate('BTC, ETH or SOL')}
              onChange={(event) => {
                const next = new URLSearchParams(params);
                if (event.target.value) next.set('search', event.target.value);
                else next.delete('search');
                setParams(next, { replace: true });
              }}
            />
          </div>
        </div>
        <MarketControls feed={feed} />
        {!rows.length && (
          <p className="activity-message">{translate('No supported pairs match your search.')}</p>
        )}
        {rows.length > 0 && (
          <div className="market-table-wrap">
            <table className="market-table">
              <caption className="sr-only">
                {translate(
                  'Selected Spot pairs, prices in USDT, rolling 24-hour change and quote volume'
                )}
              </caption>
              <thead>
                <tr>
                  <th scope="col">{translate('Pair')}</th>
                  <th scope="col">{translate('Price \u00B7 USDT')}</th>
                  <th scope="col">{translate('24h change')}</th>
                  <th scope="col">{translate('24h volume \u00B7 USDT')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((symbol) => {
                  const instrument = feed.instruments.find((row) => row.symbol === symbol);
                  const ticker = feed.tickers.find((row) => row.symbol === symbol);
                  return (
                    <tr key={symbol}>
                      <th scope="row">
                        <Link to={`/markets/${symbol}${mode === 'demo' ? '?mode=demo' : ''}`}>
                          {localize(symbol.replace('USDT', ''))}
                          <span className="muted"> / USDT ↗</span>
                        </Link>
                        {instrument && (instrument.status !== 'TRADING' || !instrument.spot) && (
                          <small>{translate('Spot trading unavailable')}</small>
                        )}
                      </th>
                      <td>
                        {localize(ticker ? formatPrice(ticker.price, instrument?.precision) : '—')}
                      </td>
                      <td className={ticker && ticker.change >= 0 ? 'market-up' : 'market-down'}>
                        {localize(
                          ticker
                            ? `${ticker.change >= 0 ? '+' : ''}${ticker.change.toFixed(2)}%`
                            : '—'
                        )}
                      </td>
                      <td>
                        {localize(
                          ticker
                            ? ticker.quoteVolume.toLocaleString(formatLocale(), {
                                maximumFractionDigits: 0
                              })
                            : '—'
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="muted">
          {translate(
            'Volume is quote-asset turnover in USDT over the rolling previous 24 hours. Market prices are separate from the fictional demo wallet.'
          )}
        </p>
      </section>
      <section className="section-heading">
        <div>
          <p className="eyebrow">{translate('A separate demo space')}</p>
          <h2>{translate('Your account, in context.')}</h2>
        </div>
        <p>
          {translate('The wallet, activity and notifications use locally authored fictional data.')}
        </p>
        <Link className="button button-primary" to="/wallet/overview">
          {translate('Explore demo wallet')}
        </Link>
      </section>
    </div>
  );
}
