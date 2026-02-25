import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

/**
 * Simple error boundary for Documents tabs.
 * Shows a friendly message and optional retry button.
 */
export default class TabErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Documents tab error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    this.props.onRetry?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 text-center space-y-3">
          <AlertCircle className="w-10 h-10 mx-auto text-red-500" />
          <div>
            <p className="text-sm font-semibold text-red-500">Something went wrong</p>
            <p className="text-xs text-slate-400 mt-1">
              {this.state.error?.message || 'The documents panel failed to render.'}
            </p>
          </div>
          <button
            onClick={this.handleRetry}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
