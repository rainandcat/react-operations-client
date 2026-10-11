import { formatDate } from '@/i18n';
import { translate, localize, useLocale } from '@/i18n';
import { Link, useLocation, useParams } from 'react-router-dom';
import { ApiRequestError } from '@/services/apiTypes';
import { useActivity } from './useActivities';
export default function ActivityDetailPage() {
  useLocale();
  const { activityId } = useParams();
  const location = useLocation();
  const listSearch = (
    location.state as {
      listSearch?: string;
    } | null
  )?.listSearch;
  const backTo = listSearch?.startsWith('?') ? `/activity${listSearch}` : '/activity';
  const query = useActivity(activityId ?? '');
  const notFound = query.error instanceof ApiRequestError && query.error.code === 'NOT_FOUND';
  return (
    <div className="page-stack">
      <Link className="back-link" to={backTo}>
        {translate('\u2190 Back to activity')}
      </Link>
      {query.isPending && (
        <p className="activity-message" role="status">
          {translate('Loading fictional activity\u2026')}
        </p>
      )}
      {query.isError && (
        <section className="activity-panel activity-message" role="alert">
          <p className="eyebrow">{translate('Activity / {{v0}}', { v0: localize(activityId) })}</p>
          <h1>{localize(notFound ? 'Activity not found' : 'Activity unavailable')}</h1>
          <p>
            {localize(
              query.error instanceof ApiRequestError
                ? query.error.message
                : 'An unexpected demo error occurred.'
            )}
          </p>
          {notFound ? (
            <Link className="button button-primary" to={backTo}>
              {translate('Back to activity')}
            </Link>
          ) : (
            <button className="button button-primary" type="button" onClick={() => query.refetch()}>
              {translate('Try again')}
            </button>
          )}
        </section>
      )}
      {query.isSuccess && (
        <section className="activity-panel activity-detail">
          <p className="eyebrow">
            {translate('Activity / {{v0}}', { v0: localize(query.data.data.id) })}
          </p>
          <h1>{translate('{{v0}} activity', { v0: localize(query.data.data.kind) })}</h1>
          <dl className="activity-detail-grid">
            <div>
              <dt>{translate('Status')}</dt>
              <dd>{localize(query.data.data.status)}</dd>
            </div>
            <div>
              <dt>{translate('Amount')}</dt>
              <dd>
                {translate('{{v0}} {{v1}}', {
                  v0: localize(query.data.data.amount),
                  v1: localize(query.data.data.currencyCode)
                })}
              </dd>
            </div>
            <div>
              <dt>{translate('Occurred')}</dt>
              <dd>{localize(formatDate(query.data.data.occurredAt))}</dd>
            </div>
            <div>
              <dt>{translate('Snapshot updated')}</dt>
              <dd>{localize(formatDate(query.data.updatedAt))}</dd>
            </div>
          </dl>
          <p className="muted">
            {translate('All values are fictional; this page cannot perform a transaction.')}
          </p>
        </section>
      )}
    </div>
  );
}
