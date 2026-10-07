import { Link } from 'react-router-dom';

export default function ActivityPage() {
  return (
    <div className="page-stack">
      <section className="page-heading">
        <p className="eyebrow">Your timeline</p>
        <h1>Activity</h1>
        <p>
          One place to review what has happened. The fictional timeline and filters arrive in M2.
        </p>
      </section>
      <div className="empty-panel">
        <span className="empty-symbol" aria-hidden="true">
          ↗
        </span>
        <h2>Activity view is ready</h2>
        <p>This route is intentionally a shell until the mock API and seed data are added.</p>
        <Link className="inline-link" to="/activity/demo-001">
          Preview a detail route
        </Link>
      </div>
    </div>
  );
}
