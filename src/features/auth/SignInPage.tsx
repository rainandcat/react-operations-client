import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { authenticateDemoClient } from './demoAuth';
import { useClientSession } from './sessionStore';

export function SignInPage() {
  const [account, setAccount] = useState('member@demo.invalid');
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const session = useClientSession((state) => state.session);
  const signIn = useClientSession((state) => state.signIn);
  const navigate = useNavigate();
  const location = useLocation();

  if (session) return <Navigate to="/overview" replace />;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!account.trim() || !passcode.trim()) {
      setError('Enter the demo account and passcode.');
      return;
    }
    const nextSession = authenticateDemoClient(account, passcode);
    if (!nextSession) {
      setError('These demo details do not match. Use the account shown below.');
      return;
    }
    signIn(nextSession);
    const from = (location.state as { from?: string } | null)?.from;
    navigate(from?.startsWith('/') && !from.startsWith('//') ? from : '/overview', {
      replace: true
    });
  }

  return (
    <main className="sign-in-shell">
      <section className="sign-in-story" aria-labelledby="sign-in-title">
        <span className="eyebrow">Operations Suite / Client</span>
        <h1 id="sign-in-title">Your day, in focus.</h1>
        <p>
          A calm place to explore account activity and preferences. This portfolio experience uses
          fictional data only.
        </p>
        <div className="story-mark" aria-hidden="true">
          01 / 04
        </div>
      </section>
      <section className="sign-in-card" aria-label="Demo sign in">
        <p className="eyebrow">Private preview</p>
        <h2>Welcome back</h2>
        <p className="muted">Sign in with the local demo account.</p>
        <form onSubmit={handleSubmit} noValidate>
          <label htmlFor="account">Demo account</label>
          <input
            id="account"
            type="email"
            autoComplete="username"
            value={account}
            onChange={(event) => {
              setAccount(event.target.value);
              setError('');
            }}
            aria-invalid={Boolean(error)}
          />
          <label htmlFor="passcode">Passcode</label>
          <input
            id="passcode"
            type="password"
            autoComplete="current-password"
            value={passcode}
            onChange={(event) => {
              setPasscode(event.target.value);
              setError('');
            }}
            aria-invalid={Boolean(error)}
          />
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <button className="button button-primary" type="submit">
            Enter demo
          </button>
        </form>
        <p className="demo-hint">
          Account: <strong>member@demo.invalid</strong>
          <br />
          Passcode: <strong>demo123</strong>
        </p>
      </section>
    </main>
  );
}
