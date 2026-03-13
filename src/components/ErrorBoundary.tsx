import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full w-full bg-gray-50 text-gray-600 p-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 max-w-md w-full text-center">
            <h2 className="text-lg font-semibold text-red-600 mb-2">Editor Crashed</h2>
            <p className="text-sm text-gray-500 mb-4">
              An unexpected error occurred while rendering the whiteboard.
            </p>
            <button 
              onClick={() => this.setState({ hasError: false, error: null })}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Reload Editor
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
