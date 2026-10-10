import { Suspense } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LoginDialog } from '@/features/auth/LoginDialog';
import { useClientSession } from '@/features/auth/sessionStore';
import { usePreferences } from '@/features/preferences/preferencesStore';

const links = [
  { to: '/', label: 'Markets' },
  { to: '/wallet/overview', label: 'Wallet' },
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
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const loginOpen = params.get('login') === '1';

  function openSignIn() {
    params.set('login', '1');
    params.delete('returnTo');
    navigate(location.pathname + `?${params}` + location.hash);
  }

  function handleSignOut() {
    signOut();
    navigate('/', { replace: true });
  }

  return (
    <div className="client-shell" data-theme={theme} data-density={density}>
      <header className="client-header">
        <NavLink to="/" className="brand" aria-label="Operations Client home">
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
              end={to === '/'}
              className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
            >
              {label}
            </NavLink>
          ))}
        </nav>
        {session ? (
          <button className="text-button" type="button" onClick={handleSignOut}>
            Sign out
          </button>
        ) : (
          <button id="client-sign-in" className="text-button" type="button" onClick={openSignIn}>
            Sign in
          </button>
        )}
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
        <span>Public Spot markets · Fictional demo accounts · Unofficial</span>
        <span>{session?.account}</span>
      </footer>
      {loginOpen && <LoginDialog />}
    </div>
  );
}
