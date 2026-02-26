import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

/**
 * Simple error boundary for Documents tabs.
 * Shows a friendly message and optional retry button.
 */
export default class TabErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, btnHovered: false };
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
        <div className="p-6 text-center space-y-3" style={{ background: '#0A0B0D' }}>
          <AlertCircle className="w-10 h-10 mx-auto" style={{ color: '#EF4444' }} />
          <div>
            <p className="text-sm font-semibold" style={{ color: '#EF4444' }}>Something went wrong</p>
            <p className="text-xs mt-1" style={{ color: '#94A3B8' }}>
              {this.state.error?.message || 'The documents panel failed to render.'}
            </p>
          </div>
          <button
            onClick={this.handleRetry}
            onMouseEnter={() => this.setState({ btnHovered: true })}
            onMouseLeave={() => this.setState({ btnHovered: false })}
            className="inline-flex items-center gap-2 px-4 py-2"
            style={{
              backgroundColor: this.state.btnHovered ? '#2563EB' : '#3B82F6',
              color: '#FFFFFF',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              transition: 'background-color 150ms ease',
            }}
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
