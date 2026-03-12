import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { colors } from '../../styles/tokens';

/**
 * TabErrorBoundary Component
 * Error boundary for settings tab panels using Dark Forge design system
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
    console.error('Settings tab error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    this.props.onRetry?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="card p-12 text-center border-dashed border-2 border-danger-border bg-danger-muted/5">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-danger-muted flex items-center justify-center border border-danger-border shadow-inner">
            <AlertCircle className="w-8 h-8 text-danger-light" />
          </div>
          <h3 className="text-lg font-bold text-text-primary mb-2 tracking-tight">Intelligence Component Failure</h3>
          <p className="text-sm text-text-muted max-w-xs mx-auto leading-relaxed mb-6">
            The requested configuration section encountered a runtime error: 
            <span className="block mt-2 font-mono text-xs text-danger-light opacity-80">{this.state.error?.message || 'Unexpected exception'}</span>
          </p>
          <button 
            onClick={this.handleRetry}
            className="btn-primary h-10 px-6 text-xs font-semibold uppercase tracking-widest flex items-center gap-2 mx-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reload Component
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
