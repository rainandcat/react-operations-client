import { Link, useParams } from 'react-router-dom';
import { ApiRequestError } from '@/services/apiTypes';
import { useActivity } from './useActivities';

export default function ActivityDetailPage() {
  const { activityId } = useParams();
  const query = useActivity(activityId ?? '');
  const notFound = query.error instanceof ApiRequestError && query.error.code === 'NOT_FOUND';
  return (
    <div className="page-stack">
      <Link className="back-link" to="/activity">
        ← Back to activity
      </Link>
      {query.isPending && (
        <p className="activity-message" role="status">
          Loading fictional activity…
        </p>
      )}
      {query.isError && (
        <section className="activity-panel activity-message" role="alert">
          <p className="eyebrow">Activity / {activityId}</p>
          <h1>{notFound ? 'Activity not found' : 'Activity unavailable'}</h1>
          <p>
            {query.error instanceof ApiRequestError
              ? query.error.message
              : 'An unexpected demo error occurred.'}
          </p>
          {notFound ? (
            <Link className="button button-primary" to="/activity">
              Back to activity
            </Link>
          ) : (
            <button className="button button-primary" type="button" onClick={() => query.refetch()}>
              Try again
            </button>
          )}
        </section>
      )}
      {query.isSuccess && (
        <section className="activity-panel activity-detail">
          <p className="eyebrow">Activity / {query.data.data.id}</p>
          <h1>{query.data.data.kind} activity</h1>
          <dl className="activity-detail-grid">
            <div>
              <dt>Status</dt>
              <dd>{query.data.data.status}</dd>
            </div>
            <div>
              <dt>Amount</dt>
              <dd>
                {query.data.data.amount} {query.data.data.currencyCode}
              </dd>
            </div>
            <div>
              <dt>Occurred</dt>
              <dd>{query.data.data.occurredAt.slice(0, 10)}</dd>
            </div>
            <div>
              <dt>Snapshot updated</dt>
              <dd>{query.data.updatedAt.slice(0, 10)}</dd>
            </div>
          </dl>
          <p className="muted">All values are fictional; this page cannot perform a transaction.</p>
        </section>
      )}
    </div>
  );
}
