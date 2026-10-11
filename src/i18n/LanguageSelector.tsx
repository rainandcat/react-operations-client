import { useRef, useState } from 'react';
import { changeLocale, languages, translate, useLocale, type Locale } from './index';
export function LanguageSelector({ reset = false }: { reset?: boolean }) {
  const locale = useLocale();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const request = useRef(0);
  async function select(value: Locale) {
    const attempt = ++request.current;
    setBusy(true);
    setError(false);
    try {
      await changeLocale(value);
    } catch {
      if (attempt === request.current) setError(true);
    } finally {
      if (attempt === request.current) setBusy(false);
    }
  }
  return (
    <div className="language-control">
      <select
        aria-label={translate('Language')}
        value={locale}
        aria-busy={busy}
        onChange={(event) => void select(event.target.value as Locale)}
      >
        {languages.map((language) => (
          <option key={language.value} value={language.value} lang={language.value}>
            {language.label}
          </option>
        ))}
      </select>
      {busy && (
        <span className="sr-only" role="status">
          {translate('Loading language…')}
        </span>
      )}
      {error && <span role="alert">{translate('Could not load the language. Try again.')}</span>}
      {reset && (
        <button type="button" onClick={() => void select('en')}>
          {translate('Reset language')}
        </button>
      )}
    </div>
  );
}
