import { Component } from 'react';

/**
 * ErrorBoundary — Catches render errors in widget subtrees.
 * 
 * Wraps each floating panel's content so a single widget crash
 * doesn't take down the entire dashboard. Shows a graceful error
 * message with a retry button.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: '16px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span style={{ fontSize: '24px' }}>⚠️</span>
          <p
            className="text-sm font-medium"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Something went wrong
          </p>
          <p
            className="text-xs"
            style={{ color: 'var(--color-text-muted)' }}
          >
            {this.props.fallbackMessage || 'This widget failed to load.'}
          </p>
          <button
            onClick={this.handleRetry}
            className="text-xs font-medium px-3 py-1.5 rounded-lg"
            style={{
              background: 'rgba(59, 130, 246, 0.1)',
              color: '#3B82F6',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              cursor: 'pointer',
              marginTop: '4px',
            }}
          >
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
