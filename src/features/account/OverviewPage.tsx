import { Link } from 'react-router-dom';
import { useClientSession } from '@/features/auth/sessionStore';

export default function OverviewPage() {
  const name = useClientSession((state) => state.session?.displayName ?? 'there');
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
      <section className="section-heading">
        <div>
          <p className="eyebrow">A simple beginning</p>
          <h2>Stay oriented</h2>
        </div>
        <p>These spaces are ready for locally authored mock data in M2.</p>
      </section>
      <div className="card-grid">
        <Link className="feature-card" to="/activity">
          <span className="card-index">01</span>
          <h3>Activity</h3>
          <p>A clear timeline of fictional activity will live here.</p>
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
