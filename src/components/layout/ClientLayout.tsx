import { Suspense } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useClientSession } from '@/features/auth/sessionStore';
import { usePreferences } from '@/features/preferences/preferencesStore';

const links = [
  { to: '/overview', label: 'Overview' },
  { to: '/activity', label: 'Activity' },
  { to: '/notifications', label: 'Notifications' },
  { to: '/preferences', label: 'Preferences' }
];

export function ClientLayout() {
  const session = useClientSession((state) => state.session);
  const signOut = useClientSession((state) => state.signOut);
  const theme = usePreferences((state) => state.theme);
  const density = usePreferences((state) => state.density);
  const navigate = useNavigate();

  function handleSignOut() {
    signOut();
    navigate('/sign-in', { replace: true });
  }

  return (
    <div className="client-shell" data-theme={theme} data-density={density}>
      <header className="client-header">
        <NavLink to="/overview" className="brand" aria-label="Operations Client home">
          <span className="brand-icon">O</span>
          <span>
            Ordinary<span className="brand-period">.</span>
          </span>
        </NavLink>
        <nav className="client-nav" aria-label="Main navigation">
          {links.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
            >
              {label}
            </NavLink>
          ))}
        </nav>
        <button className="text-button" type="button" onClick={handleSignOut}>
          Sign out
        </button>
      </header>
      <main className="client-main">
        <Suspense
          fallback={
            <p className="loading" role="status">
              Opening your space…
            </p>
          }
        >
          <Outlet />
        </Suspense>
      </main>
      <footer className="client-footer">
        <span>Operations Client / Portfolio demo</span>
        <span>Fictional data · No backend connection</span>
        <span>{session?.account}</span>
      </footer>
    </div>
  );
}
