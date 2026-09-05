/**
 * ErrorBoundary Component
 * Catches React render errors and logs them via the RDF logger.
 * From FRAMEWORK_QUICK_REFERENCE.md Pattern 4.
 */

import React from 'react';
import { logger } from '../framework/logging/core/Logger';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to RDF logger as CRITICAL (from FRAMEWORK_QUICK_REFERENCE.md)
    logger.critical(
      'component:errorBoundary',
      `${error.name}: ${error.message}`,
      {
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      }
    );
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="text-center p-8 max-w-md">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-slate-800 mb-2">Something went wrong</h1>
            <p className="text-slate-500 mb-6">
              We're sorry — an unexpected error occurred. Please refresh the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-teal-600 text-white px-6 py-3 rounded-xl hover:bg-teal-700 transition-colors"
            >
              Refresh Page
            </button>
            {import.meta.env.DEV && (
              <details className="mt-6 text-left text-sm text-slate-500 bg-slate-100 p-4 rounded-lg">
                <summary className="cursor-pointer font-medium text-red-500">
                  Dev: Error Details
                </summary>
                <pre className="mt-2 overflow-auto text-xs">
                  {this.state.error?.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
