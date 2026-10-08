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
        <p className="eyebrow">Stay informed</p>
        <h1>Notifications</h1>
        <p>Relevant updates, thoughtfully grouped.</p>
      </section>
      <section className="activity-panel" aria-label="Notification results">
        <div className="activity-controls">
          <div className="activity-field">
            <label htmlFor="notification-kind">Notification type</label>
            <select
              id="notification-kind"
              value={kind ?? ''}
              onChange={(event) => updateParams('kind', event.target.value, true)}
            >
              <option value="">All types</option>
              {kinds.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <div className="activity-field">
            <label htmlFor="notification-demo">Demo state</label>
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
              <option value="normal">Normal</option>
              <option value="empty">Empty</option>
              <option value="error">Service error</option>
            </select>
          </div>
        </div>
        <p className="activity-count" role="status" aria-live="polite">
          {query.isFetching
            ? 'Updating fictional notifications…'
            : `${query.data?.total ?? 0} fictional notifications`}
        </p>
        {query.isPending && (
          <p className="activity-message" role="status">
            Loading fictional notifications…
          </p>
        )}
        {query.isError && (
          <div className="activity-message" role="alert">
            <h2>Notifications unavailable</h2>
            <p>
              {query.error instanceof ApiRequestError
                ? query.error.message
                : 'An unexpected demo error occurred.'}
            </p>
            <button className="button button-primary" type="button" onClick={() => query.refetch()}>
              Try again
            </button>
          </div>
        )}
        {pageOutOfRange && <p role="status">Moving to the last available page…</p>}
        {query.isSuccess && !pageOutOfRange && query.data.data.length === 0 && (
          <div className="activity-message">
            <h2>No notifications</h2>
            <p>Try another type or switch the demo state to Normal.</p>
            <button
              className="inline-button"
              type="button"
              onClick={() => setSearchParams(new URLSearchParams(), { replace: true })}
            >
              Clear filters
            </button>
          </div>
        )}
        {query.isSuccess && !pageOutOfRange && query.data.data.length > 0 && (
          <>
            <ul className="notification-list">
              {query.data.data.map((item) => (
                <li key={item.id}>
                  <div>
                    <span className="notification-kind">{item.kind}</span>
                    <h2>{item.title}</h2>
                    <p>{item.body}</p>
                  </div>
                  <div className="notification-meta">
                    <span>{item.createdAt.slice(0, 10)}</span>
                    <span>{item.readAt ? 'Read' : 'Unread'}</span>
                  </div>
                </li>
              ))}
            </ul>
            <div className="activity-pagination">
              <span>
                Page {page} of {totalPages}
              </span>
              <div>
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => updateParams('page', String(page - 1))}
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => updateParams('page', String(page + 1))}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
