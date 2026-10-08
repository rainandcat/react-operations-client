import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { ApiRequestError } from '@/services/apiTypes';
import type { MockScenario } from '@/services/mockTransport';
import type { ActivityKind } from './types';
import { useActivities } from './useActivities';

const kinds: readonly ActivityKind[] = ['credit', 'debit', 'transfer'];

function readPage(value: string | null): number {
  const page = Number(value);
  return Number.isSafeInteger(page) && page > 0 ? page : 1;
}

function readKind(value: string | null): ActivityKind | undefined {
  return kinds.find((kind) => kind === value);
}

function readScenario(value: string | null): MockScenario {
  if (value === 'empty') return 'empty';
  if (value === 'error') return 'unavailable';
  return 'normal';
}

export default function ActivityPage() {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const kind = readKind(searchParams.get('kind'));
  const sort = searchParams.get('sort') === 'oldest' ? 'oldest' : 'newest';
  const page = readPage(searchParams.get('page'));
  const scenario = readScenario(searchParams.get('demo'));
  const query = useActivities({ kind, sort, page, pageSize: 5 }, scenario);
  const totalPages = Math.max(1, Math.ceil((query.data?.total ?? 0) / 5));

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
        <p className="eyebrow">Your timeline</p>
        <h1>Activity</h1>
        <p>Explore a small, fictional timeline. No account or backend connection is involved.</p>
      </section>

      <section className="activity-panel" aria-label="Activity results">
        <div className="activity-controls">
          <div className="activity-field">
            <label htmlFor="activity-kind">Activity type</label>
            <select
              id="activity-kind"
              value={kind ?? ''}
              onChange={(event) => updateParams('kind', event.target.value, true)}
            >
              <option value="">All types</option>
              <option value="credit">Credit</option>
              <option value="debit">Debit</option>
              <option value="transfer">Transfer</option>
            </select>
          </div>
          <div className="activity-field">
            <label htmlFor="activity-sort">Sort</label>
            <select
              id="activity-sort"
              value={sort}
              onChange={(event) =>
                updateParams('sort', event.target.value === 'oldest' ? 'oldest' : '', true)
              }
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </div>
          <div className="activity-field">
            <label htmlFor="demo-scenario">Demo state</label>
            <select
              id="demo-scenario"
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
            ? 'Updating fictional activity…'
            : `${query.data?.total ?? 0} fictional activities`}
        </p>
        {query.isPending && (
          <p className="activity-message" role="status">
            Loading fictional activity…
          </p>
        )}
        {query.isError && (
          <div className="activity-message" role="alert">
            <h2>Activity is unavailable</h2>
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
        {query.isSuccess && query.data.data.length === 0 && (
          <div className="activity-message">
            <h2>Nothing to show</h2>
            <p>Try another activity type or switch the demo state to Normal.</p>
            <button
              className="inline-button"
              type="button"
              onClick={() => setSearchParams(new URLSearchParams(), { replace: true })}
            >
              Clear filters
            </button>
          </div>
        )}
        {query.isSuccess && query.data.data.length > 0 && (
          <>
            <ul className="activity-list">
              {query.data.data.map((activity) => (
                <li key={activity.id}>
                  <Link
                    to={`/activity/${activity.id}`}
                    state={{ listSearch: location.search }}
                    className="activity-item"
                  >
                    <span className="activity-monogram" aria-hidden="true">
                      {activity.kind.slice(0, 1).toUpperCase()}
                    </span>
                    <span className="activity-description">
                      <strong>{activity.kind}</strong>
                      <small>
                        {activity.id} · {activity.occurredAt.slice(0, 10)}
                      </small>
                    </span>
                    <span className="activity-amount">
                      <strong>
                        {activity.amount} {activity.currencyCode}
                      </strong>
                      <small>{activity.status}</small>
                    </span>
                    <span aria-hidden="true">↗</span>
                  </Link>
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
