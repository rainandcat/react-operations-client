import { Link, isRouteErrorResponse, useRouteError } from 'react-router-dom';

export function RouteErrorPage() {
  const error = useRouteError();
  const missing = isRouteErrorResponse(error) && error.status === 404;

  return (
    <main className="app-error-shell" role="alert">
      <p className="eyebrow">{missing ? '404 / Page unavailable' : 'Route error'}</p>
      <h1>{missing ? 'This page is not available.' : 'This page could not open.'}</h1>
      <p>Return to public markets or reload to try again.</p>
      <Link className="button button-primary" to="/">
        Go to markets
      </Link>
      <button
        className="button button-light"
        type="button"
        onClick={() => window.location.reload()}
      >
        Reload demo
      </button>
    </main>
  );
}
