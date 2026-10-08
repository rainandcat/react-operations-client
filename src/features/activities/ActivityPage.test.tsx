// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, useLocation } from 'react-router-dom';
import ActivityPage from './ActivityPage';

afterEach(cleanup);

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="location">{location.search}</output>;
}

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/activity']}>
        <ActivityPage />
        <LocationProbe />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('client activity list', () => {
  it('shows fictional results and URL-backed filtering', async () => {
    const user = userEvent.setup();
    renderPage();
    expect(screen.getByText('Loading fictional activity…')).toBeTruthy();
    expect(await screen.findByText('A-0001 · 2026-01-15')).toBeTruthy();
    await user.selectOptions(screen.getByLabelText('Activity type'), 'debit');
    await waitFor(() => expect(screen.queryByText('A-0001 · 2026-01-15')).toBeNull());
    expect(screen.getByText('A-0003 · 2026-01-13')).toBeTruthy();
    expect(screen.getByTestId('location').textContent).toContain('kind=debit');
  });

  it('shows empty and error demo states', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('A-0001 · 2026-01-15');
    await user.selectOptions(screen.getByLabelText('Demo state'), 'empty');
    expect(await screen.findByText('Nothing to show')).toBeTruthy();
    await user.selectOptions(screen.getByLabelText('Demo state'), 'error');
    expect(await screen.findByRole('alert')).toBeTruthy();
    await user.selectOptions(screen.getByLabelText('Demo state'), 'normal');
    expect(await screen.findByText('A-0001 · 2026-01-15')).toBeTruthy();
  });
});
