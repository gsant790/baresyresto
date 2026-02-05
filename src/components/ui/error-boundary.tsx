"use client";

import { Component, type ReactNode } from "react";

/**
 * Error Boundary Component
 *
 * Catches JavaScript errors in child components and displays
 * a fallback UI instead of crashing the entire page.
 *
 * @example
 * <ErrorBoundary fallback={<p>Something went wrong</p>}>
 *   <MyComponent />
 * </ErrorBoundary>
 */

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log to error reporting service in production
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[200px] p-6 bg-red-500/10 border border-red-500/20 rounded-xl">
          <div className="w-12 h-12 mb-4 flex items-center justify-center rounded-full bg-red-500/20">
            <span className="material-symbols-outlined text-2xl text-red-400">
              error
            </span>
          </div>
          <h3 className="text-lg font-semibold text-red-400 mb-2">
            Something went wrong
          </h3>
          <p className="text-sm text-text-secondary text-center mb-4">
            An unexpected error occurred. Please try refreshing the page.
          </p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Compact error fallback for use in grids/lists
 */
export function CompactErrorFallback({
  onRetry,
}: {
  onRetry?: () => void;
}): ReactNode {
  return (
    <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
      <span className="material-symbols-outlined text-red-400">error</span>
      <span className="text-sm text-red-400">Failed to load</span>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="ml-auto text-sm text-red-400 hover:text-red-300 underline"
        >
          Retry
        </button>
      )}
    </div>
  );
}
