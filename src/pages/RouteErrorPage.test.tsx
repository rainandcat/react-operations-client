// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { AppErrorBoundary } from '@/components/errors/AppErrorBoundary';
import { RouteErrorPage } from './RouteErrorPage';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function BrokenPage(): never {
  throw new Error('Internal demo detail must not appear in the fallback');
}

describe('unexpected render errors', () => {
  it('shows a route fallback with a safe recovery link', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const router = createMemoryRouter(
      [
        {
          path: '/',
          errorElement: <RouteErrorPage />,
          children: [{ path: 'broken', element: <BrokenPage /> }]
        }
      ],
      { initialEntries: ['/broken'] }
    );
    render(<RouterProvider router={router} />);
    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'This page could not open.' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Go to overview' }).getAttribute('href')).toBe(
      '/overview'
    );
    expect(screen.queryByText(/Internal demo detail/)).toBeNull();
  });

  it('shows an application fallback when routing is unavailable', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    render(
      <AppErrorBoundary>
        <BrokenPage />
      </AppErrorBoundary>
    );
    expect(screen.getByRole('heading', { name: 'This demo could not open.' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Reload demo' })).toBeTruthy();
    expect(screen.queryByText(/Internal demo detail/)).toBeNull();
  });
});
