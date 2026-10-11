import { formatLocale } from '@/i18n';
import { translate, localize, useLocale } from '@/i18n';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { isMarketSymbol, MARKET_SYMBOLS, type MarketSymbol } from './types';
import { useMarketFeed } from './useMarketFeed';
import { formatPrice, MarketControls, useMarketMode } from './MarketControls';
import { CandleChart } from './CandleChart';
import { RecentTrades } from './RecentTrades';
function MarketDetail({ symbol }: { symbol: MarketSymbol }) {
  useLocale();
  const mode = useMarketMode();
  const navigate = useNavigate();
  // A stable allowlist owns one connection; changes remount this detail slice.
  const symbols = SYMBOL_SELECTIONS[symbol];
  const feed = useMarketFeed(mode, symbols, symbol);
  const instrument = feed.instruments.find((row) => row.symbol === symbol);
  const ticker = feed.tickers.find((row) => row.symbol === symbol);
  const unavailable =
    feed.instruments.length > 0 &&
    (!instrument || !instrument.spot || instrument.status !== 'TRADING');
  return (
    <div className="page-stack">
      <Link className="back-link" to={`/${mode === 'demo' ? '?mode=demo' : ''}`}>
        {translate('\u2190 Back to home')}
      </Link>
      <section className="account-panel">
        <div className="account-panel-heading">
          <div>
            <p className="eyebrow">
              {translate('Binance Spot \u00B7 Public \u00B7 Read only \u00B7 Unofficial')}
            </p>
            <h1>{translate('{{v0}} / USDT', { v0: localize(symbol.replace('USDT', '')) })}</h1>
          </div>
          <div className="activity-field">
            <label htmlFor="market-pair">{translate('Trading pair')}</label>
            <select
              id="market-pair"
              value={symbol}
              onChange={(event) =>
                navigate(`/markets/${event.target.value}${mode === 'demo' ? '?mode=demo' : ''}`)
              }
            >
              {MARKET_SYMBOLS.map((pair) => (
                <option key={pair} value={pair}>
                  {translate('{{v0}} / USDT', { v0: localize(pair.replace('USDT', '')) })}
                </option>
              ))}
            </select>
          </div>
        </div>
        <MarketControls feed={feed} />
        {unavailable && (
          <p role="alert">{translate('This pair is currently unavailable for Spot trading.')}</p>
        )}
        {ticker && (
          <div className="market-summary">
            <div>
              <span>{translate('Last price \u00B7 USDT')}</span>
              <strong>{localize(formatPrice(ticker.price, instrument?.precision))}</strong>
            </div>
            <div>
              <span>{translate('24h change')}</span>
              <strong className={ticker.change >= 0 ? 'market-up' : 'market-down'}>
                {translate('{{v0}}{{v1}}%', {
                  v0: localize(ticker.change >= 0 ? '+' : ''),
                  v1: localize(ticker.change.toFixed(2))
                })}
              </strong>
            </div>
            <div>
              <span>{translate('24h volume \u00B7 USDT')}</span>
              <strong>
                {localize(
                  ticker.quoteVolume.toLocaleString(formatLocale(), { maximumFractionDigits: 0 })
                )}
              </strong>
            </div>
          </div>
        )}
        {feed.candles.length > 0 ? (
          <CandleChart
            key={`${symbol}:${mode}`}
            candles={feed.candles}
            precision={instrument?.precision ?? 2}
          />
        ) : (
          <p className="activity-message">
            {localize(
              feed.status === 'connecting'
                ? 'Loading one-minute candle history…'
                : 'No candle history is available. Retry or select fixed demonstration data.'
            )}
          </p>
        )}
        <p className="muted">
          {translate(
            'One-minute UTC candles. Initial history contains up to 300 candles; the session keeps at most 500. Pan or zoom to inspect. No trading actions are available.'
          )}
        </p>
      </section>
      <RecentTrades
        trades={feed.trades}
        base={instrument?.base ?? symbol.replace('USDT', '')}
        precision={instrument?.precision ?? 2}
        status={feed.status}
      />
    </div>
  );
}
const SYMBOL_SELECTIONS = {
  BTCUSDT: ['BTCUSDT'],
  ETHUSDT: ['ETHUSDT'],
  SOLUSDT: ['SOLUSDT']
} as const;
export default function MarketDetailPage() {
  useLocale();
  const { symbol = '' } = useParams();
  if (!isMarketSymbol(symbol))
    return (
      <section className="account-panel">
        <p className="eyebrow">{translate('Market unavailable')}</p>
        <h1>
          {localize(
            /^[A-Z0-9]{5,20}$/.test(symbol) ? 'Unsupported trading pair' : 'Unknown trading pair'
          )}
        </h1>
        <p>{translate('This watchlist supports BTC / USDT, ETH / USDT and SOL / USDT.')}</p>
        <Link className="button button-primary" to="/">
          {translate('Go to markets')}
        </Link>
      </section>
    );
  return <MarketDetail key={symbol} symbol={symbol} />;
}
