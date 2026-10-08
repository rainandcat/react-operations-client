import { Link, useSearchParams } from 'react-router-dom';
import { useClientSession } from '@/features/auth/sessionStore';
import { ApiRequestError } from '@/services/apiTypes';
import type { MockScenario } from '@/services/mockTransport';
import { useAccountOverview } from './useAccountOverview';

export default function OverviewPage() {
  const name = useClientSession((state) => state.session?.displayName ?? 'there');
  const [searchParams, setSearchParams] = useSearchParams();
  const scenario: MockScenario =
    searchParams.get('demo') === 'empty'
      ? 'empty'
      : searchParams.get('demo') === 'error'
        ? 'unavailable'
        : 'normal';
  const query = useAccountOverview(scenario);

  function setScenario(value: string) {
    setSearchParams(
      value === 'normal' ? new URLSearchParams() : new URLSearchParams({ demo: value }),
      { replace: true }
    );
  }

  return (
    <div className="page-stack">
      <section className="welcome-panel">
        <p className="eyebrow">Your overview</p>
        <h1>Good to see you, {name}.</h1>
        <p>Everything that matters, gathered in one quiet place.</p>
        <Link className="button button-light" to="/activity">
          Explore activity <span aria-hidden="true">↗</span>
        </Link>
      </section>
      <section className="account-panel" aria-label="Demo account snapshot">
        <div className="account-panel-heading">
          <div>
            <p className="eyebrow">Fictional snapshot</p>
            <h2>Account at a glance</h2>
          </div>
          <div className="activity-field">
            <label htmlFor="overview-demo">Demo state</label>
            <select
              id="overview-demo"
              value={scenario === 'unavailable' ? 'error' : scenario}
              onChange={(event) => setScenario(event.target.value)}
            >
              <option value="normal">Normal</option>
              <option value="empty">Empty</option>
              <option value="error">Service error</option>
            </select>
          </div>
        </div>
        {query.isPending && (
          <p className="activity-message" role="status">
            Loading demo account…
          </p>
        )}
        {query.isError && (
          <div className="activity-message" role="alert">
            <h3>Account unavailable</h3>
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
        {query.isSuccess && !query.data.data && (
          <div className="activity-message">
            <h3>No account snapshot</h3>
            <p>Switch the demo state to Normal to view fictional account data.</p>
          </div>
        )}
        {query.isSuccess && query.data.data && (
          <div className="account-summary">
            <div>
              <span>Demo balance</span>
              <strong>
                {query.data.data.totalBalance} {query.data.data.currencyCode}
              </strong>
            </div>
            <div>
              <span>Account ID</span>
              <strong>{query.data.data.accountId}</strong>
            </div>
            <div>
              <span>Updated</span>
              <strong>{query.data.updatedAt.slice(0, 10)}</strong>
            </div>
          </div>
        )}
      </section>
      <section className="section-heading">
        <div>
          <p className="eyebrow">A simple beginning</p>
          <h2>Stay oriented</h2>
        </div>
        <p>Explore the fictional activity and notifications connected to this demo.</p>
      </section>
      <div className="card-grid">
        <Link className="feature-card" to="/activity">
          <span className="card-index">01</span>
          <h3>Activity</h3>
          <p>A clear timeline of fictional activity.</p>
          <span className="card-arrow" aria-hidden="true">
            ↗
          </span>
        </Link>
        <Link className="feature-card" to="/notifications">
          <span className="card-index">02</span>
          <h3>Notifications</h3>
          <p>Demo updates, without the clutter.</p>
          <span className="card-arrow" aria-hidden="true">
            ↗
          </span>
        </Link>
        <Link className="feature-card" to="/preferences">
          <span className="card-index">03</span>
          <h3>Preferences</h3>
          <p>Make this space feel like yours.</p>
          <span className="card-arrow" aria-hidden="true">
            ↗
          </span>
        </Link>
      </div>
    </div>
  );
}
