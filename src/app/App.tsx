const projectStatus = '基礎骨架完成';

export function App() {
  return (
    <main className="project-shell">
      <section className="project-intro" aria-labelledby="project-title">
        <p className="eyebrow">Operations Suite / Client</p>
        <h1 id="project-title">Clear personal activity, without the noise.</h1>
        <p className="project-summary">
          This portfolio application uses locally authored mock data only. Account overview,
          activity history, notifications, and preferences will arrive as focused features.
        </p>
        <p className="status" role="status">
          {projectStatus}
        </p>
      </section>
    </main>
  );
}
