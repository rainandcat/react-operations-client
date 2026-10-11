// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { fixtureTrades } from './fixtures';
import { RecentTrades } from './RecentTrades';

afterEach(cleanup);
describe('recent execution presentation', () => {
  it('shows base quantity, UTC execution time and taker direction beyond color alone', () => {
    render(
      <RecentTrades
        trades={fixtureTrades('BTCUSDT').slice(0, 2)}
        base="BTC"
        precision={2}
        status="demo"
      />
    );
    const table = screen.getByRole('table');
    expect(within(table).getByText('Quantity · BTC')).toBeTruthy();
    expect(within(table).getByText('Time · UTC')).toBeTruthy();
    expect(within(table).getByText('Buy')).toBeTruthy();
    expect(within(table).getByText('Sell')).toBeTruthy();
    expect(within(table).getByText('12:59:00.000')).toBeTruthy();
    expect(screen.getByText(/Fixed demonstration/)).toBeTruthy();
  });
  it('distinguishes quiet live trading from interrupted updates', () => {
    const { rerender } = render(
      <RecentTrades trades={[]} base="ETH" precision={2} status="live" />
    );
    expect(
      screen.getByText('Waiting for new executions. No trade history is loaded.')
    ).toBeTruthy();
    rerender(<RecentTrades trades={[]} base="ETH" precision={2} status="reconnecting" />);
    expect(screen.getByText(/Trade updates are paused/)).toBeTruthy();
  });
  it('retains stale executions with an explicit pause label and no backfill claim', () => {
    render(
      <RecentTrades trades={fixtureTrades('SOLUSDT')} base="SOL" precision={2} status="stale" />
    );
    expect(screen.getByText(/Updates paused · Records may be stale/)).toBeTruthy();
    expect(screen.getByText(/Disconnected periods are not backfilled/)).toBeTruthy();
    expect(within(screen.getByRole('table')).getAllByRole('row')).toHaveLength(51);
  });
});
