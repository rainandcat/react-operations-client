// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { authenticateDemoClient } from '@/features/auth/demoAuth';
import { useClientSession } from '@/features/auth/sessionStore';
import { ProtectedRoute } from './ProtectedRoute';

afterEach(() => {
  cleanup();
  useClientSession.getState().signOut();
});

function SignInProbe() {
  const location = useLocation();
  return <p>Return to {new URLSearchParams(location.search).get('returnTo')}</p>;
}

function renderProtected() {
  render(
    <MemoryRouter initialEntries={['/activity?kind=debit']}>
      <Routes>
        <Route path="/" element={<SignInProbe />} />
        <Route
          path="/activity"
          element={
            <ProtectedRoute>
              <h1>Activity history</h1>
            </ProtectedRoute>
          }
        />
      </Routes>
    </MemoryRouter>
  );
}

describe('client route protection', () => {
  it('redirects a signed-out visitor and remembers the requested URL', async () => {
    useClientSession.getState().signOut();
    renderProtected();
    expect(await screen.findByText('Return to /activity?kind=debit')).toBeTruthy();
  });

  it('allows a signed-in demo member', () => {
    useClientSession.getState().signIn(authenticateDemoClient('member@demo.invalid', 'demo123')!);
    renderProtected();
    expect(screen.getByRole('heading', { name: 'Activity history' })).toBeTruthy();
  });
});
