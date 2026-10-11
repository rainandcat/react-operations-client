import { translate, useLocale } from '@/i18n';
import { Link } from 'react-router-dom';
export function NotFoundPage() {
  useLocale();
  return (
    <main className="not-found">
      <p className="eyebrow">{translate('404 / Wrong turn')}</p>
      <h1>{translate('This page took another path.')}</h1>
      <p>{translate('There is nothing at this address.')}</p>
      <Link className="button button-primary" to="/">
        {translate('Go to markets')}
      </Link>
    </main>
  );
}
