import { formatLocale } from '@/i18n';
import { translate, localize, useLocale } from '@/i18n';
import { useEffect, useRef } from 'react';
import {
  CandlestickSeries,
  ColorType,
  createChart,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp
} from 'lightweight-charts';
import { usePreferences } from '@/features/preferences/preferencesStore';
import type { Candle } from './types';
export function CandleChart({ candles, precision }: { candles: Candle[]; precision: number }) {
  const locale = useLocale();
  const container = useRef<HTMLDivElement>(null);
  const chart = useRef<IChartApi | null>(null);
  const series = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const previous = useRef<Candle[]>([]);
  const theme = usePreferences((state) => state.theme);
  useEffect(() => {
    const element = container.current;
    if (!element) return;
    const next = createChart(element, {
      height: 360,
      width: element.clientWidth,
      timeScale: { timeVisible: true, secondsVisible: false, shiftVisibleRangeOnNewBar: true },
      localization: { locale: 'en-US' }
    });
    chart.current = next;
    series.current = next.addSeries(CandlestickSeries, {
      upColor: '#16846d',
      downColor: '#c54e57',
      wickUpColor: '#16846d',
      wickDownColor: '#c54e57',
      borderVisible: false,
      priceFormat: { type: 'price', precision, minMove: 10 ** -precision }
    });
    const observer = new ResizeObserver(() => next.applyOptions({ width: element.clientWidth }));
    observer.observe(element);
    return () => {
      observer.disconnect();
      next.remove();
      chart.current = null;
      series.current = null;
      previous.current = [];
    };
  }, [precision]);
  useEffect(() => {
    const dark = theme === 'dark';
    chart.current?.applyOptions({
      layout: {
        background: { type: ColorType.Solid, color: dark ? '#202a3f' : '#fffdf8' },
        textColor: dark ? '#b9c3d6' : '#5f6878',
        attributionLogo: true
      },
      grid: {
        vertLines: { color: dark ? '#303b51' : '#efede7' },
        horzLines: { color: dark ? '#303b51' : '#efede7' }
      }
    });
  }, [theme, precision]);
  useEffect(() => {
    const target = series.current;
    if (!target || !candles.length) return;
    const toPoint = (row: Candle) => ({
      time: (row.openTime / 1000) as UTCTimestamp,
      open: row.open,
      high: row.high,
      low: row.low,
      close: row.close
    });
    const old = previous.current;
    const replace =
      !old.length ||
      old[0].openTime !== candles[0].openTime ||
      candles.length < old.length ||
      old.slice(0, -1).some((row, index) => row !== candles[index]);
    if (replace) target.setData(candles.map(toPoint));
    else for (const row of candles.slice(Math.max(0, old.length - 1))) target.update(toPoint(row));
    if (!old.length) chart.current?.timeScale().fitContent();
    previous.current = candles;
  }, [candles, precision]);
  useEffect(() => {
    chart.current?.applyOptions({ localization: { locale: formatLocale() } });
  }, [locale, precision]);
  const latest = candles.at(-1);
  return (
    <div className="candle-panel">
      <div className="chart-heading">
        <p>
          {translate('1 minute \u00B7 UTC \u00B7 {{v0}} candles', { v0: localize(candles.length) })}
        </p>
        <button
          className="text-button"
          type="button"
          onClick={() => chart.current?.timeScale().scrollToRealTime()}
        >
          {translate('Follow latest')}
        </button>
      </div>
      <div
        ref={container}
        className="candle-chart"
        role="img"
        aria-label={translate(
          'Interactive one-minute candlestick chart. Drag to pan and pinch or scroll to zoom. Latest values appear below.'
        )}
      />
      {latest && (
        <dl className="candle-values" aria-label={translate('Latest candle')}>
          <div>
            <dt>{translate('Open')}</dt>
            <dd>{localize(latest.open.toFixed(precision))}</dd>
          </div>
          <div>
            <dt>{translate('High')}</dt>
            <dd>{localize(latest.high.toFixed(precision))}</dd>
          </div>
          <div>
            <dt>{translate('Low')}</dt>
            <dd>{localize(latest.low.toFixed(precision))}</dd>
          </div>
          <div>
            <dt>{translate('Close')}</dt>
            <dd>{localize(latest.close.toFixed(precision))}</dd>
          </div>
          <div>
            <dt>{translate('State')}</dt>
            <dd>{localize(latest.closed ? 'Closed' : 'In progress')}</dd>
          </div>
        </dl>
      )}
      <small className="muted">
        TradingView Lightweight Charts™ · Copyright (с) 2025 TradingView, Inc.{' '}
        <a href="https://www.tradingview.com/" target="_blank" rel="noreferrer">
          TradingView
        </a>
      </small>
    </div>
  );
}
