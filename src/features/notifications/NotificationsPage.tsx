import { formatDate } from '@/i18n';
import { translate, localize, useLocale } from '@/i18n';
import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ApiRequestError } from '@/services/apiTypes';
import type { MockScenario } from '@/services/mockTransport';
import type { NotificationKind } from './types';
import { useNotifications } from './useNotifications';
const kinds: readonly NotificationKind[] = ['activity', 'account', 'system'];
function readPage(value: string | null): number {
  const page = Number(value);
  return Number.isSafeInteger(page) && page > 0 ? page : 1;
}
export default function NotificationsPage() {
  useLocale();
  const [searchParams, setSearchParams] = useSearchParams();
  const kind = kinds.find((item) => item === searchParams.get('kind'));
  const page = readPage(searchParams.get('page'));
  const demo = searchParams.get('demo');
  const scenario: MockScenario =
    demo === 'empty' ? 'empty' : demo === 'error' ? 'unavailable' : 'normal';
  const query = useNotifications({ kind, page, pageSize: 4 }, scenario);
  const totalPages = Math.max(1, Math.ceil((query.data?.total ?? 0) / 4));
  const pageOutOfRange = query.isSuccess && !query.isPlaceholderData && page > totalPages;
  useEffect(() => {
    if (!pageOutOfRange) return;
    setSearchParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        if (totalPages === 1) next.delete('page');
        else next.set('page', String(totalPages));
        return next;
      },
      { replace: true }
    );
  }, [pageOutOfRange, setSearchParams, totalPages]);
  function updateParams(key: string, value: string, resetPage = false) {
    setSearchParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        if (value) next.set(key, value);
        else next.delete(key);
        if (resetPage) next.delete('page');
        return next;
      },
      { replace: true }
    );
  }
  return (
    <div className="page-stack">
      <section className="page-heading">
        <p className="eyebrow">{translate('Stay informed')}</p>
        <h1>{translate('Notifications')}</h1>
        <p>{translate('Relevant updates, thoughtfully grouped.')}</p>
      </section>
      <section className="activity-panel" aria-label={translate('Notification results')}>
        <div className="activity-controls">
          <div className="activity-field">
            <label htmlFor="notification-kind">{translate('Notification type')}</label>
            <select
              id="notification-kind"
              value={kind ?? ''}
              onChange={(event) => updateParams('kind', event.target.value, true)}
            >
              <option value="">{translate('All types')}</option>
              {kinds.map((item) => (
                <option key={item} value={item}>
                  {localize(item)}
                </option>
              ))}
            </select>
          </div>
          <div className="activity-field">
            <label htmlFor="notification-demo">{translate('Demo state')}</label>
            <select
              id="notification-demo"
              value={scenario === 'unavailable' ? 'error' : scenario}
              onChange={(event) =>
                updateParams(
                  'demo',
                  event.target.value === 'normal' ? '' : event.target.value,
                  true
                )
              }
            >
              <option value="normal">{translate('Normal')}</option>
              <option value="empty">{translate('Empty')}</option>
              <option value="error">{translate('Service error')}</option>
            </select>
          </div>
        </div>
        <p className="activity-count" role="status" aria-live="polite">
          {localize(
            query.isFetching
              ? 'Updating fictional notifications…'
              : `${query.data?.total ?? 0} fictional notifications`
          )}
        </p>
        {query.isPending && (
          <p className="activity-message" role="status">
            {translate('Loading fictional notifications\u2026')}
          </p>
        )}
        {query.isError && (
          <div className="activity-message" role="alert">
            <h2>{translate('Notifications unavailable')}</h2>
            <p>
              {localize(
                query.error instanceof ApiRequestError
                  ? query.error.message
                  : 'An unexpected demo error occurred.'
              )}
            </p>
            <button className="button button-primary" type="button" onClick={() => query.refetch()}>
              {translate('Try again')}
            </button>
          </div>
        )}
        {pageOutOfRange && (
          <p role="status">{translate('Moving to the last available page\u2026')}</p>
        )}
        {query.isSuccess && !pageOutOfRange && query.data.data.length === 0 && (
          <div className="activity-message">
            <h2>{translate('No notifications')}</h2>
            <p>{translate('Try another type or switch the demo state to Normal.')}</p>
            <button
              className="inline-button"
              type="button"
              onClick={() => setSearchParams(new URLSearchParams(), { replace: true })}
            >
              {translate('Clear filters')}
            </button>
          </div>
        )}
        {query.isSuccess && !pageOutOfRange && query.data.data.length > 0 && (
          <>
            <ul className="notification-list">
              {query.data.data.map((item) => (
                <li key={item.id}>
                  <div>
                    <span className="notification-kind">{localize(item.kind)}</span>
                    <h2>{localize(item.title)}</h2>
                    <p>{localize(item.body)}</p>
                  </div>
                  <div className="notification-meta">
                    <span>{localize(formatDate(item.createdAt))}</span>
                    <span>{localize(item.readAt ? 'Read' : 'Unread')}</span>
                  </div>
                </li>
              ))}
            </ul>
            <div className="activity-pagination">
              <span>
                {translate('Page {{v0}} of {{v1}}', {
                  v0: localize(page),
                  v1: localize(totalPages)
                })}
              </span>
              <div>
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => updateParams('page', String(page - 1))}
                >
                  {translate('Previous')}
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => updateParams('page', String(page + 1))}
                >
                  {translate('Next')}
                </button>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
