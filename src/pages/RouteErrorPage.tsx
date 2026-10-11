import { translate, localize, useLocale } from '@/i18n';
import { Link, isRouteErrorResponse, useRouteError } from 'react-router-dom';
export function RouteErrorPage() {
  useLocale();
  const error = useRouteError();
  const missing = isRouteErrorResponse(error) && error.status === 404;
  return (
    <main className="app-error-shell" role="alert">
      <p className="eyebrow">{localize(missing ? '404 / Page unavailable' : 'Route error')}</p>
      <h1>{localize(missing ? 'This page is not available.' : 'This page could not open.')}</h1>
      <p>{translate('Return to public markets or reload to try again.')}</p>
      <Link className="button button-primary" to="/">
        {translate('Go to markets')}
      </Link>
      <button
        className="button button-light"
        type="button"
        onClick={() => window.location.reload()}
      >
        {translate('Reload demo')}
      </button>
    </main>
  );
}
