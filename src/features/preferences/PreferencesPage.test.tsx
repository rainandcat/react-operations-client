// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ClientLayout } from '@/components/layout/ClientLayout';
import { usePreferences } from './preferencesStore';
import PreferencesPage from './PreferencesPage';

beforeEach(() => {
  localStorage.clear();
  usePreferences.getState().reset();
});
afterEach(cleanup);

describe('display preferences', () => {
  it('updates the shell, persists choices and restores defaults', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <MemoryRouter initialEntries={['/preferences']}>
        <Routes>
          <Route element={<ClientLayout />}>
            <Route path="/preferences" element={<PreferencesPage />} />
          </Route>
        </Routes>
      </MemoryRouter>
    );
    const shell = container.querySelector('.client-shell');
    expect(shell?.getAttribute('data-theme')).toBe('light');
    await user.click(screen.getByRole('radio', { name: 'Dark' }));
    await user.click(screen.getByRole('radio', { name: 'Compact' }));
    expect(shell?.getAttribute('data-theme')).toBe('dark');
    expect(shell?.getAttribute('data-density')).toBe('compact');
    expect(localStorage.getItem('operations-client-display-preferences')).toContain('dark');
    await user.click(screen.getByRole('button', { name: 'Restore defaults' }));
    expect(shell?.getAttribute('data-theme')).toBe('light');
    expect(shell?.getAttribute('data-density')).toBe('comfortable');
  });
});
