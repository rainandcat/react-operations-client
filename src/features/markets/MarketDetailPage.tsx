import { Link, useNavigate, useParams } from 'react-router-dom';
import { isMarketSymbol, MARKET_SYMBOLS, type MarketSymbol } from './types';
import { useMarketFeed } from './useMarketFeed';
import { formatPrice, MarketControls, useMarketMode } from './MarketControls';
import { CandleChart } from './CandleChart';

function MarketDetail({ symbol }: { symbol: MarketSymbol }) {
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
        ← Back to home
      </Link>
      <section className="account-panel">
        <div className="account-panel-heading">
          <div>
            <p className="eyebrow">Binance Spot · Public · Read only · Unofficial</p>
            <h1>{symbol.replace('USDT', '')} / USDT</h1>
          </div>
          <div className="activity-field">
            <label htmlFor="market-pair">Trading pair</label>
            <select
              id="market-pair"
              value={symbol}
              onChange={(event) =>
                navigate(`/markets/${event.target.value}${mode === 'demo' ? '?mode=demo' : ''}`)
              }
            >
              {MARKET_SYMBOLS.map((pair) => (
                <option key={pair} value={pair}>
                  {pair.replace('USDT', '')} / USDT
                </option>
              ))}
            </select>
          </div>
        </div>
        <MarketControls feed={feed} />
        {unavailable && <p role="alert">This pair is currently unavailable for Spot trading.</p>}
        {ticker && (
          <div className="market-summary">
            <div>
              <span>Last price · USDT</span>
              <strong>{formatPrice(ticker.price, instrument?.precision)}</strong>
            </div>
            <div>
              <span>24h change</span>
              <strong className={ticker.change >= 0 ? 'market-up' : 'market-down'}>
                {ticker.change >= 0 ? '+' : ''}
                {ticker.change.toFixed(2)}%
              </strong>
            </div>
            <div>
              <span>24h volume · USDT</span>
              <strong>
                {ticker.quoteVolume.toLocaleString('en-US', { maximumFractionDigits: 0 })}
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
            {feed.status === 'connecting'
              ? 'Loading one-minute candle history…'
              : 'No candle history is available. Retry or select fixed demonstration data.'}
          </p>
        )}
        <p className="muted">
          One-minute UTC candles. Initial history contains up to 300 candles; the session keeps at
          most 500. Pan or zoom to inspect. No trading actions are available.
        </p>
      </section>
    </div>
  );
}
const SYMBOL_SELECTIONS = {
  BTCUSDT: ['BTCUSDT'],
  ETHUSDT: ['ETHUSDT'],
  SOLUSDT: ['SOLUSDT']
} as const;
export default function MarketDetailPage() {
  const { symbol = '' } = useParams();
  if (!isMarketSymbol(symbol))
    return (
      <section className="account-panel">
        <p className="eyebrow">Market unavailable</p>
        <h1>
          {/^[A-Z0-9]{5,20}$/.test(symbol) ? 'Unsupported trading pair' : 'Unknown trading pair'}
        </h1>
        <p>This watchlist supports BTC / USDT, ETH / USDT and SOL / USDT.</p>
        <Link className="button button-primary" to="/">
          Go to markets
        </Link>
      </section>
    );
  return <MarketDetail key={symbol} symbol={symbol} />;
}
