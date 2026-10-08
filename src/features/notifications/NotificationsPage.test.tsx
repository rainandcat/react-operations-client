// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, useLocation } from 'react-router-dom';
import NotificationsPage from './NotificationsPage';

afterEach(cleanup);

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="location">{location.search}</output>;
}

function renderPage(initialEntry = '/notifications') {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <NotificationsPage />
        <LocationProbe />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('client notifications', () => {
  it('corrects a one-page filtered URL without clearing the filter', async () => {
    renderPage('/notifications?kind=account&page=2');
    expect(await screen.findByText('Account snapshot ready')).toBeTruthy();
    expect(screen.getByTestId('location').textContent).toBe('?kind=account');
    expect(screen.queryByText('No notifications')).toBeNull();
  });

  it('clamps an oversized page to the last non-empty page', async () => {
    renderPage('/notifications?page=99');
    expect(await screen.findByText('Demo data refreshed')).toBeTruthy();
    expect(screen.getByTestId('location').textContent).toBe('?page=2');
  });

  it('returns to page one for a genuinely empty demo result', async () => {
    renderPage('/notifications?demo=empty&page=2');
    expect(await screen.findByText('No notifications')).toBeTruthy();
    expect(screen.getByTestId('location').textContent).toBe('?demo=empty');
  });
  it('filters fictional notifications', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Activity completed');
    await user.selectOptions(screen.getByLabelText('Notification type'), 'system');
    await waitFor(() => expect(screen.queryByText('Activity completed')).toBeNull());
    expect(screen.getByText('Portfolio demo notice')).toBeTruthy();
  });

  it('shows empty and service-error states', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Activity completed');
    await user.selectOptions(screen.getByLabelText('Demo state'), 'empty');
    expect(await screen.findByText('No notifications')).toBeTruthy();
    await user.selectOptions(screen.getByLabelText('Demo state'), 'error');
    expect(await screen.findByRole('alert', {}, { timeout: 2000 })).toBeTruthy();
  });
});
