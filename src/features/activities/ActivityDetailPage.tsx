import { Link, useParams } from 'react-router-dom';

export default function ActivityDetailPage() {
  const { activityId } = useParams();
  return (
    <div className="page-stack">
      <Link className="back-link" to="/activity">
        ← Back to activity
      </Link>
      <section className="page-heading">
        <p className="eyebrow">Activity detail / route preview</p>
        <h1>{activityId}</h1>
        <p>
          This is a navigation shell. M2 will resolve fictional records by ID and handle unknown
          IDs.
        </p>
      </section>
    </div>
  );
}
