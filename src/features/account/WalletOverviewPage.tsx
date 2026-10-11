import { formatDate } from '@/i18n';
import { translate, localize, useLocale } from '@/i18n';
import { Link, useSearchParams } from 'react-router-dom';
import { useClientSession } from '@/features/auth/sessionStore';
import { ApiRequestError } from '@/services/apiTypes';
import type { MockScenario } from '@/services/mockTransport';
import { useAccountOverview } from './useAccountOverview';
export default function WalletOverviewPage() {
  useLocale();
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
        <p className="eyebrow">{translate('Demo wallet overview')}</p>
        <h1>{translate('Your wallet, {{v0}}.', { v0: localize(name) })}</h1>
        <p>{translate('A fictional account snapshot, separate from public market prices.')}</p>
        <Link className="button button-light" to="/activity">
          {translate('Explore activity')}
          <span aria-hidden="true">↗</span>
        </Link>
      </section>
      <section className="account-panel" aria-label={translate('Demo account snapshot')}>
        <div className="account-panel-heading">
          <div>
            <p className="eyebrow">{translate('Fictional snapshot')}</p>
            <h2>{translate('Account at a glance')}</h2>
          </div>
          <div className="activity-field">
            <label htmlFor="overview-demo">{translate('Demo state')}</label>
            <select
              id="overview-demo"
              value={scenario === 'unavailable' ? 'error' : scenario}
              onChange={(event) => setScenario(event.target.value)}
            >
              <option value="normal">{translate('Normal')}</option>
              <option value="empty">{translate('Empty')}</option>
              <option value="error">{translate('Service error')}</option>
            </select>
          </div>
        </div>
        {query.isPending && (
          <p className="activity-message" role="status">
            {translate('Loading demo account\u2026')}
          </p>
        )}
        {query.isError && (
          <div className="activity-message" role="alert">
            <h3>{translate('Account unavailable')}</h3>
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
        {query.isSuccess && !query.data.data && (
          <div className="activity-message">
            <h3>{translate('No account snapshot')}</h3>
            <p>{translate('Switch the demo state to Normal to view fictional account data.')}</p>
          </div>
        )}
        {query.isSuccess && query.data.data && (
          <div className="account-summary">
            <div>
              <span>{translate('Demo balance')}</span>
              <strong>
                {translate('{{v0}} {{v1}}', {
                  v0: localize(query.data.data.totalBalance),
                  v1: localize(query.data.data.currencyCode)
                })}
              </strong>
            </div>
            <div>
              <span>{translate('Account ID')}</span>
              <strong>{localize(query.data.data.accountId)}</strong>
            </div>
            <div>
              <span>{translate('Updated')}</span>
              <strong>{localize(formatDate(query.data.updatedAt))}</strong>
            </div>
          </div>
        )}
      </section>
      <section className="section-heading">
        <div>
          <p className="eyebrow">{translate('A simple beginning')}</p>
          <h2>{translate('Stay oriented')}</h2>
        </div>
        <p>
          {translate('Explore the fictional activity and notifications connected to this demo.')}
        </p>
      </section>
      <div className="card-grid">
        <Link className="feature-card" to="/activity">
          <span className="card-index">01</span>
          <h3>{translate('Activity')}</h3>
          <p>{translate('A clear timeline of fictional activity.')}</p>
          <span className="card-arrow" aria-hidden="true">
            ↗
          </span>
        </Link>
        <Link className="feature-card" to="/notifications">
          <span className="card-index">02</span>
          <h3>{translate('Notifications')}</h3>
          <p>{translate('Demo updates, without the clutter.')}</p>
          <span className="card-arrow" aria-hidden="true">
            ↗
          </span>
        </Link>
        <Link className="feature-card" to="/preferences">
          <span className="card-index">03</span>
          <h3>{translate('Preferences')}</h3>
          <p>{translate('Make this space feel like yours.')}</p>
          <span className="card-arrow" aria-hidden="true">
            ↗
          </span>
        </Link>
      </div>
    </div>
  );
}
