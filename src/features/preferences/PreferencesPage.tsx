import { LanguageSelector } from '@/i18n/LanguageSelector';
import { translate, localize, useLocale } from '@/i18n';
import { usePreferences } from './preferencesStore';
export default function PreferencesPage() {
  useLocale();
  const theme = usePreferences((state) => state.theme);
  const density = usePreferences((state) => state.density);
  const setTheme = usePreferences((state) => state.setTheme);
  const setDensity = usePreferences((state) => state.setDensity);
  const reset = usePreferences((state) => state.reset);
  return (
    <div className="page-stack">
      <section className="page-heading">
        <p className="eyebrow">{translate('Your space')}</p>
        <h1>{translate('Preferences')}</h1>
        <p>
          {translate('Adjust this demo to suit your reading style. Choices stay in this browser.')}
        </p>
      </section>
      <section className="activity-panel preference-panel">
        <LanguageSelector reset />
        <fieldset>
          <legend>{translate('Appearance')}</legend>
          <p className="muted">{translate('Choose a light or dark canvas.')}</p>
          <label>
            <input
              type="radio"
              name="theme"
              value="light"
              checked={theme === 'light'}
              onChange={() => setTheme('light')}
            />
            {translate('Light')}
          </label>
          <label>
            <input
              type="radio"
              name="theme"
              value="dark"
              checked={theme === 'dark'}
              onChange={() => setTheme('dark')}
            />
            {translate('Dark')}
          </label>
        </fieldset>
        <fieldset>
          <legend>{translate('List spacing')}</legend>
          <p className="muted">
            {translate('Compact mode fits more activity and notifications on screen.')}
          </p>
          <label>
            <input
              type="radio"
              name="density"
              value="comfortable"
              checked={density === 'comfortable'}
              onChange={() => setDensity('comfortable')}
            />
            {translate('Comfortable')}
          </label>
          <label>
            <input
              type="radio"
              name="density"
              value="compact"
              checked={density === 'compact'}
              onChange={() => setDensity('compact')}
            />
            {translate('Compact')}
          </label>
        </fieldset>
        <button className="button button-light" type="button" onClick={reset}>
          {translate('Restore defaults')}
        </button>
        <p role="status">
          {translate('Current display: {{v0}}, {{v1}}.', {
            v0: localize(theme),
            v1: localize(density)
          })}
        </p>
      </section>
    </div>
  );
}
