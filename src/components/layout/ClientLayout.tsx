import { LanguageSelector } from '@/i18n/LanguageSelector';
import { translate, localize, useLocale } from '@/i18n';
import { Suspense, useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LoginDialog } from '@/features/auth/LoginDialog';
import { useClientSession } from '@/features/auth/sessionStore';
import { usePreferences } from '@/features/preferences/preferencesStore';
const links = [
  { to: '/markets/BTCUSDT', label: 'Markets' },
  { to: '/wallet/overview', label: 'Wallet' },
  { to: '/activity', label: 'Activity' },
  { to: '/notifications', label: 'Notifications' },
  { to: '/preferences', label: 'Preferences' }
];
export function ClientLayout() {
  useLocale();
  const session = useClientSession((state) => state.session);
  const signOut = useClientSession((state) => state.signOut);
  const theme = usePreferences((state) => state.theme);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
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
        <NavLink to="/" className="brand" aria-label={translate('Operations Client home')}>
          <span className="brand-icon">O</span>
          <span>
            Ordinary<span className="brand-period">.</span>
          </span>
        </NavLink>
        <nav className="client-nav" aria-label={translate('Main navigation')}>
          {links.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                isActive || (label === 'Markets' && location.pathname.startsWith('/markets/'))
                  ? 'nav-link active'
                  : 'nav-link'
              }
            >
              {localize(label)}
            </NavLink>
          ))}
        </nav>
        <LanguageSelector />
        {session ? (
          <button className="text-button" type="button" onClick={handleSignOut}>
            {translate('Sign out')}
          </button>
        ) : (
          <button id="client-sign-in" className="text-button" type="button" onClick={openSignIn}>
            {translate('Sign in')}
          </button>
        )}
      </header>
      <main className="client-main">
        <Suspense
          fallback={
            <p className="loading" role="status">
              {translate('Opening your space\u2026')}
            </p>
          }
        >
          <Outlet />
        </Suspense>
      </main>
      <footer className="client-footer">
        <span>{translate('Operations Client / Portfolio demo')}</span>
        <span>
          {translate('Public Spot markets \u00B7 Fictional demo accounts \u00B7 Unofficial')}
        </span>
        <span>{localize(session?.account)}</span>
      </footer>
      {loginOpen && <LoginDialog />}
    </div>
  );
}
