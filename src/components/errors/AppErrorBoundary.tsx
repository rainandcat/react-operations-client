import { translate, useLocale } from '@/i18n';
import { Component, type ReactNode } from 'react';
interface Props {
  children: ReactNode;
}
interface State {
  hasError: boolean;
}
class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };
  static getDerivedStateFromError(): State {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return (
        <main className="app-error-shell" role="alert">
          <p className="eyebrow">{translate('Application error')}</p>
          <h1>{translate('This demo could not open.')}</h1>
          <p>{translate('Your browser has not sent any account data. Reload to try again.')}</p>
          <button
            className="button button-primary"
            type="button"
            onClick={() => window.location.reload()}
          >
            {translate('Reload demo')}
          </button>
        </main>
      );
    }
    return this.props.children;
  }
}
export function AppErrorBoundary({ children }: Props) {
  useLocale();
  return <ErrorBoundary>{children}</ErrorBoundary>;
}
