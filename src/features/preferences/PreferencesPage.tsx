import { usePreferences } from './preferencesStore';

export default function PreferencesPage() {
  const theme = usePreferences((state) => state.theme);
  const density = usePreferences((state) => state.density);
  const setTheme = usePreferences((state) => state.setTheme);
  const setDensity = usePreferences((state) => state.setDensity);
  const reset = usePreferences((state) => state.reset);

  return (
    <div className="page-stack">
      <section className="page-heading">
        <p className="eyebrow">Your space</p>
        <h1>Preferences</h1>
        <p>Adjust this demo to suit your reading style. Choices stay in this browser.</p>
      </section>
      <section className="activity-panel preference-panel">
        <fieldset>
          <legend>Appearance</legend>
          <p className="muted">Choose a light or dark canvas.</p>
          <label>
            <input
              type="radio"
              name="theme"
              value="light"
              checked={theme === 'light'}
              onChange={() => setTheme('light')}
            />{' '}
            Light
          </label>
          <label>
            <input
              type="radio"
              name="theme"
              value="dark"
              checked={theme === 'dark'}
              onChange={() => setTheme('dark')}
            />{' '}
            Dark
          </label>
        </fieldset>
        <fieldset>
          <legend>List spacing</legend>
          <p className="muted">Compact mode fits more activity and notifications on screen.</p>
          <label>
            <input
              type="radio"
              name="density"
              value="comfortable"
              checked={density === 'comfortable'}
              onChange={() => setDensity('comfortable')}
            />{' '}
            Comfortable
          </label>
          <label>
            <input
              type="radio"
              name="density"
              value="compact"
              checked={density === 'compact'}
              onChange={() => setDensity('compact')}
            />{' '}
            Compact
          </label>
        </fieldset>
        <button className="button button-light" type="button" onClick={reset}>
          Restore defaults
        </button>
        <p role="status">
          Current display: {theme}, {density}.
        </p>
      </section>
    </div>
  );
}
