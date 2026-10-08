import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="app-error-shell" role="alert">
          <p className="eyebrow">Application error</p>
          <h1>This demo could not open.</h1>
          <p>Your browser has not sent any account data. Reload to try again.</p>
          <button
            className="button button-primary"
            type="button"
            onClick={() => window.location.reload()}
          >
            Reload demo
          </button>
        </main>
      );
    }

    return this.props.children;
  }
}
