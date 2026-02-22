import React, { Component } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug, Search } from 'lucide-react';

// Fallback UI for error boundary — Dark Forge
const ErrorFallback = ({ error, resetError, componentName }) => {
  const isDev = import.meta.env.DEV;

  return (
    <div className="min-h-[400px] flex items-center justify-center p-6">
      <div
        className="max-w-lg w-full text-center p-8"
        style={{ background: '#111318', border: '1px solid #1F2430', borderRadius: '12px' }}
      >
        <div
          className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4"
          style={{ background: 'rgba(239, 68, 68, 0.1)' }}
        >
          <AlertTriangle className="w-8 h-8" style={{ color: '#EF4444' }} />
        </div>

        <h2 className="text-xl font-semibold mb-2" style={{ color: '#F1F5F9' }}>
          Something went wrong
        </h2>

        <p className="mb-6" style={{ color: '#94A3B8', fontSize: '15px' }}>
          {componentName
            ? `The ${componentName} section encountered an error.`
            : 'An error occurred while rendering this section.'
          }
        </p>

        {isDev && error && (
          <div
            className="rounded-lg p-4 mb-6 text-left overflow-auto"
            style={{ background: '#0A0B0D', border: '1px solid #1F2430' }}
          >
            <p className="text-sm font-mono mb-2" style={{ color: '#EF4444' }}>{error.message}</p>
            {error.stack && (
              <pre className="text-xs font-mono whitespace-pre-wrap" style={{ color: '#475569' }}>
                {error.stack.split('\n').slice(1, 5).join('\n')}
              </pre>
            )}
          </div>
        )}

        <div className="flex items-center justify-center gap-3">
          <button
            className="btn-ghost flex items-center gap-2"
            onClick={() => window.location.href = '/'}
          >
            <Home className="w-4 h-4" />
            Go Home
          </button>
          <button
            className="btn-primary flex items-center gap-2"
            onClick={resetError}
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      </div>
    </div>
  );
};

// Error Boundary Component
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log to error reporting service
    console.error('ErrorBoundary caught error:', error, errorInfo);
    
    // You could send to an error tracking service here
    // Sentry.captureException(error, { extra: errorInfo });
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.resetError);
      }
      
      return (
        <ErrorFallback
          error={this.state.error}
          resetError={this.resetError}
          componentName={this.props.componentName}
        />
      );
    }

    return this.props.children;
  }
}

// Section-level error boundary (smaller fallback)
export const SectionErrorBoundary = class extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('SectionErrorBoundary caught error:', error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="p-4 rounded-xl"
          style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}
        >
          <div className="flex items-center gap-3">
            <Bug className="w-5 h-5" style={{ color: '#EF4444' }} />
            <div className="flex-1">
              <p className="text-sm font-medium" style={{ color: '#F1F5F9' }}>
                Failed to load section
              </p>
              <p className="text-xs mt-0.5" style={{ color: '#94A3B8' }}>
                {this.state.error?.message || 'An unexpected error occurred'}
              </p>
            </div>
            <button
              className="btn-ghost flex items-center gap-1.5 text-sm"
              onClick={this.resetError}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
};

// Async Error Handler Hook
export const useAsyncError = () => {
  const [error, setError] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const execute = React.useCallback(async (asyncFunction, ...args) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await asyncFunction(...args);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = React.useCallback(() => {
    setError(null);
  }, []);

  return { execute, error, isLoading, reset };
};

// API Error Handler Component
export const APIErrorState = ({ error, onRetry }) => {
  let title = 'Request failed';
  let message = 'Something went wrong. Please try again.';
  let IconComp = AlertTriangle;

  if (error?.status === 404) {
    title = 'Not found';
    message = 'The requested resource could not be found.';
    IconComp = Search;
  } else if (error?.status === 403) {
    title = 'Access denied';
    message = 'You do not have permission to access this resource.';
  } else if (error?.status >= 500) {
    title = 'Server error';
    message = 'Our servers are experiencing issues. Please try again later.';
  } else if (error?.message?.includes('network')) {
    title = 'Network error';
    message = 'Please check your connection and try again.';
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div
        className="w-14 h-14 rounded-xl flex items-center justify-center mb-4"
        style={{ background: 'rgba(245,158,11,0.1)' }}
      >
        <IconComp className="w-7 h-7" style={{ color: '#F59E0B' }} />
      </div>
      <h3 className="text-lg font-semibold mb-1" style={{ color: '#F1F5F9' }}>{title}</h3>
      <p className="text-sm max-w-sm mb-4" style={{ color: '#94A3B8' }}>{message}</p>
      {onRetry && (
        <button className="btn-secondary flex items-center gap-2" onClick={onRetry}>
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      )}
    </div>
  );
};

export default ErrorBoundary;
