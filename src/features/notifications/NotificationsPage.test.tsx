// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import NotificationsPage from './NotificationsPage';

afterEach(cleanup);

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <NotificationsPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('client notifications', () => {
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
