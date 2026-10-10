import { Link, useSearchParams } from 'react-router-dom';
import { MARKET_SYMBOLS } from './types';
import { useMarketFeed } from './useMarketFeed';
import { formatPrice, MarketControls, useMarketMode } from './MarketControls';

export default function HomePage() {
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
        <p className="eyebrow">Public market notebook</p>
        <h1>A clear view of Spot markets.</h1>
        <p>
          Three pairs. A rolling 24-hour view. Explore prices and one-minute candles without signing
          in.
        </p>
        <a className="button button-light" href="#market-watchlist">
          Explore markets <span aria-hidden="true">↘</span>
        </a>
        <p className="market-source">
          Binance Spot public market data · Read only · Unofficial product
        </p>
      </section>
      <section className="account-panel" id="market-watchlist" aria-labelledby="watchlist-title">
        <div className="account-panel-heading">
          <div>
            <p className="eyebrow">A focused watchlist</p>
            <h2 id="watchlist-title">Market overview</h2>
          </div>
          <div className="activity-field">
            <label htmlFor="market-search">Search pairs</label>
            <input
              id="market-search"
              value={search}
              placeholder="BTC, ETH or SOL"
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
        {!rows.length && <p className="activity-message">No supported pairs match your search.</p>}
        {rows.length > 0 && (
          <div className="market-table-wrap">
            <table className="market-table">
              <caption className="sr-only">
                Selected Spot pairs, prices in USDT, rolling 24-hour change and quote volume
              </caption>
              <thead>
                <tr>
                  <th scope="col">Pair</th>
                  <th scope="col">Price · USDT</th>
                  <th scope="col">24h change</th>
                  <th scope="col">24h volume · USDT</th>
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
                          {symbol.replace('USDT', '')}
                          <span className="muted"> / USDT ↗</span>
                        </Link>
                        {instrument && (instrument.status !== 'TRADING' || !instrument.spot) && (
                          <small>Spot trading unavailable</small>
                        )}
                      </th>
                      <td>{ticker ? formatPrice(ticker.price, instrument?.precision) : '—'}</td>
                      <td className={ticker && ticker.change >= 0 ? 'market-up' : 'market-down'}>
                        {ticker
                          ? `${ticker.change >= 0 ? '+' : ''}${ticker.change.toFixed(2)}%`
                          : '—'}
                      </td>
                      <td>
                        {ticker
                          ? ticker.quoteVolume.toLocaleString('en-US', { maximumFractionDigits: 0 })
                          : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="muted">
          Volume is quote-asset turnover in USDT over the rolling previous 24 hours. Market prices
          are separate from the fictional demo wallet.
        </p>
      </section>
      <section className="section-heading">
        <div>
          <p className="eyebrow">A separate demo space</p>
          <h2>Your account, in context.</h2>
        </div>
        <p>The wallet, activity and notifications use locally authored fictional data.</p>
        <Link className="button button-primary" to="/wallet/overview">
          Explore demo wallet
        </Link>
      </section>
    </div>
  );
}
