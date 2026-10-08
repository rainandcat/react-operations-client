// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ActivityDetailPage from './ActivityDetailPage';

afterEach(cleanup);

function renderDetail(activityId: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/activity/${activityId}`]}>
        <Routes>
          <Route path="/activity/:activityId" element={<ActivityDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('client activity detail', () => {
  it('loads a fictional activity', async () => {
    renderDetail('A-0001');
    expect(await screen.findByRole('heading', { name: 'credit activity' })).toBeTruthy();
    expect(screen.getByText('42.00 USD')).toBeTruthy();
  });

  it('reports an unknown ID', async () => {
    renderDetail('A-9999');
    expect(await screen.findByRole('heading', { name: 'Activity not found' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Back to activity' })).toBeTruthy();
  });
});
