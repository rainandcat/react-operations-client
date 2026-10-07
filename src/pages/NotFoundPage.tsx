import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <main className="not-found">
      <p className="eyebrow">404 / Wrong turn</p>
      <h1>This page took another path.</h1>
      <p>There is nothing at this address.</p>
      <Link className="button button-primary" to="/overview">
        Go to overview
      </Link>
    </main>
  );
}
