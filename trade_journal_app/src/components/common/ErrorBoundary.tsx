import { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center py-12 px-4">
          <div className="w-14 h-14 rounded-2xl bg-red-900/20 border border-red-800/30 flex items-center justify-center mb-4">
            <AlertTriangle size={24} className="text-loss" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-1">Something went wrong</h3>
          <p className="text-sm text-gray-500 text-center max-w-sm mb-4">
            {this.props.fallbackMessage || 'An unexpected error occurred. Try reloading the page.'}
          </p>
          <p className="text-xs text-gray-600 font-mono mb-4 max-w-md text-center">
            {this.state.error?.message}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
