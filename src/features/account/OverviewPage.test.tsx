// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import OverviewPage from './OverviewPage';

afterEach(cleanup);

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <OverviewPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('client overview', () => {
  it('loads the fictional account and its empty state', async () => {
    const user = userEvent.setup();
    renderPage();
    expect(screen.getByText('Loading demo account…')).toBeTruthy();
    expect(await screen.findByText('128.40 USD')).toBeTruthy();
    await user.selectOptions(screen.getByLabelText('Demo state'), 'empty');
    expect(await screen.findByText('No account snapshot')).toBeTruthy();
  });

  it('shows a recoverable error', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('128.40 USD');
    await user.selectOptions(screen.getByLabelText('Demo state'), 'error');
    expect(await screen.findByRole('alert', {}, { timeout: 2000 })).toBeTruthy();
    await user.selectOptions(screen.getByLabelText('Demo state'), 'normal');
    expect(await screen.findByText('128.40 USD')).toBeTruthy();
  });
});
