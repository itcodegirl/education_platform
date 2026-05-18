// ===============================================
// ERROR BOUNDARY - Catches React render crashes
// Shows friendly fallback with retry option
// ===============================================

import { Component, createRef } from 'react';
import { reportException } from '../../lib/sentry';

export function didResetKeysChange(prevResetKeys = [], resetKeys = []) {
  if (prevResetKeys === resetKeys) return false;
  if (prevResetKeys.length !== resetKeys.length) return true;
  return resetKeys.some((key, index) => !Object.is(key, prevResetKeys[index]));
}

export function shouldRevealErrorDetails(env = import.meta.env) {
  return Boolean(env?.DEV);
}

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
    this.headingRef = createRef();
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    reportException(error, { componentStack: errorInfo?.componentStack });

    // In dev, log the full error to the console so the developer sees
    // the stack trace immediately. In production, we don't want to
    // pollute the user's devtools.
    if (import.meta.env.DEV) {
      console.error('CodeHerWay render error:', error, errorInfo);
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (!prevState.hasError && this.state.hasError) {
      this.headingRef.current?.focus();
    }
    if (this.state.hasError && didResetKeysChange(prevProps.resetKeys, this.props.resetKeys)) {
      this.handleRetry();
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Allow callers to supply a compact inline fallback (e.g. panels)
      // instead of the full-screen overlay.
      if (this.props.fallback) {
        return typeof this.props.fallback === 'function'
          ? this.props.fallback({ error: this.state.error, retry: this.handleRetry })
          : this.props.fallback;
      }

      return (
        <div className="eb-screen">
          <div className="eb-card">
            <span className="eb-icon" aria-hidden="true">⚠︎</span>
            <h2 className="eb-title" ref={this.headingRef} tabIndex={-1}>We hit a temporary snag</h2>
            <p className="eb-msg">
              Your learning screen could not finish loading. Your local progress is still kept where possible.
            </p>
            {shouldRevealErrorDetails() && this.state.error?.message && (
              <div className="eb-detail">
                <code>{this.state.error.message}</code>
              </div>
            )}
            <div className="eb-actions">
              <button type="button" className="eb-retry" onClick={this.handleRetry}>
                Try again
              </button>
              <button type="button" className="eb-reload" onClick={this.handleReload}>
                Reload page
              </button>
            </div>
            <p className="eb-help">
              If this keeps happening, reload once. If the problem returns, contact{' '}
              <a href="mailto:hello@codeherway.com">support</a>.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}



