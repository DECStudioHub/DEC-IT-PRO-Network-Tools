/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  public handleReset = (): void => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex h-full w-full flex-col items-center justify-center bg-slate-50 p-6 text-center">
          <div className="max-w-md rounded-2xl border border-rose-200 bg-white p-6 shadow-xl">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              {this.props.fallbackTitle || 'A rendering issue occurred'}
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              {this.props.fallbackMessage || 'The system safely caught an error and prevented a blank screen.'}
            </p>
            {this.state.error?.message && (
              <div className="mt-3 rounded-lg bg-slate-100 p-2 text-left font-mono text-[11px] text-slate-700 max-h-24 overflow-y-auto">
                {this.state.error.message}
              </div>
            )}
            <button
              onClick={this.handleReset}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 shadow-xs transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Resume Workspace</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
