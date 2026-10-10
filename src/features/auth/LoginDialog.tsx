import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { authenticateDemoClient } from './demoAuth';
import { useClientSession } from './sessionStore';

export function safeDestination(value: string | null): string | null {
  if (
    !value ||
    value.includes('\\') ||
    [...value].some((character) => character.charCodeAt(0) < 32)
  )
    return null;
  const pathname = value.split(/[?#]/)[0];
  return /^\/(wallet\/overview|activity(?:\/[A-Za-z0-9-]+)?|notifications|preferences)$/.test(
    pathname
  )
    ? value
    : null;
}
export function LoginDialog() {
  const [account, setAccount] = useState('member@demo.invalid');
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const dialog = useRef<HTMLDialogElement>(null);
  const accountInput = useRef<HTMLInputElement>(null);
  const session = useClientSession((state) => state.session);
  const signIn = useClientSession((state) => state.signIn);
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const destination = safeDestination(params.get('returnTo'));
  params.delete('login');
  params.delete('returnTo');
  const background = location.pathname + (params.size ? `?${params}` : '') + location.hash;

  useEffect(() => {
    const node = dialog.current;
    if (!node) return;
    const previous = document.activeElement as HTMLElement | null;
    node.showModal();
    accountInput.current?.focus();
    return () => {
      node.close();
      if (previous?.isConnected && previous !== document.body) previous.focus();
      else document.getElementById('client-sign-in')?.focus();
    };
  }, []);

  function cancel() {
    navigate(background, { replace: true });
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = authenticateDemoClient(account, passcode);
    if (!next) {
      setError('Use member@demo.invalid and passcode demo123.');
      return;
    }
    signIn(next);
    navigate(destination ?? background, { replace: true });
  }
  if (session) return <Navigate to={destination ?? background} replace />;
  return (
    <dialog
      ref={dialog}
      className="login-dialog"
      aria-labelledby="login-title"
      aria-describedby="login-description"
      onKeyDown={(event) => {
        if (event.key !== 'Tab') return;
        const controls = dialog.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled), input:not(:disabled), a[href], select:not(:disabled), [tabindex="0"]'
        );
        if (!controls?.length) return;
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }}
      onCancel={(event) => {
        event.preventDefault();
        cancel();
      }}
    >
      <div className="dialog-heading">
        <p className="eyebrow">Local demo account</p>
        <button type="button" className="text-button" onClick={cancel} aria-label="Close sign in">
          Close ×
        </button>
      </div>
      <h2 id="login-title">Welcome back</h2>
      <p id="login-description">
        Explore your fictional account. This demo sign in does not connect a Binance account.
      </p>
      <form onSubmit={submit} noValidate>
        <label htmlFor="account">Demo account</label>
        <input
          ref={accountInput}
          id="account"
          type="email"
          autoComplete="username"
          value={account}
          onChange={(event) => {
            setAccount(event.target.value);
            setError('');
          }}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? 'login-error' : undefined}
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
          aria-describedby={error ? 'login-error' : undefined}
        />
        {error && (
          <p id="login-error" className="form-error" role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="button button-primary">
          Enter demo
        </button>
      </form>
      <p className="demo-hint">
        Account: <strong>member@demo.invalid</strong>
        <br />
        Passcode: <strong>demo123</strong>
      </p>
    </dialog>
  );
}
