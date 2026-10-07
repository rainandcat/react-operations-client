export default function NotificationsPage() {
  return (
    <div className="page-stack">
      <section className="page-heading">
        <p className="eyebrow">Stay informed</p>
        <h1>Notifications</h1>
        <p>Relevant updates, thoughtfully grouped.</p>
      </section>
      <div className="empty-panel">
        <span className="empty-symbol" aria-hidden="true">
          ✳
        </span>
        <h2>A quieter inbox is coming</h2>
        <p>Fictional notifications and their states arrive with the mock API in M2.</p>
      </div>
    </div>
  );
}
