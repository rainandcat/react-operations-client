import { formatDate } from '@/i18n';
import { translate, localize, useLocale } from '@/i18n';
import { useEffect } from 'react';
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
  useLocale();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const kind = readKind(searchParams.get('kind'));
  const sort = searchParams.get('sort') === 'oldest' ? 'oldest' : 'newest';
  const page = readPage(searchParams.get('page'));
  const scenario = readScenario(searchParams.get('demo'));
  const query = useActivities({ kind, sort, page, pageSize: 5 }, scenario);
  const totalPages = Math.max(1, Math.ceil((query.data?.total ?? 0) / 5));
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
        <p className="eyebrow">{translate('Your timeline')}</p>
        <h1>{translate('Activity')}</h1>
        <p>
          {translate(
            'Explore a small, fictional timeline. No account or backend connection is involved.'
          )}
        </p>
      </section>

      <section className="activity-panel" aria-label={translate('Activity results')}>
        <div className="activity-controls">
          <div className="activity-field">
            <label htmlFor="activity-kind">{translate('Activity type')}</label>
            <select
              id="activity-kind"
              value={kind ?? ''}
              onChange={(event) => updateParams('kind', event.target.value, true)}
            >
              <option value="">{translate('All types')}</option>
              <option value="credit">{translate('Credit')}</option>
              <option value="debit">{translate('Debit')}</option>
              <option value="transfer">{translate('Transfer')}</option>
            </select>
          </div>
          <div className="activity-field">
            <label htmlFor="activity-sort">{translate('Sort')}</label>
            <select
              id="activity-sort"
              value={sort}
              onChange={(event) =>
                updateParams('sort', event.target.value === 'oldest' ? 'oldest' : '', true)
              }
            >
              <option value="newest">{translate('Newest first')}</option>
              <option value="oldest">{translate('Oldest first')}</option>
            </select>
          </div>
          <div className="activity-field">
            <label htmlFor="demo-scenario">{translate('Demo state')}</label>
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
              <option value="normal">{translate('Normal')}</option>
              <option value="empty">{translate('Empty')}</option>
              <option value="error">{translate('Service error')}</option>
            </select>
          </div>
        </div>
        <p className="activity-count" role="status" aria-live="polite">
          {localize(
            query.isFetching
              ? 'Updating fictional activity…'
              : `${query.data?.total ?? 0} fictional activities`
          )}
        </p>
        {query.isPending && (
          <p className="activity-message" role="status">
            {translate('Loading fictional activity\u2026')}
          </p>
        )}
        {query.isError && (
          <div className="activity-message" role="alert">
            <h2>{translate('Activity is unavailable')}</h2>
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
            <h2>{translate('Nothing to show')}</h2>
            <p>{translate('Try another activity type or switch the demo state to Normal.')}</p>
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
            <ul className="activity-list">
              {query.data.data.map((activity) => (
                <li key={activity.id}>
                  <Link
                    to={`/activity/${activity.id}`}
                    state={{ listSearch: location.search }}
                    className="activity-item"
                  >
                    <span className="activity-monogram" aria-hidden="true">
                      {localize(activity.kind.slice(0, 1).toUpperCase())}
                    </span>
                    <span className="activity-description">
                      <strong>{localize(activity.kind)}</strong>
                      <small>
                        {translate('{{v0}} \u00B7 {{v1}}', {
                          v0: localize(activity.id),
                          v1: localize(formatDate(activity.occurredAt))
                        })}
                      </small>
                    </span>
                    <span className="activity-amount">
                      <strong>
                        {translate('{{v0}} {{v1}}', {
                          v0: localize(activity.amount),
                          v1: localize(activity.currencyCode)
                        })}
                      </strong>
                      <small>{localize(activity.status)}</small>
                    </span>
                    <span aria-hidden="true">↗</span>
                  </Link>
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
